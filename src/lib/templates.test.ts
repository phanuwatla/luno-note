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
    expect(basicHtml).toContain("<nav");
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

    // 9. Invoice & Receipt
    const invoiceHtml = getNoteTemplateContent("invoice", "en", "html");
    expect(invoiceHtml).toContain("INVOICE");
    expect(invoiceHtml).toContain("Invoice No:");
    expect(invoiceHtml).toContain("Subtotal:");

    // 10. Pricing Plans
    const pricingHtml = getNoteTemplateContent("pricing-table", "en", "html");
    expect(pricingHtml).toContain("Simple, Transparent Pricing");
    expect(pricingHtml).toContain("Starter");
    expect(pricingHtml).toContain("Professional");

    // 11. Event Invitation & RSVP
    const eventHtml = getNoteTemplateContent("event-invite", "en", "html");
    expect(eventHtml).toContain("Annual Tech & Innovation Summit");
    expect(eventHtml).toContain("Reserve Your Seat");
    expect(eventHtml).toContain("Agenda & Highlights");

    // 12. Restaurant Menu
    const menuHtml = getNoteTemplateContent("restaurant-menu", "en", "html");
    expect(menuHtml).toContain("Luno Bistro & Cafe");
    expect(menuHtml).toContain("Signature Dishes");
    expect(menuHtml).toContain("Specialty Coffee & Drinks");

    // 13. FAQ & Help Center
    const faqHtml = getNoteTemplateContent("faq-page", "en", "html");
    expect(faqHtml).toContain("Help Center & FAQ");
    expect(faqHtml).toContain("Frequently Asked Questions");
    expect(faqHtml).toContain("How does local note storage and encryption work?");
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

    // 5. Journal
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

    // 9. Lecture Notes
    const lectureTxt = getNoteTemplateContent("lecture-notes", "en", "plain");
    expect(lectureTxt).toContain("Lecture Notes");
    expect(lectureTxt).toContain("Course & Lecture Info");
    expect(lectureTxt).toContain("Key Concepts & Takeaways");

    const lectureTxtTh = getNoteTemplateContent("lecture-notes", "th", "plain");
    expect(lectureTxtTh).toContain("บันทึกการเรียน / เลกเชอร์");
    expect(lectureTxtTh).toContain("ประเด็นสำคัญประจำคาบ");

    // 10. Server Config
    const serverTxt = getNoteTemplateContent("server-config", "en", "plain");
    expect(serverTxt).toContain("SERVER CONFIGURATION & ENVIRONMENT SPEC");
    expect(serverTxt).toContain("Ports & Active Services");
    expect(serverTxt).toContain("Key Environment Variables");

    // 11. Incident Report
    const incidentTxt = getNoteTemplateContent("incident-report", "en", "plain");
    expect(incidentTxt).toContain("INCIDENT POSTMORTEM & ROOT CAUSE REPORT");
    expect(incidentTxt).toContain("Root Cause Analysis (RCA)");

    // 12. Shopping List
    const shoppingTxt = getNoteTemplateContent("shopping-list", "en", "plain");
    expect(shoppingTxt).toContain("Shopping & Grocery List");
    expect(shoppingTxt).toContain("Produce & Groceries");

    // 13. Recipe Plain Text
    const recipeTxt = getNoteTemplateContent("recipe-txt", "en", "plain");
    expect(recipeTxt).toContain("Recipe: [Dish Name]");
    expect(recipeTxt).toContain("Ingredients");
    expect(recipeTxt).toContain("Instructions");

    const recipeTxtTh = getNoteTemplateContent("recipe-txt", "th", "plain");
    expect(recipeTxtTh).toContain("สูตรอาหาร: [ชื่อเมนูอาหาร]");
    expect(recipeTxtTh).toContain("ขั้นตอนการทำ (Step-by-Step Instructions)");
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

    // 3. Cornell Notes
    const cornell = getNoteTemplateContent("cornell-notes", "en", "markdown");
    expect(cornell).toContain("Cornell Notes:");
    expect(cornell).toContain("Cue Column & Key Questions");
    expect(cornell).toContain("Summary");

    const cornellTh = getNoteTemplateContent("cornell-notes", "th", "markdown");
    expect(cornellTh).toContain("บันทึกการเรียนแบบคอร์เนลล์");
    expect(cornellTh).toContain("คำถามและประเด็นสำคัญ (Cue Column)");

    // 4. Content Planner
    const contentPlanner = getNoteTemplateContent("content-planner", "en", "markdown");
    expect(contentPlanner).toContain("Content & Video Script Planner");
    expect(contentPlanner).toContain("The Hook");
    expect(contentPlanner).toContain("Production & Publishing Checklist");

    // 5. API Doc
    const apiDoc = getNoteTemplateContent("api-doc", "en", "markdown");
    expect(apiDoc).toContain("API Endpoint Specification");
    expect(apiDoc).toContain("Request Headers");
    expect(apiDoc).toContain("Response Status Codes");

    // 6. Habit Tracker
    const habit = getNoteTemplateContent("habit-tracker", "en", "markdown");
    expect(habit).toContain("Weekly Habit & Wellness Tracker");
    expect(habit).toContain("Daily Habit Matrix");

    // 7. Monthly Budget
    const budget = getNoteTemplateContent("monthly-budget", "en", "markdown");
    expect(budget).toContain("Monthly Budget & Financial Planner");
    expect(budget).toContain("Total Income");
    expect(budget).toContain("Fixed Expenses");

    // 8. Travel Itinerary
    const travel = getNoteTemplateContent("travel-itinerary", "en", "markdown");
    expect(travel).toContain("Travel Itinerary & Trip Planner");
    expect(travel).toContain("Day-by-Day Itinerary");
    expect(travel).toContain("Packing & Essentials Checklist");
  });

  it("resolves default template for different extensions correctly", () => {
    const settings = {
      defaultTemplateMd: "cornell-notes" as const,
      defaultTemplateTxt: "lecture-notes" as const,
      defaultTemplateHtml: "invoice" as const,
      defaultNoteTemplate: "daily" as const,
    };

    expect(getDefaultTemplateForExtension(settings, "test.md")).toBe("cornell-notes");
    expect(getDefaultTemplateForExtension(settings, "lecture.txt")).toBe("lecture-notes");
    expect(getDefaultTemplateForExtension(settings, "invoice.html")).toBe("invoice");
    expect(getDefaultTemplateForExtension(settings, "website.htm")).toBe("invoice");
  });

  it("has metadata and pack-specific icons for all templates", () => {
    // Markdown
    expect(NOTE_TEMPLATE_METADATA["daily"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["todo"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["meeting"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["project"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["study"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["bug"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["weekly-review"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["book-notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["cornell-notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["content-planner"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["api-doc"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["habit-tracker"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["monthly-budget"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["travel-itinerary"]).toBeDefined();

    // HTML
    expect(NOTE_TEMPLATE_METADATA["basic-website"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["landing-page"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["portfolio"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["blog"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["dashboard"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["documentation"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["link-tree"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["invoice"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["pricing-table"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["event-invite"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["restaurant-menu"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["faq-page"]).toBeDefined();

    // Plain Text
    expect(NOTE_TEMPLATE_METADATA["notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["journal"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["readme"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["changelog"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["work-log"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["lecture-notes"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["server-config"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["incident-report"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["shopping-list"]).toBeDefined();
    expect(NOTE_TEMPLATE_METADATA["recipe-txt"]).toBeDefined();

    expect(NOTE_TEMPLATE_METADATA["blank"]).toBeDefined();
  });

  it("resolves template icons based on active icon pack", () => {
    expect(getTemplateIcon("cornell-notes", "lucide")).toBe("lucide:GraduationCap");
    expect(getTemplateIcon("cornell-notes", "tabler")).toBe("tabler:IconSchool");
    expect(getTemplateIcon("cornell-notes", "phosphor")).toBe("phosphor:GraduationCap");

    expect(getTemplateIcon("invoice", "lucide")).toBe("lucide:Receipt");
    expect(getTemplateIcon("invoice", "tabler")).toBe("tabler:IconReceipt");
    expect(getTemplateIcon("invoice", "phosphor")).toBe("phosphor:Receipt");

    expect(getTemplateIcon("server-config", "lucide")).toBe("lucide:Server");
    expect(getTemplateIcon("server-config", "tabler")).toBe("tabler:IconServer");
    expect(getTemplateIcon("server-config", "phosphor")).toBe("phosphor:HardDrives");
  });
});

