export type NoteTemplateType =
  | "blank"
  | "meeting"
  | "daily"
  | "project"
  | "todo"
  | "study"
  | "bug";

export function getNoteTemplateContent(
  templateType: NoteTemplateType,
  lang: "en" | "th" = "en",
  format: "markdown" | "html" | "plain" = "markdown"
): string {
  const isTh = lang === "th";
  const now = new Date();
  const dateStr = now.toLocaleDateString(isTh ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString(isTh ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handle Plain Text Format templates (.txt)
  if (format === "plain") {
    if (!templateType || templateType === "blank") {
      return "";
    }

    if (templateType === "meeting") {
      if (isTh) {
        return (
          `บันทึกการประชุม - ${dateStr}\n` +
          `=======================================\n\n` +
          `รายละเอียด\n` +
          `----------\n` +
          `- วันที่: ${dateStr}\n` +
          `- เวลา: ${timeStr}\n` +
          `- ผู้เข้าร่วม: \n\n` +
          `วาระการประชุม\n` +
          `-------------\n` +
          `[ ] วาระที่ 1\n` +
          `[ ] วาระที่ 2\n\n` +
          `สรุปการพูดคุย & บันทึก\n` +
          `---------------------\n` +
          `- \n\n` +
          `งานที่ต้องทำต่อ (Action Items)\n` +
          `-----------------------------\n` +
          `[ ] งานที่ 1 (ผู้รับผิดชอบ: )\n` +
          `[ ] งานที่ 2 (ผู้รับผิดชอบ: )\n`
        );
      }
      return (
        `Meeting Notes - ${dateStr}\n` +
        `=======================================\n\n` +
        `Details\n` +
        `-------\n` +
        `- Date: ${dateStr}\n` +
        `- Time: ${timeStr}\n` +
        `- Attendees: \n\n` +
        `Agenda\n` +
        `------\n` +
        `[ ] Item 1\n` +
        `[ ] Item 2\n\n` +
        `Discussion & Notes\n` +
        `------------------\n` +
        `- \n\n` +
        `Action Items\n` +
        `------------\n` +
        `[ ] Task 1 (Assigned to: )\n` +
        `[ ] Task 2 (Assigned to: )\n`
      );
    }

    if (templateType === "daily") {
      if (isTh) {
        return (
          `บันทึกประจำวัน - ${dateStr}\n` +
          `=======================================\n\n` +
          `สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ\n` +
          `---------------------------------------\n` +
          `- \n\n` +
          `เป้าหมายสำคัญวันนี้\n` +
          `-------------------\n` +
          `[ ] เป้าหมายที่ 1\n` +
          `[ ] เป้าหมายที่ 2\n` +
          `[ ] เป้าหมายที่ 3\n\n` +
          `ข้อคิด & สรุปประจำวัน\n` +
          `---------------------\n` +
          `- \n`
        );
      }
      return (
        `Daily Journal - ${dateStr}\n` +
        `=======================================\n\n` +
        `Highlights & Gratitude\n` +
        `----------------------\n` +
        `- What am I grateful for today?\n` +
        `- \n\n` +
        `Today's Priorities\n` +
        `------------------\n` +
        `[ ] Priority 1\n` +
        `[ ] Priority 2\n` +
        `[ ] Priority 3\n\n` +
        `Notes & Reflections\n` +
        `-------------------\n` +
        `- \n`
      );
    }

    if (templateType === "project") {
      if (isTh) {
        return (
          `วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]\n` +
          `=======================================\n\n` +
          `ภาพรวมโปรเจกต์\n` +
          `--------------\n` +
          `- วัตถุประสงค์: \n` +
          `- กลุ่มเป้าหมาย: \n` +
          `- กำหนดการส่งมอบ: ${dateStr}\n\n` +
          `เป้าหมายหลัก (Key Objectives)\n` +
          `-----------------------------\n` +
          `[ ] เป้าหมายที่ 1\n` +
          `[ ] เป้าหมายที่ 2\n\n` +
          `ขั้นตอนดำเนินการ (Milestones & Timeline)\n` +
          `-----------------------------------------\n` +
          `[ ] ระยะที่ 1: วางโครงสร้างและวางแผน\n` +
          `[ ] ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์\n` +
          `[ ] ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง\n` +
          `[ ] ระยะที่ 4: ปล่อยใช้งานและเปิดตัว\n\n` +
          `เครื่องมือและเทคโนโลยีที่ใช้\n` +
          `---------------------------\n` +
          `- \n\n` +
          `บันทึกเพิ่มเติม & ไอเดีย\n` +
          `-----------------------\n` +
          `- \n`
        );
      }
      return (
        `Project Planning - [Project Name]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Objective: \n` +
        `- Target Audience: \n` +
        `- Target Launch Date: ${dateStr}\n\n` +
        `Key Objectives\n` +
        `--------------\n` +
        `[ ] Objective 1\n` +
        `[ ] Objective 2\n\n` +
        `Milestones & Timeline\n` +
        `---------------------\n` +
        `[ ] Phase 1: Planning & Architecture\n` +
        `[ ] Phase 2: Implementation & Creation\n` +
        `[ ] Phase 3: Testing & Quality Assurance\n` +
        `[ ] Phase 4: Launch & Deployment\n\n` +
        `Tools & Technologies\n` +
        `--------------------\n` +
        `- \n\n` +
        `Additional Notes & Brainstorming\n` +
        `--------------------------------\n` +
        `- \n`
      );
    }

    if (templateType === "todo") {
      if (isTh) {
        return (
          `รายการงานที่ต้องทำ - ${dateStr}\n` +
          `=======================================\n\n` +
          `งานด่วนและสำคัญมาก (High Priority)\n` +
          `-----------------------------------\n` +
          `[ ] งานที่ 1\n` +
          `[ ] งานที่ 2\n\n` +
          `งานสำคัญทั่วไป (Medium Priority)\n` +
          `---------------------------------\n` +
          `[ ] งานที่ 1\n` +
          `[ ] งานที่ 2\n\n` +
          `งานอื่นๆ / งานตามหลัง (Low Priority)\n` +
          `------------------------------------\n` +
          `[ ] งานที่ 1\n\n` +
          `สรุปงานเสร็จสิ้น (Completed)\n` +
          `----------------------------\n` +
          `- \n`
        );
      }
      return (
        `Task & To-Do List - ${dateStr}\n` +
        `=======================================\n\n` +
        `High Priority\n` +
        `-------------\n` +
        `[ ] Task 1\n` +
        `[ ] Task 2\n\n` +
        `Medium Priority\n` +
        `---------------\n` +
        `[ ] Task 1\n` +
        `[ ] Task 2\n\n` +
        `Low Priority\n` +
        `------------\n` +
        `[ ] Task 1\n\n` +
        `Completed\n` +
        `---------\n` +
        `- \n`
      );
    }

    if (templateType === "study") {
      if (isTh) {
        return (
          `บันทึกการเรียนรู้ - [หัวข้อ/วิชา]\n` +
          `=======================================\n\n` +
          `ข้อมูลทั่วไป\n` +
          `------------\n` +
          `- วิชา/หัวข้อ: \n` +
          `- วันที่: ${dateStr}\n` +
          `- แหล่งอ้างอิง: \n\n` +
          `สรุปเนื้อหาสำคัญ (Key Concepts)\n` +
          `-------------------------------\n` +
          `- \n\n` +
          `รายละเอียดและคำอธิบายเพิ่มเติม\n` +
          `------------------------------\n` +
          `- \n\n` +
          `คำถามที่ต้องหาคำตอบเพิ่ม (Questions)\n` +
          `------------------------------------\n` +
          `[ ] คำถามที่ 1\n\n` +
          `สรุปความเข้าใจแบบสั้น (Takeaways)\n` +
          `---------------------------------\n` +
          `- \n`
        );
      }
      return (
        `Study & Research Notes - [Subject/Topic]\n` +
        `=======================================\n\n` +
        `Overview\n` +
        `--------\n` +
        `- Subject/Topic: \n` +
        `- Date: ${dateStr}\n` +
        `- Source/References: \n\n` +
        `Key Concepts & Core Ideas\n` +
        `-------------------------\n` +
        `- \n\n` +
        `Detailed Notes\n` +
        `--------------\n` +
        `- \n\n` +
        `Questions to Explore Further\n` +
        `----------------------------\n` +
        `[ ] Question 1\n\n` +
        `Key Takeaways & Summary\n` +
        `-----------------------\n` +
        `- \n`
      );
    }

    if (templateType === "bug") {
      if (isTh) {
        return (
          `รายงานปัญหา / บั๊ก - [ชื่อปัญหา]\n` +
          `=======================================\n\n` +
          `รายละเอียดปัญหา (Issue Overview)\n` +
          `--------------------------------\n` +
          `- ความรุนแรง: [High / Medium / Low]\n` +
          `- สถานะ: [Open / In Progress / Resolved]\n` +
          `- วันที่พบปัญหา: ${dateStr}\n\n` +
          `อธิบายพฤติกรรมของปัญหา (Description)\n` +
          `-------------------------------------\n` +
          `- \n\n` +
          `ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
          `---------------------------------------------\n` +
          `1. ขั้นตอนที่ 1\n` +
          `2. ขั้นตอนที่ 2\n` +
          `3. เกิดปัญหาทันที\n\n` +
          `ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
          `-------------------------------------------\n` +
          `- ผลลัพธ์ที่คาดหวัง: \n` +
          `- ผลลัพธ์ที่เกิดขึ้นจริง: \n\n` +
          `แนวทางการแก้ไข (Proposed Fix & Action Items)\n` +
          `--------------------------------------------\n` +
          `[ ] ตรวจสอบสาเหตุ\n` +
          `[ ] ดำเนินการแก้ไขและทดสอบ\n`
        );
      }
      return (
        `Bug & Issue Report - [Issue Name]\n` +
        `=======================================\n\n` +
        `Issue Overview\n` +
        `--------------\n` +
        `- Severity: [High / Medium / Low]\n` +
        `- Status: [Open / In Progress / Resolved]\n` +
        `- Reported Date: ${dateStr}\n\n` +
        `Description\n` +
        `-----------\n` +
        `- \n\n` +
        `Steps to Reproduce\n` +
        `------------------\n` +
        `1. Step 1\n` +
        `2. Step 2\n` +
        `3. Observe issue\n\n` +
        `Expected vs Actual Behavior\n` +
        `---------------------------\n` +
        `- Expected: \n` +
        `- Actual: \n\n` +
        `Proposed Fix & Action Items\n` +
        `---------------------------\n` +
        `[ ] Investigate root cause\n` +
        `[ ] Implement fix & verify\n`
      );
    }

    return "";
  }

  // Handle HTML Format templates
  if (format === "html") {
    if (!templateType || templateType === "blank") {
      return (
        `<!DOCTYPE html>\n` +
        `<html lang="${lang}">\n` +
        `<head>\n` +
        `  <meta charset="UTF-8">\n` +
        `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
        `  <title>Document</title>\n` +
        `  <style>\n` +
        `    body {\n` +
        `      font-family: system-ui, -apple-system, sans-serif;\n` +
        `      line-height: 1.7;\n` +
        `      max-width: 800px;\n` +
        `      margin: 40px auto;\n` +
        `      padding: 0 20px;\n` +
        `      color: #222;\n` +
        `    }\n` +
        `    h1 { font-size: 2.2rem; margin-bottom: 10px; }\n` +
        `    h2 { margin-top: 35px; }\n` +
        `    p { margin: 12px 0; }\n` +
        `  </style>\n` +
        `</head>\n` +
        `<body>\n` +
        `  <h1>${isTh ? "เอกสารใหม่" : "New Document"}</h1>\n` +
        `  <p></p>\n` +
        `</body>\n` +
        `</html>`
      );
    }

    let title = "";
    let bodyContent = "";

    if (templateType === "meeting") {
      title = isTh ? `บันทึกการประชุม - ${dateStr}` : `Meeting Notes - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>บันทึกการประชุม - ${dateStr}</h1>\n` +
          `<h2>รายละเอียด</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วันที่:</strong> ${dateStr}</li>\n` +
          `  <li><strong>เวลา:</strong> ${timeStr}</li>\n` +
          `  <li><strong>ผู้เข้าร่วม:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>วาระการประชุม</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> วาระที่ 1</li>\n` +
          `  <li><input type="checkbox"> วาระที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>สรุปการพูดคุย & บันทึก</h2>\n` +
          `<p></p>\n` +
          `<h2>งานที่ต้องทำต่อ (Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1 (ผู้รับผิดชอบ: )</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2 (ผู้รับผิดชอบ: )</li>\n` +
          `</ul>`
        : `<h1>Meeting Notes - ${dateStr}</h1>\n` +
          `<h2>Details</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Time:</strong> ${timeStr}</li>\n` +
          `  <li><strong>Attendees:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Agenda</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Item 1</li>\n` +
          `  <li><input type="checkbox"> Item 2</li>\n` +
          `</ul>\n` +
          `<h2>Discussion & Notes</h2>\n` +
          `<p></p>\n` +
          `<h2>Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1 (Assigned to: )</li>\n` +
          `  <li><input type="checkbox"> Task 2 (Assigned to: )</li>\n` +
          `</ul>`;
    } else if (templateType === "daily") {
      title = isTh ? `บันทึกประจำวัน - ${dateStr}` : `Daily Journal - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>บันทึกประจำวัน - ${dateStr}</h1>\n` +
          `<h2>สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ</h2>\n` +
          `<p></p>\n` +
          `<h2>เป้าหมายสำคัญวันนี้</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 1</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 2</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 3</li>\n` +
          `</ul>\n` +
          `<h2>ข้อคิด & สรุปประจำวัน</h2>\n` +
          `<p></p>`
        : `<h1>Daily Journal - ${dateStr}</h1>\n` +
          `<h2>Highlights & Gratitude</h2>\n` +
          `<p></p>\n` +
          `<h2>Today's Priorities</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Priority 1</li>\n` +
          `  <li><input type="checkbox"> Priority 2</li>\n` +
          `  <li><input type="checkbox"> Priority 3</li>\n` +
          `</ul>\n` +
          `<h2>Notes & Reflections</h2>\n` +
          `<p></p>`;
    } else if (templateType === "project") {
      title = isTh ? `วางแผนโปรเจกต์` : `Project Planning`;
      bodyContent = isTh
        ? `<h1>วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]</h1>\n` +
          `<h2>ภาพรวมโปรเจกต์</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วัตถุประสงค์:</strong> </li>\n` +
          `  <li><strong>กลุ่มเป้าหมาย:</strong> </li>\n` +
          `  <li><strong>กำหนดการส่งมอบ:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>เป้าหมายหลัก (Key Objectives)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 1</li>\n` +
          `  <li><input type="checkbox"> เป้าหมายที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>ขั้นตอนดำเนินการ (Milestones & Timeline)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ระยะที่ 1: วางโครงสร้างและวางแผน</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง</li>\n` +
          `  <li><input type="checkbox"> ระยะที่ 4: ปล่อยใช้งานและเปิดตัว</li>\n` +
          `</ul>\n` +
          `<h2>เครื่องมือและเทคโนโลยีที่ใช้</h2>\n` +
          `<p></p>\n` +
          `<h2>บันทึกเพิ่มเติม & ไอเดีย</h2>\n` +
          `<p></p>`
        : `<h1>Project Planning - [Project Name]</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Objective:</strong> </li>\n` +
          `  <li><strong>Target Audience:</strong> </li>\n` +
          `  <li><strong>Target Launch Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Key Objectives</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Objective 1</li>\n` +
          `  <li><input type="checkbox"> Objective 2</li>\n` +
          `</ul>\n` +
          `<h2>Milestones & Timeline</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Phase 1: Planning & Architecture</li>\n` +
          `  <li><input type="checkbox"> Phase 2: Implementation & Creation</li>\n` +
          `  <li><input type="checkbox"> Phase 3: Testing & Quality Assurance</li>\n` +
          `  <li><input type="checkbox"> Phase 4: Launch & Deployment</li>\n` +
          `</ul>\n` +
          `<h2>Tools & Technologies</h2>\n` +
          `<p></p>\n` +
          `<h2>Additional Notes & Brainstorming</h2>\n` +
          `<p></p>`;
    } else if (templateType === "todo") {
      title = isTh ? `รายการงานที่ต้องทำ - ${dateStr}` : `Task & To-Do List - ${dateStr}`;
      bodyContent = isTh
        ? `<h1>รายการงานที่ต้องทำ - ${dateStr}</h1>\n` +
          `<h2>งานด่วนและสำคัญมาก (High Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>งานสำคัญทั่วไป (Medium Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `  <li><input type="checkbox"> งานที่ 2</li>\n` +
          `</ul>\n` +
          `<h2>งานอื่นๆ / งานตามหลัง (Low Priority)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> งานที่ 1</li>\n` +
          `</ul>\n` +
          `<h2>สรุปงานเสร็จสิ้น (Completed)</h2>\n` +
          `<p></p>`
        : `<h1>Task & To-Do List - ${dateStr}</h1>\n` +
          `<h2>High Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `  <li><input type="checkbox"> Task 2</li>\n` +
          `</ul>\n` +
          `<h2>Medium Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `  <li><input type="checkbox"> Task 2</li>\n` +
          `</ul>\n` +
          `<h2>Low Priority</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Task 1</li>\n` +
          `</ul>\n` +
          `<h2>Completed</h2>\n` +
          `<p></p>`;
    } else if (templateType === "study") {
      title = isTh ? `บันทึกการเรียนรู้` : `Study & Research Notes`;
      bodyContent = isTh
        ? `<h1>บันทึกการเรียนรู้ - [หัวข้อ/วิชา]</h1>\n` +
          `<h2>ข้อมูลทั่วไป</h2>\n` +
          `<ul>\n` +
          `  <li><strong>วิชา/หัวข้อ:</strong> </li>\n` +
          `  <li><strong>วันที่:</strong> ${dateStr}</li>\n` +
          `  <li><strong>แหล่งอ้างอิง:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>สรุปเนื้อหาสำคัญ (Key Concepts)</h2>\n` +
          `<p></p>\n` +
          `<h2>รายละเอียดและคำอธิบายเพิ่มเติม</h2>\n` +
          `<p></p>\n` +
          `<h2>คำถามที่ต้องหาคำตอบเพิ่ม (Questions)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> คำถามที่ 1</li>\n` +
          `</ul>\n` +
          `<h2>สรุปความเข้าใจแบบสั้น (Takeaways)</h2>\n` +
          `<p></p>`
        : `<h1>Study & Research Notes - [Subject/Topic]</h1>\n` +
          `<h2>Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Subject/Topic:</strong> </li>\n` +
          `  <li><strong>Date:</strong> ${dateStr}</li>\n` +
          `  <li><strong>Source/References:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Key Concepts & Core Ideas</h2>\n` +
          `<p></p>\n` +
          `<h2>Detailed Notes</h2>\n` +
          `<p></p>\n` +
          `<h2>Questions to Explore Further</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Question 1</li>\n` +
          `</ul>\n` +
          `<h2>Key Takeaways & Summary</h2>\n` +
          `<p></p>`;
    } else if (templateType === "bug") {
      title = isTh ? `รายงานปัญหา / บั๊ก` : `Bug & Issue Report`;
      bodyContent = isTh
        ? `<h1>รายงานปัญหา / บั๊ก - [ชื่อปัญหา]</h1>\n` +
          `<h2>รายละเอียดปัญหา (Issue Overview)</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ความรุนแรง:</strong> [High / Medium / Low]</li>\n` +
          `  <li><strong>สถานะ:</strong> [Open / In Progress / Resolved]</li>\n` +
          `  <li><strong>วันที่พบปัญหา:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>อธิบายพฤติกรรมของปัญหา (Description)</h2>\n` +
          `<p></p>\n` +
          `<h2>ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)</h2>\n` +
          `<ol>\n` +
          `  <li>ขั้นตอนที่ 1</li>\n` +
          `  <li>ขั้นตอนที่ 2</li>\n` +
          `  <li>เกิดปัญหาทันที</li>\n` +
          `</ol>\n` +
          `<h2>ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง</h2>\n` +
          `<ul>\n` +
          `  <li><strong>ผลลัพธ์ที่คาดหวัง:</strong> </li>\n` +
          `  <li><strong>ผลลัพธ์ที่เกิดขึ้นจริง:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>แนวทางการแก้ไข (Proposed Fix & Action Items)</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> ตรวจสอบสาเหตุ</li>\n` +
          `  <li><input type="checkbox"> ดำเนินการแก้ไขและทดสอบ</li>\n` +
          `</ul>`
        : `<h1>Bug & Issue Report - [Issue Name]</h1>\n` +
          `<h2>Issue Overview</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Severity:</strong> [High / Medium / Low]</li>\n` +
          `  <li><strong>Status:</strong> [Open / In Progress / Resolved]</li>\n` +
          `  <li><strong>Reported Date:</strong> ${dateStr}</li>\n` +
          `</ul>\n` +
          `<h2>Description</h2>\n` +
          `<p></p>\n` +
          `<h2>Steps to Reproduce</h2>\n` +
          `<ol>\n` +
          `  <li>Step 1</li>\n` +
          `  <li>Step 2</li>\n` +
          `  <li>Observe issue</li>\n` +
          `</ol>\n` +
          `<h2>Expected vs Actual Behavior</h2>\n` +
          `<ul>\n` +
          `  <li><strong>Expected:</strong> </li>\n` +
          `  <li><strong>Actual:</strong> </li>\n` +
          `</ul>\n` +
          `<h2>Proposed Fix & Action Items</h2>\n` +
          `<ul>\n` +
          `  <li><input type="checkbox"> Investigate root cause</li>\n` +
          `  <li><input type="checkbox"> Implement fix & verify</li>\n` +
          `</ul>`;
    }

    return (
      `<!DOCTYPE html>\n` +
      `<html lang="${lang}">\n` +
      `<head>\n` +
      `  <meta charset="UTF-8">\n` +
      `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
      `  <title>${title}</title>\n` +
      `  <style>\n` +
      `    body {\n` +
      `      font-family: system-ui, -apple-system, sans-serif;\n` +
      `      line-height: 1.7;\n` +
      `      max-width: 800px;\n` +
      `      margin: 40px auto;\n` +
      `      padding: 0 20px;\n` +
      `      color: #222;\n` +
      `    }\n` +
      `    h1 { font-size: 2.2rem; margin-bottom: 10px; }\n` +
      `    h2 { margin-top: 35px; }\n` +
      `    p { margin: 12px 0; }\n` +
      `    ul, ol { padding-left: 24px; }\n` +
      `  </style>\n` +
      `</head>\n` +
      `<body>\n` +
      `  ${bodyContent}\n` +
      `</body>\n` +
      `</html>`
    );
  }

  // Handle Markdown Format templates
  if (!templateType || templateType === "blank") {
    return "";
  }

  if (templateType === "meeting") {
    if (isTh) {
      return (
        `# บันทึกการประชุม - ${dateStr}\n\n` +
        `## รายละเอียด\n` +
        `- **วันที่:** ${dateStr}\n` +
        `- **เวลา:** ${timeStr}\n` +
        `- **ผู้เข้าร่วม:** \n\n` +
        `## วาระการประชุม\n` +
        `- [ ] วาระที่ 1\n` +
        `- [ ] วาระที่ 2\n\n` +
        `## สรุปการพูดคุย & บันทึก\n` +
        `- \n\n` +
        `## งานที่ต้องทำต่อ (Action Items)\n` +
        `- [ ] งานที่ 1 (ผู้รับผิดชอบ: )\n` +
        `- [ ] งานที่ 2 (ผู้รับผิดชอบ: )\n`
      );
    }
    return (
      `# Meeting Notes - ${dateStr}\n\n` +
      `## Details\n` +
      `- **Date:** ${dateStr}\n` +
      `- **Time:** ${timeStr}\n` +
      `- **Attendees:** \n\n` +
      `## Agenda\n` +
      `- [ ] Item 1\n` +
      `- [ ] Item 2\n\n` +
      `## Discussion & Notes\n` +
      `- \n\n` +
      `## Action Items\n` +
      `- [ ] Task 1 (Assigned to: )\n` +
      `- [ ] Task 2 (Assigned to: )\n`
    );
  }

  if (templateType === "daily") {
    if (isTh) {
      return (
        `# บันทึกประจำวัน - ${dateStr}\n\n` +
        `## สิ่งดีๆ ประจำวัน & เรื่องที่รู้สึกขอบคุณ\n` +
        `- \n\n` +
        `## เป้าหมายสำคัญวันนี้\n` +
        `- [ ] เป้าหมายที่ 1\n` +
        `- [ ] เป้าหมายที่ 2\n` +
        `- [ ] เป้าหมายที่ 3\n\n` +
        `## ข้อคิด & สรุปประจำวัน\n` +
        `- \n`
      );
    }
    return (
      `# Daily Journal - ${dateStr}\n\n` +
      `## Highlights & Gratitude\n` +
      `- What am I grateful for today?\n` +
      `- \n\n` +
      `## Today's Priorities\n` +
      `- [ ] Priority 1\n` +
      `- [ ] Priority 2\n` +
      `- [ ] Priority 3\n\n` +
      `## Notes & Reflections\n` +
      `- \n`
    );
  }

  if (templateType === "project") {
    if (isTh) {
      return (
        `# วางแผนโปรเจกต์ - [ชื่อโปรเจกต์]\n\n` +
        `## ภาพรวมโปรเจกต์\n` +
        `- **วัตถุประสงค์:** \n` +
        `- **กลุ่มเป้าหมาย:** \n` +
        `- **กำหนดการส่งมอบ:** ${dateStr}\n\n` +
        `## เป้าหมายหลัก (Key Objectives)\n` +
        `- [ ] เป้าหมายที่ 1\n` +
        `- [ ] เป้าหมายที่ 2\n\n` +
        `## ขั้นตอนดำเนินการ (Milestones & Timeline)\n` +
        `- [ ] ระยะที่ 1: วางโครงสร้างและวางแผน\n` +
        `- [ ] ระยะที่ 2: ดำเนินการพัฒนา / สร้างสรรค์\n` +
        `- [ ] ระยะที่ 3: ทดสอบและตรวจสอบความถูกต้อง\n` +
        `- [ ] ระยะที่ 4: ปล่อยใช้งานและเปิดตัว\n\n` +
        `## เครื่องมือและเทคโนโลยีที่ใช้\n` +
        `- \n\n` +
        `## บันทึกเพิ่มเติม & ไอเดีย\n` +
        `- \n`
      );
    }
    return (
      `# Project Planning - [Project Name]\n\n` +
      `## Overview\n` +
      `- **Objective:** \n` +
      `- **Target Audience:** \n` +
      `- **Target Launch Date:** ${dateStr}\n\n` +
      `## Key Objectives\n` +
      `- [ ] Objective 1\n` +
      `- [ ] Objective 2\n\n` +
      `## Milestones & Timeline\n` +
      `- [ ] Phase 1: Planning & Architecture\n` +
      `- [ ] Phase 2: Implementation & Creation\n` +
      `- [ ] Phase 3: Testing & Quality Assurance\n` +
      `- [ ] Phase 4: Launch & Deployment\n\n` +
      `## Tools & Technologies\n` +
      `- \n\n` +
      `## Additional Notes & Brainstorming\n` +
      `- \n`
    );
  }

  if (templateType === "todo") {
    if (isTh) {
      return (
        `# รายการงานที่ต้องทำ - ${dateStr}\n\n` +
        `## งานด่วนและสำคัญมาก (High Priority)\n` +
        `- [ ] งานที่ 1\n` +
        `- [ ] งานที่ 2\n\n` +
        `## งานสำคัญทั่วไป (Medium Priority)\n` +
        `- [ ] งานที่ 1\n` +
        `- [ ] งานที่ 2\n\n` +
        `## งานอื่นๆ / งานตามหลัง (Low Priority)\n` +
        `- [ ] งานที่ 1\n\n` +
        `## สรุปงานเสร็จสิ้น (Completed)\n` +
        `- \n`
      );
    }
    return (
      `# Task & To-Do List - ${dateStr}\n\n` +
      `## High Priority\n` +
      `- [ ] Task 1\n` +
      `- [ ] Task 2\n\n` +
      `## Medium Priority\n` +
      `- [ ] Task 1\n` +
      `- [ ] Task 2\n\n` +
      `## Low Priority\n` +
      `- [ ] Task 1\n\n` +
      `## Completed\n` +
      `- \n`
    );
  }

  if (templateType === "study") {
    if (isTh) {
      return (
        `# บันทึกการเรียนรู้ - [หัวข้อ/วิชา]\n\n` +
        `## ข้อมูลทั่วไป\n` +
        `- **วิชา/หัวข้อ:** \n` +
        `- **วันที่:** ${dateStr}\n` +
        `- **แหล่งอ้างอิง:** \n\n` +
        `## สรุปเนื้อหาสำคัญ (Key Concepts)\n` +
        `- \n\n` +
        `## รายละเอียดและคำอธิบายเพิ่มเติม\n` +
        `- \n\n` +
        `## คำถามที่ต้องหาคำตอบเพิ่ม (Questions)\n` +
        `- [ ] คำถามที่ 1\n\n` +
        `## สรุปความเข้าใจแบบสั้น (Takeaways)\n` +
        `- \n`
      );
    }
    return (
      `# Study & Research Notes - [Subject/Topic]\n\n` +
      `## Overview\n` +
      `- **Subject/Topic:** \n` +
      `- **Date:** ${dateStr}\n` +
      `- **Source/References:** \n\n` +
      `## Key Concepts & Core Ideas\n` +
      `- \n\n` +
      `## Detailed Notes\n` +
      `- \n\n` +
      `## Questions to Explore Further\n` +
      `- [ ] Question 1\n\n` +
      `## Key Takeaways & Summary\n` +
      `- \n`
    );
  }

  if (templateType === "bug") {
    if (isTh) {
      return (
        `# รายงานปัญหา / บั๊ก - [ชื่อปัญหา]\n\n` +
        `## รายละเอียดปัญหา (Issue Overview)\n` +
        `- **ความรุนแรง:** [High / Medium / Low]\n` +
        `- **สถานะ:** [Open / In Progress / Resolved]\n` +
        `- **วันที่พบปัญหา:** ${dateStr}\n\n` +
        `## อธิบายพฤติกรรมของปัญหา (Description)\n` +
        `- \n\n` +
        `## ขั้นตอนการทำให้เกิดปัญหา (Steps to Reproduce)\n` +
        `1. ขั้นตอนที่ 1\n` +
        `2. ขั้นตอนที่ 2\n` +
        `3. เกิดปัญหาทันที\n\n` +
        `## ผลลัพธ์ที่คาดหวัง vs ผลลัพธ์ที่เกิดขึ้นจริง\n` +
        `- **ผลลัพธ์ที่คาดหวัง:** \n` +
        `- **ผลลัพธ์ที่เกิดขึ้นจริง:** \n\n` +
        `## แนวทางการแก้ไข (Proposed Fix & Action Items)\n` +
        `- [ ] ตรวจสอบสาเหตุ\n` +
        `- [ ] ดำเนินการแก้ไขและทดสอบ\n`
      );
    }
    return (
      `# Bug & Issue Report - [Issue Name]\n\n` +
      `## Issue Overview\n` +
      `- **Severity:** [High / Medium / Low]\n` +
      `- **Status:** [Open / In Progress / Resolved]\n` +
      `- **Reported Date:** ${dateStr}\n\n` +
      `## Description\n` +
      `- \n\n` +
      `## Steps to Reproduce\n` +
      `1. Step 1\n` +
      `2. Step 2\n` +
      `3. Observe issue\n\n` +
      `## Expected vs Actual Behavior\n` +
      `- **Expected:** \n` +
      `- **Actual:** \n\n` +
      `## Proposed Fix & Action Items\n` +
      `- [ ] Investigate root cause\n` +
      `- [ ] Implement fix & verify\n`
    );
  }

  return "";
}
