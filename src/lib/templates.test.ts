import { describe, it, expect } from "vitest";
import { getNoteTemplateContent, getDefaultTemplateForExtension, NOTE_TEMPLATE_METADATA, getTemplateIcon } from "./templates";

describe("templates.ts", () => {
  it("generates all HTML templates correctly", () => {
    // 1. Blank HTML
    const blankHtml = getNoteTemplateContent("blank", "en", "html");
    expect(blankHtml).toContain("<!DOCTYPE html>");
    expect(blankHtml).toContain("<h1>Hello, World!</h1>");

    // 2. Basic Website
    const basicHtml = getNoteTemplateContent("basic-website", "en", "html");
    expect(basicHtml).toContain("<header>");
    expect(basicHtml).toContain("<nav>");
    expect(basicHtml).toContain("<main>");
    expect(basicHtml).toContain("<footer>");

    // 3. Landing Page
    const landingHtml = getNoteTemplateContent("landing-page", "en", "html");
    expect(landingHtml).toContain("hero");
    expect(landingHtml).toContain("features");
    expect(landingHtml).toContain("Start Free Trial");

    // 4. Portfolio
    const portfolioHtml = getNoteTemplateContent("portfolio", "en", "html");
    expect(portfolioHtml).toContain("Featured Projects");
    expect(portfolioHtml).toContain("Skills & Technologies");

    // 5. Blog
    const blogHtml = getNoteTemplateContent("blog", "en", "html");
    expect(blogHtml).toContain("<article");
    expect(blogHtml).toContain("blockquote");

    // 6. Dashboard
    const dashboardHtml = getNoteTemplateContent("dashboard", "en", "html");
    expect(dashboardHtml).toContain("Dashboard Overview");
    expect(dashboardHtml).toContain("Recent Transactions");
    expect(dashboardHtml).toContain("Total Revenue");

    // 7. Documentation
    const docHtml = getNoteTemplateContent("documentation", "en", "html");
    expect(docHtml).toContain("Developer Documentation");
    expect(docHtml).toContain("Getting Started");
    expect(docHtml).toContain("API Endpoints");

    // 8. Link in Bio
    const linksHtml = getNoteTemplateContent("link-tree", "en", "html");
    expect(linksHtml).toContain("My Links");
    expect(linksHtml).toContain("Visit My Portfolio Website");
    expect(linksHtml).toContain("avatar");
  });

  it("generates all Plain Text templates correctly", () => {
    // 1. Blank Text
    const blankTxt = getNoteTemplateContent("blank", "en", "plain");
    expect(blankTxt).toBe("");

    // 2. Notes
    const notesTxt = getNoteTemplateContent("notes", "en", "plain");
    expect(notesTxt).toContain("Quick Notes");
    expect(notesTxt).toContain("Date:");

    // 3. To-Do List
    const todoTxt = getNoteTemplateContent("todo", "en", "plain");
    expect(todoTxt).toContain("Task & To-Do List");
    expect(todoTxt).toContain("High Priority");

    // 4. Meeting Notes
    const meetingTxt = getNoteTemplateContent("meeting", "en", "plain");
    expect(meetingTxt).toContain("Meeting Notes");
    expect(meetingTxt).toContain("Attendees");
    expect(meetingTxt).toContain("Action Items");

    // 5. Journal (Fix verified)
    const journalTxt = getNoteTemplateContent("journal", "en", "plain");
    expect(journalTxt).toContain("Daily Journal");
    expect(journalTxt).toContain("Highlights & Gratitude");
    expect(journalTxt).toContain("Habits & Wellbeing");

    const journalTxtTh = getNoteTemplateContent("journal", "th", "plain");
    expect(journalTxtTh).toContain("ไดอารี่และบันทึกประจำวัน");
    expect(journalTxtTh).toContain("Highlights & Gratitude");

    // 6. Work Log
    const workLogTxt = getNoteTemplateContent("work-log", "en", "plain");
    expect(workLogTxt).toContain("Work Log");
    expect(workLogTxt).toContain("Time & Activity Log");
    expect(workLogTxt).toContain("Completed Tasks");

    // 7. README
    const readmeTxt = getNoteTemplateContent("readme", "en", "plain");
    expect(readmeTxt).toContain("PROJECT NAME / REPOSITORY README");
    expect(readmeTxt).toContain("Overview");
    expect(readmeTxt).toContain("Installation & Setup");
    expect(readmeTxt).toContain("Usage");
    expect(readmeTxt).toContain("File Structure");

    // 8. Changelog
    const changelogTxt = getNoteTemplateContent("changelog", "en", "plain");
    expect(changelogTxt).toContain("CHANGELOG");
    expect(changelogTxt).toContain("[Unreleased]");
    expect(changelogTxt).toContain("[1.0.0]");
  });

  it("generates Markdown templates correctly including new additions", () => {
    // 1. Weekly Review
    const weeklyReview = getNoteTemplateContent("weekly-review", "en", "markdown");
    expect(weeklyReview).toContain("Weekly Review");
    expect(weeklyReview).toContain("Wins & Highlights");
    expect(weeklyReview).toContain("Top 3 Priorities for Next Week");

    const weeklyReviewTh = getNoteTemplateContent("weekly-review", "th", "markdown");
    expect(weeklyReviewTh).toContain("สรุปประจำสัปดาห์");
    expect(weeklyReviewTh).toContain("ผลงานและความสำเร็จในสัปดาห์นี้");

    // 2. Book Notes
    const bookNotes = getNoteTemplateContent("book-notes", "en", "markdown");
    expect(bookNotes).toContain("Book Notes:");
    expect(bookNotes).toContain("Key Takeaways & Core Concepts");
    expect(bookNotes).toContain("Favorite Quotes");

    const bookNotesTh = getNoteTemplateContent("book-notes", "th", "markdown");
    expect(bookNotesTh).toContain("สรุปหนังสือ:");
    expect(bookNotesTh).toContain("สาระสำคัญและแนวคิดหลัก");
  });

  it("resolves default template for different extensions correctly", () => {
    const settings = {
      defaultTemplateMd: "weekly-review" as const,
      defaultTemplateTxt: "changelog" as const,
      defaultTemplateHtml: "documentation" as const,
      defaultNoteTemplate: "daily" as const,
    };

    expect(getDefaultTemplateForExtension(settings, "test.md")).toBe("weekly-review");
    expect(getDefaultTemplateForExtension(settings, "CHANGELOG.txt")).toBe("changelog");
    expect(getDefaultTemplateForExtension(settings, "docs.html")).toBe("documentation");
    expect(getDefaultTemplateForExtension(settings, "website.htm")).toBe("documentation");
  });

  it("has metadata and pack-specific icons for all templates", () => {
    expect(NOTE_TEMPLATE_METADATA["basic-website"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["landing-page"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["portfolio"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["blog"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["dashboard"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["documentation"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["link-tree"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["journal"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["readme"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["changelog"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["work-log"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["weekly-review"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["book-notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["blank"]).toBeDefined();
  });

  it("resolves template icons based on active icon pack", () => {
    expect(getTemplateIcon("daily", "lucide")).toBe("lucide:Calendar");
    expect(getTemplateIcon("daily", "tabler")).toBe("tabler:IconCalendar");
    expect(getTemplateIcon("daily", "phosphor")).toBe("phosphor:Calendar");

    expect(getTemplateIcon("todo", "lucide")).toBe("lucide:CheckSquare");
    expect(getTemplateIcon("todo", "tabler")).toBe("tabler:IconSquareCheck");
    expect(getTemplateIcon("todo", "phosphor")).toBe("phosphor:CheckSquare");

    expect(getTemplateIcon("landing-page", "lucide")).toBe("lucide:Rocket");
    expect(getTemplateIcon("landing-page", "tabler")).toBe("tabler:IconRocket");
    expect(getTemplateIcon("landing-page", "phosphor")).toBe("phosphor:Rocket");

    const dailyMdTabler = getNoteTemplateContent("daily", "en", "markdown", "YYYY-MM-DD", "24h", "tabler");
    expect(dailyMdTabler).toContain('icon: "tabler:IconCalendar"');

    const dailyMdPhosphor = getNoteTemplateContent("daily", "en", "markdown", "YYYY-MM-DD", "24h", "phosphor");
    expect(dailyMdPhosphor).toContain('icon: "phosphor:Calendar"');
  });
});

