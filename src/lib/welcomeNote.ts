export const WELCOME_NOTE_FILENAME = "Welcome.md";

export function getWelcomeNoteContent(
  lang: "en" | "th" = "en",
  workspaceName?: string
): string {
  const wsName = workspaceName?.trim() || "Luno Note";

  if (lang === "th") {
    return `---
icon: "lucide:BookOpen"
tags:
  - welcome
  - guide
---
# 👋 ยินดีต้อนรับสู่ ${wsName}!
นี่คือพื้นที่สำหรับจดบันทึก รวบรวมไอเดีย และจัดระเบียบความคิดของคุณ  
คุณสามารถแก้ไข ทดลองพิมพ์ หรือลบโน้ตนี้ได้ตามสบายเมื่อพร้อมใช้งานจริง 🚀

---

### 📌 ก้าวแรกของคุณ (ลองคลิกหรือติ๊กดูได้เลย!)
- [ ] ลองพิมพ์ข้อความใหม่ต่อท้ายบรรทัดนี้
- [ ] กด \`Ctrl + N\` เพื่อสร้างโน้ตใหม่
- [ ] กด \`Ctrl + K\` เพื่อค้นหาโน้ตหรือเปิดคำสั่งด่วน (Command Palette)
- [ ] ลองลากรูปภาพหรือไฟล์เสียงมาวางลงในตัวแก้ไขข้อความ
- [ ] ลบโน้ตนี้เมื่อคุณพร้อมเริ่มต้นบันทึกข้อมูลของคุณเอง

---

### 💡 ตัวอย่างรูปแบบการเขียน (Markdown & Interactive Features)
* **ตัวหนา (Bold)** ด้วย \`Ctrl + B\` และ *ตัวเอียง (Italic)* ด้วย \`Ctrl + I\`
* สร้างรายการสิ่งที่ต้องทำด้วย \`- [ ]\` (Task list)
* เน้นข้อความสำคัญด้วยการไฮไลท์ หรือใส่ \`inline code\`
* เชื่อมโยงโน้ตหากันได้ง่ายๆ ด้วย \`[[ชื่อโน้ต]]\` (WikiLink / Backlink)
* ใส่แท็กจัดหมวดหมู่ได้ทุกที่ เช่น \`#welcome\` \`#getting-started\`

\`\`\`javascript
// ตัวอย่าง Code Block พร้อม Syntax Highlighting
function greet(name) {
  return \`Hello, \${name}! Welcome to Luno Note\`;
}
\`\`\`

> 💡 **Tip:** คุณสามารถคลิกขวาที่โน้ตในแถบด้านซ้าย เพื่อเปลี่ยนไอคอนโน้ต ปักหมุด หรือตั้งรหัสผ่านล็อกโน้ตได้

---

### ⌨️ คีย์ลัดที่มีประโยชน์
| การทำงาน | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **สร้างโน้ตใหม่** | \`Ctrl + N\` | \`Cmd + N\` |
| **ค้นหา / Command Palette** | \`Ctrl + K\` / \`Ctrl + P\` | \`Cmd + K\` / \`Cmd + P\` |
| **เปิด / ปิดแถบข้าง (Sidebar)** | \`Ctrl + \\\` | \`Cmd + \\\` |
| **เปลี่ยนเป็นตัวหนา** | \`Ctrl + B\` | \`Cmd + B\` |
| **เปลี่ยนเป็นตัวเอียง** | \`Ctrl + I\` | \`Cmd + I\` |
| **บันทึกข้อมูล** | \`Ctrl + S\` (บันทึกอัตโนมัติ) | \`Cmd + S\` |

---

> 🚀 **พร้อมแล้วใช่ไหม?** เริ่มต้นสร้างสรรค์พื้นที่ความรู้ของคุณได้ทันที!
`;
  }

  return `---
icon: "lucide:BookOpen"
tags:
  - welcome
  - guide
---
# 👋 Welcome to ${wsName}!
This is your personal workspace for notes, ideas, and knowledge organization.  
Feel free to edit, experiment, or delete this note when you're ready to start fresh 🚀

---

### 📌 Getting Started (Try checking these off!)
- [ ] Try typing a new line right here
- [ ] Press \`Ctrl + N\` to create a new note
- [ ] Press \`Ctrl + K\` to search notes or open the Command Palette
- [ ] Try dragging and dropping an image or audio file into this note
- [ ] Delete this note when you are ready to build your workspace

---

### 💡 Formatting Showcase (Markdown & Features)
* **Bold text** with \`Ctrl + B\` and *italic text* with \`Ctrl + I\`
* Interactive task lists with \`- [ ]\`
* Highlight important phrases or write \`inline code\`
* Connect your thoughts with backlinks: \`[[Note Title]]\`
* Organize with tags anywhere: \`#welcome\` \`#getting-started\`

\`\`\`javascript
// Code block with syntax highlighting
function greet(name) {
  return \`Hello, \${name}! Welcome to Luno Note\`;
}
\`\`\`

> 💡 **Tip:** Right-click any note in the sidebar to pin it, customize its icon, or lock it with a PIN.

---

### ⌨️ Handy Shortcuts
| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **New Note** | \`Ctrl + N\` | \`Cmd + N\` |
| **Quick Search / Command Palette** | \`Ctrl + K\` / \`Ctrl + P\` | \`Cmd + K\` / \`Cmd + P\` |
| **Toggle Sidebar** | \`Ctrl + \\\` | \`Cmd + \\\` |
| **Bold** | \`Ctrl + B\` | \`Cmd + B\` |
| **Italic** | \`Ctrl + I\` | \`Cmd + I\` |
| **Save** | \`Ctrl + S\` (Auto-saved) | \`Cmd + S\` |

---

> 🚀 **Ready to go?** Start building your second brain today!
`;
}
