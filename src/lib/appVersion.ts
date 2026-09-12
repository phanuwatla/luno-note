import packageJson from "../../package.json";

export const APP_VERSION: string = packageJson.version;
export const APP_NAME: string = packageJson.productName || "Luno Note";
export const APP_AUTHOR: string =
  typeof packageJson.author === "object" && packageJson.author !== null
    ? (packageJson.author as { name?: string }).name || "phanuwatla"
    : String(packageJson.author || "phanuwatla");
export const APP_AUTHOR_URL: string =
  typeof packageJson.author === "object" && packageJson.author !== null
    ? (packageJson.author as { url?: string }).url || "https://github.com/phanuwatla"
    : "https://github.com/phanuwatla";
export const APP_COPYRIGHT = "Copyright © 2026 phanuwatla";
export const APP_ABOUT_CREDIT = `Made by ${APP_AUTHOR} © 2026 ${APP_NAME}`;

export function openExternalUrl(url: string) {
  const electron = (window as unknown as { electronAPI?: { openExternal?: (url: string) => Promise<boolean> } })?.electronAPI;
  if (electron?.openExternal) {
    void electron.openExternal(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
