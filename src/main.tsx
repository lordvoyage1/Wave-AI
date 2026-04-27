import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// StrictMode is intentionally omitted — it double-fires effects and causes
// canvas animation loops to conflict with each other, freezing the page.
createRoot(document.getElementById("root")!).render(<App />);
