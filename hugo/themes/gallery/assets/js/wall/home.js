import { PHONE } from "./util.js";

// Lobby: every room hangs as its cover. Wide screens get stacks (the first room alone and largest),
// phones get rows that keep each cover's proportions, with the first room on top and larger.
const B = 9; // frame border
const F = 0.045; // mat, as a share of the frame width
const PLATE = 42; // name plate plus its gap
const G = 30; // gap between frames in a stack

export function initHome() {
  const hang = document.getElementById("lobby");
  if (!hang) return;
  const lobby = hang.closest(".lobby");
  const items = [...hang.querySelectorAll(".lobby-item")].map((el) => {
    const img = el.querySelector("img");
    return { el, img, frame: el.querySelector(".frame"), r: +img.getAttribute("width") / +img.getAttribute("height") };
  });
  if (!items.length) return;

  // Size one frame by its outer width (stacks) or by its image height (rows).
  function byWidth(it, w) {
    const m = Math.round(w * F), iw = Math.max(20, Math.round(w - 2 * B - 2 * m));
    set(it, iw, Math.round(iw / it.r), m);
  }
  function byHeight(it, ih) {
    const m = Math.round(ih * 0.05);
    set(it, Math.round(ih * it.r), Math.round(ih), m);
    return Math.round(ih * it.r) + 2 * (m + B);
  }
  function set(it, iw, ih, m) {
    it.frame.style.setProperty("--matw", m + "px");
    it.img.style.width = iw + "px";
    it.img.style.height = ih + "px";
  }

  // Width of a stack whose frames, plates and gaps add up to height H.
  function stackWidth(group, H) {
    let A = 0, C = 0;
    for (const it of group) { A += (1 - 2 * F) / it.r + 2 * F; C += 2 * B * (1 - 1 / it.r); }
    return (H - group.length * PLATE - (group.length - 1) * G - C) / A;
  }

  function reset() {
    for (const it of items) hang.append(it.el);
    hang.querySelectorAll(".lobby-col, .lobby-row").forEach((n) => n.remove());
  }

  // Every way to split the rooms after the first into stacks of one to three.
  function splits(n) {
    if (n === 0) return [[]];
    const out = [];
    for (let k = 1; k <= Math.min(3, n); k++) for (const rest of splits(n - k)) out.push([k, ...rest]);
    return out;
  }

  // Try each split at full height, scale it to fit the width, and keep the one with the most picture on the wall.
  function stacks() {
    const H = hang.clientHeight, Wv = hang.clientWidth, CG = 40;
    const plateW = items.map((it) => it.el.querySelector(".plate").offsetWidth);
    let best = null;
    for (const split of splits(items.length - 1)) {
      const groups = [[0]];
      let i = 1;
      for (const k of split) { groups.push(Array.from({ length: k }, (_, j) => i + j)); i += k; }
      const shares = groups.map((g, gi) => (gi === 0 ? 0.82 : 0.56 + 0.12 * g.length + (gi % 2 ? -0.03 : 0.03)));
      const widths = groups.map((g, gi) => stackWidth(g.map((x) => items[x]), H * Math.min(0.92, shares[gi])));
      if (widths.some((w) => w < 60)) continue;
      const colW = (k) => groups.map((g, gi) => Math.max(widths[gi] * k, ...g.map((x) => plateW[x])));
      const total = (k) => colW(k).reduce((a, b) => a + b, 0) + CG * (groups.length - 1);
      let k = Math.min(1, Wv / total(1));
      for (let pass = 0; pass < 3; pass++) k = Math.min(1, k * (Wv / total(k)));
      // Score by the summed size of every piece (square root of its area), so no room shrinks to a stamp.
      const sizes = groups.flatMap((g, gi) => g.map((x) => (widths[gi] * k) / Math.sqrt(items[x].r)));
      const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const smallest = Math.min(...sizes.slice(1));
      // Favour the first room staying the largest piece, and no other room much smaller than the rest.
      const heroOk = sizes[0] >= Math.max(...sizes.slice(1)) * 0.95;
      const score = mean * Math.sqrt(smallest / mean) * (heroOk ? 1 : 0.6);
      if (!best || score > best.score) best = { groups, widths, k, score };
    }
    for (const [gi, g] of best.groups.entries()) {
      const col = document.createElement("div");
      col.className = "lobby-col";
      col.style.gap = G + "px";
      g.forEach((x) => { byWidth(items[x], best.widths[gi] * best.k); col.append(items[x].el); });
      hang.append(col);
    }
    hang.style.gap = CG + "px";
    // Rounding can still leave the wall a few pixels too wide. Shrink once more if so.
    if (hang.scrollWidth > Wv + 1) {
      const s = (Wv / hang.scrollWidth) * 0.99;
      best.groups.forEach((g, gi) => g.forEach((x) => byWidth(items[x], best.widths[gi] * best.k * s)));
    }
  }

  function rows() {
    const T = hang.clientWidth, gap = 14;
    const rest = items.slice(1), plan = [];
    const fit = (group) => {
      let s = 0;
      for (const it of group) s += it.r + 0.1;
      return (T - (group.length - 1) * gap - group.length * 2 * B) / s;
    };
    for (let i = 0; i < rest.length;) {
      let k = Math.min(2, rest.length - i);
      while (fit(rest.slice(i, i + k)) > 200 && i + k < rest.length && k < 3) k++;
      if (rest.length - (i + k) === 1 && k < 3) k++;
      plan.push(rest.slice(i, i + k));
      i += k;
    }
    const heights = plan.map((g) => Math.min(fit(g), 220));
    const tallest = Math.max(0, ...heights);
    const hero = items[0];
    const heroH = Math.min(tallest ? tallest * 1.6 : innerHeight * 0.4, (T * 0.86 - 2 * B) / (hero.r + 0.1));

    const mk = (group, h) => {
      const row = document.createElement("div");
      row.className = "lobby-row";
      row.style.gap = gap + "px";
      group.forEach((it) => { it.el.style.width = byHeight(it, h) + "px"; row.append(it.el); });
      hang.append(row);
      // A name plate wider than its frame can push a row past the edge. Shrink that row to fit.
      if (row.scrollWidth > T + 1) {
        const s = (T / row.scrollWidth) * 0.98;
        group.forEach((it) => { it.el.style.width = byHeight(it, h * s) + "px"; });
      }
    };
    mk([hero], heroH);
    plan.forEach((g, i) => mk(g, heights[i]));
  }

  function apply() {
    reset();
    hang.style.gap = "";
    items.forEach((it) => (it.el.style.width = ""));
    const phone = PHONE.matches;
    lobby.classList.toggle("is-rows", phone);
    lobby.classList.toggle("is-cols", !phone);
    phone ? rows() : stacks();
    hang.classList.add("is-hung");
  }

  let size = "", timer = 0;
  const onResize = () => {
    const now = innerWidth + "x" + (PHONE.matches ? 0 : innerHeight);
    if (now === size) return;
    size = now;
    apply();
  };
  addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(onResize, 120); });
  PHONE.addEventListener("change", onResize);
  onResize();
}
