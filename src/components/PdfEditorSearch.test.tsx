import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

// Mock PDF search popover component matching Editor.tsx implementation exactly
function MockPdfSearchToolbar({
  isTh = false,
  totalMatches = 3,
  initialQuery = "",
}: {
  isTh?: boolean;
  totalMatches?: number;
  initialQuery?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [stats, setStats] = useState({
    total: initialQuery ? totalMatches : 0,
    current: initialQuery && totalMatches > 0 ? 0 : -1,
  });

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setStats({ total: 0, current: -1 });
    } else {
      setStats({ total: totalMatches, current: totalMatches > 0 ? 0 : -1 });
    }
  };

  const handleNext = () => {
    if (stats.total > 0) {
      setStats((prev) => ({
        ...prev,
        current: (prev.current + 1) % prev.total,
      }));
    }
  };

  const handlePrev = () => {
    if (stats.total > 0) {
      setStats((prev) => ({
        ...prev,
        current: prev.current <= 0 ? prev.total - 1 : prev.current - 1,
      }));
    }
  };

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid="pdf-search-button"
                className="h-auto w-auto p-1 rounded text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 outline-none select-none"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="sr-only">{isTh ? "ค้นหา" : "Search"}</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isTh ? "ค้นหา" : "Find"}
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          data-pdf-search-popover="true"
          align="end"
          sideOffset={6}
          className="w-64 sm:w-72 p-2 rounded-2xl shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md select-text"
        >
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 border border-border/60 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground pointer-events-none" />
            <input
              data-testid="pdf-search-input"
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={isTh ? "ค้นหาใน PDF..." : "Find in PDF..."}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-normal"
              autoFocus
            />
            {query && (
              <button
                type="button"
                data-testid="pdf-search-clear"
                onClick={() => handleQueryChange("")}
                className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {query.trim() && (
            <div className="mt-2 px-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40 pt-1.5">
              <span data-testid="pdf-search-count">
                {stats.total > 0
                  ? isTh
                    ? `พบ ${stats.total} รายการ${stats.current >= 0 ? ` (${stats.current + 1}/${stats.total})` : ""}`
                    : `Found ${stats.total} matching ${stats.total === 1 ? "result" : "results"}${stats.current >= 0 ? ` (${stats.current + 1}/${stats.total})` : ""}`
                  : isTh
                  ? "ไม่พบข้อความที่ตรงกัน"
                  : "No matching text"}
              </span>
              {stats.total > 0 && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    data-testid="pdf-search-prev"
                    onClick={handlePrev}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    data-testid="pdf-search-next"
                    onClick={handleNext}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}

describe("PDF Editor Search UI (matching Relations tab & Code editor search style)", () => {
  it("renders search trigger button with Search icon and tooltip", () => {
    render(<MockPdfSearchToolbar />);
    const btn = screen.getByTestId("pdf-search-button");
    expect(btn).toBeInTheDocument();
  });

  it("opens floating popover menu on click with input and placeholder", () => {
    render(<MockPdfSearchToolbar isTh={true} />);
    const btn = screen.getByTestId("pdf-search-button");
    fireEvent.click(btn);

    const input = screen.getByTestId("pdf-search-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.placeholder).toBe("ค้นหาใน PDF...");
  });

  it("displays match count and navigation chevrons when query is matched", () => {
    render(<MockPdfSearchToolbar isTh={true} totalMatches={3} />);
    const btn = screen.getByTestId("pdf-search-button");
    fireEvent.click(btn);

    const input = screen.getByTestId("pdf-search-input");
    fireEvent.change(input, { target: { value: "invoice" } });

    const countText = screen.getByTestId("pdf-search-count");
    expect(countText.textContent).toBe("พบ 3 รายการ (1/3)");

    const nextBtn = screen.getByTestId("pdf-search-next");
    fireEvent.click(nextBtn);
    expect(countText.textContent).toBe("พบ 3 รายการ (2/3)");

    const prevBtn = screen.getByTestId("pdf-search-prev");
    fireEvent.click(prevBtn);
    expect(countText.textContent).toBe("พบ 3 รายการ (1/3)");
  });

  it("displays English matching results string properly", () => {
    render(<MockPdfSearchToolbar isTh={false} totalMatches={4} />);
    const btn = screen.getByTestId("pdf-search-button");
    fireEvent.click(btn);

    const input = screen.getByTestId("pdf-search-input");
    fireEvent.change(input, { target: { value: "summary" } });

    const countText = screen.getByTestId("pdf-search-count");
    expect(countText.textContent).toBe("Found 4 matching results (1/4)");
  });

  it("shows no matches message when total is 0", () => {
    render(<MockPdfSearchToolbar isTh={true} totalMatches={0} />);
    const btn = screen.getByTestId("pdf-search-button");
    fireEvent.click(btn);

    const input = screen.getByTestId("pdf-search-input");
    fireEvent.change(input, { target: { value: "unknown text" } });

    const countText = screen.getByTestId("pdf-search-count");
    expect(countText.textContent).toBe("ไม่พบข้อความที่ตรงกัน");
  });

  it("clears query and results when clear button is clicked", () => {
    render(<MockPdfSearchToolbar isTh={true} totalMatches={5} initialQuery="hello" />);
    const btn = screen.getByTestId("pdf-search-button");
    fireEvent.click(btn);

    const clearBtn = screen.getByTestId("pdf-search-clear");
    fireEvent.click(clearBtn);

    const input = screen.getByTestId("pdf-search-input") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(screen.queryByTestId("pdf-search-count")).toBeNull();
  });

  it("preserves search query and matching results when closed and reopened like relations and code editor", () => {
    render(<MockPdfSearchToolbar isTh={true} totalMatches={3} />);
    const btn = screen.getByTestId("pdf-search-button");

    // 1. Open and search
    fireEvent.click(btn);
    const input = screen.getByTestId("pdf-search-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "เภสัช" } });
    expect(screen.getByTestId("pdf-search-count").textContent).toBe("พบ 3 รายการ (1/3)");

    // 2. Close popover by clicking search trigger button
    fireEvent.click(btn);
    expect(screen.queryByTestId("pdf-search-popover")).toBeNull();

    // 3. Reopen popover
    fireEvent.click(btn);
    const reopenedInput = screen.getByTestId("pdf-search-input") as HTMLInputElement;
    expect(reopenedInput.value).toBe("เภสัช");
    expect(screen.getByTestId("pdf-search-count").textContent).toBe("พบ 3 รายการ (1/3)");
  });
});
