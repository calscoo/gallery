export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Phones (and phones held sideways) hang walls top to bottom. Tablets and desktops walk them sideways.
export const PHONE = matchMedia("(max-width: 699px), (max-height: 499px) and (pointer: coarse)");

// Storage can be blocked (private windows, strict settings). Treat that as empty.
export const store = {
  get(area, key) {
    try { return window[area].getItem(key); } catch { return null; }
  },
  set(area, key, value) {
    try { value == null ? window[area].removeItem(key) : window[area].setItem(key, value); } catch { /* ignore */ }
  },
};

// Frame finish per piece: mostly black, some white, a few thin frames with no mat.
// Keyed by the piece, so a photo has the same frame on the home page and on its wall.
export const finishOf = (slug) => { const r = rand(slug, 7); return r < 0.58 ? "black" : r < 0.84 ? "white" : "thin"; };
export const spec = (fin) => (fin === "thin" ? { b: 4, f: 0 } : { b: 9, f: 0.045 });

// Stable number in [0, 1) per piece, so a wall hangs the same way on every visit.
export function rand(id, salt = 0) {
  let h = 2166136261 ^ salt;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Wall label for a piece. Matches layouts/partials/card.html.
export function cardHTML(frame, room) {
  const { title, no } = frame.dataset;
  const { medium, room: roomTitle, email } = room.dataset;
  const subject = encodeURIComponent(`Print: ${title} (${roomTitle}, No. ${no})`);
  return `<h3>${esc(title)}</h3>${medium ? esc(medium) + "<br>" : ""}No. ${esc(no)}, ${esc(roomTitle)}<br>` +
    (email ? `<a href="mailto:${esc(email)}?subject=${subject}">Ask about a print</a>` : "");
}
