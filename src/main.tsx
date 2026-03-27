import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


// โหลด mammoth แบบ dynamic เพื่อรองรับ dev server/public path
if (typeof window !== "undefined") {
	function ensureMammothLoaded() {
		if (typeof (window as any).mammoth !== "undefined") {
			console.log("[mammoth] mammoth loaded successfully", (window as any).mammoth);
			return;
		}
		const script = document.createElement("script");
		script.src = "mammoth.browser.min.js";
		script.onload = () => {
			if (typeof (window as any).mammoth !== "undefined") {
				console.log("[mammoth] mammoth loaded successfully (dynamic)", (window as any).mammoth);
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
