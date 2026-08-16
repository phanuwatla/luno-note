import { describe, expect, it } from "vitest";
import { preprocessMarkdownForEditor } from "@/components/Editor";

describe("First line paragraph indentation preservation", () => {
  it("should convert 4-space indented first line into em-space indented line during preprocessing", () => {
    const input = "    ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์ โลกตะวันตก...";
    const output = preprocessMarkdownForEditor(input);
    expect(output).toBe("\u2003\u2003ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์ โลกตะวันตก...");
  });

  it("should convert 2-space indented line into em-space indented line during preprocessing", () => {
    const input = "  ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...";
    const output = preprocessMarkdownForEditor(input);
    expect(output).toBe("\u2003\u2003ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...");
  });

  it("should preserve em-space indented line during preprocessing", () => {
    const input = "\u2003\u2003ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...";
    const output = preprocessMarkdownForEditor(input);
    expect(output).toBe("\u2003\u2003ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...");
  });

  it("should convert tab indented line into em-space indented line during preprocessing", () => {
    const input = "\tต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...";
    const output = preprocessMarkdownForEditor(input);
    expect(output).toBe("\u2003\u2003ต่อเนื่องจากยุคกลางจนถึงยุคเรเนสซองส์...");
  });
});
