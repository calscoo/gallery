import { initRoom } from "./wall/room.js";
import { initHome } from "./wall/home.js";
import { initMenu } from "./wall/menu.js";
import "./slider.js";

initMenu();
initRoom();
initHome();

// Prevent right-click and dragging on images
document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") e.preventDefault();
});
document.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "IMG" || e.target.closest?.(".frame")) e.preventDefault();
});
