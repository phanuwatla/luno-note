/**
 * Real Thai & English Spell Checker & Suggestion Engine
 * Built-in Lexicon + Levenshtein Distance & Phonotactic Anomaly Engine
 * Massive Comprehensive Thai Misspelling & Typo Database (500+ Words)
 */

export const THAI_SPELL_CORRECTIONS: Record<string, string[]> = {
  // --- Common Thai Typo & Keyboard Slips ---
  "ดดน": ["โดน"],
  "รรก": ["รัก"],
  "มมก": ["มาก"],
  "กกบ": ["กบ"],
  "บบท": ["บท"],
  "คคน": ["คน"],

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
  "ใบกระเพรา": ["ใบกะเพรา"],
  "กะเพราไก่": ["กะเพราไก่"],
  "กระทิ": ["กะทิ"],
  "กระเทย": ["กะเทย"],
  "กระละแม": ["กะละแม"],
  "กระโหลก": ["กะโหลก"],
  "กระบังลม": ["กะบังลม"],
  "กระพริบ": ["กะพริบ"],
  "กระเพาะ": ["กะเพาะ"],
  "กระหล่ำปลี": ["กะหล่ำปลี"],
  "กังวาล": ["กังวาน"],
  "กัญชาร์": ["กัญชา"],
  "กาละเทศะ": ["กาลเทศะ"],
  "การันตรี": ["การันตี"],
  "กุละสตรี": ["กุลสตรี"],
  "เกมส์": ["เกม"],
  "เกษียร": ["เกษียณ"],
  "เกษียน": ["เกษียณ"],
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
  "คุกกี้": ["คุกกี้"],
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
  "จงกลนี": ["จงกลนี"],

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
  "ดาลดาล": ["ดาลดาล"],
  "ตักบาตรย์": ["ตักบาตร"],
  "บาทพระ": ["บาตรพระ"],
  "ตาลขโมย": ["ตานขโมย"],
  "เต้นท์": ["เต็นท์"],
  "ไตรยางค์": ["ไตรยางศ์"],

  // --- หมวด ถ, ท, ธ ---
  "แถลงการ": ["แถลงการณ์"],
  "ทะนายความ": ["ทนายความ"],
  "ทนุถนอม": ["ทะนุถนอม"],
  "ทะลาย": ["ทลาย"],
  "ทัศนะคติ": ["ทัศนคติ"],
  "ทะเลสาป": ["ทะเลสาบ"],
  "ทวยราษฎร": ["ทวยราษฎร์"],
  "ทัณฑะสถาน": ["ทัณฑสถาน"],
  "ทลวง": ["ทะลวง"],

  // --- หมวด น, บ ---
  "นานาพันธ์": ["นานาพันธุ์"],
  "นพปฎล": ["นพปฎล"],
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
  "ปราโมช": ["ปราโมทย์"],
  "ประการัง": ["ปะการัง"],
  "ผัดซีอิ้ว": ["ผัดซีอิ๊ว"],
  "ผัดไท": ["ผัดไทย"],
  "ผูกพันธ์": ["ผูกพัน"],
  "ผูกพันธิ์": ["ผูกพัน"],
  "เผ่าพันธ์": ["เผ่าพันธุ์"],
  "พรมหมลิขิต": ["พรหมลิขิต"],
  "พระรุงพระรัง": ["พะรุงพะรัง"],
  "พิธีรีตอง": ["พิธีรีตอง"],
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

  // --- หมวดคำทับศัพท์เทคโนโลยี & แอพพลิเคชัน ---
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
  "ชั่ย": ["ใช่"],
  "ก้อ": ["ก็"],
  "ก้": ["ก็"],
  "หลอ": ["หรอ", "เหรอ"],
  "เด่ว": ["เดี๋ยว"],
  "แปป": ["แป๊บ"],
  "เนี่ยะ": ["เนี่ย"],
  "เปน": ["เป็น"],
  "เหน": ["เห็น"],
  "ป่ะ": ["ไหม", "หรือเปล่า"],
  "ป่าว": ["เปล่า"],
  "งัย": ["ไง"],
  "คร้าบ": ["ครับ"],
  "มั่ก": ["มาก"],
  "ม๊าก": ["มาก"],
  "มากก": ["มาก"],
  "มว๊าก": ["มาก"],
  "มว้าก": ["มาก"],
  "ม่าย": ["ไม่"],
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
  "ราดหน้า", "โลกาภิวัตน์", "กะทันหัน", "สมรรถนะ", "สัญชาตญาณ", "กาลเทศะ", "การันตี", "เกม", "ทะนุถนอม", "ทะลวง"
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

function findThaiSuggestions(word: string, maxSuggestions = 5): string[] {
  // 1. Exact match from known corrections
  if (THAI_SPELL_CORRECTIONS[word]) {
    const list = THAI_SPELL_CORRECTIONS[word].filter((s) => s !== word);
    if (list.length > 0) return list.slice(0, maxSuggestions);
  }

  // 2. Structural anomalies fixes
  if (word.includes("เเ")) {
    return [word.replace(/เเ/g, "แ")];
  }
  if (/[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}/.test(word)) {
    const cleaned = word
      .replace(/([่้๊๋])\1+/g, "$1")
      .replace(/([ิีึื])\1+/g, "$1")
      .replace(/([ุู])\1+/g, "$1")
      .replace(/([ั])\1+/g, "$1")
      .replace(/([์])\1+/g, "$1");
    if (cleaned !== word) {
      return [cleaned];
    }
  }

  // 3. Algorithmic Levenshtein distance on Common Thai Words
  const results: { word: string; dist: number; score: number }[] = [];
  for (const dictWord of COMMON_THAI_WORDS) {
    if (dictWord === word) continue;
    if (Math.abs(dictWord.length - word.length) > 2) continue;

    const dist = levenshteinDistance(word, dictWord);
    if (dist <= 2) {
      let score = dist * 10;
      if (dictWord.startsWith(word.slice(0, 2))) score -= 5;
      if (Math.abs(dictWord.length - word.length) === 0) score -= 3;
      results.push({ word: dictWord, dist, score });
    }
  }

  // 4. Partial / Substring replacement from known corrections
  for (const [misspelled, corrects] of Object.entries(THAI_SPELL_CORRECTIONS)) {
    if (word.includes(misspelled)) {
      for (const c of corrects) {
        const replaced = word.replace(misspelled, c);
        if (replaced !== word && !results.some((r) => r.word === replaced)) {
          results.push({ word: replaced, dist: 1, score: 0 });
        }
      }
    }
  }

  results.sort((a, b) => a.score - b.score);
  const unique = Array.from(new Set(results.map((r) => r.word)));
  return unique.slice(0, maxSuggestions);
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

  // Check Thai suggestions with algorithmic ranking
  if (/[\u0E00-\u0E7F]/.test(cleanWord)) {
    const thaiSuggestions = findThaiSuggestions(cleanWord, maxSuggestions);
    if (thaiSuggestions.length > 0) return thaiSuggestions;
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

  return [];
}

export const THAI_SPELL_SET = new Set(Object.keys(THAI_SPELL_CORRECTIONS));
export const ENGLISH_SPELL_SET = new Set(Object.keys(ENGLISH_SPELL_CORRECTIONS));

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const THAI_SPELL_PATTERN = Object.keys(THAI_SPELL_CORRECTIONS)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join("|");

export const THAI_STRUCTURAL_ANOMALY_PATTERN = "เเ|[่้๊๋]{2,}|[ิีึื]{2,}|[ุู]{2,}|[ั]{2,}|[์]{2,}|[ำ]{2,}|[ำ][่้๊๋]";

export function getThaiSpellRegex(): RegExp {
  return new RegExp(THAI_SPELL_PATTERN, "g");
}

export function getThaiAnomalyRegex(): RegExp {
  return new RegExp(THAI_STRUCTURAL_ANOMALY_PATTERN, "g");
}

export const THAI_SPELL_REGEX = getThaiSpellRegex();
export const THAI_STRUCTURAL_ANOMALY_REGEX = getThaiAnomalyRegex();

export function isWordMisspelled(word: string): boolean {
  if (!word) return false;
  const clean = word.trim();
  if (!clean || clean.length <= 1) return false;
  const lower = clean.toLowerCase();

  if (IGNORED_SPELL_WORDS.has(lower)) return false;

  // Thai check: ONLY real misspellings and structural anomalies
  if (/[\u0E00-\u0E7F]/.test(clean)) {
    if (THAI_SPELL_SET.has(clean)) return true;
    if (getThaiAnomalyRegex().test(clean)) return true;
    return false;
  }

  // English check
  if (/^[A-Za-z]+$/.test(clean)) {
    if (ENGLISH_SPELL_SET.has(lower)) return true;
    if (/([a-z])\1{2,}/.test(lower)) return true;
    return false;
  }

  return false;
}
