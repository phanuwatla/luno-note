/**
 * Thai & English spell suggestions for Electron main process
 */

const THAI_SPELL_CORRECTIONS = {
  "สังเกตุ": ["สังเกต"],
  "อนุญาติ": ["อนุญาต"],
  "กะเพรา": ["กะเพรา"],
  "กระเพรา": ["กะเพรา"],
  "กะทิ": ["กะทิ"],
  "กระทิ": ["กะทิ"],
  "สัมนา": ["สัมมนา"],
  "ผูกพันธ์": ["ผูกพัน"],
  "ลำใย": ["ลำไย"],
  "โควต้า": ["โควตา"],
  "นานาพันธ์": ["นานาพันธุ์"],
  "ละเอียดลออ": ["ละเอียดลออ"],
  "สรรสร้าง": ["สร้างสรรค์"],
  "โอกาศ": ["โอกาส"],
  "อารมณ์": ["อารมณ์"],
  "ออฟฟิต": ["ออฟฟิศ"],
  "ลิ้งค์": ["ลิงก์"],
  "โพส": ["โพสต์"],
  "โน๊ต": ["โน้ต"],
  "ปริ้น": ["ปริ้นท์", "พิมพ์"],
  "เซ็นต์": ["เซ็น"],
  "เค๊ก": ["เค้ก"],
  "คลีนิค": ["คลินิก"],
  "กราฟฟิก": ["กราฟิก"],
  "เมนู": ["เมนู"],
  "แท็ก": ["แท็ก"],
  "คอมเม้น": ["คอมเมนต์"],
  "แท็บ": ["แท็บ"],
  "อีเมล์": ["อีเมล"],
  "ไลน์": ["ไลน์"],
  "สเตตัส": ["สเตตัส"],
  "ประสบการณ์": ["ประสบการณ์"],
  "ทัศนคติ": ["ทัศนคติ"],
  "กิจวัตร": ["กิจวัตร"],
  "คลั่งไคล้": ["คลั่งไคล้"],
  "บรรยากาศ": ["บรรยากาศ"],
  "มงกุฎ": ["มงกุฎ"],
  "มุกดาหาร": ["มุกดาหาร"],
  "ปรากฏ": ["ปรากฏ"],
  "อนุสรณ์": ["อนุสรณ์"],
  "อินเทอร์เน็ต": ["อินเทอร์เน็ต"],
  "เว็บไซต์": ["เว็บไซต์"],
  "สมรรถนะ": ["สมรรถนะ"],
  "สัญชาตญาณ": ["สัญชาตญาณ"],
  "กะทันหัน": ["กะทันหัน"],
  "ศีรษะ": ["ศีรษะ"],
  "รสชาติ": ["รสชาติ"],
  "บันดาล": ["บันดาล"],
  "กาลเทศะ": ["กาลเทศะ"],
  "คำนวณ": ["คำนวณ"],
  "คำนวน": ["คำนวณ"],
  "ประณีต": ["ประณีต"],
  "ปราณีต": ["ประณีต"],
  "สับปะรด": ["สับปะรด"],
  "สัปปะรด": ["สับปะรด"],
  "อัปโหลด": ["อัปโหลด"],
  "อัพโหลด": ["อัปโหลด"],
  "ดาวน์โหลด": ["ดาวน์โหลด"],
  "ดาวโหลด": ["ดาวน์โหลด"],
  "ดิจิทัล": ["ดิจิทัล"],
  "ดิจิตอล": ["ดิจิทัล"],
};

const ENGLISH_SPELL_CORRECTIONS = {
  thiss: ["this"],
  speling: ["spelling"],
  teh: ["the"],
  recieve: ["receive"],
  recieved: ["received"],
  seperate: ["separate"],
  definately: ["definitely"],
  untill: ["until"],
  occured: ["occurred"],
  wierd: ["weird"],
  writting: ["writing"],
  truely: ["truly"],
  calender: ["calendar"],
  accomodate: ["accommodate"],
  acheive: ["achieve"],
  accross: ["across"],
  adress: ["address"],
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
  tommorow: ["tomorrow"],
  unfortunatly: ["unfortunately"],
  whitch: ["which"],
  wether: ["weather", "whether"],
};

const IGNORED_WORDS = new Set(["luno", "luno-ai", "lunoai"]);

function getSpellingSuggestions(word, maxSuggestions = 5) {
  if (!word || typeof word !== "string") return [];
  const cleanWord = word.trim();
  if (!cleanWord) return [];

  if (IGNORED_WORDS.has(cleanWord.toLowerCase())) {
    return [];
  }

  if (THAI_SPELL_CORRECTIONS[cleanWord]) {
    return THAI_SPELL_CORRECTIONS[cleanWord].slice(0, maxSuggestions);
  }

  const lower = cleanWord.toLowerCase();
  if (ENGLISH_SPELL_CORRECTIONS[lower]) {
    const suggestions = ENGLISH_SPELL_CORRECTIONS[lower];
    if (cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord[0] !== cleanWord[0].toLowerCase()) {
      return suggestions.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).slice(0, maxSuggestions);
    }
    return suggestions.slice(0, maxSuggestions);
  }

  const isThai = /[\u0E00-\u0E7F]/.test(cleanWord);
  if (isThai) {
    const results = [];
    for (const [misspelled, corrects] of Object.entries(THAI_SPELL_CORRECTIONS)) {
      if (cleanWord.includes(misspelled)) {
        for (const c of corrects) {
          const replaced = cleanWord.replace(misspelled, c);
          if (!results.includes(replaced)) results.push(replaced);
        }
      }
    }
    if (results.length > 0) return results.slice(0, maxSuggestions);
  }

  return [];
}

module.exports = {
  getSpellingSuggestions,
};
