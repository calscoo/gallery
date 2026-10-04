import { cardHTML } from "./util.js";

// Closer look: one piece large with its label. The URL hash names the piece, so a link can open it directly.
export function makeCloser({ box, room, frames, onClose }) {
  const img = box.querySelector(".frame img");
  const card = box.querySelector(".card");
  let idx = 0;
  let opener = null;

  function draw() {
    const f = frames[idx];
    img.src = f.dataset.full;
    img.width = +f.dataset.fw;
    img.height = +f.dataset.fh;
    img.alt = f.dataset.title;
    card.innerHTML = cardHTML(f, room);
    history.replaceState(null, "", "#" + f.dataset.slug);
  }
  function open(i) {
    idx = i;
    opener = document.activeElement;
    draw();
    box.hidden = false;
    box.querySelector("nav [data-act=close]").focus();
  }
  function close() {
    box.hidden = true;
    history.replaceState(null, "", location.pathname + location.search);
    opener?.focus?.({ preventScroll: true });
    onClose?.(idx);
  }
  const step = (d) => { idx = (idx + d + frames.length) % frames.length; draw(); };

  box.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") close();
    if (act === "next") step(1);
    if (act === "prev") step(-1);
  });
  addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Swipe sideways on a phone to move between pieces.
  let touch = null;
  box.addEventListener("touchstart", (e) => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch[0];
    const dy = e.changedTouches[0].clientY - touch[1];
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  });

  return {
    open,
    isOpen: () => !box.hidden,
    indexOf: (slug) => frames.findIndex((f) => f.dataset.slug === slug),
  };
}
