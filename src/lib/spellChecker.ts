/**
 * Real Thai & English Spell Checker & Suggestion Engine
 */

export const THAI_SPELL_CORRECTIONS: Record<string, string[]> = {
  // Common Thai Misspelled Words -> Correct Words
  "สังเกตุ": ["สังเกต"],
  "อนุญาติ": ["อนุญาต"],
  "กะเพรา": ["กะเพรา"],
  "กระเพรา": ["กะเพรา"],
  "กะทิ": ["กะทิ"],
  "กระทิ": ["กะทิ"],
  "สัมนา": ["สัมมนา"],
  "ผูกพันธ์": ["ผูกพัน"],
  "ผูกพันธิ์": ["ผูกพัน"],
  "ลำใย": ["ลำไย"],
  "โควต้า": ["โควตา"],
  "นานาพันธ์": ["นานาพันธุ์"],
  "นานาพรรณ": ["นานาพันธุ์", "นานาพรรณ"],
  "ละเอียดลออ": ["ละเอียดลออ"],
  "ละเอียดยิบ": ["ละเอียดยิบ"],
  "สรรสร้าง": ["สร้างสรรค์"],
  "สร้างสรร": ["สร้างสรรค์"],
  "โอกาศ": ["โอกาส"],
  "อารมณ์": ["อารมณ์"],
  "อารมย์": ["อารมณ์"],
  "ออฟฟิต": ["ออฟฟิศ"],
  "ออฟฟิตซ์": ["ออฟฟิศ"],
  "ลิ้งค์": ["ลิงก์"],
  "ลิ้ง": ["ลิงก์"],
  "ลิงค์": ["ลิงก์"],
  "โพส": ["โพสต์"],
  "โพสท์": ["โพสต์"],
  "โน๊ต": ["โน้ต"],
  "โน็ต": ["โน้ต"],
  "ปริ้น": ["ปริ้นท์", "พิมพ์"],
  "ปริ้นท์": ["ปริ้นท์", "พิมพ์"],
  "เซ็นต์": ["เซ็น"],
  "เซ็น": ["เซ็น"],
  "เค๊ก": ["เค้ก"],
  "เค้ก": ["เค้ก"],
  "คลีนิค": ["คลินิก"],
  "คลีนิก": ["คลินิก"],
  "กราฟฟิก": ["กราฟิก"],
  "กราฟฟิค": ["กราฟิก"],
  "เมนู": ["เมนู"],
  "แท็ก": ["แท็ก"],
  "แท๊ก": ["แท็ก"],
  "คอมเม้น": ["คอมเมนต์"],
  "คอมเม้นต์": ["คอมเมนต์"],
  "แท็บ": ["แท็บ"],
  "แท๊บ": ["แท็บ"],
  "อีเมล์": ["อีเมล"],
  "อีเมล": ["อีเมล"],
  "ไลน์": ["ไลน์"],
  "สเตตัส": ["สเตตัส"],
  "สเตตัสส์": ["สเตตัส"],
  "ประสบการณ์": ["ประสบการณ์"],
  "ประสบการ": ["ประสบการณ์"],
  "ทัศนคติ": ["ทัศนคติ"],
  "ทัศนะคติ": ["ทัศนคติ"],
  "กิจวัตร": ["กิจวัตร"],
  "กิจวัตรประจำวัน": ["กิจวัตรประจำวัน"],
  "คลั่งไคล้": ["คลั่งไคล้"],
  "คลั่งไคล": ["คลั่งไคล้"],
  "บรรยากาศ": ["บรรยากาศ"],
  "บรรยากาศณ์": ["บรรยากาศ"],
  "มงกุฎ": ["มงกุฎ"],
  "มงกุฏ": ["มงกุฎ"],
  "มุกดาหาร": ["มุกดาหาร"],
  "มุขดาหาร": ["มุกดาหาร"],
  "ปรากฏ": ["ปรากฏ"],
  "ปรากฎ": ["ปรากฏ"],
  "อนุสรณ์": ["อนุสรณ์"],
  "อนุสร": ["อนุสรณ์"],
  "อินเทอร์เน็ต": ["อินเทอร์เน็ต"],
  "อินเตอร์เน็ต": ["อินเทอร์เน็ต"],
  "เว็บไซต์": ["เว็บไซต์"],
  "เว็ปไซต์": ["เว็บไซต์"],
  "เวบไซต์": ["เว็บไซต์"],
  "สมรรถนะ": ["สมรรถนะ"],
  "สมรรถณะ": ["สมรรถนะ"],
  "สัญชาตญาณ": ["สัญชาตญาณ"],
  "สัญชาตญาน": ["สัญชาตญาณ"],
  "กะทันหัน": ["กะทันหัน"],
  "กระทันหัน": ["กะทันหัน"],
  "ศีรษะ": ["ศีรษะ"],
  "ศรีษะ": ["ศีรษะ"],
  "รสชาติ": ["รสชาติ"],
  "รสชาด": ["รสชาติ"],
  "บันดาล": ["บันดาล"],
  "บรรดาล": ["บันดาล"],
  "กาลเทศะ": ["กาลเทศะ"],
  "กาละเทศะ": ["กาลเทศะ"],
  "กะเพราไก่": ["กะเพราไก่"],
  "ตารางกิโลเมตร": ["ตารางกิโลเมตร"],
  "การันตี": ["การันตี"],
  "การันตรี": ["การันตี"],
  "เกม": ["เกม"],
  "เกมส์": ["เกม", "เกมส์"],
  "คำนวณ": ["คำนวณ"],
  "คำนวน": ["คำนวณ"],
  "ทะนุถนอม": ["ทะนุถนอม"],
  "ทนุถนอม": ["ทะนุถนอม"],
  "ทะลวง": ["ทะลวง"],
  "ทลวง": ["ทะลวง"],
  "ประณีต": ["ประณีต"],
  "ปราณีต": ["ประณีต"],
  "พิถีพิถัน": ["พิถีพิถัน"],
  "พะรุงพะรัง": ["พะรุงพะรัง"],
  "พระรุงพระรัง": ["พะรุงพะรัง"],
  "พลอยได้": ["พลอยได้"],
  "มงคล": ["มงคล"],
  "มงคลสมรส": ["มงคลสมรส"],
  "ลายเซ็น": ["ลายเซ็น"],
  "ลายเซ็นต์": ["ลายเซ็น"],
  "วิ่งเปี้ยว": ["วิ่งเปี้ยว"],
  "วิ่งเปรี้ยว": ["วิ่งเปี้ยว"],
  "สวัสดิการ": ["สวัสดิการ"],
  "สวัสดิภาพ": ["สวัสดิภาพ"],
  "สัมภาษณ์": ["สัมภาษณ์"],
  "สัมภาษ": ["สัมภาษณ์"],
  "สับปะรด": ["สับปะรด"],
  "สัปปะรด": ["สับปะรด"],
  "สุญญากาศ": ["สุญญากาศ"],
  "สูญญากาศ": ["สุญญากาศ"],
  "หยากไย่": ["หยากไย่"],
  "หยากใย่": ["หยากไย่"],
  "หมาใน": ["หมาใน"],
  "อนุมัติ": ["อนุมัติ"],
  "อัปโหลด": ["อัปโหลด"],
  "อัพโหลด": ["อัปโหลด"],
  "ดาวน์โหลด": ["ดาวน์โหลด"],
  "ดาวโหลด": ["ดาวน์โหลด"],
  "โปรแกรม": ["โปรแกรม"],
  "โปรโตคอล": ["โปรโทคอล", "โปรโตคอล"],
  "ดิจิทัล": ["ดิจิทัล"],
  "ดิจิตอล": ["ดิจิทัล"],
};

export const ENGLISH_SPELL_CORRECTIONS: Record<string, string[]> = {
  thiss: ["this"],
  speling: ["spelling"],
  teh: ["the"],
  recieve: ["receive"],
  recieved: ["received"],
  recieving: ["receiving"],
  seperate: ["separate"],
  seperated: ["separated"],
  seperating: ["separating"],
  definately: ["definitely"],
  untill: ["until"],
  occured: ["occurred"],
  occurence: ["occurrence"],
  wierd: ["weird"],
  writting: ["writing"],
  truely: ["truly"],
  calender: ["calendar"],
  accomodate: ["accommodate"],
  accomodation: ["accommodation"],
  acheive: ["achieve"],
  acheived: ["achieved"],
  accross: ["across"],
  adress: ["address"],
  adresses: ["addresses"],
  alot: ["a lot"],
  alright: ["all right"],
  arguement: ["argument"],
  basicly: ["basically"],
  comming: ["coming"],
  dissapear: ["disappear"],
  embarass: ["embarrass"],
  enviroment: ["environment"],
  existance: ["existence"],
  foward: ["forward"],
  goverment: ["government"],
  grammer: ["grammar"],
  happend: ["happened"],
  independant: ["independent"],
  knowlege: ["knowledge"],
  neccessary: ["necessary"],
  noticable: ["noticeable"],
  peice: ["piece"],
  possession: ["possession"],
  prefered: ["preferred"],
  refered: ["referred"],
  relevent: ["relevant"],
  religous: ["religious"],
  succesful: ["successful"],
  suprise: ["surprise"],
  suprised: ["surprised"],
  tommorow: ["tomorrow"],
  unfortunatly: ["unfortunately"],
  whitch: ["which"],
  wether: ["weather", "whether"],
  wierdest: ["weirdest"],
  yeild: ["yield"],
  tomorow: ["tomorrow"],
  tounge: ["tongue"],
  belive: ["believe"],
  cheif: ["chief"],
  collegue: ["colleague"],
  consious: ["conscious"],
  definatelyy: ["definitely"],
  embarras: ["embarrass"],
  familar: ["familiar"],
  foriegn: ["foreign"],
  freind: ["friend"],
  guarentee: ["guarantee"],
  harrass: ["harass"],
  heigth: ["height"],
  hierachy: ["hierarchy"],
  immediatly: ["immediately"],
  judgement: ["judgment", "judgement"],
  liasion: ["liaison"],
  libary: ["library"],
  lisence: ["license"],
  millenium: ["millennium"],
  mispell: ["misspell"],
  neice: ["niece"],
  paralell: ["parallel"],
  persue: ["pursue"],
  posession: ["possession"],
  pronounciation: ["pronunciation"],
  publically: ["publicly"],
  reciept: ["receipt"],
  reccomend: ["recommend"],
  recomended: ["recommended"],
  rythm: ["rhythm"],
  sence: ["sense"],
  sieze: ["seize"],
  twelth: ["twelfth"],
  tyrany: ["tyranny"],
  vaccum: ["vacuum"],
  vehical: ["vehicle"],
  writtingg: ["writing"],
  bluee: ["blue", "blues", "bluer"],
  rede: ["red", "read"],
  gren: ["green"],
  collor: ["color", "collar"],
  aple: ["apple"],
  aplle: ["apple"],
  bannana: ["banana"],
  helo: ["hello", "help", "hero"],
  helllo: ["hello"],
  goodd: ["good"],
  thiss: ["this"],
  thatt: ["that"],
  notess: ["notes", "note"],
  editt: ["edit"],
  writee: ["write", "writer"],
  titele: ["title"],
  heade: ["head", "header"],
  footre: ["footer"],
  codde: ["code"],
  prgoram: ["program"],
  programing: ["programming"],
  computr: ["computer"],
  computre: ["computer"],
  softwear: ["software"],
  hardwear: ["hardware"],
  fille: ["file", "fill"],
  follder: ["folder"],
  foldr: ["folder"],
  savve: ["save"],
  cancle: ["cancel"],
  settngs: ["settings"],
  settng: ["setting"],
  langauge: ["language"],
  languege: ["language"],
  delet: ["delete"],
  delette: ["delete"],
  searsh: ["search"],
  serch: ["search"],
};

export const COMMON_ENGLISH_WORDS: string[] = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
  "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
  "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
  "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
  "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us", "luno", "note", "notes", "file",
  "files", "folder", "folders", "edit", "editor", "view", "save", "delete", "cancel", "settings",
  "color", "colors", "blue", "blues", "bluer", "red", "green", "black", "white", "yellow", "orange",
  "purple", "pink", "brown", "gray", "grey", "silver", "gold", "dark", "light", "bright", "clear",
  "apple", "banana", "fruit", "orange", "grape", "water", "food", "table", "text", "line", "word",
  "words", "character", "characters", "sentence", "paragraph", "title", "header", "footer", "code",
  "program", "programming", "software", "hardware", "computer", "system", "screen", "keyboard",
  "mouse", "click", "select", "copy", "cut", "paste", "undo", "redo", "find", "search", "replace",
  "format", "style", "bold", "italic", "underline", "strike", "quote", "link", "image", "media",
  "table", "row", "column", "cell", "list", "bullet", "number", "check", "checkbox", "task", "done",
  "pending", "active", "status", "ready", "open", "close", "window", "panel", "sidebar", "toolbar",
  "button", "input", "output", "preview", "export", "import", "download", "upload", "sync", "cloud",
  "drive", "storage", "memory", "database", "network", "internet", "web", "page", "site", "online",
  "offline", "help", "support", "about", "version", "update", "upgrade", "install", "login", "logout",
  "account", "user", "profile", "password", "email", "message", "chat", "language", "english", "thai",
  "spell", "spelling", "grammar", "correct", "wrong", "mistake", "error", "warning", "info", "success",
  "failed", "true", "false", "default", "custom", "theme", "dark", "light", "system", "auto", "size",
  "font", "width", "height", "spacing", "padding", "margin", "border", "radius", "shadow", "blur",
  "opacity", "visible", "hidden", "show", "hide", "toggle", "switch", "option", "options", "menu",
  "dialog", "modal", "toast", "alert", "tooltip", "popover", "dropdown", "select", "badge", "icon",
  "hello", "welcome", "world", "friend", "family", "house", "home", "car", "city", "country", "place",
  "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night", "month", "week", "hour",
  "minute", "second", "always", "never", "sometimes", "often", "usually", "really", "very", "great",
  "super", "happy", "fast", "slow", "simple", "easy", "hard", "quick", "clean", "beautiful", "nice",
  "cool", "fine", "sure", "maybe", "please", "thanks", "thank", "you", "yes", "no", "ok", "okay"
];

function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

function findEnglishSuggestions(word: string, maxSuggestions = 5): string[] {
  const lower = word.toLowerCase();
  const results: { word: string; dist: number; score: number }[] = [];

  // 1. Repeated letters check: e.g. "bluee" -> "blue", "heeeey" -> "hey"
  const collapsed = lower.replace(/(.)\1+/g, "$1");
  const doubleCollapsed = lower.replace(/(.)\1{2,}/g, "$1$1");
  if (COMMON_ENGLISH_WORDS.includes(collapsed) && collapsed !== lower) {
    results.push({ word: collapsed, dist: 1, score: 0 });
  }
  if (COMMON_ENGLISH_WORDS.includes(doubleCollapsed) && doubleCollapsed !== lower) {
    results.push({ word: doubleCollapsed, dist: 1, score: 0 });
  }

  // 2. Scan dictionary for distance <= 2
  for (const dictWord of COMMON_ENGLISH_WORDS) {
    if (dictWord === lower) continue;
    if (Math.abs(dictWord.length - lower.length) > 2) continue;
    if (dictWord[0] !== lower[0] && Math.abs(dictWord.length - lower.length) > 1) continue;

    const dist = levenshteinDistance(lower, dictWord);
    if (dist <= 2) {
      let score = dist * 10;
      if (dictWord.startsWith(lower.slice(0, 3))) score -= 5;
      else if (dictWord.startsWith(lower.slice(0, 2))) score -= 3;
      if (Math.abs(dictWord.length - lower.length) <= 1) score -= 2;
      results.push({ word: dictWord, dist, score });
    }
  }

  results.sort((a, b) => a.score - b.score);
  const unique = Array.from(new Set(results.map((r) => r.word)));
  return unique.slice(0, maxSuggestions);
}

export const IGNORED_SPELL_WORDS = new Set([
  "luno",
  "luno-ai",
  "lunoai",
]);

export function getSpellingSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!word) return [];
  const cleanWord = word.trim();
  if (!cleanWord) return [];

  // Ignore brand names / custom valid words like "Luno"
  if (IGNORED_SPELL_WORDS.has(cleanWord.toLowerCase())) {
    return [];
  }

  // Check exact Thai correction map
  if (THAI_SPELL_CORRECTIONS[cleanWord]) {
    const list = THAI_SPELL_CORRECTIONS[cleanWord].filter((s) => s !== cleanWord);
    if (list.length > 0) return list.slice(0, maxSuggestions);
  }

  // Check case-insensitive English correction map
  const lower = cleanWord.toLowerCase();
  if (ENGLISH_SPELL_CORRECTIONS[lower]) {
    const suggestions = ENGLISH_SPELL_CORRECTIONS[lower].filter((s) => s.toLowerCase() !== lower);
    if (suggestions.length > 0) {
      if (cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord[0] !== cleanWord[0].toLowerCase()) {
        return suggestions.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).slice(0, maxSuggestions);
      }
      return suggestions.slice(0, maxSuggestions);
    }
  }

  // Check English algorithmic suggestions (e.g. bluee -> blue, aple -> apple)
  if (/^[A-Za-z]+$/.test(cleanWord)) {
    const suggestions = findEnglishSuggestions(cleanWord, maxSuggestions);
    if (suggestions.length > 0) {
      if (cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord[0] !== cleanWord[0].toLowerCase()) {
        return suggestions.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
      }
      return suggestions;
    }
  }

  // Check Thai phonetic / common confusion variations
  const isThai = /[\u0E00-\u0E7F]/.test(cleanWord);
  if (isThai) {
    const results: string[] = [];
    for (const [misspelled, corrects] of Object.entries(THAI_SPELL_CORRECTIONS)) {
      if (cleanWord.includes(misspelled)) {
        for (const c of corrects) {
          const replaced = cleanWord.replace(misspelled, c);
          if (replaced !== cleanWord && !results.includes(replaced)) {
            results.push(replaced);
          }
        }
      }
    }
    if (results.length > 0) return results.slice(0, maxSuggestions);
  }

  return [];
}

export const THAI_SPELL_SET = new Set(Object.keys(THAI_SPELL_CORRECTIONS));
export const ENGLISH_SPELL_SET = new Set(Object.keys(ENGLISH_SPELL_CORRECTIONS));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const THAI_SPELL_REGEX = new RegExp(
  Object.keys(THAI_SPELL_CORRECTIONS)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|"),
  "g"
);

export function isWordMisspelled(word: string): boolean {
  if (!word) return false;
  const clean = word.trim();
  if (!clean || clean.length <= 1) return false;
  const lower = clean.toLowerCase();

  if (IGNORED_SPELL_WORDS.has(lower)) return false;

  // Thai check: only known misspelled Thai words
  if (/[\u0E00-\u0E7F]/.test(clean)) {
    return THAI_SPELL_SET.has(clean);
  }

  // English check: only known English misspelled words or 3+ repeated letter typos (e.g. "soooo", "heeeey")
  if (/^[A-Za-z]+$/.test(clean)) {
    if (ENGLISH_SPELL_SET.has(lower)) return true;
    if (/([a-z])\1{2,}/.test(lower)) return true;
    return false;
  }

  return false;
}
