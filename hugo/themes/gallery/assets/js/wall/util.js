export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Storage can be blocked (private windows, strict settings). Treat that as empty.
export const store = {
  get(area, key) {
    try { return window[area].getItem(key); } catch { return null; }
  },
  set(area, key, value) {
    try { value == null ? window[area].removeItem(key) : window[area].setItem(key, value); } catch { /* ignore */ }
  },
};

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
