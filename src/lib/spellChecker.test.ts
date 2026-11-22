import { describe, it, expect } from "vitest";
import {
  isWordMisspelled,
  getSpellingSuggestions,
  findThaiMisspellingsInText,
  addCustomSpellWord,
  removeCustomSpellWord,
  isCustomSpellWord,
} from "./spellChecker";

describe("spellChecker", () => {
  it("does not flag valid English words, contractions, acronyms, or camelCase identifiers as misspelled", () => {
    const validWords = [
      "Luno",
      "luno",
      "Test",
      "Heading",
      "quiet",
      "space",
      "worth",
      "remembering",
      "track",
      "gives",
      "live",
      "Getting",
      "Started",
      "Create",
      "Note",
      "supports",
      "Markdown",
      "Links",
      "Inline",
      "code",
      "is",
      "a",
      "simple",
      "flexible",
      "workspace",
      "for",
      "writing",
      "organizing",
      "doesn't",
      "don’t",
      "it's",
      "user's",
      "PDF",
      "API",
      "HTML",
      "JSON",
      "useState",
      "JavaScript",
      "TypeScript",
      "GitHub",
    ];

    for (const word of validWords) {
      expect(isWordMisspelled(word), "Expected " + word + " NOT to be marked misspelled").toBe(false);
    }
  });

  it("accurately detects misspelled English words via Hunspell (nspell + dictionary-en) and gives suggestions", () => {
    expect(isWordMisspelled("bluee")).toBe(true);
    expect(getSpellingSuggestions("bluee")).toContain("blue");

    expect(isWordMisspelled("teh")).toBe(true);
    expect(getSpellingSuggestions("teh")).toContain("the");

    expect(isWordMisspelled("recieve")).toBe(true);
    expect(getSpellingSuggestions("recieve")).toContain("receive");

    // General English typos powered by Hunspell dictionary-en
    expect(isWordMisspelled("becuase")).toBe(true);
    expect(getSpellingSuggestions("becuase")).toContain("because");

    expect(isWordMisspelled("documnet")).toBe(true);
    expect(getSpellingSuggestions("documnet")).toContain("document");

    expect(isWordMisspelled("compnent")).toBe(true);
    expect(getSpellingSuggestions("compnent")).toContain("component");

    expect(isWordMisspelled("algoritm")).toBe(true);
    expect(getSpellingSuggestions("algoritm")).toContain("algorithm");
  });

  it("does not produce false positives on valid Thai words or continuous Thai paragraphs", () => {
    const validThaiWords = [
      "แก้ไข",
      "ก้าวหน้า",
      "เก้าอี้",
      "แก้ว",
      "ใกล้",
      "กว้าง",
      "เหนือ",
      "เหนื่อย",
      "วิจัย",
      "ปัจจัย",
      "อินเทอร์เน็ต",
      "สร้างสรรค์",
      "สัมภาษณ์",
      "อนุสรณ์",
      "แถลงการณ์",
      "คลั่งไคล้",
      "โพสต์",
      "สคริปต์",
      "โปรดักต์",
      "คุกกี้",
      "ผัดกะเพราไก่",
      "กระเพาะ",
      "กระเพาะอาหาร",
      "พิธีรีตอง",
      "ป่าวประกาศ",
      "แม่ม่าย",
      "ทะลาย",
      "โดยเฉพาะ",
      "เป็น",
      "มหาวิทยาลัย",
      "โทรศัพท์",
      "เรียบร้อย",
    ];

    for (const word of validThaiWords) {
      expect(isWordMisspelled(word), `Expected valid Thai word "${word}" NOT to be misspelled`).toBe(false);
    }

    const validParagraph =
      "การแก้ไขปัญหาก้าวหน้าไปมาก เก้าอี้และแก้วน้ำอยู่ใกล้หน้าต่างบานกว้าง เหนือสิ่งอื่นใดแม้จะเหนื่อยจากการวิจัยและวิเคราะห์ปัจจัยต่างๆ บนอินเทอร์เน็ต เราก็สร้างสรรค์ผลงานและสัมภาษณ์ผู้เชี่ยวชาญแล้วโพสต์สคริปต์ของโปรดักต์ลงในเว็บไซต์อย่างมีกาลเทศะ วันที่ 20 พ.ย. 2569 ณ กทม.";
    expect(findThaiMisspellingsInText(validParagraph)).toEqual([]);
  });

  it("accurately detects real misspelled Thai words and gives correct suggestions", () => {
    expect(isWordMisspelled("สังเกตุ")).toBe(true);
    expect(getSpellingSuggestions("สังเกตุ")).toEqual(["สังเกต"]);
    expect(isWordMisspelled("สังเกต")).toBe(false);

    expect(isWordMisspelled("อนุญาติ")).toBe(true);
    expect(getSpellingSuggestions("อนุญาติ")).toEqual(["อนุญาต"]);
    expect(isWordMisspelled("อนุญาต")).toBe(false);

    // Common typing slip / slang typos
    expect(isWordMisspelled("ดดน")).toBe(true);
    expect(getSpellingSuggestions("ดดน")).toContain("โดน");

    expect(isWordMisspelled("นะค่ะ")).toBe(true);
    expect(getSpellingSuggestions("นะค่ะ")).toEqual(["นะคะ"]);

    expect(isWordMisspelled("ผัดกระเพรา")).toBe(true);
    expect(getSpellingSuggestions("ผัดกระเพรา")).toEqual(["ผัดกะเพรา"]);

    expect(isWordMisspelled("กะเพาะ")).toBe(true);
    expect(getSpellingSuggestions("กะเพาะ")).toEqual(["กระเพาะ"]);

    // Structural anomalies (double sara-e)
    expect(isWordMisspelled("เเละ")).toBe(true);
    expect(getSpellingSuggestions("เเละ")).toEqual(["และ"]);

    // Additional common typos
    expect(isWordMisspelled("กระเทย")).toBe(true);
    expect(getSpellingSuggestions("กระเทย")).toEqual(["กะเทย"]);

    expect(isWordMisspelled("แหมว")).toBe(true);
    expect(getSpellingSuggestions("แหมว")).toContain("แมว");

    expect(isWordMisspelled("แอปพลิเคชั่น")).toBe(true);
    expect(getSpellingSuggestions("แอปพลิเคชั่น")).toEqual(["แอปพลิเคชัน"]);

    expect(isWordMisspelled("แอพพลิเคชัน")).toBe(true);
    expect(getSpellingSuggestions("แอพพลิเคชัน")).toEqual(["แอปพลิเคชัน"]);

    expect(isWordMisspelled("เต้นท์")).toBe(true);
    expect(getSpellingSuggestions("เต้นท์")).toEqual(["เต็นท์"]);

    expect(isWordMisspelled("คฑา")).toBe(true);
    expect(getSpellingSuggestions("คฑา")).toEqual(["คทา"]);
  });

  it("segments continuous Thai sentences via Dictionary DAG and catches embedded typos without false positives", () => {
    const sentence1 =
      "ปรับปรุงตัวตรวจการสะกด โดยใช้ส่วนเสริมที่เชื่อถือได้และมีความสามารถมากพอเพราะตอนนี้ระบบตรวจตัวสะกดดดยเฉพาะภาษาไทยค่อนข้างไม่เก่ง ทำงานได้ไม่ดี ตรวจคำที่ไม่ควรผิด แต่คำที่ผิดกับไม่โดนตรวจเลือกใช้ให้ทีขอดีเหมาะสมที่สุดไม่มีค่าใช้จ่ายเพราะเราเป็ฯ software ฟรี";
    const errors1 = findThaiMisspellingsInText(sentence1);
    expect(errors1.map((e) => e.word)).toEqual(["ดดยเฉพาะ", "เป็ฯ"]);
    expect(getSpellingSuggestions("ดดยเฉพาะ")[0]).toBe("โดยเฉพาะ");
    expect(getSpellingSuggestions("เป็ฯ")[0]).toBe("เป็น");

    const sentence2 =
      "สวัดดีครับ วันนี้เรียนที่มหาวิยาลัยแล้วเจอปันหาเรื่องสำคันเกี่ยวกับคอมพิวเตอณ์และโทรศัพมือถือ พรุ่งนีจะทำให้เสร็จเรียบร้อบ";
    const errors2 = findThaiMisspellingsInText(sentence2);
    expect(errors2.map((e) => e.word)).toEqual([
      "สวัดดี",
      "มหาวิยาลัย",
      "ปันหา",
      "สำคัน",
      "คอมพิวเตอณ์",
      "โทรศัพ",
      "พรุ่งนี",
      "เรียบร้อบ",
    ]);
    expect(getSpellingSuggestions("สวัดดี")[0]).toBe("สวัสดี");
    expect(getSpellingSuggestions("มหาวิยาลัย")[0]).toBe("มหาวิทยาลัย");
    expect(getSpellingSuggestions("โทรศัพ")[0]).toBe("โทรศัพท์");
    expect(getSpellingSuggestions("พรุ่งนี")[0]).toBe("พรุ่งนี้");
    expect(getSpellingSuggestions("เรียบร้อบ")[0]).toBe("เรียบร้อย");
  });

  it("supports adding and removing words in the custom user dictionary", () => {
    const customThai = "ลูโน่โน้ต";
    const customEng = " Lunoverse ";

    addCustomSpellWord(customThai);
    addCustomSpellWord(customEng);

    expect(isCustomSpellWord("ลูโน่โน้ต")).toBe(true);
    expect(isCustomSpellWord("Lunoverse")).toBe(true);
    expect(isWordMisspelled("ลูโน่โน้ต")).toBe(false);
    expect(isWordMisspelled("Lunoverse")).toBe(false);

    removeCustomSpellWord(customThai);
    removeCustomSpellWord(customEng);
    expect(isCustomSpellWord("ลูโน่โน้ต")).toBe(false);
    expect(isCustomSpellWord("Lunoverse")).toBe(false);
  });
});
