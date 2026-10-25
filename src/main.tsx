import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { initAnalytics } from "./app/lib/analytics";
import { captureFirstTouch } from "./app/lib/attribution";
import "./styles/index.css";

captureFirstTouch();
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
