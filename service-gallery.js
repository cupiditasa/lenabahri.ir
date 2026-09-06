(() => {
  const root = document.querySelector("[data-video-gallery]");
  const library = Array.isArray(window.LENA_VIDEO_LIBRARY) ? window.LENA_VIDEO_LIBRARY : [];
  if (!root || !library.length) return;

  const preferredTopic = document.body.dataset.videoTopic || "";
  const relevantIndexes = library
    .map((item, index) => item.topics?.includes(preferredTopic) ? index : -1)
    .filter((index) => index >= 0);
  let currentIndex = relevantIndexes.length
    ? relevantIndexes[0]
    : Math.floor(Math.random() * library.length);

  const video = root.querySelector("video");
  const eyebrow = root.querySelector("[data-video-eyebrow]");
  const title = root.querySelector("[data-video-title]");
  const body = root.querySelector("[data-video-body]");
  const tags = root.querySelector("[data-video-tags]");
  const duration = root.querySelector("[data-video-duration]");
  const current = root.querySelector("[data-video-current]");
  const total = root.querySelector("[data-video-total]");
  const status = root.querySelector("[data-video-status]");
  const previous = root.querySelector("[data-video-previous]");
  const next = root.querySelector("[data-video-next]");
  const toggle = root.querySelector("[data-video-toggle]");
  const toggleLabel = toggle?.querySelector("span");
  const progress = root.querySelector("[data-video-progress]");
  let pointerStart = null;

  const toPersianNumber = (value) => new Intl.NumberFormat("fa-IR", {
    useGrouping: false,
    minimumIntegerDigits: 2
  }).format(value);

  const updateToggle = () => {
    const isPaused = video.paused;
    toggle?.classList.toggle("is-playing", !isPaused);
    toggle?.setAttribute("aria-label", isPaused ? "پخش ویدیو" : "توقف ویدیو");
    if (toggleLabel) toggleLabel.textContent = isPaused ? "پخش" : "توقف";
  };

  const render = (index, announce = true) => {
    currentIndex = (index + library.length) % library.length;
    const item = library[currentIndex];
    video.pause();
    video.src = item.video;
    video.poster = item.poster;
    video.load();
    eyebrow.textContent = item.eyebrow;
    title.textContent = item.title;
    body.textContent = item.body;
    duration.textContent = item.duration;
    current.textContent = toPersianNumber(currentIndex + 1);
    total.textContent = toPersianNumber(library.length);
    tags.replaceChildren(...item.tags.map((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      return span;
    }));
    progress.style.setProperty("--video-progress", `${((currentIndex + 1) / library.length) * 100}%`);
    if (announce) status.textContent = `ویدیوی ${currentIndex + 1} از ${library.length}: ${item.title}`;
    updateToggle();
  };

  const change = (step) => render(currentIndex + step);

  previous?.addEventListener("click", () => change(-1));
  next?.addEventListener("click", () => change(1));
  toggle?.addEventListener("click", () => video.paused ? video.play() : video.pause());
  video.addEventListener("click", () => video.paused ? video.play() : video.pause());
  video.addEventListener("play", updateToggle);
  video.addEventListener("pause", updateToggle);
  video.addEventListener("ended", () => change(1));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      change(1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      change(-1);
    }
  });

  root.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    pointerStart = event.clientX;
  });
  root.addEventListener("pointerup", (event) => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) > 55) change(delta < 0 ? 1 : -1);
  });
  root.addEventListener("pointercancel", () => { pointerStart = null; });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
  });

  render(currentIndex, false);
})();
