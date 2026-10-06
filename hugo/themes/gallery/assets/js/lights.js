// Room and spotlight levels for the wall. Runs inline in <head> so the page paints in the right light.
// Each level is 0 to 1. The middle (0.5, 0.5) is the default look.
(function () {
  var KEY = "wall-lights";
  var clamp = function (x) { return Math.min(1, Math.max(0, +x || 0)); };
  var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
  var mix = function (a, b, t) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }); };
  var rgb = function (c) { return "rgb(" + c.join(",") + ")"; };
  var lum = function (c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  var WHITE = [255, 255, 255], BLACK = [0, 0, 0], WARM = [255, 232, 196];
  var NIGHT = hex("#141517"), DAY = hex("#c6c7c3"), BRIGHT = hex("#e8e9e5");
  var INK = hex("#1c1d1f"), PAPER = hex("#ecebe7");

  function apply(room, spot) {
    room = clamp(room); spot = clamp(spot);
    var wall = room < 0.5 ? mix(NIGHT, DAY, room * 2) : mix(DAY, BRIGHT, (room - 0.5) * 2);
    var dark = Math.max(0, 1 - room * 2); // 0 from the middle up, 1 at the darkest
    var L = lum(wall);
    var light = 1.05 / (L + 0.05) > (L + 0.05) / (lum(INK) + 0.05); // light text reads better
    var s = document.documentElement.style;
    var set = function (k, v) { s.setProperty(k, v); };
    set("--wall", rgb(wall));
    set("--wall-lit", rgb(mix(wall, WHITE, 0.08 + 0.9 * room)));
    set("--floor-1", rgb(mix(wall, BLACK, 0.15)));
    set("--floor-2", rgb(mix(wall, BLACK, 0.28)));
    set("--skirting", rgb(mix(wall, WHITE, 0.6 * Math.min(1, 0.3 + 1.4 * room))));
    set("--ink", rgb(light ? PAPER : INK));
    set("--ink-rgb", (light ? PAPER : INK).join(","));
    // Secondary text sits between the ink and the wall, as far toward the wall as it can while staying readable.
    var ink = light ? PAPER : INK, quiet = hex(light ? "#a5a8ab" : "#55585b");
    var contrast = function (a, b) { var x = lum(a) + 0.05, y = lum(b) + 0.05; return Math.max(x, y) / Math.min(x, y); };
    if (contrast(quiet, wall) < 4) {
      quiet = ink;
      for (var t = 0.45; t > 0; t -= 0.05) { var q = mix(ink, wall, t); if (contrast(q, wall) >= 4.5) { quiet = q; break; } }
    }
    set("--quiet", rgb(quiet));
    // Labels, mats and white frames are objects on the wall: they dim with the room.
    set("--card", rgb(mix(hex("#ebebe7"), BLACK, 0.3 * dark)));
    set("--card-quiet", rgb(mix(hex("#55585b"), INK, 0.8 * dark)));
    set("--mat", rgb(mix(hex("#f4f4f1"), BLACK, 0.32 * dark)));
    set("--frame-white", rgb(mix(hex("#efeee9"), BLACK, 0.32 * dark)));
    // Spotlights: strength 0 to 2 (1 is the default), warmer as the room darkens.
    set("--spot", (spot * 2).toFixed(3));
    set("--spot-rgb", mix(WHITE, WARM, 0.75 * dark).join(","));
    s.colorScheme = light ? "dark" : "light";
  }

  var state = { room: 0.5, spot: 0.5 };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) { state.room = clamp(saved.room); state.spot = clamp(saved.spot); }
  } catch (e) { /* storage blocked or empty */ }
  apply(state.room, state.spot);

  window.wallLights = {
    state: state,
    set: function (room, spot) {
      state.room = clamp(room); state.spot = clamp(spot);
      apply(state.room, state.spot);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
    },
  };
})();
