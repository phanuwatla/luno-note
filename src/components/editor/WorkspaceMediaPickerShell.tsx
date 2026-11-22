import React from "react";
import { Folder, LayoutGrid, List, Loader2, Paperclip, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";

export interface MediaPickerItemBase {
  id: string;
  fileName: string;
  folderPath: string;
}

export interface WorkspaceMediaPickerShellProps<T extends MediaPickerItemBase> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "list" | "grid";
  onToggleViewMode: () => void;
  activeTab: "attachments" | "all";
  onChangeTab: (tab: "attachments" | "all") => void;
  attachmentsCount: number;
  workspaceCount: number;
  allTabIcon: React.ReactNode;
  allTabLabel: string;
  isLoading: boolean;
  hasAnyScanned: boolean;
  displayedItems: T[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onConfirmItem: (item: T) => void;
  emptyIcon: React.ReactNode;
  emptyAttachmentsLabel: string;
  emptyWorkspaceLabel: string;
  confirmLabel: string;
  getFolderDisplay: (folderPath: string) => string;
  renderThumbnail: (item: T, isListMode: boolean) => React.ReactNode;
}

/**
 * Shared Dialog shell for WorkspaceImagePickerDialog and WorkspaceVideoPickerDialog (LN-REUSE-01 / LN-MDL-01).
 */
export function WorkspaceMediaPickerShell<T extends MediaPickerItemBase>({
  isOpen,
  onClose,
  title,
  description,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleViewMode,
  activeTab,
  onChangeTab,
  attachmentsCount,
  workspaceCount,
  allTabIcon,
  allTabLabel,
  isLoading,
  hasAnyScanned,
  displayedItems,
  selectedItemId,
  onSelectItem,
  onConfirmItem,
  emptyIcon,
  emptyAttachmentsLabel,
  emptyWorkspaceLabel,
  confirmLabel,
  getFolderDisplay,
  renderThumbnail,
}: WorkspaceMediaPickerShellProps<T>) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 min-w-0">
          {/* Search bar & View Mode Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const target = displayedItems.find((i) => i.id === selectedItemId) || displayedItems[0];
                    if (target) onConfirmItem(target);
                  }
                }}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors min-w-0"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleViewMode}
                  className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                >
                  {viewMode === "list" ? (
                    <LayoutGrid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {viewMode === "list" ? t("launcher.gridView") : t("launcher.listView")}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {viewMode === "list" ? t("launcher.gridView") : t("launcher.listView")}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Segmented Pill Toggle Switcher */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold select-none border border-border/40 min-w-0">
            <button
              type="button"
              onClick={() => onChangeTab("attachments")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "attachments"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("editor.tabAttachments")} ({attachmentsCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTab("all")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === "all"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {allTabIcon}
              <span className="truncate">
                {allTabLabel} ({workspaceCount})
              </span>
            </button>
          </div>

          {/* Grid / List Container */}
          <div className="max-h-[260px] min-h-[140px] overflow-y-auto rounded-xl border border-border bg-muted/10 p-2 min-w-0">
            {isLoading && !hasAnyScanned ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                <p className="text-xs">{t("common.loading")}</p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-1.5">
                {emptyIcon}
                <p className="text-xs">
                  {activeTab === "attachments" ? emptyAttachmentsLabel : emptyWorkspaceLabel}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-2 min-w-0">
                {displayedItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      onDoubleClick={() => onConfirmItem(item)}
                      className={`group relative flex flex-col rounded-xl border p-1.5 text-left cursor-pointer transition-all duration-150 min-w-0 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted/30 border border-border/30 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        {renderThumbnail(item, false)}
                      </div>
                      <div className="mt-1 space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors min-w-0">
                          {item.fileName}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate leading-none min-w-0">
                          <Folder className="h-2.5 w-2.5 shrink-0 opacity-70" />
                          <span className="truncate min-w-0">{getFolderDisplay(item.folderPath)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1 min-w-0">
                {displayedItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      onDoubleClick={() => onConfirmItem(item)}
                      className={`group flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all duration-150 cursor-pointer min-w-0 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted/30 border border-border/30 shrink-0 flex items-center justify-center relative">
                          {renderThumbnail(item, true)}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2 overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors min-w-0">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate min-w-0">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border/60 min-w-0 truncate">
                              <Folder className="h-2.5 w-2.5 shrink-0 opacity-70" />
                              <span className="truncate min-w-0">{getFolderDisplay(item.folderPath)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {!isSelected && (
                        <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {confirmLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!selectedItemId}
            onClick={() => {
              const target = displayedItems.find((i) => i.id === selectedItemId);
              if (target) onConfirmItem(target);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WorkspaceMediaPickerShell;
