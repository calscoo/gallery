// The Lights button opens a dimmer plate with two sliders: room lighting and spotlights.
export function initDimmer() {
  const btn = document.getElementById("lights-btn");
  const plate = document.getElementById("dimmer");
  const lights = window.wallLights;
  if (!btn || !plate || !lights) return;
  btn.hidden = false;
  const room = plate.querySelector('[data-light="room"]');
  const spot = plate.querySelector('[data-light="spot"]');
  const sync = () => { room.value = Math.round(lights.state.room * 100); spot.value = Math.round(lights.state.spot * 100); };
  const change = () => lights.set(room.value / 100, spot.value / 100);
  room.addEventListener("input", change);
  spot.addEventListener("input", change);
  plate.querySelector('[data-light="reset"]').addEventListener("click", () => { lights.set(0.5, 0.5); sync(); });

  const open = (yes) => {
    plate.hidden = !yes;
    btn.setAttribute("aria-expanded", String(yes));
    if (yes) { sync(); room.focus(); }
  };
  btn.addEventListener("click", () => open(plate.hidden));
  document.addEventListener("pointerdown", (e) => {
    if (!plate.hidden && !plate.contains(e.target) && !btn.contains(e.target)) open(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !plate.hidden) { open(false); btn.focus(); }
  });
}
