import { rand, reduced, cardHTML, PHONE } from "./util.js";
import { Walker } from "./walker.js";
import { makeCloser } from "./closer.js";

const HOVER = matchMedia("(hover: hover)");

// Frame finish per piece: mostly black, some white, a few thin frames with no mat.
const finishOf = (slug) => { const r = rand(slug, 7); return r < 0.58 ? "black" : r < 0.84 ? "white" : "thin"; };
const spec = (fin) => (fin === "thin" ? { b: 4, f: 0 } : { b: 9, f: 0.045 });

export function initRoom() {
  const room = document.getElementById("room");
  if (!room) return;
  const pieces = room.querySelector("#pieces");
  const frames = [...pieces.querySelectorAll(".frame")];
  const rail = document.getElementById("rail");
  const thumb = rail.querySelector("i");
  const count = document.getElementById("count");
  const items = frames.map((el) => {
    const img = el.querySelector("img");
    const slug = el.dataset.slug;
    return { el, img, slug, r: +img.getAttribute("width") / +img.getAttribute("height"), fin: finishOf(slug) };
  });
  let mode = null;

  function hangFrame(it, iw, ih, m) {
    it.el.className = "frame f-" + it.fin;
    it.el.style.setProperty("--matw", m + "px");
    it.img.style.width = iw + "px";
    it.img.style.height = ih + "px";
  }

  // Sideways salon: stacks of one to four pieces. Each stack gets one width chosen so it fills a target height.
  function layoutColumns() {
    const vh = innerHeight, vw = innerWidth, wide = vw > vh;
    const Hc = vh - 64 - (vh * 0.09 + 44) - 24;
    const G = 22;
    const minW = wide ? Math.max(150, vw * 0.1) : vw * 0.22;
    const maxW = wide ? vw * 0.27 : vw * 0.42;
    const pattern = [1, 2, 3, 2, 1, 3, 2, 2, 4];
    const width = (group, H) => {
      let A = 0, B = 0;
      for (const it of group) {
        const s = spec(it.fin);
        A += (1 - 2 * s.f) / it.r + 2 * s.f;
        B += 2 * s.b * (1 - 1 / it.r);
      }
      return (H - B - (group.length - 1) * G) / A;
    };
    let i = 0, p = 0;
    while (i < items.length) {
      let k = Math.min(pattern[p++ % pattern.length], items.length - i);
      const H = Hc * (0.74 + 0.26 * rand(items[i].slug, 3));
      let w = width(items.slice(i, i + k), H);
      while (w > maxW && i + k < items.length && k < 4) w = width(items.slice(i, i + ++k), H);
      while (w < minW && k > 1) w = width(items.slice(i, i + --k), H);
      w = Math.min(w, maxW);
      const col = document.createElement("div");
      col.className = "col";
      col.style.gap = G + "px";
      if (i) col.style.marginLeft = Math.round(G * (1.4 + 1.4 * rand(items[i].slug, 11))) + "px";
      for (const it of items.slice(i, i + k)) {
        const s = spec(it.fin);
        const m = Math.round(w * s.f);
        const iw = Math.round(w - 2 * s.b - 2 * m);
        hangFrame(it, iw, Math.round(iw / it.r), m);
        col.append(it.el);
      }
      pieces.append(col);
      i += k;
    }
  }

  // Top to bottom salon for phones: rows of one to three pieces. Each row gets one height chosen so it fills a target width.
  function layoutRows() {
    const T = pieces.clientWidth;
    const G = 14, rowGap = 26;
    const minH = 110, maxH = Math.min(innerHeight * 0.62, 520);
    const pattern = [1, 2, 1, 2, 2, 1, 3];
    const height = (group, Wt) => {
      let A = 0, B = 0;
      for (const it of group) {
        const s = spec(it.fin);
        A += it.r * (1 - 2 * s.f) + 2 * s.f;
        B += 2 * s.b * (1 - it.r);
      }
      return (Wt - B - (group.length - 1) * G) / A;
    };
    let i = 0, p = 0;
    while (i < items.length) {
      let k = Math.min(pattern[p++ % pattern.length], items.length - i);
      const Wt = T * (0.82 + 0.18 * rand(items[i].slug, 3));
      let h = height(items.slice(i, i + k), Wt);
      while (h > maxH && i + k < items.length && k < 3) h = height(items.slice(i, i + ++k), Wt);
      while (h < minH && k > 1) h = height(items.slice(i, i + --k), Wt);
      h = Math.min(h, maxH);
      const row = document.createElement("div");
      row.className = "row";
      row.style.gap = G + "px";
      if (i) row.style.marginTop = rowGap + "px";
      for (const it of items.slice(i, i + k)) {
        const s = spec(it.fin);
        const m = Math.round(h * s.f);
        const ih = Math.round(h - 2 * s.b - 2 * m);
        hangFrame(it, Math.round(ih * it.r), ih, m);
        row.append(it.el);
      }
      pieces.append(row);
      i += k;
    }
  }

  // Scroll position helpers that work in both directions.
  const isH = () => mode === "h";
  const span = () => (isH() ? room.scrollWidth - room.clientWidth : document.documentElement.scrollHeight - innerHeight);
  const pos = () => (isH() ? room.scrollLeft : scrollY);
  const setPos = (v) => (isH() ? (room.scrollLeft = v) : scrollTo(0, v));

  function apply() {
    const next = PHONE.matches ? "v" : "h";
    const ratio = mode ? pos() / Math.max(1, span()) : 0;
    for (const it of items) pieces.append(it.el);
    pieces.querySelectorAll(".col, .row").forEach((n) => n.remove());
    mode = next;
    room.classList.toggle("is-h", isH());
    room.classList.toggle("is-v", !isH());
    document.body.classList.toggle("walls-h", isH());
    document.body.classList.toggle("walls-v", !isH());
    isH() ? layoutColumns() : layoutRows();
    if (ratio) setPos(ratio * span());
    update();
  }

  function update() {
    if (isH()) {
      const sw = room.scrollWidth;
      thumb.style.left = (room.scrollLeft / sw) * 100 + "%";
      thumb.style.width = (room.clientWidth / sw) * 100 + "%";
    }
    let lo = 0, hi = 0;
    items.forEach((it, k) => {
      const r = it.el.getBoundingClientRect();
      const inView = isH() ? r.right > 0 && r.left < innerWidth : r.bottom > 0 && r.top < innerHeight;
      if (inView) { if (!lo) lo = k + 1; hi = k + 1; }
    });
    count.textContent = !lo ? `${items.length} works` : lo === hi ? `Piece ${lo} of ${items.length}` : `Pieces ${lo} to ${hi} of ${items.length}`;
    tipHide();
  }

  function centerOn(i) {
    const r = items[i].el.getBoundingClientRect();
    if (isH()) room.scrollLeft += r.left + r.width / 2 - innerWidth / 2;
    else scrollBy(0, r.top + r.height / 2 - innerHeight / 2);
  }

  // Hover label beside a piece.
  const tip = document.createElement("div");
  tip.className = "tip card";
  document.body.append(tip);
  function tipFor(el) {
    tip.innerHTML = cardHTML(el, room);
    const r = el.getBoundingClientRect(), tw = 168, gap = 14;
    const left = r.right + gap + tw < innerWidth ? r.right + gap : r.left - gap - tw;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.min(innerHeight - tip.offsetHeight - 8, Math.max(64, r.bottom - tip.offsetHeight)) + "px";
    tip.classList.add("show");
  }
  function tipHide() { tip.classList.remove("show"); }
  pieces.addEventListener("mouseover", (e) => { const f = e.target.closest(".frame"); if (f && HOVER.matches && !drag?.moved) tipFor(f); });
  pieces.addEventListener("mouseout", (e) => { if (e.target.closest(".frame")) tipHide(); });
  pieces.addEventListener("focusin", (e) => { const f = e.target.closest(".frame"); if (f) tipFor(f); });
  pieces.addEventListener("focusout", tipHide);

  // Closer look.
  const closer = makeCloser({ box: document.getElementById("closer"), room, frames, onClose: centerOn });
  pieces.addEventListener("click", (e) => {
    const f = e.target.closest(".frame");
    if (!f) return;
    e.preventDefault();
    tipHide();
    walker.stop();
    closer.open(frames.indexOf(f));
  });

  // Sideways input: the wheel moves the wall, the mouse drags it with a little momentum.
  room.addEventListener("wheel", (e) => {
    if (!isH() || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    room.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    e.preventDefault();
  }, { passive: false });

  let drag = null, glide = 0, swallowClick = false;
  room.addEventListener("pointerdown", (e) => {
    if (!isH() || e.pointerType !== "mouse" || e.button !== 0) return;
    cancelAnimationFrame(glide);
    drag = { x: e.clientX, left: room.scrollLeft, moved: false, id: e.pointerId, trail: [[performance.now(), e.clientX]] };
    e.preventDefault();
  });
  room.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      room.classList.add("dragging");
      try { room.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      tipHide();
    }
    if (!drag.moved) return;
    room.scrollLeft = drag.left - dx;
    const now = performance.now();
    drag.trail.push([now, e.clientX]);
    while (drag.trail.length > 2 && now - drag.trail[0][0] > 100) drag.trail.shift();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) {
      swallowClick = true;
      room.classList.remove("dragging");
      const [t0, x0] = drag.trail[0], [t1, x1] = drag.trail[drag.trail.length - 1];
      let v = t1 > t0 ? -((x1 - x0) / (t1 - t0)) * 1000 : 0;
      v = Math.max(-3000, Math.min(3000, v));
      if (!reduced && Math.abs(v) > 60) {
        let last = performance.now();
        const run = (now) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          room.scrollLeft += v * dt;
          v *= Math.exp(-dt * 4.5);
          if (Math.abs(v) > 20) glide = requestAnimationFrame(run);
        };
        glide = requestAnimationFrame(run);
      }
    }
    drag = null;
  };
  room.addEventListener("pointerup", endDrag);
  room.addEventListener("pointercancel", endDrag);
  room.addEventListener("click", (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // The rail is the wall's scrollbar. Click to jump there, drag the thumb to move.
  let railDrag = null;
  rail.addEventListener("pointerdown", (e) => {
    if (!isH()) return;
    e.preventDefault();
    cancelAnimationFrame(glide);
    const box = rail.getBoundingClientRect(), t = thumb.getBoundingClientRect();
    const scale = room.scrollWidth / box.width;
    if (e.clientX < t.left || e.clientX > t.right) room.scrollLeft = (e.clientX - box.left) * scale - room.clientWidth / 2;
    railDrag = { x: e.clientX, left: room.scrollLeft, scale, id: e.pointerId };
    try { rail.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    rail.classList.add("dragging");
  });
  rail.addEventListener("pointermove", (e) => {
    if (railDrag && e.pointerId === railDrag.id) room.scrollLeft = railDrag.left + (e.clientX - railDrag.x) * railDrag.scale;
  });
  const endRail = () => { railDrag = null; rail.classList.remove("dragging"); };
  rail.addEventListener("pointerup", endRail);
  rail.addEventListener("pointercancel", endRail);

  // Auto-walk.
  let walkPos = null;
  let onUserScroll = null;
  const walker = new Walker({
    mount: document.getElementById("walk-slot"),
    step: (dt) => {
      if (walkPos == null || Math.abs(walkPos - pos()) > 2) walkPos = pos();
      walkPos += (isH() ? 42 : 34) * dt;
      setPos(walkPos);
      // The browser stops the scroll at the real end of the wall, which can differ from the measured size
      // (phone toolbars, rounding). Falling behind the target means the end is reached.
      return pos() > walkPos - 1.5;
    },
    onEnd: () => { if (room.dataset.next) location.href = room.dataset.next; },
    onIdleScroll: (fn) => (onUserScroll = fn),
  });
  walker.paused = closer.isOpen;
  const scrolled = () => {
    update();
    if (!walker.walking) onUserScroll?.();
  };
  room.addEventListener("scroll", scrolled, { passive: true });
  addEventListener("scroll", scrolled, { passive: true });

  // Phone toolbars change the window height while scrolling. A top to bottom wall only re-hangs when the width changes.
  let resizeTimer = 0, lastWidth = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (mode === "v" && PHONE.matches && innerWidth === lastWidth) return;
      lastWidth = innerWidth;
      apply();
    }, 150);
  });
  PHONE.addEventListener("change", apply);

  apply();
  if (isH()) room.focus({ preventScroll: true });

  // A link to a piece (#slug) opens it.
  const fromHash = closer.indexOf(decodeURIComponent(location.hash.slice(1)));
  if (fromHash >= 0) {
    requestAnimationFrame(() => centerOn(fromHash));
    closer.open(fromHash);
  }
}
