import { reduced, store } from "./util.js";

// Run fn once the page is visible, finished loading and painted. Gives up waiting on the load after 8 seconds.
function whenShown(fn) {
  let done = false;
  const paint = () => { if (!done) { done = true; requestAnimationFrame(() => requestAnimationFrame(fn)); } };
  const loaded = () => {
    if (document.readyState === "complete") paint();
    else { addEventListener("load", paint, { once: true }); setTimeout(paint, 8000); }
  };
  const visible = () => {
    if (document.hidden) document.addEventListener("visibilitychange", visible, { once: true });
    else loaded();
  };
  if (document.prerendering) document.addEventListener("prerenderingchange", visible, { once: true });
  else visible();
}

// Auto-walk. After a few seconds without input the wall moves on its own.
// At the end of the wall it pauses, then goes to the next room, which pauses again before it walks.
// Left alone, it cycles through every room forever. Any input stops it and restarts the idle clock.
// step(dt) moves the wall and returns false at the end.
export class Walker {
  constructor({ step, onEnd, onIdleScroll, idleMs = 3000, endPauseMs = 3000, mount }) {
    this.step = step;
    this.onEnd = onEnd;
    this.idleMs = idleMs;
    this.endPauseMs = endPauseMs;
    const saved = store.get("localStorage", "walk-enabled");
    this.enabled = saved == null ? !reduced : saved === "1";
    this.walking = false;
    this.ending = false;

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
    onIdleScroll?.(() => { if (!this.walking && !this.ending) this.arm(); });

    // Arriving in a room counts as the start of inactivity, but only once the room is on screen.
    // Browsers can load the next page in the background (prerender, or a hidden tab) and run its
    // scripts early, so the clock waits for the page to be shown, loaded and painted.
    addEventListener("visibilitychange", () => {
      if (document.hidden) { this.stop(); this.cancelEnd(); clearTimeout(this.timer); }
      else this.arm();
    });
    addEventListener("pageshow", (e) => { if (e.persisted) this.arm(); });

    this.render();
    whenShown(() => this.arm());
  }

  poke(e) {
    if (e?.target instanceof Node && this.el.contains(e.target)) return;
    if (this.walking) this.stop();
    this.cancelEnd();
    this.arm();
  }

  arm() {
    clearTimeout(this.timer);
    if (this.enabled) this.timer = setTimeout(() => this.start(), this.idleMs);
  }

  start() {
    if (!this.enabled || this.walking || this.ending || document.hidden) return;
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
        this.ending = true;
        this.render();
        this.endTimer = setTimeout(() => {
          this.ending = false;
          if (this.paused?.()) { this.render(); this.arm(); return; }
          this.onEnd?.();
        }, this.endPauseMs);
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

  cancelEnd() {
    if (!this.ending) return;
    clearTimeout(this.endTimer);
    this.ending = false;
    this.render();
  }

  toggle() {
    this.enabled = !this.enabled;
    store.set("localStorage", "walk-enabled", this.enabled ? "1" : "0");
    if (this.enabled) this.start();
    else { this.stop(); this.cancelEnd(); clearTimeout(this.timer); }
    this.render();
  }

  render() {
    const b = this.el.querySelector("button");
    const s = this.el.querySelector("span");
    b.setAttribute("aria-pressed", String(this.enabled));
    b.textContent = this.enabled ? "Auto-walk on" : "Auto-walk off";
    const stopHint = matchMedia("(pointer: coarse)").matches ? "Touch the wall to stop." : "Scroll or press a key to stop.";
    s.textContent = !this.enabled ? ""
      : this.walking ? `Walking. ${stopHint}`
      : this.ending ? `Next room in ${this.endPauseMs / 1000} seconds`
      : `Starts after ${this.idleMs / 1000} seconds without input`;
    this.el.classList.toggle("walking", this.walking || this.ending);
  }
}
