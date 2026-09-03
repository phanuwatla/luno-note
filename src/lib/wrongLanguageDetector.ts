/**
 * Wrong Language Layout Auto-Detection Engine
 * Detects when a user accidentally types in the wrong keyboard layout (e.g. "l;ylfu" -> "สวัสดี", "ธ้ฟรสฟืก" -> "Thailand")
 */

import { swapKeyboardLayout } from "./thaiKeyboardMapper";

// Common English words & programming keywords that should NEVER be treated as wrong Thai layout
const COMMON_ENGLISH_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into",
  "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
  "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
  "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
  "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  // Code & common tech words
  "const", "let", "var", "function", "return", "if", "else", "switch", "case", "default", "break",
  "continue", "for", "while", "do", "in", "of", "try", "catch", "finally", "throw", "class",
  "extends", "super", "this", "new", "import", "export", "from", "as", "async", "await", "yield",
  "null", "undefined", "true", "false", "boolean", "string", "number", "object", "symbol", "bigint",
  "interface", "type", "enum", "implements", "public", "private", "protected", "readonly", "static",
  "abstract", "declare", "namespace", "module", "any", "unknown", "never", "void", "keyof", "typeof",
  "console", "log", "error", "warn", "info", "debug", "window", "document", "node", "element", "html",
  "css", "json", "api", "url", "http", "https", "app", "page", "view", "component", "state", "props",
  "hook", "effect", "ref", "memo", "callback", "context", "provider", "store", "action", "reducer",
  "dispatch", "query", "mutation", "data", "loading", "error", "success", "file", "path", "dir", "name",
  "title", "text", "body", "header", "footer", "main", "nav", "aside", "section", "article", "button",
  "input", "form", "select", "option", "table", "row", "col", "card", "modal", "dialog", "drawer",
  "toast", "alert", "icon", "image", "audio", "video", "canvas", "svg", "width", "height", "top",
  "left", "right", "bottom", "color", "background", "border", "padding", "margin", "font", "size",
  "apple", "google", "microsoft", "github", "luno", "note", "notes", "test", "todo", "done", "list",
  "time", "date", "day", "month", "year", "hour", "minute", "second", "user", "admin", "login", "logout",
  "signin", "signup", "register", "password", "email", "phone", "home", "search", "filter", "sort",
  "add", "edit", "delete", "remove", "update", "create", "save", "cancel", "submit", "confirm", "close",
  "open", "show", "hide", "toggle", "clear", "reset", "copy", "paste", "cut", "undo", "redo", "select",
  "all", "find", "replace", "help", "about", "settings", "profile", "account", "dashboard", "overview"
]);

// Massive Thai Common Dictionary & Frequent Prefixes / Words
const THAI_FREQUENT_WORDS = new Set([
  // Greetings & Courtesies
  "สวัสดี", "ขอบคุณ", "ขอโทษ", "ยินดี", "ลาก่อน", "ราตรีสวัสดิ์", "อรุณสวัสดิ์",
  // Common Verbs
  "เป็น", "อยู่", "คือ", "มี", "ไป", "มา", "ทำ", "ได้", "ให้", "เอา", "จะ", "อยาก", "คิด", "รู้", "เห็น",
  "ดู", "ฟัง", "พูด", "บอก", "ถาม", "ตอบ", "เขียน", "อ่าน", "เรียน", "สอน", "ช่วย", "กิน", "ดื่ม", "นอน",
  "นั่ง", "ยืน", "เดิน", "วิ่ง", "ชอบ", "รัก", "เกลียด", "กลัว", "จำ", "ลืม", "เริ่ม", "หมด", "เสร็จ",
  "หยุด", "พัก", "รอ", "พบ", "เจอ", "หา", "ใช้", "จ่าย", "ซื้อ", "ขาย", "ส่ง", "รับ", "ใส่", "ถอด",
  "เปิด", "ปิด", "เข้า", "ออก", "ขึ้น", "ลง", "ผ่าน", "ข้าม", "นำ", "ตาม", "เก็บ", "ทิ้ง", "สร้าง",
  "เกิด", "ตาย", "เจ็บ", "ป่วย", "รักษา", "แก้ไข", "ปรับปรุง", "พัฒนา", "สำเร็จ", "แพ้", "ชนะ",
  "อย่าลืม", "เข้าใจ", "สนใจ", "ต้องการ", "สามารถ", "ตกลง", "อนุญาต", "ปฏิเสธ",
  // Pronouns & Nouns
  "ฉัน", "ผม", "เรา", "คุณ", "เธอ", "เขา", "มัน", "พวกเรา", "พวกเขา", "ทุกคน", "ใคร", "คน", "มนุษย์",
  "เพื่อน", "พี่", "น้อง", "พ่อ", "แม่", "ลูก", "ครู", "อาจารย์", "หมอ", "นักเรียน", "ผู้จัดการ",
  "บ้าน", "โรงเรียน", "มหาวิทยาลัย", "ที่ทำงาน", "บริษัท", "ห้อง", "โต๊ะ", "เก้าอี้", "เตียง", "ประตู",
  "หน้าต่าง", "เมือง", "ประเทศ", "โลก", "สังคม", "ชีวิต", "ครอบครัว", "งาน", "เงิน", "เวลา", "วัน",
  "เดือน", "ปี", "นาที", "ชั่วโมง", "เช้า", "เที่ยง", "บ่าย", "เย็น", "ค่ำ", "คืน", "วันนี้", "พรุ่งนี้",
  "เมื่อวาน", "ตอนนี้", "อนาคต", "อดีต", "เรื่อง", "สิ่ง", "ของ", "อัน", "อย่าง", "แบบ", "ทาง", "ใจ",
  "ตัว", "หน้า", "ตา", "หู", "จมูก", "ปาก", "มือ", "เท้า", "หัว", "สมอง", "ความคิด", "ความรู้สึก",
  "ภาษา", "คำ", "ข้อความ", "ประโยค", "ตัวอักษร", "หนังสือ", "เอกสาร", "สมุด", "โน้ต", "บันทึก",
  "คอมพิวเตอร์", "มือถือ", "โทรศัพท์", "อินเทอร์เน็ต", "โปรแกรม", "แอป", "ข้อมูล", "ระบบ", "ไฟล์",
  "แป้นพิมพ์", "คีย์บอร์ด", "หน้าจอ", "เว็บไซต์", "ประเทศไทย", "ภาษาไทย", "ภาษาอังกฤษ",
  // Adjectives & Adverbs
  "ดี", "ชั่ว", "ร้าย", "สวย", "หล่อ", "น่ารัก", "เก่ง", "ฉลาด", "โง่", "เร็ว", "ช้า", "ง่าย", "ยาก",
  "มาก", "น้อย", "ใหญ่", "เล็ก", "สูง", "ต่ำ", "ยาว", "สั้น", "หนัก", "เบา", "ร้อน", "หนาว", "เย็น",
  "ใหม่", "เก่า", "แก่", "หนุ่ม", "สาว", "จริง", "เท็จ", "ถูก", "ผิด", "แพง", "สะอาด", "สกปรก",
  "สว่าง", "มืด", "พร้อม", "แน่", "แน่นอน", "ชัดเจน", "สำคัญ", "พิเศษ", "ปกติ", "ธรรมดา",
  // Conjunctions, Prepositions & Particles
  "และ", "หรือ", "แต่", "ถ้า", "หาก", "เพราะ", "เนื่องจาก", "ดังนั้น", "จึง", "ก็", "กับ", "แก่", "แด่",
  "ต่อ", "สำหรับ", "เพื่อ", "โดย", "ตาม", "จาก", "ถึง", "ใน", "บน", "ล่าง", "ใต้", "เหนือ", "ข้าง",
  "ระหว่าง", "ที่", "ซึ่ง", "อัน", "ว่า", "นะ", "ครับ", "ค่ะ", "คะ", "จ้ะ", "จ๋า", "ละ", "สิ", "เถอะ",
  "ไหม", "มั้ย", "หรือยัง", "อะไร", "ที่ไหน", "เมื่อไหร่", "ทำไม", "อย่างไร", "เท่าไหร่", "ใช่", "ไม่ใช่",
  "ไม่", "อย่า", "ห้าม", "มิ", "เกือบ", "ค่อนข้าง", "ทั้ง", "ทั้งหมด", "อีก", "ด้วย", "เช่น", "ได้แก่",
  "การปฏิบัติตัว", "ที่นี่", "ที่นั่น", "ที่โน่น", "อย่างไรก็ตาม", "ในที่สุด", "สวัสดีครับ", "สวัสดีค่ะ",
]);

// Common English words for Thai-to-English recognition (e.g. "ธ้ฟรสฟืก" -> "Thailand")
const COMMON_ENGLISH_TARGETS = new Set([
  "thailand", "thai", "english", "hello", "hi", "world", "google", "youtube", "facebook", "github",
  "microsoft", "apple", "twitter", "instagram", "tiktok", "friend", "friends", "love", "like", "good",
  "morning", "night", "today", "tomorrow", "yesterday", "welcome", "thanks", "thank", "you", "please",
  "sorry", "help", "yes", "no", "okay", "ok", "computer", "phone", "internet", "website", "online",
  "offline", "system", "program", "developer", "software", "hardware", "network", "server", "client",
  "database", "project", "document", "note", "notes", "file", "folder", "image", "video", "music",
  "message", "email", "chat", "call", "meeting", "task", "work", "job", "school", "home", "family",
  "test", "check", "create", "delete", "edit", "update", "save", "cancel", "open", "close", "start",
  "stop", "play", "pause", "resume", "loading", "error", "success", "info", "warning", "danger"
]);

// Structural regex for checking impossible Thai sequences
const THAI_INVALID_STARTS = /^[่้๊๋ิีึืุูั์ํ๎]/;
const THAI_STRUCTURAL_ANOMALY = /เเ|[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}|[ำ]{2,}|[ำ][่้๊๋]/;

/**
 * Checks if a Thai string looks like genuine, valid Thai
 */
export function isPlausibleThai(str: string): boolean {
  if (!str || str.length < 2) return false;
  // Must contain Thai characters
  if (!/[\u0E00-\u0E7F]/.test(str)) return false;
  // Must not have English letters mixed in
  if (/[a-zA-Z]/.test(str)) return false;
  // Cannot start with a floating vowel or tone mark
  if (THAI_INVALID_STARTS.test(str)) return false;
  // Cannot have structural anomalies like double tone marks
  if (THAI_STRUCTURAL_ANOMALY.test(str)) return false;

  // Exact dictionary match
  if (THAI_FREQUENT_WORDS.has(str)) return true;

  // Prefix matching (e.g. "การ...", "ความ...", "ผู้...", "นัก...", "ที่...", "ไม่...", "น่า...")
  const prefixes = ["การ", "ความ", "ผู้", "นัก", "ที่", "ไม่", "น่า", "อย่าง", "รับ", "ส่ง", "ขอ", "สวัสดี", "อย่า", "มี", "เป็น", "ไป", "มา"];
  for (const prefix of prefixes) {
    if (str.startsWith(prefix)) {
      if (str === prefix) return true;
      const rest = str.slice(prefix.length);
      if (THAI_FREQUENT_WORDS.has(rest) || THAI_FREQUENT_WORDS.has(str) || rest.length >= 2) {
        return true;
      }
    }
  }

  // Common Thai words prefix match (e.g. while typing "l;ylf" -> "สวัสด" which is prefix of "สวัสดี")
  for (const word of THAI_FREQUENT_WORDS) {
    if (word.startsWith(str) || str.startsWith(word)) {
      return true;
    }
  }

  return false;
}

export interface WrongLanguageSuggestion {
  original: string;
  replacement: string;
  targetLang: "th" | "en";
  fromOffset: number;
}

/**
 * Detects if the current token before cursor is written in the wrong keyboard layout.
 *
 * Examples:
 * - "l;ylfu" -> "สวัสดี" (target: Thai)
 * - "l;ylfumujouj" -> "สวัสดีที่นี่" (target: Thai)
 * - "gvhpH0N" -> "อย่าลืม" (target: Thai)
 * - "dkiyd8b0yfg0N" -> "การปฏิบัติตัว" (target: Thai)
 * - "ธ้ฟรสฟืก" -> "Thailand" (target: English)
 * - "้ำสสน" -> "hello" (target: English)
 */
export function detectWrongLanguage(token: string): WrongLanguageSuggestion | null {
  if (!token || token.length < 2) return null;

  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Case 1: Pure ASCII text typed (potentially Thai in US QWERTY)
  if (/^[a-zA-Z0-9;'\.,/`\-=\[\]\\~!@#$%^&*()_+{}|:"<>?]+$/.test(trimmed)) {
    const lower = trimmed.toLowerCase();
    // If it's a known, legitimate English word / programming keyword, DO NOT suggest converting
    if (COMMON_ENGLISH_WORDS.has(lower)) {
      return null;
    }

    const swapped = swapKeyboardLayout(trimmed);
    if (swapped !== trimmed && isPlausibleThai(swapped)) {
      return {
        original: trimmed,
        replacement: swapped,
        targetLang: "th",
        fromOffset: trimmed.length,
      };
    }
  }

  // Case 2: Pure Thai text typed (potentially English in Kedmanee)
  if (/^[\u0E01-\u0E5B]+$/.test(trimmed)) {
    const swapped = swapKeyboardLayout(trimmed);
    if (swapped !== trimmed && /^[A-Za-z0-9_\-]+$/.test(swapped)) {
      const lower = swapped.toLowerCase();
      if (COMMON_ENGLISH_TARGETS.has(lower) || COMMON_ENGLISH_WORDS.has(lower)) {
        return {
          original: trimmed,
          replacement: swapped,
          targetLang: "en",
          fromOffset: trimmed.length,
        };
      }
    }
  }

  return null;
}

/**
 * Extracts the candidate token ending at the cursor from text preceding the cursor.
 */
export function getWrongLanguageCandidate(textBeforeCursor: string): WrongLanguageSuggestion | null {
  if (!textBeforeCursor) return null;

  // Look for the last continuous non-whitespace word right before the cursor
  const match = /[^\s\n\r]+$/.exec(textBeforeCursor);
  if (!match) return null;

  const token = match[0];
  const detected = detectWrongLanguage(token);
  if (detected) {
    return {
      ...detected,
      fromOffset: token.length,
    };
  }

  return null;
}
