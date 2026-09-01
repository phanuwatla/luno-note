import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Folder, FolderPlus, FolderOpen, FolderSearch, Loader2, ArrowLeft, RefreshCw, AlertTriangle, ShieldAlert, Cloud, CloudOff, Link2, Unlink2, LayoutGrid, List } from "lucide-react";
import { GoogleDriveIcon } from "@/components/icons/GoogleDriveIcon";
import lunoLogo from "@/assets/luno-logo.png";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { isGoogleDriveConnected, requestGoogleDriveAuth, getStoredTokenInfo } from "@/lib/googleDriveAuth";
import { listCloudWorkspaces, createCloudWorkspace } from "@/lib/googleDriveApi";
import {
  CloudWorkspaceInfo,
  getLocalWorkspaceManifest,
  getAllKnownLocalManifests,
  calculateWorkspaceStatus,
} from "@/lib/workspaceIdentity";

function formatModifiedDate(timeStr?: string, language: string = "en"): string {
  if (!timeStr) return "";
  try {
    const d = new Date(timeStr);
    const locale = language === "th" ? "th-TH" : "en-US";
    const formatted = d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return language === "th" ? formatted : formatted.toUpperCase();
  } catch {
    return "";
  }
}

interface WorkspaceLauncherProps {
  onOpenFolder: () => void | Promise<void>;
  onCreateWorkspace: (parentPath: string, workspaceName: string) => void | Promise<void>;
  onConnectGoogleDrive: () => void | Promise<void>;
  onOpenCloudWorkspace?: (cloudWs: CloudWorkspaceInfo) => void | Promise<void>;
  onCreateCloudWorkspace?: (workspaceName: string) => void | Promise<void>;
  isCreating?: boolean;
}

export const WorkspaceLauncher: React.FC<WorkspaceLauncherProps> = ({
  onOpenFolder,
  onCreateWorkspace,
  onConnectGoogleDrive,
  onOpenCloudWorkspace,
  onCreateCloudWorkspace,
  isCreating = false,
}) => {
  const { t, language } = useTranslation();

  // Local Workspace Creation State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("My Notes");
  const [parentPath, setParentPath] = useState("");
  const [pathError, setPathError] = useState("");

  // Cloud Workspaces View State
  const [showCloudView, setShowCloudView] = useState(false);
  const [cloudWorkspaces, setCloudWorkspaces] = useState<CloudWorkspaceInfo[]>([]);
  const [isLoadingCloudWorkspaces, setIsLoadingCloudWorkspaces] = useState(false);
  const [createCloudDialogOpen, setCreateCloudDialogOpen] = useState(false);
  const [cloudWorkspaceName, setCloudWorkspaceName] = useState("My Notes");
  const [cloudNameError, setCloudNameError] = useState("");
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  // Safety Confirmation & Warning Dialogs State
  const [pendingCloudWs, setPendingCloudWs] = useState<CloudWorkspaceInfo | null>(null);
  const [confirmConnectedOpen, setConfirmConnectedOpen] = useState(false);
  const [confirmDiffersOpen, setConfirmDiffersOpen] = useState(false);

  // Fetch Cloud Workspaces from Google Drive
  const fetchCloudWorkspacesList = useCallback(async () => {
    if (!isGoogleDriveConnected()) return;
    setIsLoadingCloudWorkspaces(true);
    try {
      const tokenInfo = getStoredTokenInfo();
      if (!tokenInfo?.access_token) return;

      const [cloudList, localManifests] = await Promise.all([
        listCloudWorkspaces(tokenInfo.access_token),
        getAllKnownLocalManifests(),
      ]);

      const evaluatedList: CloudWorkspaceInfo[] = cloudList.map((cw) => {
        const status = calculateWorkspaceStatus(cw, localManifests);

        return {
          id: cw.folderId,
          name: cw.name,
          workspaceId: cw.workspaceId,
          status,
          modifiedTime: cw.modifiedTime,
        };
      });

      setCloudWorkspaces(evaluatedList);
    } catch (err) {
      console.warn("Failed to list cloud workspaces:", err);
    } finally {
      setIsLoadingCloudWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    if (showCloudView && isGoogleDriveConnected()) {
      void fetchCloudWorkspacesList();
    }
  }, [showCloudView, fetchCloudWorkspacesList]);

  // Handle clicking Google Drive Sync Option in Launcher
  const handleSignInGoogleDrive = async () => {
    if (isGoogleDriveConnected()) {
      setShowCloudView(true);
      void fetchCloudWorkspacesList();
      return;
    }

    try {
      await requestGoogleDriveAuth();
      if (isGoogleDriveConnected()) {
        setShowCloudView(true);
        void fetchCloudWorkspacesList();
      }
    } catch (err) {
      console.warn("Google Drive sign in canceled or failed:", err);
      if (onConnectGoogleDrive) {
        void onConnectGoogleDrive();
      }
    }
  };

  // Handle selecting a Cloud Workspace
  const handleSelectCloudWorkspace = (cloudWs: CloudWorkspaceInfo) => {
    if (cloudWs.status === "connected") {
      setPendingCloudWs(cloudWs);
      setConfirmConnectedOpen(true);
      return;
    }

    if (cloudWs.status === "differs") {
      setPendingCloudWs(cloudWs);
      setConfirmDiffersOpen(true);
      return;
    }

    // "cloud_only" opens directly without warning
    if (onOpenCloudWorkspace) {
      void onOpenCloudWorkspace(cloudWs);
    }
  };

  // Confirm Editing Cloud Version of Connected Workspace
  const handleConfirmEditConnected = () => {
    if (pendingCloudWs && onOpenCloudWorkspace) {
      void onOpenCloudWorkspace(pendingCloudWs);
    }
    setConfirmConnectedOpen(false);
    setPendingCloudWs(null);
  };

  // Confirm Editing Cloud Version of Differing Workspace
  const handleConfirmEditDiffers = () => {
    if (pendingCloudWs && onOpenCloudWorkspace) {
      void onOpenCloudWorkspace(pendingCloudWs);
    }
    setConfirmDiffersOpen(false);
    setPendingCloudWs(null);
  };

  // Create New Cloud Workspace
  const handleConfirmCreateCloudWorkspace = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cloudWorkspaceName.trim()) {
      setCloudNameError(t("launcher.nameRequired") || "Please enter a workspace name");
      return;
    }
    setCloudNameError("");
    if (onCreateCloudWorkspace) {
      await onCreateCloudWorkspace(cloudWorkspaceName.trim());
      setCreateCloudDialogOpen(false);
    }
  };

  // Local Browse Location Handler
  const handleBrowseLocation = async () => {
    try {
      const electronAPI = (window as unknown as { electronAPI?: Record<string, Function> }).electronAPI;
      if (electronAPI?.selectDirectoryDialog) {
        const selected = await electronAPI.selectDirectoryDialog(
          t("launcher.selectLocationTitle") || "Select Location for Workspace"
        );
        if (selected) {
          setParentPath(selected);
          setPathError("");
        }
      } else if ("showDirectoryPicker" in window) {
        const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        if (handle?.name) {
          setParentPath(handle.name);
          setPathError("");
        }
      }
    } catch (err) {
      console.warn("Browse location canceled or failed:", err);
    }
  };

  const handleConfirmCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!workspaceName.trim()) {
      setPathError(t("launcher.nameRequired") || "Please enter a workspace name");
      return;
    }
    if (!parentPath.trim()) {
      setPathError(t("launcher.locationRequired") || "Please select a storage location");
      return;
    }
    setPathError("");
    await onCreateWorkspace(parentPath.trim(), workspaceName.trim());
    setCreateDialogOpen(false);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-full w-full flex-col items-center justify-center bg-background px-4 py-8 text-foreground select-none">
      <div className="w-full max-w-[540px] flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* App Logo & Title Branding */}
        <div className="flex flex-col items-center text-center gap-2 mb-1">
          <img src={lunoLogo} alt="Luno Logo" className="h-16 w-16 object-contain select-none drop-shadow-sm luno-app-logo" />
          <h1 className="font-krona text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Luno
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Version 1.1.0
          </p>
        </div>

        {/* Cloud Workspaces View */}
        {showCloudView ? (
          <div className="w-full rounded-2xl border border-border/70 bg-card p-2 sm:p-3 shadow-sm divide-y divide-border/60">
            {/* Header with Back button and Refresh */}
            <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShowCloudView(false)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">{t("launcher.back") || t("launcher.backToLocal") || "Back"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t("launcher.back") || t("launcher.backToLocal") || "Back"}</TooltipContent>
                </Tooltip>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <GoogleDriveIcon className="h-4 w-4 shrink-0" />
                    <span>{t("launcher.cloudWorkspacesTitle") || "Your Workspaces"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t("launcher.cloudWorkspacesDesc") || "Select a cloud workspace on Google Drive or create a new one."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setLayoutMode((prev) => (prev === "list" ? "grid" : "list"))}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                    >
                      {layoutMode === "list" ? (
                        <LayoutGrid className="h-3.5 w-3.5" />
                      ) : (
                        <List className="h-3.5 w-3.5" />
                      )}
                      <span className="sr-only">
                        {layoutMode === "list"
                          ? t("launcher.gridView") || "Grid view"
                          : t("launcher.listView") || "List view"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {layoutMode === "list"
                      ? t("launcher.gridView") || "Grid view"
                      : t("launcher.listView") || "List view"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoadingCloudWorkspaces}
                      onClick={() => void fetchCloudWorkspacesList()}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCloudWorkspaces ? "animate-spin" : ""}`} />
                      <span className="sr-only">{t("launcher.refresh") || "Refresh"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t("launcher.refresh") || "Refresh"}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* List / Grid of Cloud Workspaces */}
            <div className="max-h-[340px] overflow-y-auto no-scrollbar">
              {isLoadingCloudWorkspaces ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>{t("launcher.loadingCloudWorkspaces") || "Loading cloud workspaces..."}</span>
                </div>
              ) : cloudWorkspaces.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                  {t("launcher.noCloudWorkspaces") || "No workspaces found on Google Drive. Create your first workspace below."}
                </div>
              ) : layoutMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2.5">
                  {cloudWorkspaces.map((cw) => (
                    <div
                      key={cw.id}
                      onClick={() => handleSelectCloudWorkspace(cw)}
                      className="group relative flex flex-col items-center text-center p-2 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/40 hover:border-primary hover:shadow-xs active:scale-[0.98] transition-all duration-150 cursor-pointer"
                    >
                      {/* Top Preview / Folder Icon */}
                      <div className="w-full h-12 sm:h-14 flex items-center justify-center p-1 mb-0.5 group-hover:scale-105 transition-transform duration-150">
                        <Folder className="h-8 w-8 sm:h-9 sm:w-9 text-primary transition-colors" />
                      </div>

                      {/* Name */}
                      <span className="text-[11.5px] sm:text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors block mb-0.5">
                        {cw.name}
                      </span>

                      {/* Subtitle / Metadata (No ID) */}
                      <div className="flex flex-col items-center gap-0.5 w-full text-[8px] sm:text-[8.5px] text-muted-foreground uppercase font-medium tracking-wider">
                        {cw.status === "connected" && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[7.5px] sm:text-[8px] bg-muted text-muted-foreground border border-border/60 group-hover:border-primary/30 transition-colors">
                            <Link2 className="h-2 w-2" />
                            <span>{t("launcher.statusConnected") || "Connected"}</span>
                          </span>
                        )}
                        {cw.status === "cloud_only" && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[7.5px] sm:text-[8px] bg-muted text-muted-foreground border border-border/60 group-hover:border-primary/30 transition-colors">
                            <Cloud className="h-2 w-2" />
                            <span>{t("launcher.statusCloudOnly") || "Cloud only"}</span>
                          </span>
                        )}
                        {cw.status === "differs" && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[7.5px] sm:text-[8px] bg-muted text-muted-foreground border border-border/60 group-hover:border-primary/30 transition-colors">
                            <Unlink2 className="h-2 w-2" />
                            <span>{t("launcher.statusDiffers") || "Differs"}</span>
                          </span>
                        )}

                        {cw.modifiedTime && <span className="opacity-90 group-hover:opacity-100 transition-opacity">{formatModifiedDate(cw.modifiedTime, language)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {cloudWorkspaces.map((cw) => (
                    <div
                      key={cw.id}
                      onClick={() => handleSelectCloudWorkspace(cw)}
                      className="group flex items-center justify-between gap-2.5 p-2 sm:p-2.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Folder Icon */}
                        <div className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform duration-150">
                          <Folder className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                        </div>

                        {/* Title & Metadata (No ID) */}
                        <div className="space-y-0.2 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {cw.name}
                            </span>
                            {/* Status Badges */}
                            {cw.status === "connected" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] sm:text-[8.5px] font-medium bg-muted text-muted-foreground border border-border/60 shrink-0">
                                <Link2 className="h-2 w-2" />
                                <span>{t("launcher.statusConnected") || "Connected"}</span>
                              </span>
                            )}
                            {cw.status === "cloud_only" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] sm:text-[8.5px] font-medium bg-muted text-muted-foreground border border-border/60 shrink-0">
                                <Cloud className="h-2 w-2" />
                                <span>{t("launcher.statusCloudOnly") || "Cloud only"}</span>
                              </span>
                            )}
                            {cw.status === "differs" && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] sm:text-[8.5px] font-medium bg-muted text-muted-foreground border border-border/60 shrink-0">
                                <Unlink2 className="h-2 w-2" />
                                <span>{t("launcher.statusDiffers") || "Differs"}</span>
                              </span>
                            )}
                          </div>
                          {cw.modifiedTime && (
                            <div className="text-[9px] sm:text-[9.5px] text-muted-foreground uppercase font-medium tracking-wider">
                              {formatModifiedDate(cw.modifiedTime, language)}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCloudWorkspace(cw);
                        }}
                        className="w-[64px] py-1 rounded-lg border border-border/80 bg-background hover:bg-muted hover:text-foreground text-foreground text-[11px] font-semibold flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        {t("launcher.openCloudBtn") || "Open"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Option: Create New Workspace on Google Drive */}
            <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-primary shrink-0" />
                  <span>{t("launcher.createNewCloudWorkspace") || "Create new workspace"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("launcher.createCloudDialogSubtitle") || "The workspace will be created in Luno/Workspaces/ on your Google Drive."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCloudWorkspaceName("My Notes");
                  setCloudNameError("");
                  setCreateCloudDialogOpen(true);
                }}
                className="w-[84px] py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                {t("launcher.createBtn") || "Create"}
              </button>
            </div>
          </div>
        ) : (
          /* Standard Launcher Card with Dividers */
          <div className="w-full rounded-2xl border border-border/70 bg-card p-2 sm:p-3 shadow-sm divide-y divide-border/60">
            {/* Option 1: Create New Workspace */}
            <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-primary shrink-0" />
                  <span>{t("launcher.createTitle")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("launcher.createDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceName("My Notes");
                  setPathError("");
                  setCreateDialogOpen(true);
                }}
                className="w-[84px] py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                {t("launcher.createBtn")}
              </button>
            </div>

            {/* Option 2: Open Folder as Workspace */}
            <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span>{t("launcher.openTitle")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("launcher.openDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void onOpenFolder()}
                className="w-[84px] py-2 rounded-xl border border-border/80 bg-background hover:bg-muted hover:text-foreground text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                {t("launcher.openBtn")}
              </button>
            </div>

            {/* Option 3: Google Drive Workspaces */}
            <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GoogleDriveIcon className="h-4 w-4 shrink-0" />
                  <span>{t("launcher.driveTitle")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("launcher.driveDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSignInGoogleDrive()}
                className="w-[84px] py-2 rounded-xl border border-border/80 bg-background hover:bg-muted hover:text-foreground text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                {t("launcher.driveBtn")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Local Workspace Modal Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("launcher.createDialogTitle")}</DialogTitle>
            <DialogDescription>{t("launcher.createDialogSubtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="workspace-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("launcher.workspaceNameLabel")}
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => {
                  setWorkspaceName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"));
                  if (pathError) setPathError("");
                }}
                placeholder="My Notes"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="workspace-location" className="mb-2 block text-sm font-medium text-foreground">
                {t("launcher.locationLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="workspace-location"
                  type="text"
                  value={parentPath}
                  onChange={(e) => {
                    setParentPath(e.target.value);
                    if (pathError) setPathError("");
                  }}
                  placeholder={t("launcher.locationPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors truncate"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseLocation}
                  className="shrink-0 h-10 px-3.5 rounded-xl font-medium flex items-center gap-1.5"
                >
                  <FolderSearch className="h-4 w-4" />
                  <span>{t("launcher.browseBtn")}</span>
                </Button>
              </div>
            </div>

            {pathError && (
              <p className="text-xs text-destructive font-medium">
                {pathError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={isCreating || !workspaceName.trim() || !parentPath.trim()}
              onClick={handleConfirmCreate}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t("launcher.creating")}</span>
                </>
              ) : (
                <span>{t("launcher.createConfirm")}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Cloud Workspace Modal Dialog */}
      <Dialog open={createCloudDialogOpen} onOpenChange={setCreateCloudDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("launcher.createCloudDialogTitle") || "Create new workspace on Google Drive"}</DialogTitle>
            <DialogDescription>
              {t("launcher.createCloudDialogSubtitle") || "The workspace will be created in Luno/Workspaces/ on your Google Drive."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCreateCloudWorkspace} className="space-y-4 py-2">
            <div>
              <label htmlFor="cloud-workspace-name" className="mb-2 block text-sm font-medium text-foreground">
                {t("launcher.workspaceNameLabel") || "Workspace name"}
              </label>
              <input
                id="cloud-workspace-name"
                type="text"
                value={cloudWorkspaceName}
                onChange={(e) => {
                  setCloudWorkspaceName(e.target.value.replace(/[\\/:*?"<>|]/g, "_"));
                  if (cloudNameError) setCloudNameError("");
                }}
                placeholder="My Notes"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus-visible:border-primary focus-visible:ring-0 transition-colors"
                autoFocus
              />
            </div>

            {cloudNameError && (
              <p className="text-xs text-destructive font-medium">
                {cloudNameError}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateCloudDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !cloudWorkspaceName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{t("launcher.creating") || "Creating..."}</span>
                  </>
                ) : (
                  <span>{t("launcher.createCloudConfirm") || "Create Cloud Workspace"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connected Workspace Confirmation Dialog */}
      <Dialog open={confirmConnectedOpen} onOpenChange={setConfirmConnectedOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">
                {t("launcher.connectedDialogTitle") || "Workspace is connected to this device"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
              {t("launcher.connectedDialogDesc") ||
                "You're about to edit the cloud version of this workspace. Changes made here will not be applied to the local files and may cause the two versions to become different."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmConnectedOpen(false);
                setPendingCloudWs(null);
              }}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmEditConnected}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("launcher.editCloudVersionBtn") || "Edit Cloud Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloud version differs Warning Dialog */}
      <Dialog open={confirmDiffersOpen} onOpenChange={setConfirmDiffersOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">
                {t("launcher.differsDialogTitle") || "Cloud version differs from local workspace"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
              {t("launcher.differsDialogDesc") ||
                "This workspace has a local copy on your device, but the cloud version has differences. Editing the cloud version directly will not update your local files. If you want to synchronize both sides, please use the Sync feature."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDiffersOpen(false);
                setPendingCloudWs(null);
              }}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmEditDiffers}
            >
              {t("launcher.editCloudVersionBtn") || "Edit Cloud Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};
