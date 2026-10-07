// Lobby: every room hangs as its cover, with its name and work count under the frame, flush right.
// Wide screens get stacks (the first room alone and largest). Phones and portrait tablets get rows
// that keep each cover's proportions, with the first room on top and nearly full width.
const B = 9; // frame border
const F = 0.045; // mat, as a share of the frame width
const G = 30; // gap between frames in a stack
const LABEL = 48; // height of a label (name, count and the space above them)
const ROWS = matchMedia("(max-width: 699px), (max-height: 499px) and (pointer: coarse), (orientation: portrait) and (max-width: 1100px)");

export function initHome() {
  const hang = document.getElementById("lobby");
  if (!hang) return;
  const lobby = hang.closest(".lobby");
  const items = [...hang.querySelectorAll(".lobby-item")].map((el) => {
    const img = el.querySelector("img");
    return { el, img, frame: el.querySelector(".frame"), plate: el.querySelector(".plate"), r: +img.getAttribute("width") / +img.getAttribute("height") };
  });
  if (!items.length) return;

  // Size one frame by its outer width (stacks) or by its image height (rows).
  function byWidth(it, w) {
    const m = Math.round(w * F), iw = Math.max(20, Math.round(w - 2 * B - 2 * m));
    set(it, iw, Math.round(iw / it.r), m);
    it.el.style.width = iw + 2 * (m + B) + "px";
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

  // Width of a stack whose frames, labels and gaps add up to height H.
  function stackWidth(group, H) {
    let A = 0, C = 0;
    for (const it of group) { A += (1 - 2 * F) / it.r + 2 * F; C += 2 * B * (1 - 1 / it.r); }
    return (H - group.length * LABEL - (group.length - 1) * G - C) / A;
  }

  // Every way to split the rooms after the first into stacks of one to three.
  function splits(n) {
    if (n === 0) return [[]];
    const out = [];
    for (let k = 1; k <= Math.min(3, n); k++) for (const rest of splits(n - k)) out.push([k, ...rest]);
    return out;
  }

  // Try each split at full height, scale it to fit the width, and keep the one that hangs the largest,
  // most even pieces with the first room clearly the largest.
  function stacks() {
    const H = hang.clientHeight, Wv = hang.clientWidth, CG = 40;
    let best = null;
    for (const split of splits(items.length - 1)) {
      const groups = [[0]];
      let i = 1;
      for (const k of split) { groups.push(Array.from({ length: k }, (_, j) => i + j)); i += k; }
      const shares = groups.map((g, gi) => (gi === 0 ? 0.82 : 0.56 + 0.12 * g.length + (gi % 2 ? -0.03 : 0.03)));
      const widths = groups.map((g, gi) => stackWidth(g.map((x) => items[x]), H * Math.min(0.92, shares[gi])));
      if (widths.some((w) => w < 60)) continue;
      const k = Math.min(1, (Wv - CG * (groups.length - 1)) / widths.reduce((a, w) => a + w, 0));
      // Score by the size of every piece (square root of its area), so no room shrinks to a stamp.
      const sizes = groups.flatMap((g, gi) => g.map((x) => (widths[gi] * k) / Math.sqrt(items[x].r)));
      const others = sizes.slice(1);
      const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const otherMean = others.reduce((a, b) => a + b, 0) / others.length;
      // The first room should read as the hero: about twice the size of the others.
      const hero = Math.min(1, sizes[0] / (2 * otherMean)) ** 1.5;
      const score = mean * Math.sqrt(Math.min(...others) / mean) * hero;
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
    const heights = plan.map((g) => Math.min(fit(g), Math.max(220, T * 0.36)));
    // The first room fills most of the width, short of taking over the whole screen.
    const hero = items[0];
    const heroH = Math.min(innerHeight * 0.58, (T * 0.88 - 2 * B) / (hero.r + 0.1));

    const mk = (group, h) => {
      const row = document.createElement("div");
      row.className = "lobby-row";
      row.style.gap = gap + "px";
      group.forEach((it) => { it.el.style.width = byHeight(it, h) + "px"; row.append(it.el); });
      hang.append(row);
      // Rounding can push a row a pixel or two past the edge. Shrink that row to fit.
      if (row.scrollWidth > T + 1) {
        const s = (T / row.scrollWidth) * 0.98;
        group.forEach((it) => { it.el.style.width = byHeight(it, h * s) + "px"; });
      }
    };
    mk([hero], heroH);
    plan.forEach((g, i) => mk(g, heights[i]));
  }

  // A room name wider than its frame would run into the next label. Shrink its text until it fits.
  function fitLabel(it) {
    const name = it.plate.querySelector("b");
    let fs = parseFloat(getComputedStyle(it.plate).fontSize);
    while (name.offsetWidth > it.plate.clientWidth + 0.5 && fs > 9.5) {
      fs -= 0.5;
      it.plate.style.fontSize = fs + "px";
    }
  }

  function apply() {
    for (const it of items) { hang.append(it.el); it.el.style.width = ""; it.plate.style.fontSize = ""; }
    hang.querySelectorAll(".lobby-col, .lobby-row").forEach((n) => n.remove());
    hang.style.gap = "";
    const useRows = ROWS.matches;
    lobby.classList.toggle("is-rows", useRows);
    lobby.classList.toggle("is-cols", !useRows);
    useRows ? rows() : stacks();
    items.forEach(fitLabel);
    hang.classList.add("is-hung");
  }

  let size = "", timer = 0;
  const onResize = () => {
    const now = innerWidth + "x" + (ROWS.matches ? 0 : innerHeight);
    if (now === size) return;
    size = now;
    apply();
  };
  addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(onResize, 120); });
  ROWS.addEventListener("change", onResize);
  onResize();
}
