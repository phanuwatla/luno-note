import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsNewView from "./WhatsNewView";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { APP_VERSION } from "@/lib/appVersion";

describe("WhatsNewView Component", () => {
  it("renders release notes and version title correctly", () => {
    render(
      <AppSettingsProvider>
        <WhatsNewView />
      </AppSettingsProvider>
    );
    expect(screen.getAllByText(new RegExp(`Luno Note v${APP_VERSION}`)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/HTML/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Tooltip/i).length).toBeGreaterThanOrEqual(1);
  });

  it("calls onOpenHelp when help button is clicked", () => {
    const handleHelp = vi.fn();
    render(
      <AppSettingsProvider>
        <WhatsNewView onOpenHelp={handleHelp} />
      </AppSettingsProvider>
    );
    const helpBtn = screen.getByRole("button", { name: /help|คู่มือ/i });
    fireEvent.click(helpBtn);
    expect(handleHelp).toHaveBeenCalledWith("features");
  });

  it("calls onOpenSettings when settings button is clicked", () => {
    const handleSettings = vi.fn();
    render(
      <AppSettingsProvider>
        <WhatsNewView onOpenSettings={handleSettings} />
      </AppSettingsProvider>
    );
    const settingsBtn = screen.getByRole("button", { name: /settings|ตั้งค่า/i });
    fireEvent.click(settingsBtn);
    expect(handleSettings).toHaveBeenCalledWith("about");
  });

  it("renders latest GitHub release button", () => {
    render(
      <AppSettingsProvider>
        <WhatsNewView />
      </AppSettingsProvider>
    );
    const gitBtn = screen.getByRole("button", { name: /github release|เปิด github release/i });
    expect(gitBtn).toBeInTheDocument();
  });

  it("calls onOpenWebTab when latest GitHub release and author link are clicked", () => {
    const handleOpenWebTab = vi.fn();
    render(
      <AppSettingsProvider>
        <WhatsNewView onOpenWebTab={handleOpenWebTab} />
      </AppSettingsProvider>
    );

    const gitBtn = screen.getByRole("button", { name: /github release|เปิด github release/i });
    fireEvent.click(gitBtn);
    expect(handleOpenWebTab).toHaveBeenCalledWith(
      expect.stringContaining("releases/latest"),
      expect.any(String)
    );

    const authorLink = screen.getByText(/Made by phanuwatla/i);
    fireEvent.click(authorLink);
    expect(handleOpenWebTab).toHaveBeenCalledWith(
      expect.stringContaining("github.com/phanuwatla"),
      expect.any(String)
    );
  });
});

import SettingsTabView from "./SettingsTabView";
import HelpTabView from "./HelpTabView";

describe("Clickable Version Number & Author in Settings & Help", () => {
  it("SettingsTabView calls onOpenWhatsNew and onOpenWebTab", () => {
    const handleOpenWhatsNew = vi.fn();
    const handleOpenWebTab = vi.fn();
    render(
      <AppSettingsProvider>
        <SettingsTabView
          initialCategory="about"
          onOpenWhatsNew={handleOpenWhatsNew}
          onOpenWebTab={handleOpenWebTab}
        />
      </AppSettingsProvider>
    );

    const versionBtn = screen.getByRole("button", { name: new RegExp(`Version ${APP_VERSION}`) });
    expect(versionBtn).toBeInTheDocument();
    expect(versionBtn.className).toContain("text-xs");
    expect(versionBtn.className).toContain("text-muted-foreground");
    expect(versionBtn.className).toContain("hover:text-foreground");
    expect(versionBtn.className).toContain("cursor-pointer");

    fireEvent.click(versionBtn);
    expect(handleOpenWhatsNew).toHaveBeenCalledTimes(1);

    const authorLink = screen.getByText(/Made by phanuwatla/i);
    fireEvent.click(authorLink);
    expect(handleOpenWebTab).toHaveBeenCalledWith(
      expect.stringContaining("github.com/phanuwatla"),
      expect.any(String)
    );
  });

  it("HelpTabView calls onOpenWhatsNew and onOpenWebTab", () => {
    const handleOpenWhatsNew = vi.fn();
    const handleOpenWebTab = vi.fn();
    render(
      <AppSettingsProvider>
        <HelpTabView
          initialCategory="about"
          onOpenWhatsNew={handleOpenWhatsNew}
          onOpenWebTab={handleOpenWebTab}
        />
      </AppSettingsProvider>
    );

    const versionBtn = screen.getByRole("button", { name: new RegExp(`Version ${APP_VERSION}`) });
    expect(versionBtn).toBeInTheDocument();
    expect(versionBtn.className).toContain("text-xs");
    expect(versionBtn.className).toContain("text-muted-foreground");
    expect(versionBtn.className).toContain("hover:text-foreground");
    expect(versionBtn.className).toContain("cursor-pointer");

    fireEvent.click(versionBtn);
    expect(handleOpenWhatsNew).toHaveBeenCalledTimes(1);

    const authorLink = screen.getByText(/Made by phanuwatla/i);
    fireEvent.click(authorLink);
    expect(handleOpenWebTab).toHaveBeenCalledWith(
      expect.stringContaining("github.com/phanuwatla"),
      expect.any(String)
    );
  });
});
