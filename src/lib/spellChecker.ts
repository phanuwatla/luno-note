/**
 * Thai & English Spell Checker & Suggestion Engine
 * Powered by Hunspell (`nspell`), dictionary-en (SCOWL/Hunspell US English),
 * Royal Society of Thailand (ORST / พจนานุกรมฉบับราชบัณฑิตยสภา),
 * LibreOffice th_TH Hunspell Dictionary, and Thai National/Textbook Corpus (TNC/TTC) frequencies.
 */

import nspell, { type NSpellInstance } from "nspell";
import enAffRaw from "./dictionaries/en_US.aff?raw";
import enDicRaw from "./dictionaries/en_US.dic?raw";
import thAffRaw from "./dictionaries/th_TH.aff?raw";
import thDicRaw from "./dictionaries/th_TH.dic?raw";

const CUSTOM_DICT_STORAGE_KEY = "luno-custom-spell-dictionary";

export const THAI_SPELL_CORRECTIONS: Record<string, string[]> = {
  // --- Common Thai Typo & Keyboard Slips ---
  "ดดน": ["โดน"],
  "ดดย": ["โดย"],
  "ดดยเฉพาะ": ["โดยเฉพาะ"],
  "เป็ฯ": ["เป็น"],
  "รรก": ["รัก"],
  "มมก": ["มาก"],
  "กกบ": ["กบ"],
  "บบท": ["บท"],
  "คคน": ["คน"],
  "สวัดดี": ["สวัสดี"],
  "มหาวิยาลัย": ["มหาวิทยาลัย"],
  "ปันหา": ["ปัญหา"],
  "สำคัน": ["สำคัญ"],
  "โทรศัพ": ["โทรศัพท์"],
  "พรุ่งนี": ["พรุ่งนี้"],
  "เรียบร้อบ": ["เรียบร้อย"],
  "ประสบการ": ["ประสบการณ์"],
  "สถาณการณ์": ["สถานการณ์"],
  "กฏหมาย": ["กฎหมาย"],
  "กฏเกณฑ์": ["กฎเกณฑ์"],
  "ปรากฎการณ์": ["ปรากฏการณ์"],
  "คอมพิวเตอณ์": ["คอมพิวเตอร์"],
  "คอมพิวเตอร": ["คอมพิวเตอร์"],
  "คอนเน็คชั่น": ["คอนเนกชัน"],
  "คอนเนคชั่น": ["คอนเนกชัน"],

  // --- Common Grammar & Tone Errors ---
  "นะค่ะ": ["นะคะ"],
  "ค้ะ": ["ค่ะ"],
  "จ่ะ": ["จ้ะ"],
  "มั๊ย": ["ไหม", "มั้ย"],
  "ไม๊": ["ไหม", "มั้ย"],
  "หรอยัง": ["หรือยัง"],
  "รึยัง": ["หรือยัง"],

  // --- หมวด ก ---
  "กระทันหัน": ["กะทันหัน"],
  "กระเพรา": ["กะเพรา"],
  "ผัดกระเพรา": ["ผัดกะเพรา"],
  "ผัดกระเพราไก่": ["ผัดกะเพราไก่"],
  "กระเพราไก่": ["กะเพราไก่"],
  "ใบกระเพรา": ["ใบกะเพรา"],
  "กระทิ": ["กะทิ"],
  "กระเทย": ["กะเทย"],
  "กระละแม": ["กะละแม"],
  "กระโหลก": ["กะโหลก"],
  "กระบังลม": ["กะบังลม"],
  "กระพริบ": ["กะพริบ"],
  "กะเพาะ": ["กระเพาะ"],
  "กะเพาะอาหาร": ["กระเพาะอาหาร"],
  "กระหล่ำปลี": ["กะหล่ำปลี"],
  "กังวาล": ["กังวาน"],
  "กัญชาร์": ["กัญชา"],
  "กาละเทศะ": ["กาลเทศะ"],
  "การันตรี": ["การันตี"],
  "กุละสตรี": ["กุลสตรี"],
  "เกมส์": ["เกม"],
  "เกษียรอายุ": ["เกษียณอายุ"],
  "เกษียนอายุ": ["เกษียณอายุ"],
  "ไก่ย่างวิเชียร": ["ไก่ย่างวิเชียรบุรี"],

  // --- หมวด ข ---
  "คะมักเขม้น": ["ขะมักเขม้น"],
  "ขี้เกลียด": ["ขี้เกียจ"],
  "ขี้เกียด": ["ขี้เกียจ"],
  "ข้าวเหน๊ยว": ["ข้าวเหนียว"],

  // --- หมวด ค ---
  "คฑา": ["คทา"],
  "คลั่งไคล": ["คลั่งไคล้"],
  "คุรุภัณฑ์": ["ครุภัณฑ์"],
  "คำนวน": ["คำนวณ"],
  "คำสาบ": ["คำสาป"],
  "คุ๊กกี้": ["คุกกี้"],
  "เค๊ก": ["เค้ก"],
  "คลีนิค": ["คลินิก"],
  "คลีนิก": ["คลินิก"],
  "คอมเม้น": ["คอมเมนต์"],
  "คอมเม้นต์": ["คอมเมนต์"],
  "คอนเฟิม": ["คอนเฟิร์ม"],

  // --- หมวด จ ---
  "จรเข้": ["จระเข้"],
  "จาระเม็ด": ["จะละเม็ด"],
  "เจียรไน": ["เจียระไน"],
  "จงกลณี": ["จงกลนี"],

  // --- หมวด ช, ซ ---
  "ชลอ": ["ชะลอ"],
  "ชลอม": ["ชะลอม"],
  "ช็อคโกแลต": ["ช็อกโกแลต"],
  "ช๊อกโกแลต": ["ช็อกโกแลต"],
  "ช๊อปปิ้ง": ["ช้อปปิ้ง"],
  "ซีเรียต": ["ซีเรียส"],
  "เซ็นต์": ["เซ็น"],
  "เซ็นเซอร์": ["เซนเซอร์"],
  "ซอฟแวร์": ["ซอฟต์แวร์"],
  "ซอฟท์แวร์": ["ซอฟต์แวร์"],

  // --- หมวด ด, ต ---
  "ดอกจันทร์": ["ดอกจัน"],
  "ตักบาตรย์": ["ตักบาตร"],
  "บาทพระ": ["บาตรพระ"],
  "ตาลขโมย": ["ตานขโมย"],
  "เต้นท์": ["เต็นท์"],
  "ไตรยางค์": ["ไตรยางศ์"],

  // --- หมวด ถ, ท, ธ ---
  "แถลงการ": ["แถลงการณ์"],
  "ทะนายความ": ["ทนายความ"],
  "ทนุถนอม": ["ทะนุถนอม"],
  "ทัศนะคติ": ["ทัศนคติ"],
  "ทะเลสาป": ["ทะเลสาบ"],
  "ทวยราษฎร": ["ทวยราษฎร์"],
  "ทัณฑะสถาน": ["ทัณฑสถาน"],
  "ทลวง": ["ทะลวง"],

  // --- หมวด น, บ ---
  "นานาพันธ์": ["นานาพันธุ์"],
  "นพปฏล": ["นพปฎล"],
  "นิมิตร": ["นิมิต"],
  "เนรมิตร": ["เนรมิต"],
  "โน๊ต": ["โน้ต"],
  "โน็ต": ["โน้ต"],
  "บังกาโล": ["บังกะโล"],
  "บังสุกล": ["บังสุกุล"],
  "บันทุก": ["บันทึก"],
  "บรรดาล": ["บันดาล"],
  "เบญจเพศ": ["เบญจเพส"],
  "บล็อค": ["บล็อก"],
  "บุฟเฟ่ต์": ["บุฟเฟต์"],
  "บุฟเฟ่": ["บุฟเฟต์"],

  // --- หมวด ป ---
  "ปรากฎ": ["ปรากฏ"],
  "ประการัง": ["ปะการัง"],
  "ผัดซีอิ้ว": ["ผัดซีอิ๊ว"],
  "ผัดไท": ["ผัดไทย"],
  "ผูกพันธ์": ["ผูกพัน"],
  "ผูกพันธิ์": ["ผูกพัน"],
  "เผ่าพันธ์": ["เผ่าพันธุ์"],
  "พรมหมลิขิต": ["พรหมลิขิต"],
  "พระรุงพระรัง": ["พะรุงพะรัง"],
  "พิธีรีตรอง": ["พิธีรีตอง"],
  "พินัยกำ": ["พินัยกรรม"],
  "พิทิพิถัน": ["พิถีพิถัน"],
  "ปราณีต": ["ประณีต"],
  "โพส": ["โพสต์"],
  "โพสท์": ["โพสต์"],
  "ปริ้น": ["พิมพ์", "ปริ้นท์"],

  // --- หมวด ม ---
  "มงกุฏ": ["มงกุฎ"],
  "มนโนภาพ": ["มโนภาพ"],
  "มาละยาท": ["มารยาท"],
  "มุขดาหาร": ["มุกดาหาร"],
  "มุขตลก": ["มุกตลก"],
  "ไข่มุข": ["ไข่มุก"],
  "โมเด็ล": ["โมเดล"],
  "แหมว": ["แมว"],
  "เหมว": ["แมว"],
  "เมี๊ยว": ["เหมียว"],

  // --- หมวด ย, ร, ล ---
  "ยศฐาบรรดาศักดิ์": ["ยศถาบรรดาศักดิ์"],
  "ย่อมเยาว์": ["ย่อมเยา"],
  "รสชาด": ["รสชาติ"],
  "ราชปะตืน": ["ราชปะแตน"],
  "ลาดหน้า": ["ราดหน้า"],
  "โลกาภิวัฒน์": ["โลกาภิวัตน์"],
  "ลายเซ็นต์": ["ลายเซ็น"],
  "ลำใย": ["ลำไย"],
  "ลิ้งค์": ["ลิงก์"],
  "ลิ้ง": ["ลิงก์"],
  "ลิงค์": ["ลิงก์"],
  "ไลท์": ["ไลก์"],

  // --- หมวด ว, ศ, ส ---
  "วิ่งเปรี้ยว": ["วิ่งเปี้ยว"],
  "วัยเกษียน": ["วัยเกษียณ"],
  "วัยเกษียร": ["วัยเกษียณ"],
  "ศรีษะ": ["ศีรษะ"],
  "สินธรรม": ["ศีลธรรม"],
  "สิลปีน": ["ศิลปิน"],
  "สังเกตุ": ["สังเกต"],
  "สัมนา": ["สัมมนา"],
  "สัมภาษ": ["สัมภาษณ์"],
  "สัปปะรด": ["สับปะรด"],
  "สรรเสริน": ["สรรเสริญ"],
  "สร้างสรร": ["สร้างสรรค์"],
  "สรรสร้าง": ["สร้างสรรค์"],
  "สัญชาตญาน": ["สัญชาตญาณ"],
  "สัญจอน": ["สัญจร"],
  "สมรรถณะ": ["สมรรถนะ"],
  "สาธารณะประโยชน์": ["สาธารณประโยชน์"],
  "สูญญากาศ": ["สุญญากาศ"],
  "สเตตัสส์": ["สเตตัส"],
  "สเปค": ["สเปก"],
  "สตาร์ท": ["สตาร์ต"],
  "สคริป": ["สคริปต์"],
  "สคริปท์": ["สคริปต์"],

  // --- หมวด ห, อ, ฮ ---
  "หมูกะทะ": ["หมูกระทะ"],
  "หมูสร่ง": ["หมูโสร่ง"],
  "หลงไหล": ["หลงใหล"],
  "หยากใย่": ["หยากไย่"],
  "อนุญาติ": ["อนุญาต"],
  "อนุสร": ["อนุสรณ์"],
  "อันเชิญ": ["อัญเชิญ"],
  "อัทธยาศัย": ["อัธยาศัย"],
  "อานาจักร": ["อาณาจักร"],
  "อานามัย": ["อนามัย"],
  "อารมย์": ["อารมณ์"],
  "อำนาด": ["อำนาจ"],
  "ออฟฟิต": ["ออฟฟิศ"],
  "ออฟฟิตซ์": ["ออฟฟิศ"],
  "อัพเดท": ["อัปเดต"],
  "อัพโหลด": ["อัปโหลด"],
  "ดาวโหลด": ["ดาวน์โหลด"],
  "อินเตอร์เน็ต": ["อินเทอร์เน็ต"],
  "อินเตอเน็ต": ["อินเทอร์เน็ต"],
  "เว็ปไซต์": ["เว็บไซต์"],
  "เวบไซต์": ["เว็บไซต์"],
  "เวปไซต์": ["เว็บไซต์"],
  "อีเมล์": ["อีเมล"],
  "อีเมลล์": ["อีเมล"],
  "โอกาศ": ["โอกาส"],
  "โอสด": ["โอสถ"],
  "โควต้า": ["โควตา"],
  "ไอศครีม": ["ไอศกรีม"],
  "ฮาดแวร์": ["ฮาร์ดแวร์"],
  "ฮาร์ดแวร": ["ฮาร์ดแวร์"],

  // --- หมวดคำทับศัพท์เทคโนโลยี & แอปพลิเคชัน ---
  "แอปพลิเคชั่น": ["แอปพลิเคชัน"],
  "แอพพลิเคชัน": ["แอปพลิเคชัน"],
  "แอพพลิเคชั่น": ["แอปพลิเคชัน"],
  "แอปเปิ้ล": ["แอปเปิล"],
  "แอพเปิ้ล": ["แอปเปิล"],
  "กราฟฟิก": ["กราฟิก"],
  "กราฟฟิค": ["กราฟิก"],
  "แท๊ก": ["แท็ก"],
  "แท๊บ": ["แท็บ"],
  "แทกซี่": ["แท็กซี่"],
  "แคนเซิ่ล": ["แคนเซิล"],
  "แคลอรี่": ["แคลอรี"],
  "ไดอารี่": ["ไดอารี"],
  "แกลลอรี่": ["แกลเลอรี"],
  "แกลเลอรี่": ["แกลเลอรี"],
  "เฟสบุ๊ค": ["เฟซบุ๊ก"],
  "เฟซบุ๊ค": ["เฟซบุ๊ก"],
  "ยูทูป": ["ยูทูบ"],
  "เช็ค": ["เช็ก"],
  "เช็คอิน": ["เช็กอิน"],
  "ดิจิตอล": ["ดิจิทัล"],
  "ฟังก์ชั่น": ["ฟังก์ชัน"],
  "ฟังชั่น": ["ฟังก์ชัน"],
  "ฟังก์ชันน์": ["ฟังก์ชัน"],
  "โปรเจ็ค": ["โปรเจกต์"],
  "โปรเจค": ["โปรเจกต์"],
  "โปรเจ็คท์": ["โปรเจกต์"],
  "โปรดักท์": ["โปรดักต์"],
  "โปรดัก": ["โปรดักต์"],
  "พาสเวิด": ["รหัสผ่าน", "พาสเวิร์ด"],
  "แพลทฟอร์ม": ["แพลตฟอร์ม"],
  "แพลตฟอม": ["แพลตฟอร์ม"],
  "อัลกอลิทึม": ["อัลกอริทึม"],
  "อังกอริทึม": ["อัลกอริทึม"],
  "คอนเสิต": ["คอนเสิร์ต"],
  "ก๊อล์ฟ": ["กอล์ฟ"],
  "เวิร์คช็อป": ["เวิร์กช็อป"],
  "เวิร์คช๊อป": ["เวิร์กช็อป"],

  // --- หมวดคำสแลง, แชต, พิมพ์สลับ, และคำเชื่อม ---
  "คัย": ["ใคร"],
  "จัย": ["ใจ"],
  "จิง": ["จริง"],
  "จิงๆ": ["จริงๆ"],
  "ปัย": ["ไป"],
  "เทอ": ["เธอ"],
  "ขอบคุน": ["ขอบคุณ"],
  "รุ้": ["รู้"],
  "อะรัย": ["อะไร"],
  "ทำมัย": ["ทำไม"],
  "รึป่าว": ["หรือเปล่า"],
  "หรือป่าว": ["หรือเปล่า"],
  "ใช่ป่าว": ["ใช่เปล่า", "ใช่ไหม"],
  "ชั่ย": ["ใช่"],
  "ก้อ": ["ก็"],
  "หลอ": ["หรอ", "เหรอ"],
  "เด่ว": ["เดี๋ยว"],
  "แปป": ["แป๊บ"],
  "เนี่ยะ": ["เนี่ย"],
  "เปน": ["เป็น"],
  "เหน": ["เห็น"],
  "ป่ะ": ["ไหม", "หรือเปล่า"],
  "งัย": ["ไง"],
  "คร้าบ": ["ครับ"],
  "มั่ก": ["มาก"],
  "ม๊าก": ["มาก"],
  "มากก": ["มาก"],
  "มว๊าก": ["มาก"],
  "มว้าก": ["มาก"],
  "น่าร๊าก": ["น่ารัก"],
  "น่ารักก": ["น่ารัก"],
  "ก๊อป": ["ก๊อบ", "คัดลอก"],
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
  becuase: ["because"],
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

export const COMMON_THAI_WORDS: string[] = [
  "สวัสดี", "ขอบคุณ", "สบายดี", "ประเทศไทย", "ภาษาไทย", "กรุงเทพ", "อาหาร", "กินข้าว", "อร่อย", "น้ำ",
  "ทำงาน", "การบ้าน", "โรงเรียน", "มหาวิทยาลัย", "หนังสือ", "อ่าน", "เขียน", "เรียน", "สอน", "ครู",
  "อาจารย์", "นักเรียน", "นักศึกษา", "เพื่อน", "ครอบครัว", "พ่อ", "แม่", "พี่", "น้อง", "ลูก",
  "บ้าน", "ห้อง", "ประตู", "หน้าต่าง", "โต๊ะ", "เก้าอี้", "เตียง", "รถยนต์", "มอเตอร์ไซค์", "ถนน",
  "ตลาด", "ร้านค้า", "ห้างสรรพสินค้า", "โรงพยาบาล", "หมอ", "พยาบาล", "ยา", "สุขภาพ", "ออกกำลังกาย", "กีฬา",
  "ฟุตบอล", "ดนตรี", "เพลง", "ภาพยนตร์", "หนัง", "เที่ยว", "ทะเล", "ภูเขา", "ธรรมชาติ", "ต้นไม้",
  "ดอกไม้", "สัตว์", "สุนัข", "แมว", "นก", "ปลา", "เวลา", "วันนี้", "พรุ่งนี้", "เมื่อวาน",
  "ตอนเช้า", "ตอนเย็น", "กลางคืน", "นาที", "ชั่วโมง", "วัน", "สัปดาห์", "เดือน", "ปี", "อากาศ",
  "ร้อน", "หนาว", "ฝนตก", "แดดออก", "ลม", "ความรัก", "ความสุข", "ความรู้", "ความคิด", "ความจำ",
  "รูปภาพ", "กล้อง", "โทรศัพท์", "คอมพิวเตอร์", "อินเทอร์เน็ต", "เว็บไซต์", "โปรแกรม", "แอปพลิเคชัน", "ข้อมูล", "ระบบ",
  "เอกสาร", "ข้อความ", "โฟลเดอร์", "ไฟล์", "บันทึก", "แก้ไข", "ลบ", "บันทึกข้อมูล", "ค้นหา", "ตั้งค่า",
  "โน้ต", "หัวข้อ", "รายละเอียด", "รายการ", "สถานะ", "เสร็จสิ้น", "กำลังทำ", "สำคัญ", "โปรเจกต์", "งาน",
  "กะเพรา", "กะทิ", "กะเทย", "สับปะรด", "ลำไย", "ส้มตำ", "ต้มยำ", "ผัดไทย", "หมูกระทะ", "ไอศกรีม", "เค้ก",
  "โอกาส", "อารมณ์", "ออฟฟิศ", "ลิงก์", "โพสต์", "คลิก", "ดาวน์โหลด", "อัปโหลด", "ดิจิทัล", "ซอฟต์แวร์",
  "ฮาร์ดแวร์", "เฟซบุ๊ก", "ยูทูบ", "บล็อก", "อัปเดต", "เช็ก", "สตาร์ต", "สเปก", "แกลเลอรี", "เซนเซอร์",
  "ศีรษะ", "รสชาติ", "บันดาล", "สังเกต", "อนุญาต", "สัมมนา", "ผูกพัน", "โควตา", "สร้างสรรค์", "ปรากฏ",
  "คำนวณ", "ประณีต", "พิถีพิถัน", "ลายเซ็น", "วิ่งเปี้ยว", "สัมภาษณ์", "สุญญากาศ", "หยากไย่", "หลงใหล", "ย่อมเยา",
  "ราดหน้า", "โลกาภิวัตน์", "กะทันหัน", "สมรรถนะ", "สัญชาตญาณ", "กาลเทศะ", "การันตี", "เกม", "ทะนุถนอม", "ทะลวง",
  "โดยเฉพาะ", "เป็น", "ปัญหา", "เรียบร้อย", "ประสบการณ์", "สถานการณ์", "กฎหมาย", "กฎเกณฑ์", "กระเพาะ"
];

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

export const IGNORED_SPELL_WORDS = new Set([
  "luno",
  "luno-ai",
  "lunoai",
  "markdown",
  "frontmatter",
  "wikilink",
  "wikilinks",
  "backlink",
  "backlinks",
  "callout",
  "callouts",
  "subtask",
  "subtasks",
  "checkbox",
  "checkboxes",
  "popover",
  "popovers",
  "tooltip",
  "tooltips",
  "sidebar",
  "sidebars",
  "toolbar",
  "toolbars",
  "breadcrumb",
  "breadcrumbs",
  "lightbox",
  "spellcheck",
  "spellchecker",
  "autosave",
  "autocomplete",
  "darkmode",
  "lightmode",
  "multicolor",
  "cyberpunk",
  "tiptap",
  "prosemirror",
  "codemirror",
  "turndown",
  "lowlight",
  "dompurify",
  "tailwind",
  "vite",
  "vitest",
  "electron",
  "typescript",
  "javascript",
  "reactjs",
  "nodejs",
  "github",
  "gitlab",
  "oauth",
  "gemini",
  "openai",
  "chatgpt",
  "claude",
  "supabase",
  "firebase",
  "firestore",
  "postgres",
  "postgresql",
  "sqlite",
  "indexeddb",
  "localstorage",
  "sessionstorage",
  "webview",
  "iframe",
  "async",
  "await",
  "config",
  "configs",
  "repo",
  "repos",
  "codebase",
  "frontend",
  "backend",
  "fullstack",
  "hotkey",
  "hotkeys",
  "keybinding",
  "keybindings",
  "kanban",
  "todo",
  "todos",
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "gif",
  "mp3",
  "mp4",
  "webm",
  "wav",
  "ogg",
  "html",
  "css",
  "json",
  "yaml",
  "yml",
  "xml",
  "sql",
  "api",
  "apis",
  "url",
  "urls",
  "uri",
  "utf",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "Noto",
  "noto",
  "Sarabun",
  "sarabun",
  "Kanit",
  "kanit",
  "Inter",
  "JetBrains",
  "jetbrains",
  "Consolas",
  "consolas",
  "Calibri",
  "calibri",
  "Roboto",
  "roboto",
  "Arial",
  "arial",
  "Lucida",
  "lucida",
]);

export const THAI_SPELL_SET = new Set(Object.keys(THAI_SPELL_CORRECTIONS));
export const ENGLISH_SPELL_SET = new Set(Object.keys(ENGLISH_SPELL_CORRECTIONS));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const THAI_SPELL_PATTERN = Object.keys(THAI_SPELL_CORRECTIONS)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join("|");

export const THAI_STRUCTURAL_ANOMALY_PATTERN =
  "เเ|[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}|[ำ]{2,}|[ำ][่้๊๋]|[^\u0E01]\u0E47(?![\u0E01-\u0E2E\u0E48-\u0E4B])";

export function getThaiSpellRegex(): RegExp {
  return new RegExp(THAI_SPELL_PATTERN, "g");
}

export function getThaiAnomalyRegex(): RegExp {
  return new RegExp(THAI_STRUCTURAL_ANOMALY_PATTERN, "g");
}

export const THAI_SPELL_REGEX = getThaiSpellRegex();
export const THAI_STRUCTURAL_ANOMALY_REGEX = getThaiAnomalyRegex();

// --- Custom User Dictionary Management ---

let customSpellWordsSet: Set<string> | null = null;

function ensureCustomSpellWordsLoaded(): Set<string> {
  if (customSpellWordsSet) return customSpellWordsSet;
  customSpellWordsSet = new Set<string>();
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(CUSTOM_DICT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === "string" && item.trim()) {
              customSpellWordsSet.add(item.trim());
              customSpellWordsSet.add(item.trim().toLowerCase());
            }
          }
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return customSpellWordsSet;
}

export function getCustomSpellWords(): string[] {
  const set = ensureCustomSpellWordsLoaded();
  return Array.from(set);
}

export function isCustomSpellWord(word: string): boolean {
  if (!word) return false;
  const clean = word.trim();
  const set = ensureCustomSpellWordsLoaded();
  return set.has(clean) || set.has(clean.toLowerCase());
}

export function addCustomSpellWord(word: string): void {
  if (!word) return;
  const clean = word.trim();
  if (!clean) return;
  const set = ensureCustomSpellWordsLoaded();
  set.add(clean);
  set.add(clean.toLowerCase());
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {
    // ignore storage errors
  }
  if (englishSpellInstance && /^[A-Za-z]+$/.test(clean)) {
    englishSpellInstance.add(clean);
    englishSpellInstance.add(clean.toLowerCase());
  }
  if (thaiDictState && /[\u0E00-\u0E7F]/.test(clean)) {
    thaiDictState.validDict.add(clean);
  }
  if (thaiSpellInstance && /[\u0E00-\u0E7F]/.test(clean)) {
    thaiSpellInstance.add(clean);
  }
  clearSpellCaches();
}

export function removeCustomSpellWord(word: string): void {
  if (!word) return;
  const clean = word.trim();
  const set = ensureCustomSpellWordsLoaded();
  set.delete(clean);
  set.delete(clean.toLowerCase());
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(Array.from(set)));
    }
  } catch {
    // ignore
  }
  if (englishSpellInstance && /^[A-Za-z]+$/.test(clean)) {
    englishSpellInstance.remove(clean);
    englishSpellInstance.remove(clean.toLowerCase());
  }
  if (thaiDictState && /[\u0E00-\u0E7F]/.test(clean)) {
    thaiDictState.validDict.delete(clean);
  }
  if (thaiSpellInstance && /[\u0E00-\u0E7F]/.test(clean)) {
    thaiSpellInstance.remove(clean);
  }
  clearSpellCaches();
}

// --- Lazy Hunspell & Thai Dictionary Engines ---

let englishSpellInstance: NSpellInstance | null = null;
let thaiSpellInstance: NSpellInstance | null = null;

interface ThaiDictionaryState {
  validDict: Set<string>;
  logFreqMap: Map<string, number>;
  wordsByLen: Map<number, string[]>;
}

let thaiDictState: ThaiDictionaryState | null = null;

const englishCorrectCache = new Map<string, boolean>();
const englishSuggestCache = new Map<string, string[]>();
const thaiMisspelledCache = new Map<string, boolean>();
const thaiSuggestCache = new Map<string, string[]>();
const thaiRunErrorsCache = new Map<string, Array<{ start: number; end: number; word: string }>>();

function clearSpellCaches(): void {
  englishCorrectCache.clear();
  englishSuggestCache.clear();
  thaiMisspelledCache.clear();
  thaiSuggestCache.clear();
  thaiRunErrorsCache.clear();
}

function getEnglishSpellChecker(): NSpellInstance {
  if (englishSpellInstance) return englishSpellInstance;
  const instance = nspell(enAffRaw, enDicRaw);
  for (const w of IGNORED_SPELL_WORDS) {
    if (/^[A-Za-z]+$/.test(w)) {
      instance.add(w);
    }
  }
  for (const w of COMMON_ENGLISH_WORDS) {
    instance.add(w);
  }
  for (const w of ensureCustomSpellWordsLoaded()) {
    if (/^[A-Za-z]+$/.test(w)) {
      instance.add(w);
    }
  }
  englishSpellInstance = instance;
  return instance;
}

function getThaiDictionaryState(): ThaiDictionaryState {
  if (thaiDictState) return thaiDictState;

  const validDict = new Set<string>();
  const logFreqMap = new Map<string, number>();
  const wordsByLen = new Map<number, string[]>();

  const lines = thDicRaw.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const hashIdx = line.indexOf("#");
    let word: string;
    let logFreq = 0;
    if (hashIdx !== -1) {
      word = line.slice(0, hashIdx).trim();
      logFreq = Number(line.slice(hashIdx + 1)) || 0;
    } else {
      word = line.trim();
    }
    if (!word) continue;
    if (!THAI_SPELL_SET.has(word)) {
      validDict.add(word);
      if (logFreq > 0) {
        logFreqMap.set(word, logFreq);
      }
      if (logFreq >= 13 && word.length >= 2) {
        let bucket = wordsByLen.get(word.length);
        if (!bucket) {
          bucket = [];
          wordsByLen.set(word.length, bucket);
        }
        bucket.push(word);
      }
    }
  }

  for (const w of COMMON_THAI_WORDS) {
    if (!THAI_SPELL_SET.has(w)) {
      validDict.add(w);
      if ((logFreqMap.get(w) || 0) < 25) {
        logFreqMap.set(w, 25);
      }
      let bucket = wordsByLen.get(w.length);
      if (!bucket) {
        bucket = [];
        wordsByLen.set(w.length, bucket);
      }
      if (!bucket.includes(w)) bucket.push(w);
    }
  }

  for (const corrects of Object.values(THAI_SPELL_CORRECTIONS)) {
    for (const c of corrects) {
      if (!THAI_SPELL_SET.has(c)) {
        validDict.add(c);
        if ((logFreqMap.get(c) || 0) < 25) {
          logFreqMap.set(c, 25);
        }
        let bucket = wordsByLen.get(c.length);
        if (!bucket) {
          bucket = [];
          wordsByLen.set(c.length, bucket);
        }
        if (!bucket.includes(c)) bucket.push(c);
      }
    }
  }

  for (const w of ensureCustomSpellWordsLoaded()) {
    if (/[\u0E00-\u0E7F]/.test(w)) {
      validDict.add(w);
    }
  }

  thaiDictState = { validDict, logFreqMap, wordsByLen };
  return thaiDictState;
}

function getThaiSpellChecker(): NSpellInstance {
  if (thaiSpellInstance) return thaiSpellInstance;
  const instance = nspell(thAffRaw, thDicRaw);
  for (const w of COMMON_THAI_WORDS) {
    if (!THAI_SPELL_SET.has(w)) instance.add(w);
  }
  for (const w of ensureCustomSpellWordsLoaded()) {
    if (/[\u0E00-\u0E7F]/.test(w)) instance.add(w);
  }
  thaiSpellInstance = instance;
  return instance;
}

// --- Edit Distance & Thai Suggestion Lookup ---

function damerauLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function findBestThaiDictMatches(
  word: string,
  maxDist = 2,
  maxResults = 5
): Array<{ word: string; dist: number; logFreq: number; score: number }> {
  const { wordsByLen, logFreqMap } = getThaiDictionaryState();
  const candidates: Array<{ word: string; dist: number; logFreq: number; score: number }> = [];

  const minLen = Math.max(2, word.length - maxDist);
  const maxLen = word.length + maxDist;

  for (let len = minLen; len <= maxLen; len++) {
    const list = wordsByLen.get(len);
    if (!list) continue;
    for (let i = 0; i < list.length; i++) {
      const cand = list[i];
      if (cand === word) continue;
      if (
        cand[0] !== word[0] &&
        cand[cand.length - 1] !== word[word.length - 1] &&
        (word.length < 2 || cand[1] !== word[1])
      ) {
        continue;
      }
      const d = damerauLevenshteinDistance(word, cand);
      if (d <= maxDist) {
        const logFreq = logFreqMap.get(cand) || 10;
        let score = (3 - d) * 1000 + logFreq * 12;
        if (cand[0] === word[0]) score += 150;
        if (cand[cand.length - 1] === word[word.length - 1]) score += 80;
        if (cand.length === word.length) score += 60;
        candidates.push({ word: cand, dist: d, logFreq, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, maxResults);
}

// --- Thai Character Cluster (TCC) & Dictionary DAG Word Segmentation ---

const THAI_DEPENDENT_OR_COMBINING = /[\u0E30-\u0E3A\u0E45\u0E47-\u0E4E]/;
const THAI_LEADING_VOWEL = /[\u0E40-\u0E44]/;
const THAI_TONE_MARK = /[\u0E48-\u0E4B]/;
const THAI_BASE_CONSONANT_CHAR = /[\u0E01-\u0E2E]/;
const THAI_DIGITS_ONLY = /^[\u0E50-\u0E59]+$/;

export function computeValidThaiBoundaries(s: string): Uint8Array {
  const n = s.length;
  const valid = new Uint8Array(n + 1);
  valid[0] = 1;
  valid[n] = 1;

  for (let i = 1; i < n; i++) {
    const ch = s[i];
    const prev = s[i - 1];

    // Never split before a dependent vowel or combining mark
    if (THAI_DEPENDENT_OR_COMBINING.test(ch)) continue;
    // Never split right after a leading vowel (เ แ โ ไ ใ)
    if (THAI_LEADING_VOWEL.test(prev)) continue;
    // Never split before a leading vowel that has an illegal combining mark attached directly to it
    if (THAI_LEADING_VOWEL.test(ch) && THAI_DEPENDENT_OR_COMBINING.test(s[i + 1] || "")) {
      continue;
    }
    // Never split immediately after medial vowel marks ั (\u0E31) or ็ (\u0E47, except ก็)
    if (prev === "\u0E31") continue;
    if (prev === "\u0E47" && !(i >= 2 && s[i - 2] === "ก")) continue;
    if (THAI_TONE_MARK.test(prev) && i >= 2) {
      const beforeTone = s[i - 2];
      if (beforeTone === "\u0E31") continue;
      if (beforeTone === "\u0E47" && !(i >= 3 && s[i - 3] === "ก")) continue;
    }
    // Paiyannoi ฯ stays attached to the preceding syllable unless starting ฯลฯ
    if (ch === "ฯ" && s.slice(i, i + 3) !== "ฯลฯ") {
      continue;
    }

    valid[i] = 1;
  }

  return valid;
}

export interface ThaiSegmentToken {
  start: number;
  end: number;
  text: string;
  type: "valid" | "misspelled" | "unknown";
}

export function segmentThaiText(s: string): ThaiSegmentToken[] {
  const n = s.length;
  if (n === 0) return [];
  const { validDict, logFreqMap } = getThaiDictionaryState();
  const customSet = ensureCustomSpellWordsLoaded();
  const validBounds = computeValidThaiBoundaries(s);
  const maxWordLen = 28;

  const dpCost = new Float64Array(n + 1).fill(Infinity);
  const dpNext = new Int32Array(n + 1).fill(-1);
  const dpType: Array<"valid" | "misspelled" | "unknown"> = new Array(n + 1).fill("valid");
  dpCost[n] = 0;

  for (let i = n - 1; i >= 0; i--) {
    if (!validBounds[i]) continue;

    const limit = Math.min(n, i + maxWordLen);
    for (let j = i + 1; j <= limit; j++) {
      if (!validBounds[j]) continue;
      const sub = s.slice(i, j);

      if (customSet.has(sub)) {
        const c = 9 + dpCost[j];
        if (c < dpCost[i]) {
          dpCost[i] = c;
          dpNext[i] = j;
          dpType[i] = "valid";
        }
        continue;
      }

      const hasAnomaly = getThaiAnomalyRegex().test(sub);
      if (!hasAnomaly && (validDict.has(sub) || THAI_DIGITS_ONLY.test(sub))) {
        const lf = logFreqMap.get(sub) || 0;
        const baseCost =
          sub.length <= 3 && lf < 10 && sub !== "ก็" && sub !== "ๆ" && sub !== "ณ"
            ? 13
            : 10;
        const c = baseCost + dpCost[j];
        if (c < dpCost[i]) {
          dpCost[i] = c;
          dpNext[i] = j;
          dpType[i] = "valid";
        }
      } else if (THAI_SPELL_SET.has(sub)) {
        // Multi-syllable compound misspellings (e.g. อนุญาติ, สังเกตุ, รสชาด, ปันหา, นะค่ะ) get 9.5
        // so [compound_misspelling + 1_valid_word = 19.5] beats splitting into [2_valid_words = 20.0],
        // while a single valid dictionary word covering the span (10.0) always wins.
        const edgeCost = sub.length >= 4 || sub === "นะค่ะ" ? 9.5 : 18;
        const c = edgeCost + dpCost[j];
        if (c < dpCost[i]) {
          dpCost[i] = c;
          dpNext[i] = j;
          dpType[i] = "misspelled";
        }
      }
    }

    // Fallback step to next valid TCC boundary
    let nextB = i + 1;
    while (nextB < n && !validBounds[nextB]) nextB++;
    const sub = s.slice(i, nextB);
    const isSingleValidWord = sub.length === 1 && validDict.has(sub);
    const stepCost = isSingleValidWord ? 28 : 45 + (nextB - i);
    const c = stepCost + dpCost[nextB];
    if (c < dpCost[i]) {
      dpCost[i] = c;
      dpNext[i] = nextB;
      dpType[i] = isSingleValidWord ? "valid" : "unknown";
    }
  }

  const rawTokens: ThaiSegmentToken[] = [];
  let cur = 0;
  while (cur < n && dpNext[cur] !== -1) {
    const next = dpNext[cur];
    const type = dpType[cur];
    if (
      type === "unknown" &&
      rawTokens.length > 0 &&
      rawTokens[rawTokens.length - 1].type === "unknown"
    ) {
      rawTokens[rawTokens.length - 1].end = next;
      rawTokens[rawTokens.length - 1].text = s.slice(rawTokens[rawTokens.length - 1].start, next);
    } else {
      rawTokens.push({ start: cur, end: next, text: s.slice(cur, next), type });
    }
    cur = next;
  }

  // Bridge short valid islands (<= 4 chars total) sandwiched between two unknown tokens
  let bridged = true;
  while (bridged) {
    bridged = false;
    for (let i = 0; i < rawTokens.length - 2; i++) {
      if (rawTokens[i].type === "unknown") {
        let j = i + 1;
        let islandLen = 0;
        while (
          j < rawTokens.length &&
          rawTokens[j].type === "valid" &&
          islandLen + rawTokens[j].text.length <= 4
        ) {
          islandLen += rawTokens[j].text.length;
          j++;
        }
        if (j > i + 1 && j < rawTokens.length && rawTokens[j].type === "unknown") {
          const newEnd = rawTokens[j].end;
          rawTokens.splice(i, j - i + 1, {
            start: rawTokens[i].start,
            end: newEnd,
            text: s.slice(rawTokens[i].start, newEnd),
            type: "unknown",
          });
          bridged = true;
          break;
        }
      }
    }
  }

  // Coalesce unknown tokens with 1-2 adjacent short valid tokens when the combined span
  // is within edit distance 1-2 of a single common dictionary word (e.g. ส+วัด+ดี -> สวัดดี, โทร+ศัพ -> โทรศัพ, พรุ่ง+นี -> พรุ่งนี, เรียบ+ร้+อบ -> เรียบร้อบ)
  let idx = 0;
  while (idx < rawTokens.length) {
    if (rawTokens[idx].type === "unknown") {
      const windowPasses = [
        {
          windows: [
            [idx - 1, idx + 1],
            [idx, idx + 2],
          ],
          maxDist: 1,
          maxLenDiff: 0,
        },
        {
          windows: [
            [idx - 1, idx],
            [idx, idx + 1],
          ],
          maxDist: 1,
          maxLenDiff: 1,
        },
        {
          windows: [
            [idx - 1, idx],
            [idx, idx + 1],
            [idx - 1, idx + 1],
            [idx, idx + 2],
          ],
          maxDist: 2,
          maxLenDiff: 2,
        },
      ];

      let merged = false;
      for (const pass of windowPasses) {
        for (const [wStart, wEnd] of pass.windows) {
          if (wStart < 0 || wEnd >= rawTokens.length) continue;
          let neighborsShort = true;
          for (let k = wStart; k <= wEnd; k++) {
            if (k !== idx && rawTokens[k].text.length > 6) {
              neighborsShort = false;
              break;
            }
          }
          if (!neighborsShort) continue;
          const startOff = rawTokens[wStart].start;
          const endOff = rawTokens[wEnd].end;
          const spanText = s.slice(startOff, endOff);
          if (spanText.length > 14 || getThaiAnomalyRegex().test(spanText)) continue;

          const matches = findBestThaiDictMatches(spanText, pass.maxDist, 1);
          if (
            matches.length > 0 &&
            matches[0].logFreq >= 20 &&
            Math.abs(matches[0].word.length - spanText.length) <= pass.maxLenDiff
          ) {
            rawTokens.splice(wStart, wEnd - wStart + 1, {
              start: startOff,
              end: endOff,
              text: spanText,
              type: "unknown",
            });
            idx = wStart;
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
      if (merged) {
        idx++;
        continue;
      }
    }
    idx++;
  }

  return rawTokens;
}

export function findThaiMisspellingsInText(
  text: string
): Array<{ start: number; end: number; word: string }> {
  if (!text || !/[\u0E00-\u0E7F]/.test(text)) return [];

  const results: Array<{ start: number; end: number; word: string }> = [];
  const thaiRunRegex = /[\u0E00-\u0E7F]+/g;
  let runMatch: RegExpExecArray | null;

  while ((runMatch = thaiRunRegex.exec(text)) !== null) {
    const run = runMatch[0];
    const runStart = runMatch.index;
    const runEnd = runStart + run.length;

    if (run.length <= 1) continue;

    // Skip short Thai abbreviations attached to a period (e.g. พ.ย., เม.ย., มิ.ย., กทม., ดร., ผศ., รพ.)
    const isAbbrev =
      run.length <= 5 &&
      (text[runEnd] === "." || (runStart > 0 && text[runStart - 1] === "."));
    if (isAbbrev && !getThaiAnomalyRegex().test(run)) {
      continue;
    }

    let runErrors = thaiRunErrorsCache.get(run);
    if (!runErrors) {
      runErrors = [];
      const tokens = segmentThaiText(run);

      for (const tok of tokens) {
        if (tok.type === "valid") continue;
        let errStart = tok.start;
        let errEnd = tok.end;

        // Never start a decoration on a floating combining mark
        while (errStart > 0 && THAI_DEPENDENT_OR_COMBINING.test(run[errStart])) {
          errStart--;
        }
        if (THAI_DEPENDENT_OR_COMBINING.test(run[errStart])) {
          continue;
        }

        // If an unknown gibberish cluster in the middle of a run starts with a leading vowel
        // and has no valid dictionary suggestion starting with that leading vowel, anchor to preceding consonant
        const sliceText = run.slice(errStart, errEnd);
        if (
          tok.type === "unknown" &&
          errStart > 0 &&
          THAI_LEADING_VOWEL.test(run[errStart]) &&
          !THAI_SPELL_SET.has(sliceText) &&
          findBestThaiDictMatches(sliceText, 2, 1).length === 0
        ) {
          while (errStart > 0 && !THAI_BASE_CONSONANT_CHAR.test(run[errStart])) {
            errStart--;
          }
        }

        while (errEnd < run.length && THAI_DEPENDENT_OR_COMBINING.test(run[errEnd])) {
          errEnd++;
        }

        const errWord = run.slice(errStart, errEnd);
        if (errWord.length <= 1 && !getThaiAnomalyRegex().test(errWord)) {
          continue;
        }
        if (
          runErrors.length > 0 &&
          errStart <= runErrors[runErrors.length - 1].end
        ) {
          const prev = runErrors[runErrors.length - 1];
          prev.end = Math.max(prev.end, errEnd);
          prev.word = run.slice(prev.start, prev.end);
        } else {
          runErrors.push({ start: errStart, end: errEnd, word: errWord });
        }
      }

      if (thaiRunErrorsCache.size > 2000) {
        thaiRunErrorsCache.clear();
      }
      thaiRunErrorsCache.set(run, runErrors);
    }

    for (const err of runErrors) {
      results.push({
        start: runStart + err.start,
        end: runStart + err.end,
        word: err.word,
      });
    }
  }

  return results;
}

// --- Suggestion Generation (Thai & English) ---

function findThaiSuggestions(word: string, maxSuggestions = 5): string[] {
  const cached = thaiSuggestCache.get(word);
  if (cached) return cached.slice(0, maxSuggestions);

  const suggestions: string[] = [];
  const addUnique = (cand: string) => {
    if (cand && cand !== word && !THAI_SPELL_SET.has(cand) && !suggestions.includes(cand)) {
      suggestions.push(cand);
    }
  };

  // 1. Exact match from curated Thai corrections
  if (THAI_SPELL_CORRECTIONS[word]) {
    for (const s of THAI_SPELL_CORRECTIONS[word]) {
      addUnique(s);
    }
    if (suggestions.length > 0) {
      thaiSuggestCache.set(word, suggestions);
      return suggestions.slice(0, maxSuggestions);
    }
  }

  // 2. Structural anomalies (e.g. เเละ -> และ, repeated tone/vowel marks, ペ็ฯ -> เป็น)
  if (word.includes("เเ")) {
    addUnique(word.replace(/เเ/g, "แ"));
  }
  if (/[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}|[ำ]{2,}|[ำ][่้๊๋]/.test(word)) {
    const cleaned = word
      .replace(/([ำ])([่้๊๋])/g, "$2$1")
      .replace(/[่้๊๋]{2,}/g, (m) => m[m.length - 1])
      .replace(/[ิีึื]{2,}/g, (m) => m[m.length - 1])
      .replace(/[ุู]{2,}/g, (m) => m[m.length - 1])
      .replace(/[ั]{2,}/g, (m) => m[m.length - 1])
      .replace(/[์]{2,}/g, (m) => m[m.length - 1])
      .replace(/[ำ]{2,}/g, "ำ");
    addUnique(cleaned);
  }
  if (suggestions.length > 0 && (word.includes("เเ") || /[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}|[ำ]{2,}/.test(word))) {
    thaiSuggestCache.set(word, suggestions);
    return suggestions.slice(0, maxSuggestions);
  }

  // 3. Substring replacement from known corrections when resulting word is valid
  const { validDict, logFreqMap } = getThaiDictionaryState();
  for (const [misspelled, corrects] of Object.entries(THAI_SPELL_CORRECTIONS)) {
    if (misspelled.length >= 3 && word.includes(misspelled)) {
      for (const c of corrects) {
        const replaced = word.replace(misspelled, c);
        if (replaced !== word && (validDict.has(replaced) || segmentThaiText(replaced).every((t) => t.type === "valid"))) {
          addUnique(replaced);
        }
      }
    }
  }

  // 4. Corpus-Frequency-Ranked Damerau-Levenshtein matches
  const dictMatches = findBestThaiDictMatches(word, 2, maxSuggestions * 2);
  for (const m of dictMatches) {
    addUnique(m.word);
  }

  // 5. Hunspell (nspell) Thai suggestions with REP/KEY/MAP rules, ranked by corpus frequency
  if (suggestions.length < maxSuggestions && word.length <= 18) {
    try {
      const hunspellSuggs = getThaiSpellChecker().suggest(word);
      hunspellSuggs
        .filter((s) => !THAI_SPELL_SET.has(s))
        .sort((a, b) => (logFreqMap.get(b) || 0) - (logFreqMap.get(a) || 0))
        .forEach((s) => addUnique(s));
    } catch {
      // ignore nspell errors
    }
  }

  if (thaiSuggestCache.size > 1000) thaiSuggestCache.clear();
  thaiSuggestCache.set(word, suggestions);
  return suggestions.slice(0, maxSuggestions);
}

function findEnglishSuggestions(word: string, maxSuggestions = 5): string[] {
  const normalized = word.replace(/\u2019/g, "'");
  const lower = normalized.toLowerCase();

  const cached = englishSuggestCache.get(lower);
  if (cached) {
    return applyEnglishCasing(normalized, cached).slice(0, maxSuggestions);
  }

  const suggestions: string[] = [];
  const addUnique = (cand: string) => {
    const cl = cand.toLowerCase();
    if (cand && cl !== lower && !suggestions.some((s) => s.toLowerCase() === cl)) {
      suggestions.push(cand);
    }
  };

  // 1. Curated instant English corrections
  if (ENGLISH_SPELL_CORRECTIONS[lower]) {
    for (const s of ENGLISH_SPELL_CORRECTIONS[lower]) {
      addUnique(s);
    }
  }

  // 2. Repeated letters collapse (e.g. blueee -> blue, helllo -> hello)
  const spellEn = getEnglishSpellChecker();
  const collapsed = lower.replace(/(.)\1+/g, "$1");
  const doubleCollapsed = lower.replace(/(.)\1{2,}/g, "$1$1");
  if (doubleCollapsed !== lower && spellEn.correct(doubleCollapsed)) {
    addUnique(doubleCollapsed);
  }
  if (collapsed !== lower && spellEn.correct(collapsed)) {
    addUnique(collapsed);
  }

  // 3. Hunspell (nspell + dictionary-en) suggestions
  if (suggestions.length < maxSuggestions) {
    try {
      const hunspellSuggs = spellEn.suggest(lower);
      for (const s of hunspellSuggs) {
        addUnique(s);
        if (suggestions.length >= maxSuggestions) break;
      }
    } catch {
      // ignore
    }
  }

  if (englishSuggestCache.size > 1000) englishSuggestCache.clear();
  englishSuggestCache.set(lower, suggestions);
  return applyEnglishCasing(normalized, suggestions).slice(0, maxSuggestions);
}

function applyEnglishCasing(original: string, suggestions: string[]): string[] {
  if (!original || suggestions.length === 0) return suggestions;
  if (original.length > 1 && original === original.toUpperCase() && original !== original.toLowerCase()) {
    return suggestions.map((s) => s.toUpperCase());
  }
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return suggestions.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  }
  return suggestions;
}

export function getSpellingSuggestions(word: string, maxSuggestions = 5): string[] {
  if (!word) return [];
  const cleanWord = word.trim();
  if (!cleanWord) return [];

  const normalized = cleanWord.replace(/\u2019/g, "'");
  const lower = normalized.toLowerCase();

  if (IGNORED_SPELL_WORDS.has(lower) || isCustomSpellWord(normalized)) {
    return [];
  }

  if (/[\u0E00-\u0E7F]/.test(cleanWord)) {
    return findThaiSuggestions(cleanWord, maxSuggestions);
  }

  if (/^[A-Za-z]+(?:'[A-Za-z]+)*$/.test(normalized)) {
    return findEnglishSuggestions(normalized, maxSuggestions);
  }

  return [];
}

function isEnglishWordValid(normalized: string): boolean {
  const lower = normalized.toLowerCase();
  if (IGNORED_SPELL_WORDS.has(lower) || isCustomSpellWord(normalized)) return true;
  if (ENGLISH_SPELL_SET.has(lower)) return false;
  if (/([a-z])\1{2,}/.test(lower)) return false;

  // Allow all-caps acronyms of 2-6 letters (e.g. PDF, API, HTML, JSON, DOM, WCAG)
  if (/^[A-Z]{2,6}$/.test(normalized)) return true;

  const cached = englishCorrectCache.get(normalized);
  if (cached !== undefined) return cached;

  const spellEn = getEnglishSpellChecker();
  let isValid =
    spellEn.correct(normalized) ||
    spellEn.correct(lower) ||
    spellEn.correct(lower.charAt(0).toUpperCase() + lower.slice(1));

  // Possessive form (e.g. user's, Luno's)
  if (!isValid && /'s$/i.test(normalized)) {
    const base = normalized.slice(0, -2);
    if (base.length >= 2) {
      isValid =
        IGNORED_SPELL_WORDS.has(base.toLowerCase()) ||
        isCustomSpellWord(base) ||
        spellEn.correct(base) ||
        spellEn.correct(base.toLowerCase());
    }
  }

  // CamelCase / PascalCase compound identifier (e.g. useState, JavaScript, TypeScript, GitHub, YouTube)
  if (!isValid && /[a-z][A-Z]/.test(normalized)) {
    const parts = normalized.split(/(?=[A-Z])/);
    if (
      parts.length >= 2 &&
      parts.every((p) => {
        if (p.length <= 1) return true;
        const pl = p.toLowerCase();
        return IGNORED_SPELL_WORDS.has(pl) || spellEn.correct(p) || spellEn.correct(pl);
      })
    ) {
      isValid = true;
    }
  }

  if (englishCorrectCache.size > 4000) englishCorrectCache.clear();
  englishCorrectCache.set(normalized, isValid);
  return isValid;
}

export function isWordMisspelled(word: string): boolean {
  if (!word) return false;
  const clean = word.trim();
  if (!clean || clean.length <= 1) return false;

  const normalized = clean.replace(/\u2019/g, "'");
  const lower = normalized.toLowerCase();

  if (IGNORED_SPELL_WORDS.has(lower) || isCustomSpellWord(normalized)) {
    return false;
  }

  // Thai check: curated misspellings + structural anomalies + dictionary & DAG segmentation check
  if (/[\u0E00-\u0E7F]/.test(clean)) {
    const cached = thaiMisspelledCache.get(clean);
    if (cached !== undefined) return cached;

    let misspelled = false;
    if (THAI_SPELL_SET.has(clean)) {
      misspelled = true;
    } else if (getThaiAnomalyRegex().test(clean)) {
      misspelled = true;
    } else {
      const { validDict } = getThaiDictionaryState();
      if (validDict.has(clean)) {
        misspelled = false;
      } else {
        misspelled = findThaiMisspellingsInText(clean).length > 0;
      }
    }

    if (thaiMisspelledCache.size > 4000) thaiMisspelledCache.clear();
    thaiMisspelledCache.set(clean, misspelled);
    return misspelled;
  }

  // English check: Hunspell (nspell + dictionary-en) + curated typo rules
  if (/^[A-Za-z]+(?:'[A-Za-z]+)*$/.test(normalized)) {
    return !isEnglishWordValid(normalized);
  }

  return false;
}
