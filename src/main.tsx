import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


// โหลด mammoth แบบ dynamic เพื่อรองรับ dev server/public path
if (typeof window !== "undefined") {
	function ensureMammothLoaded() {
		const win = window as unknown as Record<string, unknown>;
		if (typeof win.mammoth !== "undefined") {
			console.log("[mammoth] mammoth loaded successfully", win.mammoth);
			return;
		}
		const script = document.createElement("script");
		script.src = "mammoth.browser.min.js";
		script.onload = () => {
			if (typeof win.mammoth !== "undefined") {
				console.log("[mammoth] mammoth loaded successfully (dynamic)", win.mammoth);
			} else {
				console.error("[mammoth] mammoth failed to load (dynamic)");
			}
		};
		script.onerror = () => {
			console.error("[mammoth] mammoth script failed to load");
		};
		document.head.appendChild(script);
	}
	ensureMammothLoaded();
}

createRoot(document.getElementById("root")!).render(<App />);
