import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

if (process.platform !== "win32") {
  console.log("[helper:build] Skipping Windows native helper build on non-Windows platform.");
  process.exit(0);
}

const sourcePath = path.join(rootDir, "electron", "helper", "LunoFixLang.cs");
const outDir = path.join(rootDir, "electron", "bin");
const outExePath = path.join(outDir, "LunoFixLang.exe");
const iconPath = path.join(rootDir, "electron", "icon.ico");

if (!fs.existsSync(sourcePath)) {
  console.error(`[helper:build] Missing C# source file: ${sourcePath}`);
  process.exit(1);
}

function findCscExe() {
  const winDir = process.env.WINDIR || "C:\\Windows";
  const candidates = [
    path.join(winDir, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe"),
    path.join(winDir, "Microsoft.NET", "Framework", "v4.0.30319", "csc.exe"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const cscPath = findCscExe();
if (!cscPath) {
  console.error("[helper:build] Could not locate .NET Framework 4.x csc.exe.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// Stop any running instance of the dev helper before overwriting
if (fs.existsSync(outExePath)) {
  try {
    execFileSync(outExePath, ["--stop"], { windowsHide: true, timeout: 3000 });
  } catch {
    // Ignore if not running
  }
}

const args = [
  "/nologo",
  "/target:winexe",
  "/platform:anycpu",
  "/optimize+",
  "/codepage:65001",
  "/utf8output",
  `/out:${outExePath}`,
  "/reference:System.dll",
  "/reference:System.Drawing.dll",
  "/reference:System.Windows.Forms.dll",
  "/reference:System.Runtime.Serialization.dll",
];

if (fs.existsSync(iconPath)) {
  args.push(`/win32icon:${iconPath}`);
}

args.push(sourcePath);

try {
  execFileSync(cscPath, args, { stdio: "inherit", windowsHide: true });
} catch (err) {
  console.error("[helper:build] C# compilation failed.");
  process.exit(1);
}

try {
  const output = execFileSync(outExePath, ["--selftest"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000,
  }).trim();
  const stats = fs.statSync(outExePath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`[helper:build] Built ${path.relative(rootDir, outExePath)} (${sizeKb} KB) — selftest: ${output}`);
} catch (err) {
  console.error("[helper:build] Self-test failed:", err?.message || err);
  process.exit(1);
}
