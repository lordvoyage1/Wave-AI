import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// StrictMode is intentionally omitted — it double-fires effects and causes
// canvas animation loops to conflict with each other, freezing the page.
const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Hide the static boot splash on next frame after React mounts the tree.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const boot = document.getElementById("wave-boot");
    if (!boot) return;
    boot.classList.add("fade");
    setTimeout(() => boot.remove(), 400);
  });
});
