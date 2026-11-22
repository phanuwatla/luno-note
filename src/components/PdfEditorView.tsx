import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';
import { useAppSettings } from '@/hooks/useAppSettings';
import { translate } from '@/translation/translate';
import { getToolbarIcon } from '@/lib/iconPacks';
import { saveVersionSnapshot } from '@/lib/versionHistoryStorage';
import {
  clearPdfAnnotationSidecar,
  extractLunoThemeConfig,
  finalizePdfAnnotationSidecarOnClose,
  getElectronCleanBasePdfPath,
  getInkoMessages,
  InkoInstance,
  InkoTool,
  InkoUserCanvasItem,
  InkoViewerCommand,
  InkoViewerLiveState,
  loadPdfAnnotationSidecar,
  mountInkoViewer,
  PdfPageBookmark,
  savePdfAnnotationSidecar,
} from '@/lib/inkoPdfBridge';

export const pdfDraftCanvasDataMap = new Map<string, string>();
export const pdfDraftUndoRedoMap = new Map<string, any>();
export const pdfDraftHistoryMap = new Map<string, InkoUserCanvasItem[]>();
export const pdfScrollPositionMap = new Map<string, number>();
export const pdfScrollLeftMap = new Map<string, number>();
export const pdfDraftPageMap = new Map<string, number>();
export const pdfZoomScaleMap = new Map<string, number>();
export const pdfDraftBookmarksMap = new Map<string, PdfPageBookmark[]>();
export const pdfSessionCleanBase64Map = new Map<string, string>();
export const pdfSessionSavedCanvasDataMap = new Map<string, string>();
export const pdfSessionDirtyMap = new Map<string, boolean>();
export const pdfSessionFileMetaMap = new Map<
  string,
  { fileName: string; filePath?: string; folderPath?: string | null }
>();
export const pdfActiveSaveHandlerMap = new Map<string, () => Promise<boolean>>();
const finalizedClosedNotesSet = new Set<string>();

export function clearPdfEditorDraft(noteId: string) {
  pdfDraftCanvasDataMap.delete(noteId);
  pdfDraftUndoRedoMap.delete(noteId);
  pdfDraftHistoryMap.delete(noteId);
  pdfScrollPositionMap.delete(noteId);
  pdfScrollLeftMap.delete(noteId);
  pdfDraftPageMap.delete(noteId);
  pdfZoomScaleMap.delete(noteId);
}

export function isPdfTabDirty(noteId: string): boolean {
  return Boolean(pdfSessionDirtyMap.get(noteId));
}

export function getUnsavedPdfNoteIds(tabIds?: string[]): string[] {
  if (Array.isArray(tabIds)) {
    return tabIds.filter((id) => Boolean(pdfSessionDirtyMap.get(id)));
  }
  const dirtyIds: string[] = [];
  pdfSessionDirtyMap.forEach((isDirty, id) => {
    if (isDirty) dirtyIds.push(id);
  });
  return dirtyIds;
}

export async function savePdfTabAnnotations(noteId: string): Promise<boolean> {
  const handler = pdfActiveSaveHandlerMap.get(noteId);
  if (handler) {
    return await handler();
  }
  return false;
}

export async function finalizePdfTabSession(
  noteId: string,
  _options?: { discardUnsaved?: boolean }
): Promise<void> {
  finalizedClosedNotesSet.add(noteId);
  const meta = pdfSessionFileMetaMap.get(noteId);
  const bookmarks = pdfDraftBookmarksMap.get(noteId);
  clearPdfEditorDraft(noteId);
  pdfSessionCleanBase64Map.delete(noteId);
  pdfSessionSavedCanvasDataMap.delete(noteId);
  pdfSessionDirtyMap.delete(noteId);
  pdfSessionFileMetaMap.delete(noteId);
  pdfActiveSaveHandlerMap.delete(noteId);

  if (meta) {
    try {
      await finalizePdfAnnotationSidecarOnClose({
        noteId,
        fileName: meta.fileName,
        filePath: meta.filePath,
        folderPath: meta.folderPath,
        bookmarks,
      });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function finalizeAllOpenPdfSessions(): Promise<void> {
  const ids = new Set<string>([
    ...pdfSessionFileMetaMap.keys(),
    ...pdfDraftCanvasDataMap.keys(),
    ...pdfSessionCleanBase64Map.keys(),
    ...pdfSessionSavedCanvasDataMap.keys(),
    ...pdfSessionDirtyMap.keys(),
  ]);
  for (const id of ids) {
    await finalizePdfTabSession(id);
  }
}

export interface PdfEditorViewHandle {
  saveAnnotations: () => Promise<boolean>;
  saveFlattenedToOriginal: () => Promise<boolean>;
  exportFlattenedPdfAs: () => Promise<boolean>;
  exportFormPdfAs: () => Promise<boolean>;
  printPdf: () => Promise<void>;
  undo: () => boolean;
  redo: () => boolean;
  deleteSelected?: () => void;
  clearSelection?: () => void;
  sendCommand: (
    command: InkoViewerCommand,
    payload?: {
      scale?: number;
      page?: number;
      open?: boolean;
      tool?: InkoTool;
      color?: string | null;
      opacity?: number;
      width?: number;
      fontSize?: number;
      query?: string;
    }
  ) => void;
  setSearchQuery: (query: string) => void;
  searchNext: () => void;
  searchPrev: () => void;
  closeSearch: () => void;
  setTool: (tool: InkoTool) => void;
  highlightSelection: () => boolean;
  setBrushColor: (color: string) => void;
  setShapeStrokeColor: (color: string | null) => void;
  setShapeFillColor: (color: string | null) => void;
  setShapeFillOpacity: (opacity: number) => void;
  setHighlightColor: (color: string) => void;
  setHighlightWidth: (width: number) => void;
  setEraserWidth: (width: number) => void;
  setBrushWidth: (width: number) => void;
  setFontSize: (fontSize: number) => void;
  clearCurrentPageAnnotations: () => void;
  getBookmarks: () => PdfPageBookmark[];
  addBookmark: (page: number, title?: string) => PdfPageBookmark[];
  removeBookmark: (bookmarkId: string) => PdfPageBookmark[];
  togglePageBookmark: (page: number, title?: string) => PdfPageBookmark[];
}

export interface PdfEditorViewProps {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
  fileSize?: number | null;
  pdfBase64?: string | null;
  pdfUrl?: string | null;
  isLoadingSource?: boolean;
  sourceError?: string | null;
  readOnly: boolean;
  language: string;
  isVisible?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onSavingChange?: (isSaving: boolean) => void;
  onSaved?: (savedAt: Date) => void;
  onViewerStateChange?: (state: InkoViewerLiveState) => void;
  onBookmarksChange?: (bookmarks: PdfPageBookmark[]) => void;
  onReplacePdfBase64?: (newBase64: string, newByteLength: number) => void;
  onUpdatePdfFileSize?: (newByteLength: number) => void;
  onRequestSave?: () => void;
  onRequestFind?: () => void;
  onRequestPrint?: () => void;
  onOpenExternal?: () => void;
  onPdfLoaded?: () => void;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes) || bytes < 0) return '';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return window.btoa(binary);
}

function triggerBrowserPdfDownload(buffer: ArrayBuffer, suggestedName: string) {
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName.endsWith('.pdf') ? suggestedName : `${suggestedName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function isEmptyPageLayerJson(pageJson: unknown): boolean {
  if (!pageJson) return true;
  if (typeof pageJson === 'string') {
    const trimmed = pageJson.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return true;
    try {
      return isEmptyPageLayerJson(JSON.parse(trimmed));
    } catch {
      return false;
    }
  }
  if (Array.isArray(pageJson)) {
    if (pageJson.length === 0) return true;
    if (pageJson[0] === 'Layer' && pageJson[1] && typeof pageJson[1] === 'object') {
      const children = (pageJson[1] as { children?: unknown[] }).children;
      return !Array.isArray(children) || children.length === 0;
    }
    return false;
  }
  if (typeof pageJson === 'object') {
    const children = (pageJson as { children?: unknown[] }).children;
    if ('children' in (pageJson as object)) {
      return !Array.isArray(children) || children.length === 0;
    }
  }
  return false;
}

export function normalizePdfCanvasData(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '{}' || trimmed === '[]') return '';
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return '';
    if (Array.isArray(parsed)) {
      return isEmptyPageLayerJson(parsed) ? '' : trimmed;
    }
    const nonEmptyEntries = Object.entries(parsed as Record<string, unknown>)
      .filter(([, val]) => !isEmptyPageLayerJson(val))
      .sort(([a], [b]) => Number(a) - Number(b));
    if (nonEmptyEntries.length === 0) return '';
    return JSON.stringify(Object.fromEntries(nonEmptyEntries));
  } catch {
    return trimmed;
  }
}

export const PdfEditorView = forwardRef<PdfEditorViewHandle, PdfEditorViewProps>(
  function PdfEditorView(
    {
      noteId,
      fileName,
      filePath,
      folderPath,
      fileSize,
      pdfBase64,
      pdfUrl,
      isLoadingSource = false,
      sourceError = null,
      readOnly,
      language,
      isVisible = true,
      onDirtyChange,
      onSavingChange,
      onSaved,
      onViewerStateChange,
      onBookmarksChange,
      onReplacePdfBase64,
      onUpdatePdfFileSize,
      onRequestSave,
      onRequestFind,
      onRequestPrint,
      onOpenExternal,
      onPdfLoaded: onPdfLoadedProp,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<InkoInstance | null>(null);
    const latestCanvasDataRef = useRef<string>('');
    const savedCanvasDataRef = useRef<string>('');
    const historyEntriesRef = useRef<InkoUserCanvasItem[]>([]);
    const bookmarksRef = useRef<PdfPageBookmark[]>([]);
    const isRestoringViewportRef = useRef<boolean>(false);
    const wasVisibleRef = useRef<boolean>(isVisible);
    const onBookmarksChangeRef = useRef(onBookmarksChange);
    onBookmarksChangeRef.current = onBookmarksChange;
    const pendingSaveResolverRef = useRef<((ok: boolean) => void) | null>(null);
    const cleanBase64Ref = useRef<{ noteId: string; base64: string } | null>(null);
    const hasStartedMountRef = useRef<boolean>(false);
    const didMountViewerRef = useRef<boolean>(false);
    const mountSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountCancelledRef = useRef<boolean>(false);
    const onRequestSaveRef = useRef(onRequestSave);
    const onRequestFindRef = useRef(onRequestFind);
    const onRequestPrintRef = useRef(onRequestPrint);
    onRequestSaveRef.current = onRequestSave;
    onRequestFindRef.current = onRequestFind;
    onRequestPrintRef.current = onRequestPrint;

    if (pdfBase64 && cleanBase64Ref.current?.noteId !== noteId) {
      const cleanB64 = pdfSessionCleanBase64Map.get(noteId) || pdfBase64;
      cleanBase64Ref.current = { noteId, base64: cleanB64 };
      if (!pdfSessionCleanBase64Map.has(noteId)) {
        pdfSessionCleanBase64Map.set(noteId, cleanB64);
      }
    }

    useEffect(() => {
      pdfSessionFileMetaMap.set(noteId, {
        fileName,
        filePath,
        folderPath,
      });
    }, [noteId, fileName, filePath, folderPath]);

    const hasPdfSource = Boolean(pdfBase64 || pdfUrl);

    const [isViewerReady, setIsViewerReady] = useState(false);
    const [isPdfLoaded, setIsPdfLoaded] = useState(false);
    const [viewerError, setViewerError] = useState<string | null>(null);

    const isThai = language === 'th';
    const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(language || 'en', key, vars), [language]);
    const { settings } = useAppSettings();
    const iconPack = settings.iconPack;
    const FileTextIcon = getToolbarIcon('fileText', iconPack, FileText);
    const ExternalLinkIcon = getToolbarIcon('externalLink', iconPack, ExternalLink);

    const resolveNativeFullPath = useCallback(async (): Promise<string | null> => {
      if (filePath && (filePath.includes(':') || filePath.startsWith('/'))) {
        return filePath;
      }
      const electronAPI = window.electronAPI;
      if (electronAPI?.getSavedWorkspace && fileName) {
        try {
          const saved = await electronAPI.getSavedWorkspace();
          const wsFolder = typeof saved === 'string' ? saved : saved?.folderPath;
          if (wsFolder && typeof wsFolder === 'string') {
            const relPath = folderPath ? `${folderPath}/${fileName}` : fileName;
            return `${wsFolder.replace(/[\\/]+$/, '')}/${relPath}`.replace(/\\/g, '/');
          }
        } catch (err) {
          console.warn('Failed to get workspace path:', err);
        }
      }
      return filePath || null;
    }, [filePath, folderPath, fileName]);

    const persistBookmarksSilently = useCallback(
      (nextBookmarks: PdfPageBookmark[]) => {
        bookmarksRef.current = nextBookmarks;
        pdfDraftBookmarksMap.set(noteId, nextBookmarks);
        onBookmarksChangeRef.current?.(nextBookmarks);
        void (async () => {
          const resolvedPath = (await resolveNativeFullPath()) || filePath;
          await savePdfAnnotationSidecar({
            noteId,
            fileName,
            filePath: resolvedPath,
            folderPath,
            canvasData: latestCanvasDataRef.current || savedCanvasDataRef.current || '',
            existingHistory: historyEntriesRef.current,
            bookmarks: nextBookmarks,
            addHistoryVersion: false,
            userName: t("pdfEditor.lunoUser"),
          });
        })();
      },
      [noteId, fileName, filePath, folderPath, isThai, resolveNativeFullPath]
    );

    const getBookmarks = useCallback((): PdfPageBookmark[] => {
      return [...bookmarksRef.current];
    }, []);

    const addBookmark = useCallback(
      (page: number, title?: string): PdfPageBookmark[] => {
        const defaultTitle = t("pdfEditor.page", { page });
        const newBm: PdfPageBookmark = {
          id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          page,
          title: (title || '').trim() || defaultTitle,
          createdAt: new Date().toISOString(),
        };
        const next = [...bookmarksRef.current.filter((b) => b.page !== page), newBm].sort(
          (a, b) => a.page - b.page
        );
        persistBookmarksSilently(next);
        return next;
      },
      [isThai, persistBookmarksSilently]
    );

    const removeBookmark = useCallback(
      (bookmarkId: string): PdfPageBookmark[] => {
        const next = bookmarksRef.current.filter((b) => b.id !== bookmarkId);
        persistBookmarksSilently(next);
        return next;
      },
      [persistBookmarksSilently]
    );

    const togglePageBookmark = useCallback(
      (page: number, title?: string): PdfPageBookmark[] => {
        const exists = bookmarksRef.current.some((b) => b.page === page);
        if (exists) {
          const next = bookmarksRef.current.filter((b) => b.page !== page);
          persistBookmarksSilently(next);
          return next;
        } else {
          return addBookmark(page, title);
        }
      },
      [addBookmark, persistBookmarksSilently]
    );

    const restoreViewportState = useCallback(
      (targetInstance: InkoInstance | null) => {
        if (!targetInstance) return;
        const savedScale = pdfZoomScaleMap.get(noteId);
        const savedScroll = pdfScrollPositionMap.get(noteId);
        const savedScrollLeft = pdfScrollLeftMap.get(noteId);
        const savedPage = pdfDraftPageMap.get(noteId);

        isRestoringViewportRef.current = true;
        // 100% zoom default to 1.25 (comfortable reading scale)
        const targetScale = typeof savedScale === 'number' && savedScale > 0 ? savedScale : 1.25;
        targetInstance.sendCommand('setZoomDirect', { scale: targetScale });
        if (typeof savedPage === 'number' && savedPage > 1) {
          targetInstance.sendCommand('goToPage', { page: savedPage });
        }

        setTimeout(() => {
          try {
            const iframe = containerRef.current?.querySelector('iframe');
            const scrollEl = iframe?.contentDocument?.querySelector('.scroll-viewer');
            if (scrollEl) {
              if (typeof savedScroll === 'number') scrollEl.scrollTop = savedScroll;
              if (typeof savedScrollLeft === 'number') scrollEl.scrollLeft = savedScrollLeft;
            }
          } catch { /* ignore */ }
          setTimeout(() => {
            isRestoringViewportRef.current = false;
          }, 120);
        }, 60);
      },
      [noteId]
    );

    useEffect(() => {
      if (isVisible && !wasVisibleRef.current && instanceRef.current) {
        restoreViewportState(instanceRef.current);
      }
      wasVisibleRef.current = isVisible;
    }, [isVisible, restoreViewportState]);

    const persistCanvasData = useCallback(
      async (canvasData: string, addHistoryVersion = true): Promise<boolean> => {
        try {
          onSavingChange?.(true);
          const resolvedPath = (await resolveNativeFullPath()) || filePath;
          if (resolvedPath) {
            pdfSessionFileMetaMap.set(noteId, {
              fileName,
              filePath: resolvedPath,
              folderPath,
            });
          }
          const sidecar = await savePdfAnnotationSidecar({
            noteId,
            fileName,
            filePath: resolvedPath,
            folderPath,
            canvasData,
            existingHistory: historyEntriesRef.current,
            bookmarks: bookmarksRef.current,
            addHistoryVersion,
            userName: t("pdfEditor.lunoUser"),
          });
          savedCanvasDataRef.current = canvasData;
          latestCanvasDataRef.current = canvasData;
          historyEntriesRef.current = sidecar.history;
          // Keep live editable vector canvas data in session maps until the tab or app is closed!
          pdfSessionSavedCanvasDataMap.set(noteId, canvasData);
          pdfDraftCanvasDataMap.set(noteId, canvasData);
          pdfDraftHistoryMap.set(noteId, sidecar.history);
          pdfSessionDirtyMap.set(noteId, false);
          onDirtyChange?.(false);
          onSaved?.(new Date());
          return true;
        } catch (err) {
          console.error('[PdfEditorView] Failed to save PDF annotations:', err);
          toast({
            title: t("pdfEditor.failedToSave"),
            description: t("pdfEditor.failedToSavePdfAnnotations"),
            variant: 'destructive',
          });
          return false;
        } finally {
          onSavingChange?.(false);
        }
      },
      [noteId, fileName, filePath, folderPath, isThai, onDirtyChange, onSavingChange, onSaved, resolveNativeFullPath]
    );

    // Mount Inko Viewer once per note source load (never tear down on save or fileSize/filePath updates!)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      if (hasStartedMountRef.current || instanceRef.current) {
        return;
      }
      if (isLoadingSource || sourceError || (!pdfBase64 && !pdfUrl)) {
        return;
      }

      hasStartedMountRef.current = true;
      mountCancelledRef.current = false;
      didMountViewerRef.current = false;
      finalizedClosedNotesSet.delete(noteId);

      latestCanvasDataRef.current = '';
      savedCanvasDataRef.current = '';
      historyEntriesRef.current = [];
      isRestoringViewportRef.current = true;
      setIsViewerReady(false);
      setIsPdfLoaded(false);
      setViewerError(null);

      (async () => {
        const resolvedPath = (await resolveNativeFullPath()) || filePath;
        if (resolvedPath) {
          pdfSessionFileMetaMap.set(noteId, {
            fileName,
            filePath: resolvedPath,
            folderPath,
          });
        }
        const sidecar = await loadPdfAnnotationSidecar({
          noteId,
          fileName,
          filePath: resolvedPath,
          folderPath,
        });
        if (mountCancelledRef.current || !containerRef.current) return;

        const savedCanvasData = pdfSessionSavedCanvasDataMap.has(noteId)
          ? pdfSessionSavedCanvasDataMap.get(noteId) || ''
          : sidecar?.canvasData || '';
        savedCanvasDataRef.current = savedCanvasData;
        if (savedCanvasData && !pdfSessionSavedCanvasDataMap.has(noteId)) {
          pdfSessionSavedCanvasDataMap.set(noteId, savedCanvasData);
        }

        // Restore in-memory vector annotations across tab switches while tab remains open
        const hasDraft = pdfDraftCanvasDataMap.has(noteId);
        const initialCanvasData = hasDraft
          ? pdfDraftCanvasDataMap.get(noteId) || ''
          : savedCanvasData;

        const initialUndoRedo = pdfDraftUndoRedoMap.get(noteId) || undefined;

        const initialHistory = pdfDraftHistoryMap.has(noteId)
          ? pdfDraftHistoryMap.get(noteId) || []
          : (sidecar?.history || []);

        const savedBookmarks = sidecar?.bookmarks || [];
        const hasDraftBookmarks = pdfDraftBookmarksMap.has(noteId);
        const draftBookmarks = pdfDraftBookmarksMap.get(noteId) || [];
        const initialBookmarks =
          hasDraftBookmarks && draftBookmarks.length > 0 ? draftBookmarks : savedBookmarks;
        bookmarksRef.current = initialBookmarks;
        if (initialBookmarks.length > 0) {
          pdfDraftBookmarksMap.set(noteId, initialBookmarks);
        }
        onBookmarksChangeRef.current?.(initialBookmarks);

        latestCanvasDataRef.current = initialCanvasData;
        historyEntriesRef.current = initialHistory;
        const isDirty =
          normalizePdfCanvasData(initialCanvasData) !== normalizePdfCanvasData(savedCanvasData);
        pdfSessionDirtyMap.set(noteId, isDirty);
        onDirtyChange?.(isDirty);

        containerRef.current.innerHTML = '';

        mountSafetyTimerRef.current = setTimeout(() => {
          if (!mountCancelledRef.current) {
            setIsPdfLoaded(true);
            onPdfLoadedProp?.();
          }
        }, 2200);

        didMountViewerRef.current = true;
        const sourceBase64ToMount =
          pdfSessionCleanBase64Map.get(noteId) || pdfBase64 || undefined;
        const instance = mountInkoViewer(containerRef.current, {
          pdfBase64: sourceBase64ToMount,
          pdfUrl: !sourceBase64ToMount && pdfUrl ? pdfUrl : undefined,
          fileName,
          readOnly,
          initialCanvasData: initialCanvasData || undefined,
          initialHistoryState: initialUndoRedo,
          theme: extractLunoThemeConfig(),
          locale: language === 'th' ? 'en' : language,
          messages: getInkoMessages(language),
          tools: {
            defaultTool: 'select',
            defaultColor: '#000000',
            features: {
              thumbnails: true,
              bookmarks: true,
              pageNavigation: false,
              pageNav: false,
              undoRedo: true,
              zoom: false, // Redundant: Bottom status bar already provides zoom controls
              orientation: false, // Redundant on capsule toolbar
              search: true, // Keep search engine active for breadcrumb button & Ctrl+F
              history: true,
              save: false, // Redundant: Breadcrumb action bar already handles saving
              deleteSelection: true,
            },
          },
          onReady: () => {
            if (mountCancelledRef.current) return;
            setIsViewerReady(true);
          },
          onPdfLoaded: () => {
            if (mountCancelledRef.current) return;
            if (mountSafetyTimerRef.current) {
              clearTimeout(mountSafetyTimerRef.current);
              mountSafetyTimerRef.current = null;
            }
            setIsPdfLoaded(true);
            onPdfLoadedProp?.();
            try {
              instance.sendCommand('setTool', { tool: 'select' });
            } catch { /* ignore */ }
            const attachScrollListener = (iframe: HTMLIFrameElement | null | undefined) => {
              try {
                const scrollEl = iframe?.contentDocument?.querySelector('.scroll-viewer');
                scrollEl?.addEventListener(
                  'scroll',
                  () => {
                    if (!isRestoringViewportRef.current) {
                      pdfScrollPositionMap.set(noteId, scrollEl.scrollTop);
                      pdfScrollLeftMap.set(noteId, scrollEl.scrollLeft);
                    }
                  },
                  { passive: true }
                );
              } catch { /* ignore */ }
            };
            setTimeout(() => {
              restoreViewportState(instance);
              attachScrollListener(containerRef.current?.querySelector('iframe'));
            }, 60);
          },
          onChange: (canvasData) => {
            if (mountCancelledRef.current) return;
            latestCanvasDataRef.current = canvasData;
            pdfDraftCanvasDataMap.set(noteId, canvasData);
            const isDirty =
              normalizePdfCanvasData(canvasData) !==
              normalizePdfCanvasData(savedCanvasDataRef.current);
            pdfSessionDirtyMap.set(noteId, isDirty);
            onDirtyChange?.(isDirty);
          },
          onSave: async (canvasData, success, message) => {
            if (mountCancelledRef.current) return;
            if (!success) {
              toast({
                title: t("pdfEditor.failedToSave"),
                description: message ||
                  (t("pdfEditor.failedToSavePdfAnnotations")),
                variant: 'destructive',
              });
              pendingSaveResolverRef.current?.(false);
              pendingSaveResolverRef.current = null;
              return;
            }
            const ok = await persistCanvasData(canvasData, true);
            if (ok) {
              toast({
                title: t("editor.saveToastTitle"),
                description: fileName,
              });
            }
            pendingSaveResolverRef.current?.(ok);
            pendingSaveResolverRef.current = null;
          },
          onViewerStateChange: (state) => {
            if (mountCancelledRef.current) return;
            if (!isRestoringViewportRef.current && state?.currentPage) {
              pdfDraftPageMap.set(noteId, state.currentPage);
            }
            if (!isRestoringViewportRef.current && typeof state?.scale === 'number' && state.scale > 0) {
              pdfZoomScaleMap.set(noteId, state.scale);
            }
            onViewerStateChange?.(state);
          },
          onHostShortcut: (shortcut) => {
            if (mountCancelledRef.current) return;
            if (shortcut === 'save') onRequestSaveRef.current?.();
            else if (shortcut === 'find') onRequestFindRef.current?.();
            else if (shortcut === 'print') onRequestPrintRef.current?.();
          },
          onError: (err) => {
            if (mountCancelledRef.current) return;
            console.error('[PdfEditorView] Inko Viewer Error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            setViewerError(msg);
          },
        });

        instanceRef.current = instance;
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteId, hasPdfSource, isLoadingSource, sourceError]);

    // Unmount cleanup (only runs when PdfEditorView unmounts or noteId changes)
    useEffect(() => {
      return () => {
        mountCancelledRef.current = true;
        hasStartedMountRef.current = false;
        if (mountSafetyTimerRef.current) {
          clearTimeout(mountSafetyTimerRef.current);
          mountSafetyTimerRef.current = null;
        }
        const wasClosedAndFinalized = finalizedClosedNotesSet.has(noteId);
        if (didMountViewerRef.current && !wasClosedAndFinalized) {
          try {
            const liveJson = instanceRef.current?.getCanvasJson();
            if (liveJson) {
              latestCanvasDataRef.current = liveJson;
              pdfDraftCanvasDataMap.set(noteId, liveJson);
            }
            const liveHistory = instanceRef.current?.getHistoryState();
            if (liveHistory) {
              pdfDraftUndoRedoMap.set(noteId, liveHistory);
            }
            const iframe = containerRef.current?.querySelector('iframe');
            const scrollEl = iframe?.contentDocument?.querySelector('.scroll-viewer');
            if (scrollEl) {
              pdfScrollPositionMap.set(noteId, scrollEl.scrollTop);
            }
          } catch { /* ignore */ }
          if (latestCanvasDataRef.current) {
            pdfDraftCanvasDataMap.set(noteId, latestCanvasDataRef.current);
          }
          if (historyEntriesRef.current?.length) {
            pdfDraftHistoryMap.set(noteId, historyEntriesRef.current);
          }
        }
        if (wasClosedAndFinalized) {
          finalizedClosedNotesSet.delete(noteId);
        }
        if (instanceRef.current) {
          instanceRef.current.destroy();
          instanceRef.current = null;
        }
      };
    }, [noteId]);

    // Sync readOnly (Reading Mode vs Editing Mode) without reloading the PDF
    useEffect(() => {
      if (!instanceRef.current || !isViewerReady) return;
      instanceRef.current.setReadOnly(readOnly);
    }, [readOnly, isViewerReady]);

    // Sync language messages dynamically when Luno language switches between th and en
    useEffect(() => {
      if (!instanceRef.current || !isViewerReady) return;
      instanceRef.current.applyConfig({
        locale: language === 'th' ? 'en' : language,
        messages: getInkoMessages(language),
      });
    }, [language, isViewerReady]);

    // Live Luno Theme & Appearance Synchronizer (MutationObserver on <html>)
    useEffect(() => {
      if (!isViewerReady) return;

      const syncTheme = () => {
        if (!instanceRef.current) return;
        instanceRef.current.applyConfig({
          theme: extractLunoThemeConfig(),
        });
      };

      syncTheme();

      const observer = new MutationObserver(() => {
        requestAnimationFrame(syncTheme);
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme', 'data-appearance'],
      });

      window.addEventListener('storage', syncTheme);
      return () => {
        observer.disconnect();
        window.removeEventListener('storage', syncTheme);
      };
    }, [isViewerReady]);

    const saveAnnotations = useCallback(async (): Promise<boolean> => {
      if (!instanceRef.current) return false;
      onSavingChange?.(true);
      try {
        try {
          const cw = instanceRef.current.iframe?.contentWindow as any;
          cw?.__commitActiveTextOverlay?.();
        } catch { /* ignore */ }

        // 1. Persist editable vector annotation sidecar (syncing live JSON first)
        const liveJson = instanceRef.current.getCanvasJson();
        const canvasData = liveJson != null ? liveJson : latestCanvasDataRef.current;
        await persistCanvasData(canvasData, true);

        // 2. Export flattened PDF for external viewers while preserving clean unburned .base.pdf for Luno editing
        const targetFullPath = await resolveNativeFullPath();
        const electronAPI = window.electronAPI;
        if (targetFullPath && electronAPI) {
          try {
            // Backup pristine un-annotated base PDF once BEFORE overwriting targetFullPath with flattened pixels
            const cleanB64 = pdfSessionCleanBase64Map.get(noteId) || cleanBase64Ref.current?.base64;
            const basePdfPath = getElectronCleanBasePdfPath(targetFullPath, folderPath);
            if (basePdfPath && cleanB64 && electronAPI.writeFileBase64) {
              let hasBaseBackup = false;
              if (electronAPI.readFileBase64) {
                try {
                  const existingBase = await electronAPI.readFileBase64(basePdfPath);
                  hasBaseBackup = Boolean(existingBase && existingBase.length > 0);
                } catch {
                  hasBaseBackup = false;
                }
              }
              if (!hasBaseBackup) {
                await electronAPI.writeFileBase64({
                  fullPath: basePdfPath,
                  base64: cleanB64,
                });
              }
            }

            const { pdfBytes } = await instanceRef.current.exportFlattenedPdf();
            if (pdfBytes && pdfBytes.byteLength > 0) {
              if (electronAPI.writeFileBuffer) {
                const res = await electronAPI.writeFileBuffer({
                  fullPath: targetFullPath,
                  buffer: pdfBytes,
                });
                if (!res) {
                  console.warn('writeFileBuffer warning: failed writing PDF buffer');
                }
              } else if (electronAPI.writeFileBase64) {
                const b64 = arrayBufferToBase64(pdfBytes);
                const res = await electronAPI.writeFileBase64({
                  fullPath: targetFullPath,
                  base64: b64,
                });
                if (!res) {
                  console.warn('writeFileBase64 warning: failed writing PDF base64');
                }
              }
              // Update displayed file size WITHOUT replacing live pdfBase64 (prevents remount & double-burn!)
              onUpdatePdfFileSize?.(pdfBytes.byteLength);
            }
          } catch (writeErr) {
            console.warn('[PdfEditorView] Auto-flatten write to disk failed:', writeErr);
          }
        }

        // 3. Save a version history snapshot matching other editors
        try {
          saveVersionSnapshot({
            id: noteId,
            title: fileName.replace(/\.pdf$/i, ''),
            fileName,
            folderPath: folderPath || undefined,
            content: canvasData || `[PDF Document: ${fileName}]`,
          } as any);
        } catch {
          /* ignore */
        }

        pdfSessionDirtyMap.set(noteId, false);
        onDirtyChange?.(false);
        onSaved?.(new Date());

        toast({
          title: t("editor.saveToastTitle"),
          description: fileName,
        });
        return true;
      } catch (err) {
        console.error('[PdfEditorView] saveAnnotations failed:', err);
        toast({
          title: t("pdfEditor.failedToSave"),
          description: t("pdfEditor.failedToSavePdfDocument"),
          variant: 'destructive',
        });
        return false;
      } finally {
        onSavingChange?.(false);
      }
    }, [
      persistCanvasData,
      resolveNativeFullPath,
      noteId,
      fileName,
      folderPath,
      isThai,
      onDirtyChange,
      onSaved,
      onSavingChange,
      onUpdatePdfFileSize,
    ]);

    useEffect(() => {
      pdfActiveSaveHandlerMap.set(noteId, saveAnnotations);
      return () => {
        if (pdfActiveSaveHandlerMap.get(noteId) === saveAnnotations) {
          pdfActiveSaveHandlerMap.delete(noteId);
        }
      };
    }, [noteId, saveAnnotations]);

    const saveFlattenedToOriginal = useCallback(async (): Promise<boolean> => {
      if (!instanceRef.current) return false;
      try {
        onSavingChange?.(true);
        const { pdfBytes, report } = await instanceRef.current.exportFlattenedPdf();
        if (report?.hasFailures) {
          console.warn('[PdfEditorView] Flatten report issues:', report.issues);
        }

        const targetFullPath = await resolveNativeFullPath();
        const electronAPI = window.electronAPI;

        if (targetFullPath && electronAPI?.writeFileBuffer) {
          const res = await electronAPI.writeFileBuffer({
            fullPath: targetFullPath,
            buffer: pdfBytes,
          });
          if (!res) {
            throw new Error('Failed to write flattened PDF file');
          }
        } else if (targetFullPath && electronAPI?.writeFileBase64) {
          const b64 = arrayBufferToBase64(pdfBytes);
          const res = await electronAPI.writeFileBase64({
            fullPath: targetFullPath,
            base64: b64,
          });
          if (!res) {
            throw new Error('Failed to write flattened PDF file');
          }
        } else {
          triggerBrowserPdfDownload(pdfBytes, fileName);
        }

        const newBase64 = arrayBufferToBase64(pdfBytes);
        cleanBase64Ref.current = { noteId, base64: newBase64 };
        pdfSessionCleanBase64Map.set(noteId, newBase64);
        pdfSessionSavedCanvasDataMap.set(noteId, '');
        pdfSessionDirtyMap.set(noteId, false);
        await clearPdfAnnotationSidecar({ noteId, fileName, filePath, folderPath });
        clearPdfEditorDraft(noteId);
        latestCanvasDataRef.current = '';
        savedCanvasDataRef.current = '';
        historyEntriesRef.current = [];
        instanceRef.current?.loadPdfBase64(newBase64, fileName, '', readOnly);
        onDirtyChange?.(false);
        onSaved?.(new Date());
        onReplacePdfBase64?.(newBase64, pdfBytes.byteLength);

        toast({
          title: t("editor.saveToastTitle"),
          description: fileName,
        });
        return true;
      } catch (err) {
        console.error('[PdfEditorView] Failed to flatten & save PDF:', err);
        toast({
          title: t("pdfEditor.failedToSave"),
          description: t("pdfEditor.failedToFlattenAndSave"),
          variant: 'destructive',
        });
        return false;
      } finally {
        onSavingChange?.(false);
      }
    }, [
      resolveNativeFullPath,
      filePath,
      fileName,
      noteId,
      folderPath,
      isThai,
      onDirtyChange,
      onSavingChange,
      onSaved,
      onReplacePdfBase64,
    ]);

    const exportFlattenedPdfAs = useCallback(async (): Promise<boolean> => {
      if (!instanceRef.current) return false;
      try {
        onSavingChange?.(true);
        const { pdfBytes, report } = await instanceRef.current.exportFlattenedPdf();
        if (report?.hasFailures) {
          console.warn('[PdfEditorView] Flatten report issues:', report.issues);
        }

        const baseName = fileName.replace(/\.pdf$/i, '');
        const defaultExportName = `${baseName}-annotated.pdf`;
        const electronAPI = window.electronAPI;

        if (electronAPI?.showSaveDialog && electronAPI?.writeFileBuffer) {
          const dialogRes = await electronAPI.showSaveDialog({
            title: t("pdfEditor.exportFlattenedPdf"),
            defaultPath: defaultExportName,
            filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
          });
          const targetPath = typeof dialogRes === 'string' ? dialogRes : (dialogRes as any)?.filePath;
          if (!targetPath || (typeof dialogRes === 'object' && (dialogRes as any)?.canceled)) {
            return false;
          }
          const writeRes = await electronAPI.writeFileBuffer({
            fullPath: targetPath,
            buffer: pdfBytes,
          });
          if (!writeRes || (typeof writeRes === 'object' && (writeRes as any).success === false)) {
            throw new Error((writeRes as any)?.error || 'Failed to write exported PDF');
          }
          toast({
            title: t("pdfEditor.fileExported"),
            description: targetPath.split(/[/\\]/).pop() || defaultExportName,
          });
          return true;
        }

        triggerBrowserPdfDownload(pdfBytes, defaultExportName);
        toast({
          title: t("pdfEditor.fileDownloaded"),
          description: defaultExportName,
        });
        return true;
      } catch (err) {
        console.error('[PdfEditorView] Failed to export flattened PDF:', err);
        toast({
          title: t("pdfEditor.exportError"),
          description: t("pdfEditor.failedToExportPdf"),
          variant: 'destructive',
        });
        return false;
      } finally {
        onSavingChange?.(false);
      }
    }, [fileName, isThai, onSavingChange]);

    const exportFormPdfAs = useCallback(async (): Promise<boolean> => {
      if (!instanceRef.current) return false;
      try {
        onSavingChange?.(true);
        const pdfBytes = await instanceRef.current.exportPdf();
        const baseName = fileName.replace(/\.pdf$/i, '');
        const defaultExportName = `${baseName}-form.pdf`;

        const electronAPI = window.electronAPI;
        if (electronAPI?.showSaveDialog && electronAPI?.writeFileBuffer) {
          const dialogRes = await electronAPI.showSaveDialog({
            title: t("pdfEditor.exportFormPdf"),
            defaultPath: defaultExportName,
            filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
          });
          const targetPath = typeof dialogRes === 'string' ? dialogRes : (dialogRes as any)?.filePath;
          if (!targetPath || (typeof dialogRes === 'object' && (dialogRes as any)?.canceled)) {
            return false;
          }
          const writeRes = await electronAPI.writeFileBuffer({
            fullPath: targetPath,
            buffer: pdfBytes,
          });
          if (!writeRes || (typeof writeRes === 'object' && (writeRes as any).success === false)) {
            throw new Error((writeRes as any)?.error || 'Failed to write exported PDF');
          }
          toast({
            title: t("pdfEditor.fileExported"),
            description: targetPath.split(/[/\\]/).pop() || defaultExportName,
          });
          return true;
        }

        triggerBrowserPdfDownload(pdfBytes, defaultExportName);
        toast({
          title: t("pdfEditor.fileDownloaded"),
          description: defaultExportName,
        });
        return true;
      } catch (err) {
        console.error('[PdfEditorView] Failed to export form PDF:', err);
        toast({
          title: t("pdfEditor.exportError"),
          description: t("pdfEditor.failedToExportPdf2"),
          variant: 'destructive',
        });
        return false;
      } finally {
        onSavingChange?.(false);
      }
    }, [fileName, isThai, onSavingChange]);

    const printPdf = useCallback(async (): Promise<void> => {
      if (!instanceRef.current) return;
      try {
        // Export flattened PDF and open print dialog via hidden iframe or viewer window
        const { pdfBytes } = await instanceRef.current.exportFlattenedPdf();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.src = url;
        document.body.appendChild(printFrame);
        printFrame.onload = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
            } catch {
              instanceRef.current?.sendCommand('print');
            }
            setTimeout(() => {
              if (printFrame.parentNode) {
                printFrame.parentNode.removeChild(printFrame);
              }
              URL.revokeObjectURL(url);
            }, 60000);
          }, 250);
        };
      } catch {
        instanceRef.current.sendCommand('print');
      }
    }, []);

    const sendCommand = useCallback(
      (
        command: InkoViewerCommand,
        payload?: {
          scale?: number;
          page?: number;
          open?: boolean;
          tool?: InkoTool;
          color?: string | null;
          opacity?: number;
          width?: number;
          fontSize?: number;
          query?: string;
        }
      ) => {
        if (
          command === 'zoomIn' ||
          command === 'zoomOut' ||
          command === 'zoomReset' ||
          command === 'setZoom' ||
          command === 'setZoomDirect' ||
          command === 'fitWidth'
        ) {
          if (payload?.scale != null) {
            pdfZoomScaleMap.set(noteId, payload.scale);
          }
        }
        if (command === 'goToPage' && payload?.page) {
          pdfDraftPageMap.set(noteId, payload.page);
        }
        try {
          const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
            instanceRef.current?.iframe?.contentWindow) as any;
          if (command === 'undo' && typeof cw?.__inkoUndo === 'function') {
            cw.__inkoUndo();
            return;
          }
          if (command === 'redo' && typeof cw?.__inkoRedo === 'function') {
            cw.__inkoRedo();
            return;
          }
          if (command === 'deleteSelected') {
            if (typeof cw?.__inkoDeleteSelected === 'function') {
              cw.__inkoDeleteSelected();
              return;
            }
            if (typeof cw?.__inkoScrollViewer?.deleteSelected === 'function') {
              cw.__inkoScrollViewer.deleteSelected();
              return;
            }
          }
          if (command === 'clearSelection' && typeof cw?.__inkoClearSelection === 'function') {
            cw.__inkoClearSelection();
            return;
          }
          if (
            (command === 'setZoomDirect' || command === 'setZoom') &&
            typeof payload?.scale === 'number' &&
            typeof cw?.__inkoSetScaleDirect === 'function'
          ) {
            cw.__inkoSetScaleDirect(payload.scale);
            return;
          }
          if (command === 'zoomIn' && typeof cw?.__inkoZoomIn === 'function') {
            cw.__inkoZoomIn();
            return;
          }
          if (command === 'zoomOut' && typeof cw?.__inkoZoomOut === 'function') {
            cw.__inkoZoomOut();
            return;
          }
          if (command === 'zoomReset' && typeof cw?.__inkoZoomReset === 'function') {
            cw.__inkoZoomReset();
            return;
          }
          if (command === 'fitWidth' && typeof cw?.__inkoFitWidth === 'function') {
            cw.__inkoFitWidth();
            return;
          }
          if (
            command === 'goToPage' &&
            typeof payload?.page === 'number' &&
            typeof cw?.__inkoGoToPage === 'function'
          ) {
            cw.__inkoGoToPage(payload.page);
            return;
          }
          if (command === 'prevPage' && typeof cw?.__inkoPrevPage === 'function') {
            cw.__inkoPrevPage();
            return;
          }
          if (command === 'nextPage' && typeof cw?.__inkoNextPage === 'function') {
            cw.__inkoNextPage();
            return;
          }
        } catch { /* ignore */ }
        instanceRef.current?.sendCommand(command, payload as any);
      },
      [noteId]
    );

    const setSearchQuery = useCallback((query: string) => {
      instanceRef.current?.sendCommand('setSearchQuery', { query });
    }, []);

    const searchNext = useCallback(() => {
      instanceRef.current?.sendCommand('searchNext');
    }, []);

    const searchPrev = useCallback(() => {
      instanceRef.current?.sendCommand('searchPrev');
    }, []);

    const closeSearch = useCallback(() => {
      instanceRef.current?.sendCommand('closeSearch');
    }, []);

    const highlightSelection = useCallback((): boolean => {
      try {
        const cw = instanceRef.current?.iframe?.contentWindow as any;
        if (cw && typeof cw.__highlightTextSelection === 'function') {
          return Boolean(cw.__highlightTextSelection());
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('highlightSelection' as InkoViewerCommand);
      return false;
    }, []);

    const setTool = useCallback((tool: InkoTool) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (tool === 'highlighter' && typeof cw?.__highlightTextSelection === 'function') {
          cw.__highlightTextSelection();
        }
        if (typeof cw?.__setInkoTool === 'function') {
          cw.__setInkoTool(tool);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setTool', { tool });
    }, []);

    const setBrushColor = useCallback((color: string) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetBrushColor === 'function') {
          cw.__inkoSetBrushColor(color);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setColor', { color });
    }, []);

    const setShapeStrokeColor = useCallback((color: string | null) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetShapeStrokeColor === 'function') {
          cw.__inkoSetShapeStrokeColor(color);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setShapeStrokeColor', { color: color || 'transparent' });
    }, []);

    const setShapeFillColor = useCallback((color: string | null) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetShapeFillColor === 'function') {
          cw.__inkoSetShapeFillColor(color);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setShapeFillColor', { color: color || 'transparent' });
    }, []);

    const setShapeFillOpacity = useCallback((opacity: number) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetShapeFillOpacity === 'function') {
          cw.__inkoSetShapeFillOpacity(opacity);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setShapeFillOpacity', { opacity });
    }, []);

    const setHighlightColor = useCallback((color: string) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetHighlightColor === 'function') {
          cw.__inkoSetHighlightColor(color);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setHighlightColor', { color });
    }, []);

    const setHighlightWidth = useCallback((width: number) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetHighlightWidth === 'function') {
          cw.__inkoSetHighlightWidth(width);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setHighlightWidth', { width });
    }, []);

    const setEraserWidth = useCallback((width: number) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetEraserWidth === 'function') {
          cw.__inkoSetEraserWidth(width);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setEraserWidth', { width });
    }, []);

    const setBrushWidth = useCallback((width: number) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetBrushWidth === 'function') {
          cw.__inkoSetBrushWidth(width);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setWidth', { width });
    }, []);

    const setFontSize = useCallback((fontSize: number) => {
      try {
        const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
          instanceRef.current?.iframe?.contentWindow) as any;
        if (typeof cw?.__inkoSetFontSize === 'function') {
          cw.__inkoSetFontSize(fontSize);
          return;
        }
      } catch { /* ignore */ }
      instanceRef.current?.sendCommand('setFontSize', { fontSize });
    }, []);

    const clearCurrentPageAnnotations = useCallback(() => {
      instanceRef.current?.clearCurrentCanvas();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        saveAnnotations,
        saveFlattenedToOriginal,
        exportFlattenedPdfAs,
        exportFormPdfAs,
        printPdf,
        undo: () => {
          try {
            const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
              instanceRef.current?.iframe?.contentWindow) as any;
            if (typeof cw?.__inkoUndo === 'function') {
              cw.__inkoUndo();
              return true;
            }
            if (typeof cw?.__inkoScrollViewer?.undo === 'function') {
              return Boolean(cw.__inkoScrollViewer.undo());
            }
            const sv = instanceRef.current?.getScrollViewer();
            if (sv?.undo) return Boolean(sv.undo());
          } catch { /* ignore */ }
          sendCommand('undo');
          return true;
        },
        redo: () => {
          try {
            const cw = (containerRef.current?.querySelector('iframe')?.contentWindow ||
              instanceRef.current?.iframe?.contentWindow) as any;
            if (typeof cw?.__inkoRedo === 'function') {
              cw.__inkoRedo();
              return true;
            }
            if (typeof cw?.__inkoScrollViewer?.redo === 'function') {
              return Boolean(cw.__inkoScrollViewer.redo());
            }
            const sv = instanceRef.current?.getScrollViewer();
            if (sv?.redo) return Boolean(sv.redo());
          } catch { /* ignore */ }
          sendCommand('redo');
          return true;
        },
        deleteSelected: () => {
          sendCommand('deleteSelected');
        },
        clearSelection: () => {
          sendCommand('clearSelection');
        },
        sendCommand,
        setSearchQuery,
        searchNext,
        searchPrev,
        closeSearch,
        setTool,
        highlightSelection,
        setBrushColor,
        setShapeStrokeColor,
        setShapeFillColor,
        setShapeFillOpacity,
        setHighlightColor,
        setHighlightWidth,
        setEraserWidth,
        setBrushWidth,
        setFontSize,
        clearCurrentPageAnnotations,
        getBookmarks,
        addBookmark,
        removeBookmark,
        togglePageBookmark,
      }),
      [
        saveAnnotations,
        saveFlattenedToOriginal,
        exportFlattenedPdfAs,
        exportFormPdfAs,
        printPdf,
        sendCommand,
        setSearchQuery,
        searchNext,
        searchPrev,
        closeSearch,
        setTool,
        highlightSelection,
        setBrushColor,
        setShapeStrokeColor,
        setShapeFillColor,
        setShapeFillOpacity,
        setHighlightColor,
        setHighlightWidth,
        setEraserWidth,
        setBrushWidth,
        setFontSize,
        clearCurrentPageAnnotations,
        getBookmarks,
        addBookmark,
        removeBookmark,
        togglePageBookmark,
      ]
    );

    const displayError = sourceError || viewerError;

    return (
      <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden bg-background">
        {/* Inko PDF Viewer Mount Container */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full overflow-hidden"
        />

        {/* File-preview styled Loading Overlay (Matches startup loader style) */}
        {(isLoadingSource || (!isPdfLoaded && !displayError)) && (
          <PageLoader
            className="absolute inset-0 z-10"
            title={fileName}
            description={[
              t("pdfEditor.pdfDocument"),
              fileSize != null ? formatBytes(fileSize) : null,
              t("common.loading"),
            ]
              .filter(Boolean)
              .join(" • ")}
          />
        )}

        {/* Luno-styled Error Fallback */}
        {displayError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background p-8 select-none">
            <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
              <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <FileTextIcon className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">{fileName}</h3>
                <p className="text-xs text-muted-foreground break-words">{displayError}</p>
              </div>
              {onOpenExternal && filePath && (
                <div className="pt-1 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenExternal}
                    className="gap-1.5 rounded-lg text-xs"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    {t("pdfEditor.openInExternalApp")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
