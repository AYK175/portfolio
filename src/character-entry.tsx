import React from "react";
import ReactDOM from "react-dom/client";
import Character from "./character";

/* Matches the CSS breakpoint that hides the character section on mobile —
   skip mounting Three.js there entirely rather than just hiding it. */
const MIN_WIDTH = 768;

const mount = document.getElementById("character-mount");

if (mount && window.innerWidth >= MIN_WIDTH) {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      <Character introDelay={300} />
    </React.StrictMode>
  );
}
