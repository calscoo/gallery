// Home: size the framed pieces to the screen, and show each room's cover beside the directory on hover.
function fit(w, h, H, Wmax) {
  let ih = H, iw = H * (w / h);
  if (iw > Wmax) { iw = Wmax; ih = Wmax / (w / h); }
  return [Math.round(iw), Math.round(ih)];
}

function hang(fig, H) {
  const img = fig.querySelector(".frame img");
  // Leave room for the frame, and for the label beside it on wide screens.
  const narrow = innerWidth < 760;
  const room = fig.parentElement.clientWidth - (narrow ? 40 : 260);
  const [w, h] = fit(+img.getAttribute("width"), +img.getAttribute("height"), H, Math.min(innerWidth * (narrow ? 0.72 : 0.36), room));
  img.style.width = w + "px";
  img.style.height = h + "px";
  fig.querySelector(".frame").style.setProperty("--matw", Math.round(Math.max(w, h) * 0.06) + "px");
}

export function initHome() {
  const preview = document.getElementById("preview");
  if (!preview) return;
  const entrance = document.querySelector(".entrance [data-hung]");
  const sizes = () => {
    if (entrance) hang(entrance, Math.min(innerHeight * 0.6, 640));
    const shown = preview.querySelector("[data-hung]");
    if (shown) hang(shown, Math.min(innerHeight * 0.5, 520));
  };
  const show = (i) => {
    const t = preview.querySelector(`template[data-room="${i}"]`);
    if (!t) return;
    preview.querySelector("[data-hung]")?.remove();
    preview.append(t.content.cloneNode(true));
    sizes();
  };
  document.querySelectorAll(".plaque [data-room]").forEach((a) => {
    a.addEventListener("mouseenter", () => show(a.dataset.room));
    a.addEventListener("focus", () => show(a.dataset.room));
  });
  // The entrance already shows the first room's cover, so start the preview on the second room.
  show(preview.querySelector('template[data-room="1"]') ? 1 : 0);
  addEventListener("resize", sizes);
}
