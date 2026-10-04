import { reduced, store } from "./util.js";

// Auto-walk. After a few seconds without input the wall moves on its own.
// Any input stops it. At the end of the wall it waits, then walks into the next room.
// step(dt) moves the wall and returns false at the end.
export class Walker {
  constructor({ step, onEnd, onIdleScroll, idleMs = 3000, mount }) {
    this.step = step;
    this.onEnd = onEnd;
    this.idleMs = idleMs;
    const saved = store.get("localStorage", "walk-enabled");
    this.enabled = saved == null ? !reduced : saved === "1";
    this.walking = false;

    this.el = document.createElement("div");
    this.el.className = "walk";
    this.el.innerHTML = `<button type="button"></button><span></span>`;
    mount.append(this.el);
    this.el.querySelector("button").addEventListener("click", () => this.toggle());

    this.poke = this.poke.bind(this);
    for (const t of ["wheel", "keydown", "pointerdown", "touchstart"]) addEventListener(t, this.poke, { passive: true, capture: true });
    let last = null;
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (last && Math.hypot(e.clientX - last[0], e.clientY - last[1]) > 12) this.poke(e);
      last = [e.clientX, e.clientY];
    }, { passive: true });
    // A scroll we did not cause (momentum after a flick) restarts the idle clock.
    onIdleScroll?.(() => { if (!this.walking) this.arm(); });

    this.render();
    if (store.get("sessionStorage", "walk-continue") === "1" && this.enabled) {
      store.set("sessionStorage", "walk-continue", null);
      setTimeout(() => this.start(), 1200);
    } else this.arm();
  }

  poke(e) {
    if (e?.target instanceof Node && this.el.contains(e.target)) return;
    if (this.walking) this.stop();
    clearTimeout(this.endTimer);
    this.arm();
  }

  arm() {
    clearTimeout(this.timer);
    if (this.enabled) this.timer = setTimeout(() => this.start(), this.idleMs);
  }

  start() {
    if (!this.enabled || this.walking) return;
    if (this.paused?.()) { this.arm(); return; }
    this.walking = true;
    this.render();
    let t = performance.now();
    const loop = (now) => {
      if (!this.walking) return;
      const dt = Math.min(0.1, (now - t) / 1000);
      t = now;
      if (this.step(dt) === false) {
        this.walking = false;
        this.render();
        this.endTimer = setTimeout(() => {
          store.set("sessionStorage", "walk-continue", "1");
          this.onEnd?.();
        }, 2500);
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.walking = false;
    cancelAnimationFrame(this.raf);
    this.render();
  }

  toggle() {
    this.enabled = !this.enabled;
    store.set("localStorage", "walk-enabled", this.enabled ? "1" : "0");
    if (this.enabled) this.start();
    else { this.stop(); clearTimeout(this.timer); }
    this.render();
  }

  render() {
    const b = this.el.querySelector("button");
    const s = this.el.querySelector("span");
    b.setAttribute("aria-pressed", String(this.enabled));
    b.textContent = this.enabled ? "Auto-walk on" : "Auto-walk off";
    const stopHint = matchMedia("(pointer: coarse)").matches ? "Touch the wall to stop." : "Scroll or press a key to stop.";
    s.textContent = !this.enabled ? "" : this.walking ? `Walking. ${stopHint}` : `Starts after ${this.idleMs / 1000} seconds without input`;
    this.el.classList.toggle("walking", this.walking);
  }
}
