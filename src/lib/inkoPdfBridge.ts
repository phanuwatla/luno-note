// ============================================================================
// Inko PDF SDK Bridge & Luno Note Design System Synchronizer
// ============================================================================

export type InkoTool =
  | 'select'
  | 'contentSelect'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text';

export interface InkoFeaturesConfig {
  thumbnails?: boolean;
  bookmarks?: boolean;
  pageNavigation?: boolean;
  pageNav?: boolean;
  undoRedo?: boolean;
  zoom?: boolean;
  orientation?: boolean;
  search?: boolean;
  history?: boolean;
  save?: boolean;
  deleteSelection?: boolean;
}

export interface InkoToolsConfig {
  enabledTools?: InkoTool[] | null;
  defaultTool?: InkoTool;
  defaultColor?: string;
  defaultWidth?: number;
  logoUrl?: string;
  features?: InkoFeaturesConfig;
}

export interface InkoThemeConfig {
  primaryColor?: string;
  saveColor?: string;
  historyColor?: string;
  cssVars?: Record<string, string>;
}

export type InkoViewerCommand =
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomReset'
  | 'fitWidth'
  | 'setZoom'
  | 'setZoomDirect'
  | 'goToPage'
  | 'prevPage'
  | 'nextPage'
  | 'toggleSearch'
  | 'setSearchQuery'
  | 'searchNext'
  | 'searchPrev'
  | 'closeSearch'
  | 'undo'
  | 'redo'
  | 'deleteSelected'
  | 'clearSelection'
  | 'toggleThumbnails'
  | 'toggleBookmarks'
  | 'toggleHistory'
  | 'toggleOrientation'
  | 'clearPage'
  | 'setTool'
  | 'setColor'
  | 'setShapeStrokeColor'
  | 'setShapeFillColor'
  | 'setShapeFillOpacity'
  | 'setHighlightColor'
  | 'setHighlightWidth'
  | 'setEraserWidth'
  | 'setWidth'
  | 'setFontSize'
  | 'highlightSelection'
  | 'print';

export interface InkoRuntimeConfig {
  theme?: InkoThemeConfig;
  tools?: InkoToolsConfig;
  locale?: string;
  messages?: Record<string, string>;
  readOnly?: boolean;
  command?: InkoViewerCommand;
  scale?: number;
  page?: number;
  open?: boolean;
  query?: string;
}

export interface InkoUserCanvasItem {
  canvasId?: string;
  userName?: string;
  userId?: string;
  color?: string;
  registeredAt?: string;
  regDt?: string;
  canvasData: string;
  enabled?: boolean;
  isCurrent?: boolean;
}

export interface InkoFlattenReport {
  acroForm: {
    status: string;
    message?: string;
  };
  pages: Array<{
    pageNumber: number;
    renderedCount: number;
    skippedCount: number;
    unsupportedCount: number;
    failedCount: number;
    issues: Array<{
      pageNumber: number;
      itemIndex: number;
      itemType: string;
      severity: 'skipped' | 'unsupported' | 'failed';
      reason: string;
    }>;
  }>;
  renderedCount: number;
  skippedCount: number;
  unsupportedCount: number;
  failedCount: number;
  issues: Array<{
    pageNumber: number;
    itemIndex: number;
    itemType: string;
    severity: 'skipped' | 'unsupported' | 'failed';
    reason: string;
  }>;
  hasFailures: boolean;
}

export interface InkoSearchStats {
  total: number;
  current: number;
  query?: string;
  status?: string;
}

export interface InkoOutlineItem {
  id: string;
  title: string;
  page: number | null;
  depth: number;
  children?: InkoOutlineItem[];
  external?: boolean;
}

export interface PdfPageBookmark {
  id: string;
  page: number;
  title: string;
  createdAt: string;
}

export interface InkoSelectedMeta {
  kind: 'text' | 'highlighter' | 'shape' | 'drawing';
  shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow' | null;
  canFill?: boolean;
  isTextHighlight?: boolean;
  noStroke?: boolean;
  color?: string | null;
  fillColor?: string | null;
  fillOpacity?: number | null;
  width?: number | null;
  fontSize?: number | null;
}

export interface InkoViewerLiveState {
  currentPage: number;
  totalPages: number;
  scale: number;
  currentTool: InkoTool;
  isReadOnly: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isSearchOpen: boolean;
  showThumbnails: boolean;
  isOutlineOpen: boolean;
  hasOutline: boolean;
  isHistoryOpen: boolean;
  hasHistory: boolean;
  hasSelection: boolean;
  orientation: 'portrait' | 'landscape';
  brushColor: string;
  brushWidth: number;
  fontSize: number;
  highlightColor?: string;
  highlightWidth?: number;
  eraserWidth?: number;
  shapeFillColor?: string | null;
  shapeFillOpacity?: number;
  shapeNoStroke?: boolean;
  selectedMeta?: InkoSelectedMeta | null;
  outline?: InkoOutlineItem[];
  searchStats?: InkoSearchStats;
}

export interface InkoMountOptions {
  src?: string;
  pdfUrl?: string;
  pdfBase64?: string;
  fileName?: string;
  readOnly?: boolean;
  initialCanvasData?: string;
  initialHistoryState?: any;
  userCanvasData?: InkoUserCanvasItem[];
  theme?: InkoThemeConfig;
  tools?: InkoToolsConfig;
  locale?: string;
  messages?: Record<string, string>;
  onReady?: () => void;
  onPdfLoaded?: () => void;
  onChange?: (canvasData: string) => void;
  onSave?: (canvasData: string, success: boolean, message: string) => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
  onViewerStateChange?: (state: InkoViewerLiveState) => void;
  onHostShortcut?: (shortcut: 'save' | 'find' | 'print') => void;
  onIframeKeydown?: (event: {
    key: string;
    code?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }) => void;
}

export interface InkoInstance {
  iframe: HTMLIFrameElement;
  getScrollViewer: () => any;
  getCanvasJson: () => string | null;
  getHistoryState: () => any;
  loadPdfUrl: (url: string, fileName?: string, canvasData?: string, readOnly?: boolean) => void;
  loadPdfBase64: (base64: string, fileName?: string, canvasData?: string, readOnly?: boolean) => void;
  loadUserCanvasOverlay: (list: InkoUserCanvasItem[]) => void;
  save: () => void;
  exportPdf: () => Promise<ArrayBuffer>;
  exportFlattenedPdf: () => Promise<{ pdfBytes: ArrayBuffer; report: InkoFlattenReport }>;
  applyConfig: (config: InkoRuntimeConfig) => void;
  setReadOnly: (readOnly: boolean) => void;
  sendCommand: (
    command: InkoViewerCommand,
    payload?: {
      scale?: number;
      page?: number;
      open?: boolean;
      query?: string;
      tool?: InkoTool;
      color?: string | null;
      opacity?: number;
      width?: number;
      fontSize?: number;
    }
  ) => void;
  clearCurrentCanvas: () => void;
  destroy: () => void;
}

// ============================================================================
// Complete English & Thai Localization Dictionaries for Inko Viewer
// ============================================================================

export const INKO_MESSAGES_EN: Record<string, string> = {
  'tool.select': 'Select & Move Annotations',
  'tool.contentSelect': 'Select PDF Text',
  'tool.pen': 'Pen',
  'tool.highlighter': 'Highlighter',
  'tool.eraser': 'Eraser',
  'tool.rectangle': 'Rectangle',
  'tool.circle': 'Circle',
  'tool.line': 'Line',
  'tool.text': 'Add Text',
  'toolbar.label': 'PDF Editor Toolbar',
  'toolbar.navigationGroup': 'Page navigation',
  'toolbar.editHistoryGroup': 'Undo and redo',
  'toolbar.zoomGroup': 'View and zoom',
  'toolbar.toolsGroup': 'Annotation tools',
  'toolbar.actionsGroup': 'Document actions',
  'toolbar.thumbnailsHide': 'Hide page thumbnails',
  'toolbar.thumbnailsShow': 'Show page thumbnails',
  'toolbar.prevPage': 'Previous page',
  'toolbar.nextPage': 'Next page',
  'toolbar.currentPage': 'Current page',
  'toolbar.undo': 'Undo (Ctrl+Z)',
  'toolbar.redo': 'Redo (Ctrl+Y)',
  'toolbar.zoomOut': 'Zoom out',
  'toolbar.zoomIn': 'Zoom in',
  'toolbar.zoomLevel': 'Zoom {percent}%',
  'toolbar.orientationLandscape': 'Landscape view',
  'toolbar.orientationPortrait': 'Portrait view',
  'toolbar.deleteSelection': 'Delete selected annotation (Del)',
  'toolbar.bookmarksShow': 'Show document outline',
  'toolbar.bookmarksHide': 'Hide document outline',
  'toolbar.history': 'Annotation History & Layers',
  'toolbar.save': 'Save',
  'search.region': 'Search in PDF',
  'search.open': 'Find in PDF (Ctrl+F)',
  'search.input': 'Find in document',
  'search.placeholder': 'Search in PDF...',
  'search.previous': 'Previous match',
  'search.next': 'Next match',
  'search.close': 'Close search',
  'search.indexing': 'Indexing pages...',
  'search.noResults': 'No matches',
  'bookmark.title': 'Document Outline',
  'bookmark.loading': 'Loading outline...',
  'bookmark.outlineEmpty': 'This PDF does not contain an outline.',
  'bookmark.untitled': 'Untitled section',
  'bookmark.pageLabel': 'p. {n}',
  'bookmark.goToPage': '{title} — go to {page}',
  'bookmark.unresolved': '{title} — destination unavailable',
  'bookmark.externalUnsupported': '{title} — external link',
  'bookmark.expand': 'Expand {title}',
  'bookmark.collapse': 'Collapse {title}',
  'bookmark.close': 'Close outline',
  'bookmark.listLabel': 'PDF outline',
  'bookmark.keyboardInstructions': 'Use Up/Down arrows to navigate and Left/Right arrows to collapse or expand.',
  'history.title': 'Saved Versions & Layers',
  'history.empty': 'No saved versions yet.',
  'history.continueEdit': 'Restore this version',
  'history.unknownUser': 'Luno User',
  'history.hideUser': 'Hide {name}',
  'history.showUser': 'Show {name}',
  'history.close': 'Close version history',
  'history.layerVisibility': '{name} layer',
  'history.currentVersion': 'Current active version',
  'history.continueEditLabel': 'Restore version from {date} by {name}',
  'history.versionPosition': '{current} / {total}',
  'history.versionSelection': '{name}, {date}, {position}',
  'history.versionSelectionCurrent': '{name}, {date}, {position}, {current}',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.closeNotification': 'Dismiss notification',
  'error.notifications': 'Notifications',
  'sheet.color': 'Color',
  'sheet.thickness': 'Stroke Width',
  'sheet.lineThickness': 'Border Width',
  'sheet.size': 'Font Size',
  'sheet.pressure': 'Pen Pressure Sensitivity',
  'sheet.customColor': 'Custom Color',
  'sheet.customColorPick': 'Pick custom color',
  'sheet.dialogLabel': '{header} Options',
  'sheet.closeLabel': 'Close {header} options',
  'sheet.colorSwatch': 'Color {color}',
  'sheet.widthSwatch': '{label} {n}px',
  'sheet.textPreviewSample': 'AaBbCc กขค 123',
  'text.placeholder': 'Type annotation text...',
  'text.dialogTitle': 'Add Text Annotation',
  'text.inputLabel': 'Annotation text',
  'text.instructions': 'Press Enter to confirm, Shift+Enter for a new line, or Escape to cancel.',
  'text.fontSizeGroup': 'Font Size',
  'text.fontSizeOption': '{size}px',
  'text.requiredError': 'Please enter text to add.',
  'document.viewerRegion': 'PDF document viewport',
  'document.pageRegion': 'PDF page {n}',
  'document.pageText': 'Page {n} text',
  'document.currentPageAnnouncement': 'Page {n} of {total}',
  'document.accessibleTextLoading': 'Preparing text for page {n}...',
  'document.accessibleTextImageOnly': 'Page {n} contains scanned images without selectable text.',
  'document.accessibleTextError': 'Could not read text on page {n}.',
  'document.canvasCountAnnouncement': 'Page {n} has {count} annotations.',
  'document.canvasSelectionAnnouncement': 'Page {n}, selected {kind} {index} of {total}, at ({x}, {y}).',
  'document.canvasInstructionsSelect': 'Press Enter to cycle annotations, Arrow keys to nudge, Delete/Backspace to remove, Escape to deselect.',
  'document.canvasInstructionsText': 'Click anywhere on the page or press Enter to place text.',
  'document.canvasInstructionsShape': 'Drag on the page to draw a shape.',
  'document.canvasInstructionsPath': 'Draw freely on the page.',
  'document.canvasInstructionsEraser': 'Drag over annotations to erase them.',
  'document.canvasInstructionsDefault': 'PDF page annotation canvas.',
  'document.annotationKind.text': 'text',
  'document.annotationKind.drawing': 'drawing',
  'document.annotationKind.group': 'group',
  'document.annotationKind.image': 'image',
  'document.annotationKind.annotation': 'annotation',
  'document.pageAnnotations': 'Page {n} form fields and annotations',
  'document.annotationControl': 'Page {n} control {index}',
  'document.editableCanvas': 'Page {n} editable annotations',
  'document.reviewCanvas': 'Page {n} review layer',
  'error.categoryParse': 'Data',
  'error.categoryRender': 'Render',
  'error.categoryStorage': 'Storage',
  'error.categoryBridge': 'Bridge',
  'error.categoryTool': 'Tool',
  'error.categoryNetwork': 'Network',
  'error.categoryUnknown': 'System',
  'viewer.tapToPlaceText': 'Click anywhere on a page to place text',
  'viewer.savedVersion': 'Saved (Version {version})',
  'viewer.saveRequested': 'Annotations saved',
  'viewer.saveDataError': 'Failed to serialize PDF annotations',
  'viewer.saveFailed': 'Failed to save annotations',
  'viewer.encodeFailed': 'Failed to encode annotation data',
  'thumbnails.navigationLabel': 'PDF page thumbnails',
  'thumbnails.listLabel': 'Page list',
  'thumbnails.noPdf': 'No PDF loaded',
  'thumbnails.loadingList': 'Loading thumbnails... ({n}/{total})',
  'thumbnails.loadingStarted': 'Loading page thumbnails...',
  'thumbnails.loadingComplete': 'Loaded all {total} page thumbnails.',
  'thumbnail.loading': 'Loading...',
  'thumbnail.error': 'Error',
  'thumbnail.pageLabel': 'Page {n}',
  'thumbnail.currentPageLabel': 'Page {n} (current)',
  'thumbnail.pageLoadingLabel': 'Loading page {n} thumbnail',
  'thumbnail.pageErrorLabel': 'Error loading page {n} thumbnail',
  'thumbnail.contextError': 'Failed to create 2D canvas context',
};

export const INKO_MESSAGES_TH: Record<string, string> = {
  'tool.select': 'เลือกและย้ายวัตถุ',
  'tool.contentSelect': 'เลือกข้อความใน PDF',
  'tool.pen': 'ปากกาเขียน',
  'tool.highlighter': 'ปากกาเน้นข้อความ (ไฮไลท์)',
  'tool.eraser': 'ยางลบ',
  'tool.rectangle': 'สี่เหลี่ยม',
  'tool.circle': 'วงกลม',
  'tool.line': 'เส้นตรง',
  'tool.text': 'เพิ่มข้อความ',
  'toolbar.label': 'แถบเครื่องมือแก้ไข PDF',
  'toolbar.navigationGroup': 'การนำทางหน้ากระดาษ',
  'toolbar.editHistoryGroup': 'เลิกทำและทำซ้ำ',
  'toolbar.zoomGroup': 'มุมมองและการซูม',
  'toolbar.toolsGroup': 'เครื่องมือขีดเขียนและคำอธิบาย',
  'toolbar.actionsGroup': 'การจัดการเอกสาร',
  'toolbar.thumbnailsHide': 'ซ่อนตัวอย่างหน้ากระดาษ',
  'toolbar.thumbnailsShow': 'แสดงตัวอย่างหน้ากระดาษ',
  'toolbar.prevPage': 'หน้าก่อนหน้า',
  'toolbar.nextPage': 'หน้าถัดไป',
  'toolbar.currentPage': 'หน้าปัจจุบัน',
  'toolbar.undo': 'เลิกทำ (Ctrl+Z)',
  'toolbar.redo': 'ทำซ้ำ (Ctrl+Y)',
  'toolbar.zoomOut': 'ซูมออก',
  'toolbar.zoomIn': 'ซูมเข้า',
  'toolbar.zoomLevel': 'ซูม {percent}%',
  'toolbar.orientationLandscape': 'มุมมองแนวนอน',
  'toolbar.orientationPortrait': 'มุมมองแนวตั้ง',
  'toolbar.deleteSelection': 'ลบสิ่งที่เลือก (Del)',
  'toolbar.bookmarksShow': 'แสดงสารบัญเอกสาร',
  'toolbar.bookmarksHide': 'ซ่อนสารบัญเอกสาร',
  'toolbar.history': 'ประวัติการแก้ไขและเลเยอร์',
  'toolbar.save': 'บันทึก',
  'search.region': 'ค้นหาใน PDF',
  'search.open': 'ค้นหาในเอกสาร (Ctrl+F)',
  'search.input': 'ค้นหาในเอกสาร',
  'search.placeholder': 'พิมพ์คำค้นหาใน PDF...',
  'search.previous': 'ผลลัพธ์ก่อนหน้า',
  'search.next': 'ผลลัพธ์ถัดไป',
  'search.close': 'ปิดการค้นหา',
  'search.indexing': 'กำลังเตรียมข้อมูลค้นหา...',
  'search.noResults': 'ไม่พบผลลัพธ์',
  'bookmark.title': 'สารบัญเอกสาร (Outline)',
  'bookmark.loading': 'กำลังโหลดสารบัญ...',
  'bookmark.outlineEmpty': 'เอกสาร PDF นี้ไม่มีข้อมูลสารบัญ',
  'bookmark.untitled': 'ไม่มีชื่อหัวข้อ',
  'bookmark.pageLabel': 'หน้า {n}',
  'bookmark.goToPage': '{title} — ไปยัง{page}',
  'bookmark.unresolved': '{title} — ไม่พบตำแหน่งปลายทาง',
  'bookmark.externalUnsupported': '{title} — ลิงก์ภายนอก',
  'bookmark.expand': 'ขยาย {title}',
  'bookmark.collapse': 'ย่อ {title}',
  'bookmark.close': 'ปิดหน้าต่างสารบัญ',
  'bookmark.listLabel': 'รายการสารบัญ PDF',
  'bookmark.keyboardInstructions': 'ใช้ปุ่มลูกศรขึ้น/ลงเพื่อเลื่อนดู และลูกศรซ้าย/ขวาเพื่อย่อหรือขยายหัว้อย่อย',
  'history.title': 'ประวัติเวอร์ชันและเลเยอร์',
  'history.empty': 'ยังไม่มีประวัติเวอร์ชันที่บันทึกไว้',
  'history.continueEdit': 'กู้คืนและแก้ไขต่อจากเวอร์ชันนี้',
  'history.unknownUser': 'ผู้ใช้ Luno',
  'history.hideUser': 'ซ่อน {name}',
  'history.showUser': 'แสดง {name}',
  'history.close': 'ปิดหน้าต่างประวัติ',
  'history.layerVisibility': 'เลเยอร์ของ {name}',
  'history.currentVersion': 'กำลังแก้ไขปัจจุบัน',
  'history.continueEditLabel': 'แก้ไขต่อจากเวอร์ชัน {date} โดย {name}',
  'history.versionPosition': '{current} / {total}',
  'history.versionSelection': '{name}, {date}, {position}',
  'history.versionSelectionCurrent': '{name}, {date}, {position}, {current}',
  'common.cancel': 'ยกเลิก',
  'common.confirm': 'ตกลง',
  'common.close': 'ปิด',
  'common.closeNotification': 'ปิดการแจ้งเตือน',
  'error.notifications': 'การแจ้งเตือน',
  'sheet.color': 'สี',
  'sheet.thickness': 'ความหนาเส้น',
  'sheet.lineThickness': 'ความหนาเส้นขอบ',
  'sheet.size': 'ขนาดตัวอักษร',
  'sheet.pressure': 'ความไวต่อแรงกดปากกา',
  'sheet.customColor': 'กำหนดสีเอง',
  'sheet.customColorPick': 'เลือกสีที่ต้องการ',
  'sheet.dialogLabel': 'ตั้งค่า {header}',
  'sheet.closeLabel': 'ปิดการตั้งค่า {header}',
  'sheet.colorSwatch': 'สี {color}',
  'sheet.widthSwatch': '{label} {n}px',
  'sheet.textPreviewSample': 'กขค AaBbCc 123',
  'text.placeholder': 'พิมพ์ข้อความที่ต้องการเพิ่ม...',
  'text.dialogTitle': 'เพิ่มข้อความลงใน PDF',
  'text.inputLabel': 'ข้อความ',
  'text.instructions': 'กด Enter เพื่อยืนยัน, กด Shift+Enter เพื่อขึ้นบรรทัดใหม่ หรือกด Escape เพื่อยกเลิก',
  'text.fontSizeGroup': 'ขนาดตัวอักษร',
  'text.fontSizeOption': 'ขนาด {size}px',
  'text.requiredError': 'กรุณาพิมพ์ข้อความที่ต้องการเพิ่ม',
  'document.viewerRegion': 'พื้นที่แสดงเอกสาร PDF',
  'document.pageRegion': 'PDF หน้า {n}',
  'document.pageText': 'ข้อความหน้า {n}',
  'document.currentPageAnnouncement': 'หน้า {n} จาก {total}',
  'document.accessibleTextLoading': 'กำลังเตรียมข้อความหน้า {n}...',
  'document.accessibleTextImageOnly': 'หน้า {n} เป็นรูปภาพสแกน ไม่มีข้อความที่เลือกได้',
  'document.accessibleTextError': 'ไม่สามารถอ่านข้อความในหน้า {n} ได้',
  'document.canvasCountAnnouncement': 'หน้า {n} มีคำอธิบายประกอบ {count} รายการ',
  'document.canvasSelectionAnnouncement': 'หน้า {n} เลือก {kind} รายการที่ {index} จาก {total} ที่ตำแหน่ง ({x}, {y})',
  'document.canvasInstructionsSelect': 'กด Enter เพื่อสลับเลือกรายการ ใช้ปุ่มลูกศรเพื่อเลื่อนตำแหน่ง กด Delete/Backspace เพื่อลบ หรือกด Escape เพื่อยกเลิกการเลือก',
  'document.canvasInstructionsText': 'คลิกตำแหน่งที่ต้องการบนหน้ากระดาษเพื่อวางข้อความ',
  'document.canvasInstructionsShape': 'ลากเมาส์บนหน้ากระดาษเพื่อวาดรูปทรง',
  'document.canvasInstructionsPath': 'วาดเส้นบนหน้ากระดาษได้อย่างอิสระ',
  'document.canvasInstructionsEraser': 'ลากผ่านเส้นหรือวัตถุที่ต้องการลบ',
  'document.canvasInstructionsDefault': 'พื้นที่วาดคำอธิบายประกอบบนหน้า PDF',
  'document.annotationKind.text': 'ข้อความ',
  'document.annotationKind.drawing': 'เส้นวาด',
  'document.annotationKind.group': 'กลุ่มวัตถุ',
  'document.annotationKind.image': 'รูปภาพ',
  'document.annotationKind.annotation': 'คำอธิบายประกอบ',
  'document.pageAnnotations': 'แบบฟอร์มและคำอธิบายประกอบหน้า {n}',
  'document.annotationControl': 'ตัวควบคุม {index} ในหน้า {n}',
  'document.editableCanvas': 'เลเยอร์แก้ไขหน้า {n}',
  'document.reviewCanvas': 'เลเยอร์ตรวจทานหน้า {n}',
  'error.categoryParse': 'ข้อมูล',
  'error.categoryRender': 'การแสดงผล',
  'error.categoryStorage': 'การจัดเก็บ',
  'error.categoryBridge': 'การเชื่อมต่อ',
  'error.categoryTool': 'เครื่องมือ',
  'error.categoryNetwork': 'เครือข่าย',
  'error.categoryUnknown': 'ระบบ',
  'viewer.tapToPlaceText': 'คลิกบนหน้ากระดาษในตำแหน่งที่ต้องการวางข้อความ',
  'viewer.savedVersion': 'บันทึกแล้ว (เวอร์ชัน {version})',
  'viewer.saveRequested': 'บันทึกการแก้ไข PDF เรียบร้อยแล้ว',
  'viewer.saveDataError': 'เกิดข้อผิดพลาดในการสร้างข้อมูลบันทึก',
  'viewer.saveFailed': 'ไม่สามารถบันทึกข้อมูลได้',
  'viewer.encodeFailed': 'ไม่สามารถเข้ารหัสข้อมูลการแก้ไขได้',
  'thumbnails.navigationLabel': 'ตัวอย่างหน้ากระดาษ PDF',
  'thumbnails.listLabel': 'รายการหน้า',
  'thumbnails.noPdf': 'ยังไม่ได้โหลดเอกสาร PDF',
  'thumbnails.loadingList': 'กำลังโหลดตัวอย่างหน้า... ({n}/{total})',
  'thumbnails.loadingStarted': 'กำลังโหลดตัวอย่างหน้ากระดาษ...',
  'thumbnails.loadingComplete': 'โหลดตัวอย่างหน้ากระดาษครบทั้ง {total} หน้าแล้ว',
  'thumbnail.loading': 'กำลังโหลด...',
  'thumbnail.error': 'ข้อผิดพลาด',
  'thumbnail.pageLabel': 'หน้า {n}',
  'thumbnail.currentPageLabel': 'หน้า {n} (หน้าปัจจุบัน)',
  'thumbnail.pageLoadingLabel': 'กำลังโหลดตัวอย่างหน้า {n}',
  'thumbnail.pageErrorLabel': 'ไม่สามารถโหลดตัวอย่างหน้า {n}',
  'thumbnail.contextError': 'ไม่สามารถสร้าง Canvas 2D ได้',
};

export function getInkoMessages(lang: string): Record<string, string> {
  return lang === 'th' ? INKO_MESSAGES_TH : INKO_MESSAGES_EN;
}

// ============================================================================
// Live Luno Note Theme Synchronizer
// ============================================================================

function resolveHslToken(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb') ||
    trimmed.startsWith('hsl') ||
    trimmed.startsWith('oklch') ||
    trimmed.startsWith('color')
  ) {
    return trimmed;
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return fallback;
}

export function extractLunoThemeConfig(): InkoThemeConfig {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {};
  }

  const root = document.documentElement;
  const style = window.getComputedStyle(root);
  const isDark = root.classList.contains('dark');

  const background = resolveHslToken(
    style.getPropertyValue('--background'),
    isDark ? '#14171c' : '#ffffff'
  );
  const foreground = resolveHslToken(
    style.getPropertyValue('--foreground'),
    isDark ? '#f1f5f9' : '#171717'
  );
  const card = resolveHslToken(
    style.getPropertyValue('--card'),
    isDark ? '#1a1d24' : '#fafafa'
  );
  const cardForeground = resolveHslToken(
    style.getPropertyValue('--card-foreground'),
    foreground
  );
  const popover = resolveHslToken(
    style.getPropertyValue('--popover'),
    isDark ? '#1e222a' : '#ffffff'
  );
  const popoverForeground = resolveHslToken(
    style.getPropertyValue('--popover-foreground'),
    foreground
  );
  const primary = resolveHslToken(
    style.getPropertyValue('--primary'),
    '#3b82f6'
  );
  const primaryForeground = resolveHslToken(
    style.getPropertyValue('--primary-foreground'),
    '#ffffff'
  );
  const secondary = resolveHslToken(
    style.getPropertyValue('--secondary'),
    isDark ? '#222630' : '#f4f4f5'
  );
  const secondaryForeground = resolveHslToken(
    style.getPropertyValue('--secondary-foreground'),
    foreground
  );
  const muted = resolveHslToken(
    style.getPropertyValue('--muted'),
    isDark ? '#222630' : '#f4f4f5'
  );
  const mutedForeground = resolveHslToken(
    style.getPropertyValue('--muted-foreground'),
    isDark ? '#94a3b8' : '#71717a'
  );
  const accent = resolveHslToken(
    style.getPropertyValue('--accent'),
    isDark ? '#282d39' : '#e4e4e7'
  );
  const accentForeground = resolveHslToken(
    style.getPropertyValue('--accent-foreground'),
    foreground
  );
  const destructive = resolveHslToken(
    style.getPropertyValue('--destructive'),
    '#ef4444'
  );
  const border = resolveHslToken(
    style.getPropertyValue('--border'),
    isDark ? '#2e3440' : '#e4e4e7'
  );
  const radius = style.getPropertyValue('--radius').trim() || '0.75rem';
  const fontFamily =
    style.getPropertyValue('--app-font-family').trim() ||
    "'Inter', 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif";

  const pageCanvasBg = isDark
    ? `color-mix(in srgb, ${background} 78%, #090b0e)`
    : `color-mix(in srgb, ${muted} 70%, ${background})`;

  return {
    primaryColor: primary,
    saveColor: primary,
    historyColor: primary,
    cssVars: {
      '--luno-background': background,
      '--luno-foreground': foreground,
      '--luno-card': card,
      '--luno-card-foreground': cardForeground,
      '--luno-popover': popover,
      '--luno-popover-foreground': popoverForeground,
      '--luno-primary': primary,
      '--luno-primary-foreground': primaryForeground,
      '--luno-secondary': secondary,
      '--luno-secondary-foreground': secondaryForeground,
      '--luno-muted': muted,
      '--luno-muted-foreground': mutedForeground,
      '--luno-accent': accent,
      '--luno-accent-foreground': accentForeground,
      '--luno-destructive': destructive,
      '--luno-border': border,
      '--luno-radius': radius,
      '--luno-font-family': fontFamily,
      '--luno-page-canvas-bg': pageCanvasBg,
      // Native Inko variables mapped to Luno tokens
      '--color-primary': primary,
      '--color-primary-hover': primary,
      '--color-primary-strong': primary,
      '--color-primary-strong-hover': primary,
      '--color-primary-bg': `color-mix(in srgb, ${primary} 15%, ${background})`,
      '--color-primary-bg-hover': `color-mix(in srgb, ${primary} 22%, ${background})`,
      '--color-surface': popover,
      '--color-surface-subtle': card,
      '--color-surface-muted': secondary,
      '--color-surface-app': background,
      '--color-surface-thumbnail': secondary,
      '--color-surface-page-bg': pageCanvasBg,
      '--color-text-primary': foreground,
      '--color-text-secondary': mutedForeground,
      '--color-text-muted': mutedForeground,
      '--color-text-subtle': mutedForeground,
      '--color-text-strong': foreground,
      '--color-text-label': foreground,
      '--color-text-tool': foreground,
      '--color-text-inverse': primaryForeground,
      '--color-border': border,
      '--color-border-light': border,
      '--color-border-muted': border,
      '--color-border-subtle': border,
      '--color-border-strong': border,
      '--color-border-divider': border,
      '--color-action-destructive': destructive,
      '--color-action-save': primary,
      '--color-action-save-hover': primary,
      '--color-history': primary,
      '--color-history-hover': primary,
      '--blue-100': `color-mix(in srgb, ${primary} 15%, ${background})`,
      '--gray-100': secondary,
      '--gray-150': muted,
      '--gray-200': accent,
    },
  };
}

// ============================================================================
// Persistent PDF Annotation Sidecar Storage (.luno/pdf-annotations + localStorage)
// ============================================================================

export interface PdfAnnotationSidecarData {
  version: 1;
  fileName: string;
  updatedAt: string;
  canvasData: string;
  history: InkoUserCanvasItem[];
  bookmarks?: PdfPageBookmark[];
}

function sanitizeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-\u0E00-\u0E7F]/g, '_').slice(0, 140);
}

function getLocalStorageSidecarKey(noteKey: string): string {
  return `luno-pdf-annotations:${noteKey}`;
}

function normalizePathKey(p?: string | null): string {
  if (!p) return '';
  return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
}

function getCandidateSidecarStorageKeys(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
}): string[] {
  const keys = new Set<string>();
  const normFile = normalizePathKey(params.filePath);
  const normFolder = normalizePathKey(params.folderPath);
  const cleanFileName = (params.fileName || normFile.split('/').pop() || 'document.pdf').trim();

  if (normFile) {
    keys.add(getLocalStorageSidecarKey(normFile));
    if (params.filePath) {
      keys.add(getLocalStorageSidecarKey(params.filePath));
    }
  }
  if (normFolder && cleanFileName) {
    keys.add(getLocalStorageSidecarKey(`${normFolder}/${cleanFileName}`));
  }
  if (cleanFileName) {
    keys.add(getLocalStorageSidecarKey(`file:${cleanFileName}`));
  }
  if (cleanFileName && params.noteId) {
    keys.add(getLocalStorageSidecarKey(`${cleanFileName}:${params.noteId}`));
  }
  return Array.from(keys);
}

function getCandidateBookmarkStorageKeys(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
}): string[] {
  return getCandidateSidecarStorageKeys(params).map((k) =>
    k.replace(/^luno-pdf-sidecar:/, 'luno-pdf-bookmarks:')
  );
}

async function resolveSidecarPaths(params: {
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
}): Promise<{ resolvedFilePath?: string; resolvedFolderPath?: string | null; candidatePaths: string[] }> {
  let resolvedFilePath = params.filePath;
  let resolvedFolderPath = params.folderPath;

  const isRelativeFolder =
    resolvedFolderPath &&
    !/^[a-zA-Z]:[\\/]/.test(resolvedFolderPath) &&
    !resolvedFolderPath.startsWith('/');

  if (
    typeof window !== 'undefined' &&
    window.electronAPI?.getSavedWorkspace &&
    (!resolvedFilePath || isRelativeFolder)
  ) {
    try {
      const wsRes = await window.electronAPI.getSavedWorkspace();
      const wsRoot = typeof wsRes === 'string' ? wsRes : (wsRes as any)?.folderPath;
      if (wsRoot && typeof wsRoot === 'string') {
        const sep = wsRoot.includes('\\') ? '\\' : '/';
        const cleanRoot = wsRoot.replace(/[\\/]+$/, '');
        if (!resolvedFilePath && params.fileName) {
          const cleanFolder = (params.folderPath || '')
            .replace(/^[\\/]+|[\\/]+$/g, '')
            .replace(/[\\/]+/g, sep);
          resolvedFilePath = cleanFolder
            ? `${cleanRoot}${sep}${cleanFolder}${sep}${params.fileName}`
            : `${cleanRoot}${sep}${params.fileName}`;
        }
        if (!resolvedFolderPath || isRelativeFolder) {
          resolvedFolderPath = cleanRoot;
        }
      }
    } catch {
      // Ignore workspace resolution errors
    }
  }

  const candidateSet = new Set<string>();
  const p1 = getElectronSidecarPath(resolvedFilePath, resolvedFolderPath);
  if (p1) candidateSet.add(p1);
  const p2 = getElectronSidecarPath(resolvedFilePath, null);
  if (p2) candidateSet.add(p2);
  if (params.filePath && params.filePath !== resolvedFilePath) {
    const p3 = getElectronSidecarPath(params.filePath, params.folderPath);
    if (p3) candidateSet.add(p3);
    const p4 = getElectronSidecarPath(params.filePath, null);
    if (p4) candidateSet.add(p4);
  }

  return {
    resolvedFilePath,
    resolvedFolderPath,
    candidatePaths: Array.from(candidateSet),
  };
}

export function getElectronSidecarPath(filePath?: string, folderPath?: string | null): string | null {
  if (!filePath) return null;
  const normalizedFile = filePath.replace(/\\/g, '/');
  const fileName = normalizedFile.split('/').pop() || 'document.pdf';
  // Create a lightweight deterministic hash of the full path to avoid collisions across subfolders
  let hash = 0;
  for (let i = 0; i < normalizedFile.length; i++) {
    hash = (hash * 31 + normalizedFile.charCodeAt(i)) >>> 0;
  }
  const safeName = sanitizeKey(fileName);
  const sidecarFileName = `${safeName}.${hash.toString(16)}.inko.json`;

  const isAbsoluteFolder =
    Boolean(folderPath) &&
    (/^[a-zA-Z]:[\\/]/.test(folderPath!) || folderPath!.startsWith('/'));

  if (folderPath && isAbsoluteFolder) {
    const base = folderPath.replace(/[\\/]+$/, '');
    const sep = folderPath.includes('\\') ? '\\' : '/';
    return `${base}${sep}.luno${sep}pdf-annotations${sep}${sidecarFileName}`;
  }

  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  if (lastSlash > 0) {
    const dir = filePath.slice(0, lastSlash);
    const sep = filePath.includes('\\') ? '\\' : '/';
    return `${dir}${sep}.luno${sep}pdf-annotations${sep}${sidecarFileName}`;
  }
  return null;
}

export function getElectronCleanBasePdfPath(filePath?: string, folderPath?: string | null): string | null {
  const sidecar = getElectronSidecarPath(filePath, folderPath);
  if (!sidecar) return null;
  return sidecar.replace(/\.inko\.json$/i, '.base.pdf');
}

export async function loadPdfAnnotationSidecar(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
}): Promise<PdfAnnotationSidecarData | null> {
  const { resolvedFilePath, resolvedFolderPath, candidatePaths } = await resolveSidecarPaths(params);

  let fallbackBookmarks: PdfPageBookmark[] = [];
  if (typeof window !== 'undefined') {
    try {
      const bmKeys = getCandidateBookmarkStorageKeys({
        ...params,
        filePath: resolvedFilePath || params.filePath,
        folderPath: resolvedFolderPath ?? params.folderPath,
      });
      for (const bmKey of bmKeys) {
        const rawBm = window.localStorage.getItem(bmKey);
        if (rawBm) {
          const parsedBm = JSON.parse(rawBm);
          if (Array.isArray(parsedBm) && parsedBm.length > 0) {
            fallbackBookmarks = parsedBm;
            break;
          }
        }
      }
    } catch {
      // Ignore bookmark read errors
    }
  }

  if (typeof window !== 'undefined' && window.electronAPI?.readFileContent) {
    for (const sidecarPath of candidatePaths) {
      try {
        const res = await window.electronAPI.readFileContent(sidecarPath);
        const rawContent = typeof res === 'string' ? res : res?.content;
        if (rawContent && typeof rawContent === 'string') {
          const parsed = JSON.parse(rawContent) as PdfAnnotationSidecarData;
          if (parsed && typeof parsed.canvasData === 'string') {
            const bookmarks =
              Array.isArray(parsed.bookmarks) && parsed.bookmarks.length > 0
                ? parsed.bookmarks
                : fallbackBookmarks;
            return {
              version: 1,
              fileName: parsed.fileName || params.fileName,
              updatedAt: parsed.updatedAt || new Date().toISOString(),
              canvasData: parsed.canvasData,
              history: Array.isArray(parsed.history) ? parsed.history : [],
              bookmarks,
            };
          }
        }
      } catch {
        // Continue to next candidate path or localStorage
      }
    }
  }

  if (typeof window !== 'undefined') {
    const candidateKeys = getCandidateSidecarStorageKeys({
      ...params,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
    });
    for (const storageKey of candidateKeys) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as PdfAnnotationSidecarData;
          if (parsed && typeof parsed.canvasData === 'string') {
            const bookmarks =
              Array.isArray(parsed.bookmarks) && parsed.bookmarks.length > 0
                ? parsed.bookmarks
                : fallbackBookmarks;
            return {
              version: 1,
              fileName: parsed.fileName || params.fileName,
              updatedAt: parsed.updatedAt || new Date().toISOString(),
              canvasData: parsed.canvasData,
              history: Array.isArray(parsed.history) ? parsed.history : [],
              bookmarks,
            };
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }

    if (fallbackBookmarks.length > 0) {
      return {
        version: 1,
        fileName: params.fileName,
        updatedAt: new Date().toISOString(),
        canvasData: '{}',
        history: [],
        bookmarks: fallbackBookmarks,
      };
    }
  }

  return null;
}

export async function savePdfAnnotationSidecar(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
  canvasData: string;
  existingHistory?: InkoUserCanvasItem[];
  bookmarks?: PdfPageBookmark[];
  addHistoryVersion?: boolean;
  userName?: string;
}): Promise<PdfAnnotationSidecarData> {
  const nowIso = new Date().toISOString();
  const formattedDate = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  let history = Array.isArray(params.existingHistory)
    ? params.existingHistory.map((item) => ({ ...item, isCurrent: false }))
    : [];

  if (params.addHistoryVersion && params.canvasData && params.canvasData !== '{}') {
    const newEntry: InkoUserCanvasItem = {
      canvasId: `v-${Date.now()}`,
      userName: params.userName || 'Luno Note',
      registeredAt: formattedDate,
      regDt: nowIso,
      canvasData: params.canvasData,
      enabled: true,
      isCurrent: true,
    };
    history = [newEntry, ...history].slice(0, 25);
  } else if (history.length > 0) {
    history[0] = { ...history[0], isCurrent: true };
  }

  const payload: PdfAnnotationSidecarData = {
    version: 1,
    fileName: params.fileName,
    updatedAt: nowIso,
    canvasData: params.canvasData,
    history,
    bookmarks: params.bookmarks || [],
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const { resolvedFilePath, resolvedFolderPath, candidatePaths } = await resolveSidecarPaths(params);

  // 1. Always save to localStorage for instant access across candidate keys
  if (typeof window !== 'undefined') {
    const candidateKeys = getCandidateSidecarStorageKeys({
      ...params,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
    });
    for (const storageKey of candidateKeys) {
      try {
        window.localStorage.setItem(storageKey, jsonString);
      } catch {
        // Ignore quota errors
      }
    }

    if (params.bookmarks !== undefined) {
      const bmString = JSON.stringify(params.bookmarks);
      const bmKeys = getCandidateBookmarkStorageKeys({
        ...params,
        filePath: resolvedFilePath || params.filePath,
        folderPath: resolvedFolderPath ?? params.folderPath,
      });
      for (const bmKey of bmKeys) {
        try {
          window.localStorage.setItem(bmKey, bmString);
        } catch {
          // Ignore quota errors
        }
      }
    }
  }

  // 2. Also save to .luno/pdf-annotations/<file>.inko.json on Electron if path is available
  const primarySidecarPath = candidatePaths[0] || getElectronSidecarPath(resolvedFilePath, resolvedFolderPath);
  if (primarySidecarPath && typeof window !== 'undefined' && window.electronAPI?.writeFileContent) {
    try {
      await window.electronAPI.writeFileContent({
        fullPath: primarySidecarPath,
        content: jsonString,
      });
    } catch {
      // Ignore file system sidecar write errors
    }
  }

  return payload;
}

export async function clearPdfAnnotationSidecar(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
}): Promise<void> {
  const { resolvedFilePath, resolvedFolderPath, candidatePaths } = await resolveSidecarPaths(params);
  if (typeof window !== 'undefined') {
    const candidateKeys = getCandidateSidecarStorageKeys({
      ...params,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
    });
    for (const storageKey of candidateKeys) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
    const bmKeys = getCandidateBookmarkStorageKeys({
      ...params,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
    });
    for (const bmKey of bmKeys) {
      try {
        window.localStorage.removeItem(bmKey);
      } catch {
        // Ignore
      }
    }
  }
  const deleteFn =
    typeof window !== 'undefined'
      ? window.electronAPI?.deleteFileOrFolder || window.electronAPI?.deleteFile
      : undefined;
  if (deleteFn) {
    for (const sidecarPath of candidatePaths) {
      try {
        await deleteFn(sidecarPath);
      } catch {
        // Ignore
      }
      const basePdfPath = sidecarPath.replace(/\.inko\.json$/i, '.base.pdf');
      try {
        await deleteFn(basePdfPath);
      } catch {
        // Ignore
      }
    }
  }
}

export async function finalizePdfAnnotationSidecarOnClose(params: {
  noteId: string;
  fileName: string;
  filePath?: string;
  folderPath?: string | null;
  bookmarks?: PdfPageBookmark[];
}): Promise<void> {
  const { resolvedFilePath, resolvedFolderPath, candidatePaths } = await resolveSidecarPaths(params);
  const deleteFn =
    typeof window !== 'undefined'
      ? window.electronAPI?.deleteFileOrFolder || window.electronAPI?.deleteFile
      : undefined;

  // Always delete .base.pdf so next time the PDF is opened after tab/app close,
  // the flattened PDF on disk is used as the new base document (elements baked in).
  if (deleteFn) {
    for (const sidecarPath of candidatePaths) {
      const basePdfPath = sidecarPath.replace(/\.inko\.json$/i, '.base.pdf');
      try {
        await deleteFn(basePdfPath);
      } catch {
        // Ignore
      }
    }
  }

  const keptBookmarks = Array.isArray(params.bookmarks) ? params.bookmarks : [];
  if (keptBookmarks.length > 0) {
    await savePdfAnnotationSidecar({
      noteId: params.noteId,
      fileName: params.fileName,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
      canvasData: '{}',
      existingHistory: [],
      bookmarks: keptBookmarks,
      addHistoryVersion: false,
    });
    return;
  }

  if (typeof window !== 'undefined') {
    const candidateKeys = getCandidateSidecarStorageKeys({
      ...params,
      filePath: resolvedFilePath || params.filePath,
      folderPath: resolvedFolderPath ?? params.folderPath,
    });
    for (const storageKey of candidateKeys) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }

  if (deleteFn) {
    for (const sidecarPath of candidatePaths) {
      try {
        await deleteFn(sidecarPath);
      } catch {
        // Ignore
      }
    }
  }
}

// ============================================================================
// Inko SDK Mount Implementation (Supports both Web http(s):// and Electron file://)
// ============================================================================

const MSG = {
  LOAD_PDF_BASE64: 'loadPdfBase64',
  LOAD_PDF_FROM_URL: 'loadPdfFromUrl',
  LOAD_USER_CANVAS: 'loadUserCanvasData',
  SAVE_CANVAS: 'saveCanvas',
  EXPORT_PDF: 'exportPdf',
  EXPORT_FLATTENED_PDF: 'exportFlattenedPdf',
  CLEAR_CANVAS: 'clearCurrentCanvas',
  APPLY_CONFIG: 'applyConfig',
  VIEWER_READY: 'viewerReady',
  PDF_LOADED: 'pdfLoaded',
  CANVAS_CHANGED: 'canvasDataChanged',
  SAVE_RESPONSE: 'saveCanvasResponse',
  EXPORT_PDF_RESPONSE: 'exportPdfResponse',
  EXPORT_FLATTENED_PDF_RESPONSE: 'exportFlattenedPdfResponse',
  CLOSE_VIEWER: 'closeViewer',
  SET_ORIENTATION: 'setOrientation',
  VIEWER_STATE: 'viewerState',
  HOST_SHORTCUT: 'hostShortcut',
  IFRAME_KEYDOWN: 'iframeKeydown',
} as const;

const EXPORT_TIMEOUT_MS = 30000;

export function resolveInkoViewerSrc(): string {
  if (typeof window === 'undefined') return './inko-viewer/index.html';
  try {
    return new URL('./inko-viewer/index.html', window.location.href).href;
  } catch {
    return './inko-viewer/index.html';
  }
}

function deriveTargetOrigin(src: string): string {
  if (typeof window === 'undefined') return '*';
  try {
    const parsed = new URL(src, window.location.href);
    if (parsed.protocol === 'file:' || parsed.origin === 'null' || parsed.origin === 'file://') {
      return '*';
    }
    return parsed.origin;
  } catch {
    return '*';
  }
}

export function mountInkoViewer(
  container: HTMLElement,
  options: InkoMountOptions
): InkoInstance {
  const viewerSrc = options.src || resolveInkoViewerSrc();
  const targetOrigin = deriveTargetOrigin(viewerSrc);

  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.style.backgroundColor = 'transparent';
  iframe.setAttribute('title', options.fileName || 'PDF Editor');
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

  let isReady = false;
  let isDestroyed = false;
  let exportReqSeq = 0;
  const messageQueue: Array<{ type: string; data: unknown }> = [];

  const pendingExports = new Map<
    string,
    {
      resolve: (bytes: ArrayBuffer) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  const pendingFlattenedExports = new Map<
    string,
    {
      resolve: (res: { pdfBytes: ArrayBuffer; report: InkoFlattenReport }) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  function postToIframe(type: string, data?: unknown) {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type, data }, targetOrigin);
  }

  function send(type: string, data?: unknown) {
    if (isDestroyed) return;
    if (!isReady) {
      messageQueue.push({ type, data });
      return;
    }
    postToIframe(type, data);
  }

  function flushQueue() {
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift()!;
      postToIframe(msg.type, msg.data);
    }
  }

  function rejectAllPending(reason: string) {
    pendingExports.forEach((entry) => {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    });
    pendingExports.clear();

    pendingFlattenedExports.forEach((entry) => {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    });
    pendingFlattenedExports.clear();
  }

  function handleMessage(event: MessageEvent) {
    if (isDestroyed) return;
    if (event.source !== iframe.contentWindow) return;
    if (
      targetOrigin !== '*' &&
      event.origin !== targetOrigin &&
      event.origin !== 'null' &&
      event.origin !== 'file://'
    ) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

    switch (data.type) {
      case MSG.VIEWER_READY: {
        if (isReady) return;
        isReady = true;

        if (options.theme || options.tools || options.locale || options.messages) {
          postToIframe(MSG.APPLY_CONFIG, {
            theme: options.theme,
            tools: options.tools,
            locale: options.locale,
            messages: options.messages,
            readOnly: Boolean(options.readOnly),
          });
        }

        if (options.pdfBase64) {
          postToIframe(MSG.LOAD_PDF_BASE64, {
            base64: options.pdfBase64,
            fileName: options.fileName || 'document.pdf',
            canvasData: options.initialCanvasData,
            historyState: options.initialHistoryState,
            readOnly: Boolean(options.readOnly),
          });
        } else if (options.pdfUrl) {
          postToIframe(MSG.LOAD_PDF_FROM_URL, {
            url: options.pdfUrl,
            fileName: options.fileName || 'document.pdf',
            canvasData: options.initialCanvasData,
            historyState: options.initialHistoryState,
            readOnly: Boolean(options.readOnly),
          });
        }

        if (Array.isArray(options.userCanvasData) && options.userCanvasData.length > 0) {
          postToIframe(MSG.LOAD_USER_CANVAS, options.userCanvasData);
        }

        flushQueue();
        try {
          options.onReady?.();
        } catch (err) {
          options.onError?.(err);
        }
        break;
      }

      case MSG.PDF_LOADED: {
        try {
          options.onPdfLoaded?.();
        } catch (err) {
          options.onError?.(err);
        }
        break;
      }

      case MSG.CANVAS_CHANGED: {
        try {
          options.onChange?.(data.canvasData || '');
        } catch (err) {
          options.onError?.(err);
        }
        break;
      }

      case MSG.SAVE_RESPONSE: {
        try {
          options.onSave?.(data.canvasData || '', Boolean(data.success), data.message || '');
        } catch (err) {
          options.onError?.(err);
        }
        break;
      }

      case MSG.EXPORT_PDF_RESPONSE: {
        const requestId = data.requestId;
        if (typeof requestId !== 'string') return;
        const pending = pendingExports.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        pendingExports.delete(requestId);
        if (!data.success || !(data.pdfBytes instanceof ArrayBuffer)) {
          pending.reject(new Error(data.message || 'Failed to export PDF'));
          return;
        }
        pending.resolve(data.pdfBytes);
        break;
      }

      case MSG.EXPORT_FLATTENED_PDF_RESPONSE: {
        const requestId = data.requestId;
        if (typeof requestId !== 'string') return;
        const pending = pendingFlattenedExports.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        pendingFlattenedExports.delete(requestId);
        if (!data.success || !(data.pdfBytes instanceof ArrayBuffer)) {
          pending.reject(new Error(data.message || 'Failed to export flattened PDF'));
          return;
        }
        pending.resolve({
          pdfBytes: data.pdfBytes,
          report: data.report as InkoFlattenReport,
        });
        break;
      }

      case MSG.VIEWER_STATE: {
        if (data.state && typeof data.state === 'object') {
          try {
            options.onViewerStateChange?.(data.state as InkoViewerLiveState);
          } catch (err) {
            options.onError?.(err);
          }
        }
        break;
      }

      case MSG.CLOSE_VIEWER: {
        try {
          options.onClose?.();
        } catch (err) {
          options.onError?.(err);
        }
        break;
      }

      case MSG.HOST_SHORTCUT: {
        if (
          data.shortcut === 'save' ||
          data.shortcut === 'find' ||
          data.shortcut === 'print'
        ) {
          try {
            options.onHostShortcut?.(data.shortcut);
          } catch (err) {
            options.onError?.(err);
          }
        }
        break;
      }

      case MSG.IFRAME_KEYDOWN: {
        try {
          if (data && typeof data === 'object') {
            options.onIframeKeydown?.(data as any);
            const fakeEvent = new KeyboardEvent('keydown', {
              key: (data as any).key,
              code: (data as any).code,
              ctrlKey: Boolean((data as any).ctrlKey),
              metaKey: Boolean((data as any).metaKey),
              shiftKey: Boolean((data as any).shiftKey),
              altKey: Boolean((data as any).altKey),
              bubbles: true,
              cancelable: true,
            });
            window.dispatchEvent(fakeEvent);
          }
        } catch {}
        break;
      }

      default:
        break;
    }
  }

  window.addEventListener('message', handleMessage);
  iframe.src = viewerSrc;
  container.appendChild(iframe);

  return {
    iframe,

    getScrollViewer() {
      try {
        return (iframe.contentWindow as any)?.__inkoScrollViewer || null;
      } catch {
        return null;
      }
    },

    getCanvasJson() {
      try {
        const sv = (iframe.contentWindow as any)?.__inkoScrollViewer;
        return sv?.getAllCanvasJson ? sv.getAllCanvasJson() : null;
      } catch {
        return null;
      }
    },

    getHistoryState() {
      try {
        const sv = (iframe.contentWindow as any)?.__inkoScrollViewer;
        return sv?.getHistoryState ? sv.getHistoryState() : null;
      } catch {
        return null;
      }
    },

    loadPdfUrl(url, fileName, canvasData, readOnly) {
      send(MSG.LOAD_PDF_FROM_URL, {
        url,
        fileName: fileName || 'document.pdf',
        canvasData,
        readOnly: Boolean(readOnly),
      });
    },

    loadPdfBase64(base64, fileName, canvasData, readOnly) {
      send(MSG.LOAD_PDF_BASE64, {
        base64,
        fileName: fileName || 'document.pdf',
        canvasData,
        readOnly: Boolean(readOnly),
      });
    },

    loadUserCanvasOverlay(list) {
      send(MSG.LOAD_USER_CANVAS, Array.isArray(list) ? list : []);
    },

    save() {
      send(MSG.SAVE_CANVAS);
    },

    exportPdf() {
      if (isDestroyed) {
        return Promise.reject(new Error('PDF viewer is already destroyed'));
      }
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const requestId = `export-${++exportReqSeq}-${Date.now()}`;
        const timer = setTimeout(() => {
          pendingExports.delete(requestId);
          reject(new Error('PDF export timed out'));
        }, EXPORT_TIMEOUT_MS);
        pendingExports.set(requestId, { resolve, reject, timer });
        send(MSG.EXPORT_PDF, { requestId });
      });
    },

    exportFlattenedPdf() {
      if (isDestroyed) {
        return Promise.reject(new Error('PDF viewer is already destroyed'));
      }
      return new Promise<{ pdfBytes: ArrayBuffer; report: InkoFlattenReport }>((resolve, reject) => {
        const requestId = `flatten-${++exportReqSeq}-${Date.now()}`;
        const timer = setTimeout(() => {
          pendingFlattenedExports.delete(requestId);
          reject(new Error('Flattened PDF export timed out'));
        }, EXPORT_TIMEOUT_MS);
        pendingFlattenedExports.set(requestId, { resolve, reject, timer });
        send(MSG.EXPORT_FLATTENED_PDF, { requestId });
      });
    },

    applyConfig(config) {
      if (config && typeof config === 'object') {
        send(MSG.APPLY_CONFIG, config);
      }
    },

    setReadOnly(readOnly) {
      send(MSG.APPLY_CONFIG, { readOnly: Boolean(readOnly) });
    },

    sendCommand(command, payload) {
      send(MSG.APPLY_CONFIG, { command, ...payload });
    },

    clearCurrentCanvas() {
      send(MSG.CLEAR_CANVAS);
    },

    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      isReady = false;
      messageQueue.length = 0;
      rejectAllPending('PDF viewer destroyed');
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    },
  };
}
