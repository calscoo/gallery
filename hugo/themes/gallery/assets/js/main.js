import { initRoom } from "./wall/room.js";
import { initHome } from "./wall/home.js";
import { initDimmer } from "./wall/dimmer.js";
import "./slider.js";

initRoom();
initHome();
initDimmer();

// Prevent right-click and dragging on images
document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") e.preventDefault();
});
document.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "IMG" || e.target.closest?.(".frame")) e.preventDefault();
});
