// Registers the custom elements defined by the library. This must happen
// before React renders them, so that React finds each element's properties
// and sets props as properties rather than attributes
import "@cem-playground/svelte-vite";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
