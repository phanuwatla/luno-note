import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getElectronCleanBasePdfPath } from '@/lib/inkoPdfBridge';
import { getToolbarIcon } from '@/lib/iconPacks';

describe('Universal PDF Editor Tools, Interactions & Luno UI Consistency', () => {
  const publicJsPath = path.resolve(process.cwd(), 'public/inko-viewer/assets/index-BJGCP5Nd.js');
  const publicCssPath = path.resolve(process.cwd(), 'public/inko-viewer/luno-bridge.css');

  it('renders compact square handles [5, 5], snug fit bounds (g=2), window keyboard handling, and edge-stretch + corner-proportional scaling', () => {
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    // Compact square handles (5px) and #1890ff dashed frame with snug padding (2px)
    expect(jsContent).toContain('selectionColor:n="#1890ff"');
    expect(jsContent).toContain('const g=2,y=h.expand(g*2)');
    expect(jsContent).toContain('size:[5,5],fillColor:"white",strokeColor:n,strokeWidth:1');
    expect(jsContent).toContain('tolerance:2.5');

    // Window-level keyboard shortcuts (Delete, Backspace, Escape, Arrow nudge) + live style updates
    expect(jsContent).toContain('window.addEventListener("keydown",m)');
    expect(jsContent).toContain('updateSelectedStyle');
    expect(jsContent).toContain('getSelectedMeta');

    // Axis-aware edge handle stretching + proportional corner scaling
    expect(jsContent).toContain('lastScaleX=1,lastScaleY=1');
    expect(jsContent).toContain('K.scale(dx,1,Z);lastScaleX=sx');
    expect(jsContent).toContain('K.scale(1,dy,Z);lastScaleY=sy');
    expect(jsContent).toContain('K.scale(deltaScale,Z);lastScaleX=pe;lastScaleY=pe');
    expect(jsContent).toContain('selBounds.contains(R)');
  });

  it('upgrades Shapes to universal bounding-box Ellipse, Arrow CompoundPath, Shift constraints, and <3px click guard', () => {
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    expect(jsContent).toContain('"rectangle","circle","line","arrow"');
    expect(jsContent).toContain('_.Path.Ellipse({from:k,to:D2');
    expect(jsContent).toContain('case"arrow":');
    expect(jsContent).toContain('new _.CompoundPath({children:[shaft,head]');
    expect(jsContent).toContain('constrainBox(k,D,isShift)');
    expect(jsContent).toContain('constrainAngle(k,D,isShift)');
    expect(jsContent).toContain('s.getDistance(T)>=3');
  });

  it('supports Pen single-click dot placement, Eraser full bounds/highlight erasing + circular cursor, and global cross-page Undo/Redo', () => {
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    // Pen single-click dot
    expect(jsContent).toContain('c.segments.length===1');
    expect(jsContent).toContain('new Me.Point(0.15,0)');

    // Eraser circular SVG cursor, preview trail & PointText/TextHighlight erasing
    expect(jsContent).toContain('applyEraserCursor');
    expect(jsContent).toContain('q.data?.isTextHighlight');

    // Global chronological undo/redo across all pages with immediate pending flush
    expect(jsContent).toContain('flushPending');
    expect(jsContent).toContain('globalUndoPages');
    expect(jsContent).toContain('globalRedoPages');
    expect(jsContent).toContain('peekUndoPage');
    expect(jsContent).toContain('peekRedoPage');
  });

  it('forwards Ctrl+S / Ctrl+F / Ctrl+P host shortcuts and supports universal single-key tool shortcuts', () => {
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    expect(jsContent).toContain('ir({type:"hostShortcut",shortcut:"save"})');
    expect(jsContent).toContain('ir({type:"hostShortcut",shortcut:"print"})');
    expect(jsContent).toContain('ir({type:"hostShortcut",shortcut:"find"})');
    expect(jsContent).toContain('v:"select",i:"contentSelect",p:"pen",h:"highlighter",e:"eraser",t:"text",r:"rectangle",o:"circle",l:"line",a:"arrow"');
    expect(jsContent).toContain('fitActualWidth');
  });

  it('preserves multiply blend mode on white PDF paper in Dark Mode and removes cursor !important lockups', () => {
    const cssContent = fs.readFileSync(publicCssPath, 'utf8');

    // Annotations on white PDF paper must use multiply even in Dark Mode (never screen, which turns dark ink invisible)
    expect(cssContent).toContain('mix-blend-mode: multiply !important;');
    expect(cssContent).not.toContain('mix-blend-mode: screen');

    // Smart dual-mode highlighter: text spans capture text selection while non-text areas pass through to canvas
    expect(cssContent).toContain('body[data-tool="highlighter"] .inko-text-layer span');
    expect(cssContent).toContain('body[data-tool="highlighter"]:not(.is-selecting-text) .scroll-page-canvas-paper');

    // Select mode canvas allows dynamic JS move/resize cursors (no cursor: default !important)
    expect(cssContent).not.toContain('cursor: default !important');
  });

  it('keeps dist bundle synchronized with public bundle after build', () => {
    const distJsPath = path.resolve(process.cwd(), 'dist/inko-viewer/assets/index-BJGCP5Nd.js');
    if (fs.existsSync(distJsPath)) {
      const distContent = fs.readFileSync(distJsPath, 'utf8');
      expect(distContent).toContain('selectionColor:n="#1890ff"');
      expect(distContent).toContain('const g=2,y=h.expand(g*2)');
      expect(distContent).toContain('size:[5,5],fillColor:"white",strokeColor:n,strokeWidth:1');
      expect(distContent).toContain('lastScaleX=1,lastScaleY=1');
      expect(distContent).toContain('_.Path.Ellipse({from:k,to:D2');
    }
  });

  it('computes clean non-destructive .base.pdf sidecar path and maps all PDF icons across Lucide, Tabler, and Phosphor packs', () => {
    const basePdf = getElectronCleanBasePdfPath(
      'E:/vault/docs/lecture.pdf',
      'E:/vault'
    );
    expect(basePdf).toBeTruthy();
    expect(basePdf).toContain('.luno/pdf-annotations/lecture.');
    expect(basePdf?.endsWith('.base.pdf')).toBe(true);

    const pdfToolKeys = [
      'select',
      'textSelect',
      'pen',
      'highlight',
      'eraser',
      'textBox',
      'shapeSquare',
      'shapeCircle',
      'shapeLine',
      'shapeArrow',
      'bookmark',
      'printer',
    ];
    for (const pack of ['lucide', 'tabler', 'phosphor'] as const) {
      for (const key of pdfToolKeys) {
        const icon = getToolbarIcon(key, pack);
        expect(icon).toBeTruthy();
      }
    }
  });

  it('uses colored-left Radix Slider without size preset buttons, supports Shape Fill Color & Opacity, and renders transparent snug click-to-write text boxes', () => {
    const editorTsxPath = path.resolve(process.cwd(), 'src/components/Editor.tsx');
    const editorSrc = fs.readFileSync(editorTsxPath, 'utf8');
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');
    const cssContent = fs.readFileSync(publicCssPath, 'utf8');

    // 1. Slider-only controls with colored left range (no preset size button arrays)
    expect(editorSrc).toContain('import { Slider } from "@/components/ui/slider"');
    expect(editorSrc).not.toContain('[1, 2, 3, 4, 6, 8, 12].map');
    expect(editorSrc).not.toContain('[12, 16, 20, 28, 36].map');
    expect(editorSrc).not.toContain('[10, 16, 24, 36, 52].map');

    // 2. Shape interior fill color & opacity support
    expect(editorSrc).toContain('setShapeFillColor');
    expect(editorSrc).toContain('setShapeFillOpacity');
    expect(jsContent).toContain('makeShapeFill');
    expect(jsContent).toContain('case"setShapeFillColor":');
    expect(jsContent).toContain('case"setShapeFillOpacity":');
    expect(jsContent).toContain('isFillableItem');

    // 3. Transparent snug inline text insertion at exact clicked spot
    expect(cssContent).toContain('border: 1px solid #6b9ac4 !important;');
    expect(cssContent).toContain('min-width: 2px !important;');
    expect(cssContent).toContain('inset: auto !important;');
    expect(cssContent).not.toContain('rgba(255, 255, 255, 0.78)');
    expect(jsContent).toContain('__inko_text_measure');
    expect(jsContent).toContain('syncDialogPosition');
    expect(jsContent).toContain('syncTextareaStyleAndSize');
    expect(jsContent).toContain('rows="1"');
  });

  it('provides bidirectional keyboard shortcuts, iframe key forwarding, single-key tools, zoom, and annotation deletion', () => {
    const editorTsxPath = path.resolve(process.cwd(), 'src/components/Editor.tsx');
    const bridgeTsPath = path.resolve(process.cwd(), 'src/lib/inkoPdfBridge.ts');
    const pdfViewPath = path.resolve(process.cwd(), 'src/components/PdfEditorView.tsx');
    const editorSrc = fs.readFileSync(editorTsxPath, 'utf8');
    const bridgeSrc = fs.readFileSync(bridgeTsPath, 'utf8');
    const viewSrc = fs.readFileSync(pdfViewPath, 'utf8');
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    // 1. Single-key tool mapping & zoom in Editor.tsx (with Thai layout support)
    expect(editorSrc).toContain('toolByCodeMap');
    expect(editorSrc).toContain('toolByKeyMap');
    expect(editorSrc).toContain('"อ": "select"');
    expect(editorSrc).toContain('KeyV: "select"');
    expect(editorSrc).toContain('handleSelectPdfTool(targetTool)');
    expect(editorSrc).toContain('pdfEditorRef.current?.sendCommand("zoomIn")');
    expect(editorSrc).toContain('pdfEditorRef.current?.sendCommand("zoomOut")');
    expect(editorSrc).toContain('pdfEditorRef.current?.sendCommand("zoomReset")');
    expect(editorSrc).toContain('pdfEditorRef.current?.sendCommand("deleteSelected")');
    expect(editorSrc).toContain('pdfEditorRef.current?.sendCommand("clearSelection")');

    // 2. Bridge event forwarding
    expect(bridgeSrc).toContain("IFRAME_KEYDOWN: 'iframeKeydown'");
    expect(bridgeSrc).toContain("'clearSelection'");
    expect(bridgeSrc).toContain('window.dispatchEvent(fakeEvent)');

    // 3. PdfEditorView handle methods
    expect(viewSrc).toContain('deleteSelected: () =>');
    expect(viewSrc).toContain('clearSelection: () =>');
    expect(viewSrc).toContain('__inkoDeleteSelected');
    expect(viewSrc).toContain('__inkoClearSelection');

    // 4. Inko bundle global methods & keydown handling (with Thai layout support)
    expect(jsContent).toContain('window.__inkoUndo');
    expect(jsContent).toContain('window.__inkoRedo');
    expect(jsContent).toContain('window.__inkoDeleteSelected');
    expect(jsContent).toContain('window.__inkoClearSelection');
    expect(jsContent).toContain('iframeKeydown');
    expect(jsContent).toContain('KeyV:"select"');
    expect(jsContent).toContain('"อ":"select"');
    expect(jsContent).toContain('KeyS');
    expect(jsContent).toContain('KeyZ');

    // 5. Default tool on fresh PDF open is 'select' (Select & Move)
    expect(editorSrc).toContain('const [pdfActiveTool, setPdfActiveTool] = useState<InkoTool | null>("select");');
    expect(editorSrc).toContain('currentTool: InkoTool = pdfActiveTool || pdfViewerState?.currentTool || "select";');
    expect(viewSrc).toContain("defaultTool: 'select'");
    expect(jsContent).toContain('window.__currentInkoTool = window.__currentInkoTool || "select";');
  });

  it('guarantees immediate Undo/Redo responsiveness and contextual property editing for selected objects', () => {
    const editorTsxPath = path.resolve(process.cwd(), 'src/components/Editor.tsx');
    const editorSrc = fs.readFileSync(editorTsxPath, 'utf8');
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    // 1. Immediate Undo/Redo responsiveness: pending snapshots are accounted for in canUndo
    expect(jsContent).toContain('pendingSnap.size>0||s.size>0||o(gUndo).length>0');
    expect(jsContent).toContain('window.__inkoUndo=()=>{const sv=window.__inkoScrollViewer||o(b);sv?.undo();');
    expect(jsContent).toContain('window.__inkoRedo=()=>{const sv=window.__inkoScrollViewer||o(b);sv?.redo();');

    // 2. Editor toolbar handles Undo / Redo buttons accurately without sticky unsaved override
    expect(editorSrc).toContain('const canUndo = Boolean(pdfViewerState?.canUndo);');
    expect(editorSrc).toContain('const canRedo = Boolean(pdfViewerState?.canRedo);');
    expect(editorSrc).not.toContain(
      'const canUndo = Boolean(pdfViewerState?.canUndo) || (isPdfFile(note) && (saveStatus === "unsaved" || saveStatus === "saving"));'
    );
    expect(editorSrc).toContain('disabled={!canUndo}');
    expect(editorSrc).toContain('disabled={!canRedo}');
    expect(editorSrc).toContain('pdfEditorRef.current.undo()');
    expect(editorSrc).toContain('pdfEditorRef.current.redo()');

    // 3. Contextual property editing for selected objects in Select mode
    expect(editorSrc).toContain('isTextContext =');
    expect(editorSrc).toContain('isHighlighterContext =');
    expect(editorSrc).toContain('isFillableShapeContext =');
    expect(editorSrc).toContain('hasContextualStyleControls =');
    expect(editorSrc).toContain('handleSetFontSize');
    expect(editorSrc).toContain('handleSetBrushColor');
    expect(editorSrc).toContain('handleSetHighlightColor');
    expect(editorSrc).toContain('handleSetHighlightWidth');
    expect(editorSrc).toContain('handleSetShapeFillColor');
    expect(editorSrc).toContain('handleSetShapeFillOpacity');

    // 4. Inko viewer selection mode does not destroy text selection on single click & strips Proxies in ir()
    expect(jsContent).toContain('const clean=JSON.parse(JSON.stringify(e));window.parent.postMessage(clean,o);');
    expect(jsContent).toContain('window.__inkoViewportScale=O;window.__broadcastInkoViewerState?.({scale:O})');
    expect(jsContent).toContain('window.__inkoViewportScale=pe;window.__broadcastInkoViewerState?.({scale:pe})');
    expect(jsContent).toContain('function findHitAnnotation(sc,pt,tol)');
    expect(jsContent).toContain('const shouldInlineEditText=!1;');
    expect(jsContent).toContain('applySelectedStyleIfAny');
    expect(jsContent).toContain('broadcastViewerState({selectedMeta:newMeta})');

    // 5. Bundle syntax check: no syntax/parse errors
    expect(jsContent).not.toContain('const const ');
    expect(jsContent).not.toContain('let let ');
    expect(jsContent).not.toContain('var var ');
  });

  it('prevents cross-PDF annotation bleed, keeps trash button neutral color, enables PointText frame resizing, and persists bookmarks & sidecars without undefined path errors', () => {
    const editorTsxPath = path.resolve(process.cwd(), 'src/components/Editor.tsx');
    const pdfViewPath = path.resolve(process.cwd(), 'src/components/PdfEditorView.tsx');
    const bridgeTsPath = path.resolve(process.cwd(), 'src/lib/inkoPdfBridge.ts');
    const useNotesPath = path.resolve(process.cwd(), 'src/hooks/useNotes.ts');
    const preloadPath = path.resolve(process.cwd(), 'electron/preload.js');
    const mainPath = path.resolve(process.cwd(), 'electron/main.js');

    const indexPath = path.resolve(process.cwd(), 'src/pages/Index.tsx');
    const windowControlsPath = path.resolve(process.cwd(), 'src/components/WindowControls.tsx');

    const editorSrc = fs.readFileSync(editorTsxPath, 'utf8');
    const viewSrc = fs.readFileSync(pdfViewPath, 'utf8');
    const bridgeSrc = fs.readFileSync(bridgeTsPath, 'utf8');
    const useNotesSrc = fs.readFileSync(useNotesPath, 'utf8');
    const preloadSrc = fs.readFileSync(preloadPath, 'utf8');
    const mainSrc = fs.readFileSync(mainPath, 'utf8');
    const indexSrc = fs.readFileSync(indexPath, 'utf8');
    const windowControlsSrc = fs.readFileSync(windowControlsPath, 'utf8');
    const jsContent = fs.readFileSync(publicJsPath, 'utf8');

    // 1. Cross-PDF annotation isolation & non-destructive session editing until tab close
    expect(editorSrc).toContain('key={note.id}');
    expect(editorSrc).toContain('pdfBase64={pdfLoadedNoteId === note.id ? pdfBase64 : null}');
    expect(viewSrc).toContain('hasStartedMountRef.current');
    expect(viewSrc).toContain('pdfSessionCleanBase64Map');
    expect(viewSrc).toContain('pdfSessionSavedCanvasDataMap');
    expect(viewSrc).not.toContain('instanceRef.current?.loadUserCanvasOverlay(sidecar.history)');
    expect(bridgeSrc).toContain('finalizePdfAnnotationSidecarOnClose');
    expect(preloadSrc).toContain('fileExists: (fullPath) => ipcRenderer.invoke("file-exists", fullPath)');

    // 2. Delete (Trash) button uses normal foreground color (no text-destructive)
    expect(editorSrc).toContain(
      'className="h-8 w-8 rounded-full md:h-8 md:w-8 md:rounded-full transition-colors text-foreground hover:bg-muted/80 disabled:opacity-40 cursor-pointer"'
    );

    // 3. PointText selection frame shows rotation + all 8 resize handles & resizes fontSize proportionally
    expect(jsContent).toContain('const A=a(d,y);r=new Me.Group([E,rotStem,...A,rotHandle])');
    expect(jsContent).not.toContain('const A=isTextItem?[]:a(d,y);');
    expect(jsContent).toContain('baseTextFontSize=curIt instanceof Me.PointText?(curIt.fontSize||16):16');
    expect(jsContent).toContain('const nextFs=Math.max(8,Math.min(144,Math.round(baseTextFontSize*sc)));');

    // 4. Page Bookmarks & Prev/Next page navigation
    expect(jsContent).toContain('case"prevPage":a.currentPage>1&&ut(a.currentPage-1);break;');
    expect(jsContent).toContain('case"nextPage":a.currentPage<a.totalPages&&ut(a.currentPage+1);break;');
    expect(jsContent).toContain('window.__inkoPrevPage');
    expect(jsContent).toContain('window.__inkoNextPage');
    expect(bridgeSrc).toContain('luno-pdf-bookmarks:');
    expect(bridgeSrc).toContain('fullPath: primarySidecarPath');
    expect(useNotesSrc).toContain('fullPath: (item as any).fullPath ?? (existingNote as any)?.fullPath');

    // 5. Electron IPC write-file-content handles both object and string arguments
    expect(preloadSrc).toContain('typeof data === "string" ? { fullPath: data, content } : data');
    expect(mainSrc).toContain('const fullPath = typeof arg1 === "string" ? arg1 : arg1?.fullPath;');

    // 6. Default colors: black for drawing, text, and shape stroke, no shape fill
    expect(editorSrc).toContain('const [pdfActiveBrushColor, setPdfActiveBrushColor] = useState<string>("#000000");');
    expect(editorSrc).toContain('const [pdfActiveShapeFillColor, setPdfActiveShapeFillColor] = useState<string | null>(null);');
    expect(editorSrc).toContain('const [pdfActiveShapeNoStroke, setPdfActiveShapeNoStroke] = useState<boolean>(false);');

    // 7. Bookmark UI: plain muted page label (no container border/bg), trash icon, and no active icon fill
    expect(editorSrc).toContain('className="text-[11px] font-medium text-muted-foreground tracking-wide tabular-nums select-none shrink-0"');
    expect(editorSrc).toContain('t("editor.page", { currentPageNum })');
    expect(editorSrc).toContain('<Trash2 className="h-3 w-3" />');
    expect(editorSrc).not.toContain('text-primary fill-primary/30');

    // 8. Unsaved PDF confirmation modal on tab close and app exit
    expect(indexSrc).toContain('pendingPdfCloseRequest');
    expect(indexSrc).toContain('workspace.saveChangesBeforeClosing');
    expect(indexSrc).toContain('finalizePdfTabSession');
    expect(windowControlsSrc).toContain('luno:request-app-close');
    expect(windowControlsSrc).toContain('finalizeAllOpenPdfSessions');
  });
});
