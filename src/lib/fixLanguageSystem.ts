import { toast } from "@/hooks/use-toast";
import { swapKeyboardLayout } from "@/lib/thaiKeyboardMapper";
import { getActiveAppLanguage, translate } from "@/translation/translate";

export const FIX_LANGUAGE_EVENT = "luno:fix-language";

export interface FixLanguageEventDetail {
  handled: boolean;
}

export type FixLanguageOutcome =
  | { status: "converted"; originalText: string; convertedText: string }
  | { status: "unchanged"; originalText: string }
  | { status: "empty-selection" }
  | { status: "handled-by-listener" };

const SELECTABLE_INPUT_TYPES = new Set(["", "text", "search", "url", "tel", "password"]);

/**
 * Matches Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (macOS),
 * supporting both English QWERTY and Thai Kedmanee keyboard layouts.
 */
export function isFixLanguageShortcutEvent(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) {
    return false;
  }
  const key = event.key ? event.key.toLowerCase() : "";
  const code = event.code || "";
  return (
    key === "l" ||
    code === "KeyL" ||
    event.key === "ศ" ||
    event.key === "ส" ||
    event.keyCode === 76
  );
}

/**
 * Shows the standardized localized prompt telling the user to select text first.
 */
export function showSelectTextToFixToast(): void {
  const lang = getActiveAppLanguage();
  toast({
    title: translate(lang, "editor.fixLanguage"),
    description: translate(lang, "editor.selectTextToFix"),
  });
}

type RealmWindow = Window & typeof globalThis;

interface ResolvedActiveTarget {
  element: Element | null;
  doc: Document;
  win: RealmWindow;
}

function resolveDeepActiveElement(rootDoc: Document): ResolvedActiveTarget {
  let doc: Document = rootDoc;
  let win: RealmWindow = (rootDoc.defaultView || window) as RealmWindow;
  let el: Element | null = doc.activeElement;

  for (let depth = 0; depth < 8 && el; depth++) {
    if ("shadowRoot" in el && el.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement;
      continue;
    }

    if (el.tagName === "IFRAME") {
      try {
        const iframe = el as HTMLIFrameElement;
        const innerDoc = iframe.contentDocument;
        const innerWin = iframe.contentWindow as RealmWindow | null;
        if (innerDoc && innerWin && innerDoc.activeElement) {
          doc = innerDoc;
          win = innerWin;
          el = innerDoc.activeElement;
          continue;
        }
      } catch {
        // Cross-origin iframe; cannot inspect activeElement
        break;
      }
    }

    break;
  }

  return { element: el, doc, win };
}

function isSelectableTextInput(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") {
    const input = el as HTMLInputElement;
    return SELECTABLE_INPUT_TYPES.has((input.type || "text").toLowerCase());
  }
  return false;
}

function replaceTextInputSelection(
  input: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
  convertedText: string,
  doc: Document,
  win: RealmWindow
): void {
  const expectedValue = input.value.slice(0, start) + convertedText + input.value.slice(end);
  let replacedViaExecCommand = false;

  try {
    input.focus();
    input.setSelectionRange(start, end);
    if (typeof doc.execCommand === "function") {
      doc.execCommand("insertText", false, convertedText);
      if (input.value === expectedValue) {
        replacedViaExecCommand = true;
      }
    }
  } catch {
    replacedViaExecCommand = false;
  }

  if (!replacedViaExecCommand) {
    const proto =
      input.tagName === "TEXTAREA"
        ? win.HTMLTextAreaElement.prototype
        : win.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(input, expectedValue);
    } else {
      input.value = expectedValue;
    }
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
  }

  try {
    input.setSelectionRange(start, start + convertedText.length);
  } catch {
    // Ignore selection errors on detached or non-selectable inputs
  }
}

function replaceContentEditableSelection(
  el: HTMLElement,
  selection: Selection,
  convertedText: string,
  doc: Document,
  win: RealmWindow
): void {
  let replacedViaExecCommand = false;
  try {
    if (typeof doc.execCommand === "function") {
      replacedViaExecCommand = Boolean(doc.execCommand("insertText", false, convertedText));
    }
  } catch {
    replacedViaExecCommand = false;
  }

  if (replacedViaExecCommand) {
    try {
      if (
        selection.anchorNode &&
        selection.anchorNode.nodeType === Node.TEXT_NODE &&
        selection.anchorOffset >= convertedText.length
      ) {
        const range = doc.createRange();
        range.setStart(selection.anchorNode, selection.anchorOffset - convertedText.length);
        range.setEnd(selection.anchorNode, selection.anchorOffset);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch {
      // Ignore selection restoration errors
    }
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = doc.createTextNode(convertedText);
  range.insertNode(textNode);

  const nextRange = doc.createRange();
  nextRange.selectNodeContents(textNode);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
}

/**
 * Fixes mistyped Thai/English keyboard layout in the currently focused DOM editable element
 * (<input>, <textarea>, contentEditable, shadow DOM, or same-origin iframe).
 */
export function fixLanguageInActiveElement(rootDoc: Document = document): FixLanguageOutcome {
  const { element, doc, win } = resolveDeepActiveElement(rootDoc);

  if (element && isSelectableTextInput(element)) {
    if (element.disabled || element.readOnly) {
      showSelectTextToFixToast();
      return { status: "empty-selection" };
    }

    let start: number | null = null;
    let end: number | null = null;
    try {
      start = element.selectionStart;
      end = element.selectionEnd;
    } catch {
      start = null;
      end = null;
    }

    if (start === null || end === null || start === end) {
      showSelectTextToFixToast();
      return { status: "empty-selection" };
    }

    const selectedText = element.value.slice(start, end);
    if (!selectedText.trim()) {
      showSelectTextToFixToast();
      return { status: "empty-selection" };
    }

    const convertedText = swapKeyboardLayout(selectedText);
    if (convertedText === selectedText) {
      return { status: "unchanged", originalText: selectedText };
    }

    replaceTextInputSelection(element, start, end, convertedText, doc, win);
    return { status: "converted", originalText: selectedText, convertedText };
  }

  const htmlEl = element as HTMLElement | null;
  if (htmlEl && htmlEl.isContentEditable) {
    const selection = win.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      showSelectTextToFixToast();
      return { status: "empty-selection" };
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      showSelectTextToFixToast();
      return { status: "empty-selection" };
    }

    const convertedText = swapKeyboardLayout(selectedText);
    if (convertedText === selectedText) {
      return { status: "unchanged", originalText: selectedText };
    }

    replaceContentEditableSelection(htmlEl, selection, convertedText, doc, win);
    return { status: "converted", originalText: selectedText, convertedText };
  }

  showSelectTextToFixToast();
  return { status: "empty-selection" };
}

/**
 * Triggers Fix Language across the active Luno Note surface:
 * 1. First gives focused rich/code editors (TipTap, CodeMirror) a chance to handle natively via `luno:fix-language`.
 * 2. Falls back to universal DOM editable handling (<input>, <textarea>, contentEditable, same-origin iframe).
 */
export function triggerInAppFixLanguage(rootWin: Window = window): FixLanguageOutcome {
  const detail: FixLanguageEventDetail = { handled: false };
  rootWin.dispatchEvent(new CustomEvent<FixLanguageEventDetail>(FIX_LANGUAGE_EVENT, { detail }));
  if (detail.handled) {
    return { status: "handled-by-listener" };
  }
  return fixLanguageInActiveElement(rootWin.document);
}
