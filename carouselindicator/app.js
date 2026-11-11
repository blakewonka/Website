(() => {
  "use strict";

  // Figma defaults: On surface = No, Step = 1, Type = Scroll. Slide count default = 6 (the Figma maximum).
  const DEFAULTS = { type: "Scroll", step: 1, onSurface: false, count: 6, timer: false, duration: 3 };
  const MIN_COUNT = 2;
  const MIN_DURATION = 1, MAX_DURATION = 60;   // seconds per slide
  const SLIDE_MS = 450;      // slide transition when the step or timer changes slides
  const MAX_COUNT = 10000;   // keeps the scroll track inside the browser's maximum element width
  const VISIBLE = 6;         // dots visible in the indicator (matches the Figma chip)
  const IMAGE_COUNT = 5;
  const HOLD_MS = 800;       // per cycle: ~450ms spring transition + a short hold before the ink starts filling
  const state = { ...DEFAULTS, theme: "dark", device: "phone" };

  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), frameWrap = $("frameWrap"), frame = $("frame");
  const carousel = $("carousel"), track = $("track"), counter = $("counter");
  const indicator = $("indicator"), ciTrack = $("ciTrack"), hero = $("hero");
  const typeSel = $("type"), stepOut = $("step"), decBtn = $("stepDec"), incBtn = $("stepInc");
  const countIn = $("count"), countDec = $("countDec"), countInc = $("countInc");
  const surfaceSw = $("onSurface"), caption = $("caption");
  const timerSw = $("timer"), durIn = $("duration"), durDec = $("durDec"), durInc = $("durInc"), durRow = $("durationRow");

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  const DEVICES = {
    phone:  { w: 375, h: 812,  label: "Phone",  layout: "compact" },
    tablet: { w: 768, h: 1024, label: "Tablet", layout: "medium"  },
  };

  /* ---------- Random images ----------
     The 5 source images are repeated in a random order. Neighbouring slides never share an image, and a
     slide keeps its image once assigned (the sequence only grows when the slide count grows). */
  let seq = [];
  function imageFor(i) {
    while (seq.length <= i) {
      const prev = seq[seq.length - 1], prev2 = seq[seq.length - 2];
      let pick;
      do { pick = 1 + Math.floor(Math.random() * IMAGE_COUNT); } while (pick === prev || pick === prev2);
      seq.push(pick);
    }
    return seq[i];
  }

  /* ---------- Slides (virtualised: only slides near the viewport exist in the DOM) ---------- */
  const slides = new Map();
  const RENDER_RADIUS = 3;

  function buildTrack() {
    slides.forEach((el) => el.remove());
    slides.clear();
    track.style.width = state.count * 100 + "%";
  }

  function renderSlides(center) {
    const lo = Math.max(0, center - RENDER_RADIUS), hi = Math.min(state.count - 1, center + RENDER_RADIUS);
    for (const [i, el] of slides) if (i < lo || i > hi) { el.remove(); slides.delete(i); }
    for (let i = lo; i <= hi; i++) {
      if (slides.has(i)) continue;
      const el = document.createElement("div");
      el.className = "slide";
      el.style.left = (i * 100) / state.count + "%";
      el.style.width = 100 / state.count + "%";
      const img = document.createElement("img");
      img.src = `/carouselindicator/assets/images/slide-${imageFor(i)}.jpeg`;
      img.alt = `Slide ${i + 1} of ${state.count}`;
      img.draggable = false;
      el.appendChild(img);
      track.appendChild(el);
      slides.set(i, el);
    }
  }

  /* ---------- Indicator ----------
     Up to 6 slides: exactly the Figma variants.
       Scroll: the active item is a 16px pill, every other item is a 4px tertiary dot.
       Step:   items before the active one are filled 4px dots, the active item is a pill.
     More than 6 slides (Instagram style): a fixed window of 6 dots slides along with the active slide and
     the dots at an edge that still has more slides beyond it shrink. Hidden neighbours fade in and out. */
  const dots = new Map();
  let prevActive = null;

  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;              // restart the animation
    el.classList.add("bump");
    el.addEventListener("animationend", () => el.classList.remove("bump"), { once: true });
  }

  function dotEl(i) {
    let el = dots.get(i);
    if (!el) {
      el = document.createElement("span");
      el.className = "ci__dot";
      el.dataset.hidden = "true";
      const ink = document.createElement("i");
      ink.className = "ci__ink";
      el.appendChild(ink);
      ciTrack.appendChild(el);
      dots.set(i, el);
    }
    return el;
  }

  function renderIndicator() {
    const n = state.count, a = state.step - 1;
    const vis = Math.min(VISIBLE, n);
    const start = clamp(a - 3, 0, n - vis);
    const end = start + vis;                       // exclusive

    const widthOf = (i) => (i === a ? 16 : 4);
    // x position of every dot, relative to the first visible dot
    let x = 0;
    const xs = new Map();
    for (let i = start; i < end; i++) { xs.set(i, x); x += widthOf(i) + 4; }
    const trackW = x - 4;                          // sum of visible dots + gaps
    xs.set(end, x);                                // hidden neighbour after the window
    xs.set(start - 1, -8);                         // hidden neighbour before the window
    ciTrack.style.width = trackW + "px";

    // keep only the dots we need (visible window plus one hidden neighbour on each side)
    for (const [i, el] of dots) if (i < start - 1 || i > end) { el.remove(); dots.delete(i); }

    for (let i = Math.max(0, start - 1); i <= Math.min(n - 1, end); i++) {
      const el = dotEl(i);
      const inWindow = i >= start && i < end;
      const moreBefore = start > 0, moreAfter = end < n;
      const edge = inWindow && ((i === start && moreBefore) || (i === end - 1 && moreAfter)) && i !== a;
      let s = "idle";
      if (i === a) s = "active";
      else if (state.type === "Step" && i < a) s = "done";
      el.dataset.state = s;
      el.dataset.edge = String(edge);
      el.dataset.hidden = String(!inWindow);
      el.style.width = widthOf(i) + "px";
      el.style.transform = `translateX(${xs.get(i)}px) scale(${edge ? 0.5 : 1})`;
    }

    if (prevActive !== null && prevActive !== a) {
      [prevActive, a].forEach((i) => { const d = dots.get(i); if (d) bump(d); });
    }
    prevActive = a;

    indicator.dataset.timer = String(state.timer && state.step < state.count);
    indicator.dataset.type = state.type;
    indicator.dataset.step = String(state.step);
    indicator.dataset.onSurface = String(state.onSurface);
    indicator.setAttribute("aria-label", `Page ${state.step} of ${n}`);
    hero.dataset.onSurface = String(state.onSurface);
    counter.textContent = `${state.step}/${n}`;
  }

  function renderPanel() {
    typeSel.value = state.type;
    stepOut.textContent = String(state.step);
    decBtn.disabled = state.step <= 1;
    incBtn.disabled = state.step >= state.count;
    if (document.activeElement !== countIn) countIn.value = String(state.count);
    countDec.disabled = state.count <= MIN_COUNT;
    countInc.disabled = state.count >= MAX_COUNT;
    surfaceSw.setAttribute("aria-checked", String(state.onSurface));
    timerSw.setAttribute("aria-checked", String(state.timer));
    durRow.dataset.disabled = String(!state.timer);
    if (document.activeElement !== durIn) durIn.value = fmtSec(state.duration);
    durDec.disabled = state.duration <= MIN_DURATION;
    durInc.disabled = state.duration >= MAX_DURATION;
  }

  function render() {
    renderIndicator();
    renderPanel();
    renderSlides(state.step - 1);
    scheduleTimer();
  }

  /* ---------- Carousel <-> Step sync ---------- */
  let lockTarget = null, lockTimer = 0, tweenId = 0;
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function releaseLock() {
    clearTimeout(lockTimer);
    lockTarget = null;
    carousel.classList.remove("is-programmatic");
  }

  // Custom tween instead of native smooth scrolling: it works with scroll-snap in every browser and
  // is guaranteed to land on the target (a timeout finishes it even if animation frames are throttled).
  function scrollToStep(step, animate = true) {
    const target = (step - 1) * carousel.clientWidth;
    const from = carousel.scrollLeft;
    const id = ++tweenId;
    lockTarget = step - 1;
    clearTimeout(lockTimer);
    carousel.classList.add("is-programmatic");
    renderSlides(step - 1);

    const finish = () => {
      if (id !== tweenId) return;
      carousel.scrollLeft = target;
      releaseLock();
    };
    if (!animate || prefersReduced || from === target) { finish(); return; }

    const dur = SLIDE_MS, t0 = performance.now();
    lockTimer = setTimeout(finish, dur + 150);
    const tick = (now) => {
      if (id !== tweenId) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out cubic: visible start, glide, soft stop
      carousel.scrollLeft = from + (target - from) * e;
      if (t < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
  }

  ["pointerdown", "wheel", "touchstart"].forEach((ev) =>
    carousel.addEventListener(ev, () => { tweenId++; releaseLock(); }, { passive: true }));

  carousel.addEventListener("scroll", () => {
    const w = carousel.clientWidth;
    if (!w) return;
    const idx = clamp(Math.round(carousel.scrollLeft / w), 0, state.count - 1);
    renderSlides(idx);                               // keep neighbouring slides in the DOM while scrolling
    if (lockTarget !== null) {
      if (idx === lockTarget && Math.abs(carousel.scrollLeft - lockTarget * w) < 2) releaseLock();
      return;
    }
    if (idx + 1 !== state.step) { state.step = idx + 1; render(); }
  }, { passive: true });

  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { setStep(state.step + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft")  { setStep(state.step - 1); e.preventDefault(); }
  });

  function setStep(n, { scroll = true } = {}) {
    const next = clamp(n, 1, state.count);
    if (next === state.step) return;
    state.step = next;
    render();
    if (scroll) scrollToStep(next);
  }

  function setCount(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) { countIn.value = String(state.count); return; }
    const next = clamp(v, MIN_COUNT, MAX_COUNT);
    if (next === state.count) { countIn.value = String(next); return; }
    state.count = next;
    state.step = Math.min(state.step, next);
    buildTrack();
    render();
    scrollToStep(state.step, false);
    countIn.value = String(next);
  }

  /* ---------- Slide timer ----------
     With the timer on, the carousel advances every `duration` seconds and stops on the last slide
     (like Instagram it does not loop). Touching the carousel pauses it; any slide change restarts it. */
  let timerId = 0, fillId = 0, touching = false;
  const fmtSec = (n) => String(Math.round(n * 10) / 10);

  const activeInk = () => { const d = dots.get(state.step - 1); return d ? d.firstElementChild : null; };

  function resetInk() {
    dots.forEach((d) => { const k = d.firstElementChild; k.style.transition = "none"; k.style.width = "4px"; });
  }

  // One cycle = spring transition + hold (HOLD_MS), then the ink fills linearly, then the next slide.
  // The whole cycle lasts `duration` seconds, like the Step player's pace.
  function scheduleTimer() {
    clearTimeout(timerId); clearTimeout(fillId);
    resetInk();
    if (!state.timer || touching || state.step >= state.count) return;
    const fill = Math.max(state.duration * 1000 - HOLD_MS, 200);
    fillId = setTimeout(() => {
      const ink = activeInk();
      if (!ink) return;
      void ink.offsetWidth;
      ink.style.transition = `width ${fill}ms linear`;
      ink.style.width = "16px";
    }, HOLD_MS);
    timerId = setTimeout(() => setStep(state.step + 1), HOLD_MS + fill);
  }

  function setDuration(n) {
    const v = Number(String(n).replace(",", "."));
    if (!Number.isFinite(v)) { durIn.value = fmtSec(state.duration); return; }
    state.duration = clamp(Math.round(v * 10) / 10, MIN_DURATION, MAX_DURATION);
    durIn.value = fmtSec(state.duration);
    renderPanel();
    scheduleTimer();
  }

  carousel.addEventListener("pointerdown", () => { touching = true; clearTimeout(timerId); clearTimeout(fillId); resetInk(); });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    carousel.addEventListener(ev, () => { if (touching) { touching = false; scheduleTimer(); } }));

  /* ---------- Panel events ---------- */
  typeSel.addEventListener("change", () => { state.type = typeSel.value; render(); });
  decBtn.addEventListener("click", () => setStep(state.step - 1));
  incBtn.addEventListener("click", () => setStep(state.step + 1));
  countDec.addEventListener("click", () => setCount(state.count - 1));
  countInc.addEventListener("click", () => setCount(state.count + 1));
  countIn.addEventListener("change", () => setCount(countIn.value.replace(/[^\d]/g, "") || state.count));
  countIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") countIn.blur();
    if (e.key === "ArrowUp")   { setCount(state.count + 1); e.preventDefault(); }
    if (e.key === "ArrowDown") { setCount(state.count - 1); e.preventDefault(); }
  });
  countIn.addEventListener("blur", () => { countIn.value = String(state.count); });
  surfaceSw.addEventListener("click", () => { state.onSurface = !state.onSurface; render(); });
  timerSw.addEventListener("click", () => { state.timer = !state.timer; render(); });
  durDec.addEventListener("click", () => setDuration(state.duration - (state.duration > 10 ? 1 : 0.5)));
  durInc.addEventListener("click", () => setDuration(state.duration + (state.duration >= 10 ? 1 : 0.5)));
  durIn.addEventListener("change", () => setDuration(durIn.value));
  durIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") durIn.blur();
    if (e.key === "ArrowUp")   { setDuration(state.duration + 0.5); e.preventDefault(); }
    if (e.key === "ArrowDown") { setDuration(state.duration - 0.5); e.preventDefault(); }
  });
  durIn.addEventListener("blur", () => { durIn.value = fmtSec(state.duration); });
  $("reset").addEventListener("click", () => {
    Object.assign(state, DEFAULTS);
    seq = [];
    buildTrack();
    render();
    scrollToStep(state.step, false);
  });

  /* ---------- Stage controls ---------- */
  $("themeBtn").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    frame.dataset.theme = state.theme;
  });

  const ICONS = {
    phone:  '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/>',
    tablet: '<rect x="3" y="4" width="18" height="16" rx="2.5"/>',
  };
  $("deviceBtn").addEventListener("click", () => {
    state.device = state.device === "phone" ? "tablet" : "phone";
    $("deviceIcon").innerHTML = ICONS[state.device];
    frame.dataset.device = state.device;
    fit();
    requestAnimationFrame(() => scrollToStep(state.step, false));
    setTimeout(() => scrollToStep(state.step, false), 350);
  });

  /* ---------- Fit the device frame into the stage ---------- */
  function fit() {
    const d = DEVICES[state.device];
    const availW = stage.clientWidth - 120;
    const availH = stage.clientHeight - 80;
    const scale = Math.max(0.2, Math.min(1, availW / d.w, availH / d.h));
    frameWrap.style.width = d.w * scale + "px";
    frameWrap.style.height = d.h * scale + "px";
    frame.style.transformOrigin = "top left";
    frame.style.transform = `scale(${scale})`;
    caption.textContent = `${d.label} · ${d.w}×${d.h} · ${d.layout} layout · ${Math.round(scale * 100)}%`;
  }
  new ResizeObserver(fit).observe(stage);

  frame.dataset.device = state.device;
  fit();
  buildTrack();
  render();
})();
