/**
 * Thai Kedmanee <-> US QWERTY Bidirectional Keyboard Mapper (Electron Main Process)
 * Kept in exact 1:1 parity with src/lib/thaiKeyboardMapper.ts.
 */

const EN_TO_TH_MAP = {
  // unshifted
  "`": "_", "1": "ๅ", "2": "/", "3": "-", "4": "ภ", "5": "ถ", "6": "ุ", "7": "ึ", "8": "ค", "9": "ต", "0": "จ", "-": "ข", "=": "ช",
  "q": "ๆ", "w": "ไ", "e": "ำ", "r": "พ", "t": "ะ", "y": "ั", "u": "ี", "i": "ร", "o": "น", "p": "ย", "[": "บ", "]": "ล", "\\": "ฃ",
  "a": "ฟ", "s": "ห", "d": "ก", "f": "ด", "g": "เ", "h": "้", "j": "่", "k": "า", "l": "ส", ";": "ว", "'": "ง",
  "z": "ผ", "x": "ป", "c": "แ", "v": "อ", "b": "ิ", "n": "ื", "m": "ท", ",": "ม", ".": "ใ", "/": "ฝ",
  // shifted
  "~": "%", "!": "+", "@": "๑", "#": "๒", "$": "๓", "%": "๔", "^": "ู", "&": "฿", "*": "๕", "(": "๖", ")": "๗", "_": "๘", "+": "๙",
  "Q": "๐", "W": '"', "E": "ฎ", "R": "ฑ", "T": "ธ", "Y": "ํ", "U": "๊", "I": "ณ", "O": "ฯ", "P": "ญ", "{": "ฐ", "}": ",", "|": "ฅ",
  "A": "ฤ", "S": "ฆ", "D": "ฏ", "F": "โ", "G": "ฌ", "H": "็", "J": "๋", "K": "ษ", "L": "ศ", ":": "ซ", '"': ".",
  "Z": "(", "X": ")", "C": "ฉ", "V": "ฮ", "B": "ฺ", "N": "์", "M": "?", "<": "ฒ", ">": "ฬ", "?": "ฦ",
};

const TH_TO_EN_MAP = {
  // unshifted
  "_": "`", "ๅ": "1", "/": "2", "-": "3", "ภ": "4", "ถ": "5", "ุ": "6", "ึ": "7", "ค": "8", "ต": "9", "จ": "0", "ข": "-", "ช": "=",
  "ๆ": "q", "ไ": "w", "ำ": "e", "พ": "r", "ะ": "t", "ั": "y", "ี": "u", "ร": "i", "น": "o", "ย": "p", "บ": "[", "ล": "]", "ฃ": "\\",
  "ฟ": "a", "ห": "s", "ก": "d", "ด": "f", "เ": "g", "้": "h", "่": "j", "า": "k", "ส": "l", "ว": ";", "ง": "'",
  "ผ": "z", "ป": "x", "แ": "c", "อ": "v", "ิ": "b", "ื": "n", "ท": "m", "ม": ",", "ใ": ".", "ฝ": "/",
  // shifted
  "%": "~", "+": "!", "๑": "@", "๒": "#", "๓": "$", "๔": "%", "ู": "^", "฿": "&", "๕": "*", "๖": "(", "๗": ")", "๘": "_", "๙": "+",
  "๐": "Q", "ฎ": "E", "ฑ": "R", "ธ": "T", "ํ": "Y", "๊": "U", "ณ": "I", "ฯ": "O", "ญ": "P", "ฐ": "{", "ฅ": "|",
  "ฤ": "A", "ฆ": "S", "ฏ": "D", "โ": "F", "ฌ": "G", "็": "H", "๋": "J", "ษ": "K", "ศ": "L", "ซ": ":",
  "(": "Z", ")": "X", "ฉ": "C", "ฮ": "V", "ฺ": "B", "์": "N", "?": "M", "ฒ": "<", "ฬ": ">", "ฦ": "?",
};

function swapKeyboardLayout(text) {
  if (!text) return text;

  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    // Thai character (Unicode block 0x0E01 - 0x0E5B) -> Convert to English QWERTY
    if (code >= 0x0e01 && code <= 0x0e5b && TH_TO_EN_MAP[ch] !== undefined) {
      result += TH_TO_EN_MAP[ch];
    }
    // English/ASCII printable character -> Convert to Thai Kedmanee
    else if (EN_TO_TH_MAP[ch] !== undefined) {
      result += EN_TO_TH_MAP[ch];
    }
    // Whitespace, newline, unmapped characters, emojis remain as-is
    else {
      result += ch;
    }
  }
  return result;
}

function mapTextToLanguage(text, targetLang) {
  if (targetLang === "system" || !text) return text;

  let result = "";
  if (targetLang === "th") {
    for (const ch of text) {
      result += EN_TO_TH_MAP[ch] !== undefined ? EN_TO_TH_MAP[ch] : ch;
    }
  } else if (targetLang === "en") {
    for (const ch of text) {
      result += TH_TO_EN_MAP[ch] !== undefined ? TH_TO_EN_MAP[ch] : ch;
    }
  }
  return result;
}

/**
 * Returns a self-contained script executed inside an Electron <webview>
 * to swap Thai/English keyboard layout on the currently selected text.
 */
function buildWebViewFixLanguageScript() {
  return `(function() {
    try {
      const EN_TO_TH = ${JSON.stringify(EN_TO_TH_MAP)};
      const TH_TO_EN = ${JSON.stringify(TH_TO_EN_MAP)};
      const SELECTABLE_TYPES = new Set(["", "text", "search", "url", "tel", "password"]);

      function swap(text) {
        if (!text) return text;
        let out = "";
        for (const ch of text) {
          const code = ch.charCodeAt(0);
          if (code >= 0x0e01 && code <= 0x0e5b && TH_TO_EN[ch] !== undefined) {
            out += TH_TO_EN[ch];
          } else if (EN_TO_TH[ch] !== undefined) {
            out += EN_TO_TH[ch];
          } else {
            out += ch;
          }
        }
        return out;
      }

      let doc = document;
      let win = window;
      let el = doc.activeElement;
      for (let depth = 0; depth < 8 && el; depth++) {
        if (el.shadowRoot && el.shadowRoot.activeElement) {
          el = el.shadowRoot.activeElement;
          continue;
        }
        if (el.tagName === "IFRAME") {
          try {
            const innerDoc = el.contentDocument;
            const innerWin = el.contentWindow;
            if (innerDoc && innerWin && innerDoc.activeElement) {
              doc = innerDoc;
              win = innerWin;
              el = innerDoc.activeElement;
              continue;
            }
          } catch (e) {
            break;
          }
        }
        break;
      }

      if (!el) return "empty-selection";

      const isTextarea = el.tagName === "TEXTAREA";
      const isSelectableInput =
        el.tagName === "INPUT" &&
        SELECTABLE_TYPES.has((el.type || "text").toLowerCase());

      if (isTextarea || isSelectableInput) {
        if (el.disabled || el.readOnly) return "empty-selection";
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (typeof start !== "number" || typeof end !== "number" || start === end) {
          return "empty-selection";
        }
        const selected = el.value.slice(start, end);
        if (!selected.trim()) return "empty-selection";
        const converted = swap(selected);
        if (converted === selected) return "unchanged";

        const expected = el.value.slice(0, start) + converted + el.value.slice(end);
        let replaced = false;
        try {
          el.focus();
          el.setSelectionRange(start, end);
          if (typeof doc.execCommand === "function") {
            doc.execCommand("insertText", false, converted);
            if (el.value === expected) replaced = true;
          }
        } catch (e) {
          replaced = false;
        }
        if (!replaced) {
          const proto = isTextarea
            ? win.HTMLTextAreaElement.prototype
            : win.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (setter) setter.call(el, expected);
          else el.value = expected;
          el.dispatchEvent(new win.Event("input", { bubbles: true }));
        }
        try {
          el.setSelectionRange(start, start + converted.length);
        } catch (e) {}
        return "converted";
      }

      if (el.isContentEditable) {
        const sel = win.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          return "empty-selection";
        }
        const selected = sel.toString();
        if (!selected.trim()) return "empty-selection";
        const converted = swap(selected);
        if (converted === selected) return "unchanged";

        let replaced = false;
        try {
          if (typeof doc.execCommand === "function") {
            replaced = Boolean(doc.execCommand("insertText", false, converted));
          }
        } catch (e) {
          replaced = false;
        }
        if (replaced) {
          try {
            if (
              sel.anchorNode &&
              sel.anchorNode.nodeType === 3 &&
              sel.anchorOffset >= converted.length
            ) {
              const r = doc.createRange();
              r.setStart(sel.anchorNode, sel.anchorOffset - converted.length);
              r.setEnd(sel.anchorNode, sel.anchorOffset);
              sel.removeAllRanges();
              sel.addRange(r);
            }
          } catch (e) {}
          return "converted";
        }

        const range = sel.getRangeAt(0);
        range.deleteContents();
        const node = doc.createTextNode(converted);
        range.insertNode(node);
        const nextRange = doc.createRange();
        nextRange.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        el.dispatchEvent(new win.Event("input", { bubbles: true }));
        return "converted";
      }

      return "empty-selection";
    } catch (err) {
      return "error";
    }
  })()`;
}

module.exports = {
  EN_TO_TH_MAP,
  TH_TO_EN_MAP,
  swapKeyboardLayout,
  mapTextToLanguage,
  buildWebViewFixLanguageScript,
};
