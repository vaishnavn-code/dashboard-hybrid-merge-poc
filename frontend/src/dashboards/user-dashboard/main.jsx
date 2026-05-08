/**
 * main.jsx
 * ========
 * React 18 entry point.
 * Mounts the App component and imports the global CSS design tokens.
 */

import React       from "react";
import ReactDOM    from "react-dom/client";
import App         from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
