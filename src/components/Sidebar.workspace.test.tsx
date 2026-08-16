import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("Sidebar workspace folder rendering when empty", () => {
  it("renders workspace folder name when openedFolderName is provided and notes are empty", () => {
    render(
      <TooltipProvider>
        <AppSettingsProvider>
          <Sidebar
            notes={[]}
            folderPaths={[]}
            activeNoteId={null}
            openedFolderName="My Test Workspace"
            onSelect={() => {}}
            onCreate={() => {}}
          />
        </AppSettingsProvider>
      </TooltipProvider>
    );

    // The root folder name "My Test Workspace" should be visible in the workspace tree
    expect(screen.getByText("My Test Workspace")).toBeDefined();
  });
});
