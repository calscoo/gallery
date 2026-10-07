import { cardHTML } from "./util.js";

// Closer look: one piece large with its label. The URL hash names the piece, so a link can open it directly.
// Opening a piece adds one history entry, so Back (browser, mouse or swipe) returns to the wall.
// Moving to the previous or next piece updates that entry instead of adding more.
export function makeCloser({ box, room, frames, onClose }) {
  const img = box.querySelector(".frame img");
  const card = box.querySelector(".card");
  let idx = 0;
  let opener = null;
  let ownEntry = false; // the open piece has its own history entry, with the wall below it
  const wallURL = () => location.pathname + location.search;
  const slug = () => frames[idx].dataset.slug;

  function show(i) {
    idx = i;
    const f = frames[idx];
    img.src = f.dataset.full;
    img.width = +f.dataset.fw;
    img.height = +f.dataset.fh;
    img.alt = f.dataset.title;
    card.innerHTML = cardHTML(f, room);
    if (box.hidden) {
      opener = document.activeElement;
      box.hidden = false;
      box.querySelector("nav [data-act=close]").focus();
    }
  }
  function hide() {
    if (box.hidden) return;
    box.hidden = true;
    opener?.focus?.({ preventScroll: true });
    onClose?.(idx);
  }

  function open(i) {
    show(i);
    history.pushState({ piece: slug() }, "", "#" + slug());
    ownEntry = true;
  }
  // A link straight to a piece: put the wall underneath it, so Back lands on the wall.
  // After a reload the entries already exist, so leave them alone.
  function openFromLink(i) {
    show(i);
    if (history.state?.piece) { ownEntry = true; return; }
    history.replaceState(null, "", wallURL());
    history.pushState({ piece: slug() }, "", "#" + slug());
    ownEntry = true;
  }
  function close() {
    if (ownEntry) history.back();
    else { history.replaceState(null, "", wallURL()); hide(); }
  }
  function step(d) {
    show((idx + d + frames.length) % frames.length);
    history.replaceState({ piece: slug() }, "", "#" + slug());
  }

  // Back and Forward: an entry with a piece opens it, the wall entry closes the view.
  addEventListener("popstate", () => {
    const i = frames.findIndex((f) => f.dataset.slug === decodeURIComponent(location.hash.slice(1)));
    if (i >= 0) { show(i); ownEntry = true; }
    else { ownEntry = false; hide(); }
  });

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
    openFromLink,
    isOpen: () => !box.hidden,
    indexOf: (s) => frames.findIndex((f) => f.dataset.slug === s),
  };
}
