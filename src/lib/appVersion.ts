import packageJson from "../../package.json";

export const APP_VERSION: string = packageJson.version;
export const APP_NAME: string = packageJson.productName || "Luno Note";
