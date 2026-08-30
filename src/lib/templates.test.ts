import { describe, it, expect } from "vitest";
import { getNoteTemplateContent, getDefaultTemplateForExtension, NOTE_TEMPLATE_METADATA, getTemplateIcon } from "./templates";

describe("templates.ts", () => {
  it("generates 6 HTML templates correctly", () => {
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
  });

  it("generates 6 Plain Text templates correctly", () => {
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

    // 5. Journal
    const journalTxt = getNoteTemplateContent("journal", "en", "plain");
    expect(journalTxt).toContain("Daily Journal");
    expect(journalTxt).toContain("Highlights & Gratitude");

    // 6. README
    const readmeTxt = getNoteTemplateContent("readme", "en", "plain");
    expect(readmeTxt).toContain("PROJECT NAME / REPOSITORY README");
    expect(readmeTxt).toContain("Overview");
    expect(readmeTxt).toContain("Installation & Setup");
    expect(readmeTxt).toContain("Usage");
    expect(readmeTxt).toContain("File Structure");
  });

  it("resolves default template for different extensions correctly", () => {
    const settings = {
      defaultTemplateMd: "daily" as const,
      defaultTemplateTxt: "readme" as const,
      defaultTemplateHtml: "landing-page" as const,
      defaultNoteTemplate: "daily" as const,
    };

    expect(getDefaultTemplateForExtension(settings, "test.md")).toBe("daily");
    expect(getDefaultTemplateForExtension(settings, "my-notes.txt")).toBe("readme");
    expect(getDefaultTemplateForExtension(settings, "index.html")).toBe("landing-page");
    expect(getDefaultTemplateForExtension(settings, "website.htm")).toBe("landing-page");
  });

  it("has metadata and pack-specific icons for all templates", () => {
    expect(NOTE_TEMPLATE_METADATA["basic-website"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["landing-page"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["portfolio"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["blog"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["dashboard"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["journal"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["readme"]).toBeDefined();
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
