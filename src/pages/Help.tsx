import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import HelpTabView from "@/components/HelpTabView";

export default function Help() {
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
      <HelpTabView />
    </div>
  );
}
