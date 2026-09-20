import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import SettingsTabView from "@/components/SettingsTabView";

export default function Settings() {
  const { settings } = useAppSettings();

  useEffect(() => {
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
    document.documentElement.setAttribute("data-editor-font", settings.editorFontFamily || settings.fontFamily);
  }, [settings.fontFamily, settings.editorFontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
  }, [settings.theme]);

  return (
    <div className="h-full w-full max-h-full max-w-full overflow-hidden flex flex-col bg-background">
      <SettingsTabView />
    </div>
  );
}
