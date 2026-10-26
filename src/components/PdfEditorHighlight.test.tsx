import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { AppSettingsProvider } from '@/hooks/useAppSettings';
import {
  PdfEditorView,
  PdfEditorViewHandle,
  pdfDraftCanvasDataMap,
  pdfDraftUndoRedoMap,
  pdfScrollPositionMap,
  clearPdfEditorDraft,
} from './PdfEditorView';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({
    toast: (...args: unknown[]) => mockToast(...args),
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

describe('PdfEditorView Highlighting & Toolbar Styling', () => {
  it('exposes highlightSelection and setTool on handle and invokes iframe highlightTextSelection', async () => {
    const ref = createRef<PdfEditorViewHandle>();
    const { container } = render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId="test-pdf"
          fileName="sample.pdf"
          pdfUrl="blob:http://localhost/sample.pdf"
          readOnly={false}
          language="th"
        />
      </AppSettingsProvider>
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.setTool).toBe('function');
    expect(typeof ref.current?.highlightSelection).toBe('function');

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeTruthy();
    });

    const iframe = container.querySelector('iframe')!;
    const mockHighlight = vi.fn().mockReturnValue(true);
    if (iframe.contentWindow) {
      (iframe.contentWindow as any).__highlightTextSelection = mockHighlight;
    }

    // Calling highlightSelection directly
    const result = ref.current?.highlightSelection();
    expect(result).toBe(true);
    expect(mockHighlight).toHaveBeenCalledTimes(1);

    // Calling setTool("highlighter") triggers highlightSelection for existing selection
    ref.current?.setTool('highlighter');
    expect(mockHighlight).toHaveBeenCalledTimes(2);
  });

  it('luno-bridge.css isolates text layer with sans-serif and snug line-height', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(process.cwd(), 'public/inko-viewer/luno-bridge.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('.scroll-viewer .inko-text-layer');
    expect(cssContent).toContain('font-family: sans-serif !important;');
    expect(cssContent).toContain('line-height: 0.95 !important;');
    expect(cssContent).toContain('mix-blend-mode: multiply !important;');
  });

  it('inko viewer script contains unified snug selection overlay and same-line merging', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const jsPath = path.resolve(process.cwd(), 'public/inko-viewer/assets/index-BJGCP5Nd.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    expect(jsContent).toContain('topTrim = lineH * 0.19');
    expect(jsContent).toContain('bottomTrim = lineH * 0.02');
    expect(jsContent).toContain('isSameLine');
    expect(jsContent).toContain('luno-selection-box');
    expect(jsContent).toContain('updateSelectionOverlay');
    expect(jsContent).toContain('radius: 2');
  });

  it('triggers system toast matching standard notification format when saving', async () => {
    mockToast.mockClear();
    const ref = createRef<PdfEditorViewHandle>();
    const { container } = render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId="test-pdf"
          fileName="document.pdf"
          pdfUrl="blob:http://localhost/document.pdf"
          readOnly={false}
          language="th"
        />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('iframe')).toBeTruthy();
    });

    const ok = await ref.current?.saveAnnotations();
    expect(ok).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'บันทึกไฟล์แล้ว',
      description: 'document.pdf',
    });
  });

  it('triggers system toast in English when language is en', async () => {
    mockToast.mockClear();
    const ref = createRef<PdfEditorViewHandle>();
    const { container } = render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId="test-pdf"
          fileName="review.md"
          pdfUrl="blob:http://localhost/review.md"
          readOnly={false}
          language="en"
        />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('iframe')).toBeTruthy();
    });

    const ok = await ref.current?.saveAnnotations();
    expect(ok).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'File saved',
      description: 'review.md',
    });
  });

  it('luno-bridge.css defines text cursor for highlighter and crisp 1px inline text editing styles', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(process.cwd(), 'public/inko-viewer/luno-bridge.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Standard text cursor matching contentSelect (select pdf text)
    expect(cssContent).toContain('body[data-tool="highlighter"] .inko-text-layer');
    expect(cssContent).toContain('cursor: text !important;');

    // Inline in-place crisp 1px text annotation styling (matches Images 1 & 2)
    expect(cssContent).toContain('dialog.overlay-dialog');
    expect(cssContent).toContain('position: fixed !important;');
    expect(cssContent).toContain('border-radius: 0px !important;');
    expect(cssContent).toContain('background: transparent !important;');
    expect(cssContent).toContain('box-shadow: none !important;');
  });

  it('restores unsaved draft edits and dirty state across tab switches', async () => {
    const testNoteId = 'pdf-tab-switch-test';
    clearPdfEditorDraft(testNoteId);

    // Simulate unsaved in-memory draft before tab switch
    const mockDraftData = JSON.stringify({ version: '1.0', items: [{ type: 'path', strokeColor: '#26A295' }] });
    pdfDraftCanvasDataMap.set(testNoteId, mockDraftData);
    pdfScrollPositionMap.set(testNoteId, 450);

    const onDirtyMock = vi.fn();
    const ref = createRef<PdfEditorViewHandle>();
    const { container } = render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId={testNoteId}
          fileName="switching.pdf"
          pdfUrl="blob:http://localhost/switching.pdf"
          readOnly={false}
          language="th"
          onDirtyChange={onDirtyMock}
        />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('iframe')).toBeTruthy();
    });

    // Verify handle exposes setFontSize
    expect(typeof ref.current?.setFontSize).toBe('function');
    ref.current?.setFontSize(24);

    // Verify dirty state was preserved due to draft
    expect(onDirtyMock).toHaveBeenCalledWith(true);

    // Clean up
    clearPdfEditorDraft(testNoteId);
  });

  it('preserves undo/redo history stack across tab switches and exposes undo/redo on handle', async () => {
    const testNoteId = 'pdf-undo-redo-tab-switch-test';
    clearPdfEditorDraft(testNoteId);

    // Simulate draft and undo stack before tab switch
    const mockDraft = JSON.stringify({ version: '1.0', items: [{ type: 'path', strokeColor: '#26A295' }] });
    const mockUndoRedo = {
      activePage: 1,
      pages: [[1, { undoStack: ['{}'], redoStack: [], currentState: mockDraft }]],
    };
    pdfDraftCanvasDataMap.set(testNoteId, mockDraft);
    pdfDraftUndoRedoMap.set(testNoteId, mockUndoRedo);

    const ref = createRef<PdfEditorViewHandle>();
    const { container } = render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId={testNoteId}
          fileName="undoredo.pdf"
          pdfUrl="blob:http://localhost/undoredo.pdf"
          readOnly={false}
          language="th"
        />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('iframe')).toBeTruthy();
    });

    expect(typeof ref.current?.undo).toBe('function');
    expect(typeof ref.current?.redo).toBe('function');

    // Executing undo and redo on handle
    expect(ref.current?.undo()).toBe(true);
    expect(ref.current?.redo()).toBe(true);

    // Clean up
    clearPdfEditorDraft(testNoteId);
  });

  it('triggers onPdfLoaded callback and provides worker file in assets directory', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const workerAssetPath = path.resolve(process.cwd(), 'public/inko-viewer/assets/pdf.worker.mjs');
    expect(fs.existsSync(workerAssetPath)).toBe(true);

    const onLoadedMock = vi.fn();
    const ref = createRef<PdfEditorViewHandle>();
    render(
      <AppSettingsProvider>
        <PdfEditorView
          ref={ref}
          noteId="worker-test-pdf"
          fileName="worker.pdf"
          pdfUrl="blob:http://localhost/worker.pdf"
          readOnly={false}
          language="th"
          onPdfLoaded={onLoadedMock}
        />
      </AppSettingsProvider>
    );

    // Verify onPdfLoaded gets called within fallback / live period
    await waitFor(() => {
      expect(onLoadedMock).toHaveBeenCalled();
    }, { timeout: 3500 });
  });

  it('luno-bridge.css styles page thumbnails to match Workspace Images item card, hover, and active states', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(process.cwd(), 'public/inko-viewer/luno-bridge.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Default card: rounded-lg, border-border/60, bg-card
    expect(cssContent).toContain('border-radius: 8px !important;');
    expect(cssContent).toContain('color-mix(in srgb, var(--luno-border) 60%, transparent)');
    expect(cssContent).toContain('background-color: var(--luno-card) !important;');

    // Hover state: hover:border-border, hover:bg-muted/40, group-hover:text-primary
    expect(cssContent).toContain('.thumbnail-container:hover:not(.active)');
    expect(cssContent).toContain('border-color: var(--luno-border) !important;');
    expect(cssContent).toContain('color-mix(in srgb, var(--luno-muted) 40%, transparent)');
    expect(cssContent).toContain('.thumbnail-container:hover:not(.active) .thumbnail-label');

    // Active state: border-primary, bg-primary/10, shadow-xs
    expect(cssContent).toContain('.thumbnail-container.active');
    expect(cssContent).toContain('border: 1px solid var(--luno-primary) !important;');
    expect(cssContent).toContain('color-mix(in srgb, var(--luno-primary) 10%, transparent)');
    expect(cssContent).toContain('box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;');

    // Inner preview: rounded-md, bg-muted/30, border-border/30
    expect(cssContent).toContain('.thumbnail-content');
    expect(cssContent).toContain('border-radius: 6px !important;');
    expect(cssContent).toContain('color-mix(in srgb, var(--luno-muted) 30%, transparent)');
    expect(cssContent).toContain('color-mix(in srgb, var(--luno-border) 30%, transparent)');
  });

  it('maps PDF file icon to file (not fileText) and select tool to MousePointer2', async () => {
    const { getDefaultFileIconKey } = await import('@/lib/fileIconUtils');
    const { getToolbarIcon } = await import('@/lib/iconPacks');
    const Lucide = await import('lucide-react');

    // PDF files should use "file" icon key
    expect(getDefaultFileIconKey('6767_1_8551.pdf')).toBe('file');
    expect(getDefaultFileIconKey('document.pdf')).toBe('file');

    // Both "file" and legacy "filePdf" should render Lucide.File
    const fileComp = getToolbarIcon('file', 'lucide');
    const pdfComp = getToolbarIcon('filePdf', 'lucide');
    expect(fileComp).toBe(Lucide.File);
    expect(pdfComp).toBe(Lucide.File);

    // Select tool should render MousePointer2
    const selectComp = getToolbarIcon('select', 'lucide');
    expect(selectComp).toBe(Lucide.MousePointer2);
  });

  it('configures select and move mode so canvas has pointer-events and text layer is non-interfering', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const cssPath = path.resolve(process.cwd(), 'public/inko-viewer/luno-bridge.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Canvas must be interactive in select mode
    expect(cssContent).toContain('body[data-tool="select"] .scroll-page-canvas-paper');
    expect(cssContent).toContain('.scroll-viewer[data-tool="select"] .scroll-page-canvas-paper');
    expect(cssContent).toContain('pointer-events: auto !important;');

    // Text layer must be non-interfering in select mode
    expect(cssContent).toContain('body[data-tool="select"] .inko-text-layer');
    expect(cssContent).toContain('pointer-events: none !important;');

    // JS bundle keeps editing-active active for select & dual-mode highlighter tools
    const jsPath = path.resolve(process.cwd(), 'public/inko-viewer/assets/index-BJGCP5Nd.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    expect(jsContent).toContain('V=oe(()=>t.isReadOnly||t.currentTool==="contentSelect"),H=oe(()=>!o(V)),');
    expect(jsContent).toContain('Math.max(10,Z.hitTestTolerance)');
  });

  it('renders original-style compact square handles and snug fit bounds', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const jsPath = path.resolve(process.cwd(), 'public/inko-viewer/assets/index-BJGCP5Nd.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    // Original style compact square handles (5px) and blue stroke with snug padding (2px)
    expect(jsContent).toContain('selectionColor:n="#1890ff"');
    expect(jsContent).toContain('const g=2,y=h.expand(g*2)');
    expect(jsContent).toContain('size:[5,5],fillColor:"white",strokeColor:n,strokeWidth:1');
    expect(jsContent).toContain('tolerance:2.5');

    // Stable delta-based proportional & axis-aware scaling avoiding compounding and browser lockups
    expect(jsContent).toContain('lastScaleX=1,lastScaleY=1');
    expect(jsContent).toContain('deltaScale=pe/lastScaleX');
    expect(jsContent).toContain('K.scale(deltaScale,Z);lastScaleX=pe;lastScaleY=pe');

    // Immediate drag-moving on click within selection bounds
    expect(jsContent).toContain('selBounds.contains(R)');
  });
});
