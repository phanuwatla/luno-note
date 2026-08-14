import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import SettingsTabView from "@/components/SettingsTabView";

export default function Settings() {
  const { settings } = useAppSettings();

  useEffect(() => {
    document.documentElement.setAttribute("data-app-font", settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-theme", settings.theme);
  }, [settings.theme]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <SettingsTabView />
    </div>
  );
}
