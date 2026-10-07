// On small screens the room links fold away behind "Rooms". Tapping it opens them between the header
// and the page, pushing the page down. Closing slides the page back up.
const SMALL = matchMedia("(max-width: 760px)");

export function initMenu() {
  const top = document.querySelector(".top");
  const toggle = top?.querySelector(".rooms-link");
  const nav = top?.querySelector("nav");
  if (!toggle || !nav) return;
  toggle.setAttribute("role", "button");
  const root = document.documentElement.style;
  const isOpen = () => top.classList.contains("is-open");
  const set = (on) => {
    top.classList.toggle("is-open", on);
    toggle.setAttribute("aria-expanded", String(on));
    const h = on ? nav.scrollHeight : 0;
    root.setProperty("--menu-h", h + "px");
    root.setProperty("--menu-push", (on ? h + 12 : 0) + "px");
  };
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    set(!isOpen());
  });
  document.addEventListener("click", (e) => { if (isOpen() && !top.contains(e.target)) set(false); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) { set(false); toggle.focus(); }
  });
  SMALL.addEventListener("change", () => { if (isOpen()) set(false); });
}
