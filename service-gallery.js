(async () => {
  const root = document.querySelector("[data-video-gallery]");
  const library = Array.isArray(window.LENA_VIDEO_LIBRARY) ? window.LENA_VIDEO_LIBRARY : [];
  if (!root || !library.length) return;
  const localeState = window.LenaLocale;
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const catalog = locale !== "fa" ? await (localeState?.catalogReady || new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve({ common: {} }), 2000);
    window.addEventListener("lena:locale-ready", () => {
      window.clearTimeout(timeout);
      resolve(window.LenaLocaleCatalog || { common: {} });
    }, { once: true });
  })) : { common: {} };
  if (locale !== "fa") {
    const common = catalog.common || {};
    const translateData = (value) => {
      if (typeof value === "string") return window.LenaLocale?.formatDigits(common[value] ?? value) ?? value;
      if (Array.isArray(value)) return value.map(translateData);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateData(item)]));
      return value;
    };
    for (let index = 0; index < library.length; index += 1) library[index] = translateData(library[index]);
  }
  const videoUi = {
    fa: { play: "پخش", pause: "توقف", playVideo: "پخش ویدیو", pauseVideo: "توقف ویدیو", video: "ویدیوی", of: "از" },
    en: { play: "Play", pause: "Pause", playVideo: "Play video", pauseVideo: "Pause video", video: "Video", of: "of" },
    ar: { play: "تشغيل", pause: "إيقاف", playVideo: "تشغيل الفيديو", pauseVideo: "إيقاف الفيديو", video: "الفيديو", of: "من" },
    zh: { play: "播放", pause: "暂停", playVideo: "播放视频", pauseVideo: "暂停视频", video: "视频", of: "/" }
  }[locale] || { play: "پخش", pause: "توقف", playVideo: "پخش ویدیو", pauseVideo: "توقف ویدیو", video: "ویدیوی", of: "از" };
  const numberLocale = { fa: "fa-IR", en: "en-US", ar: "ar", zh: "zh-CN" }[locale] || "fa-IR";

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

  const toLocalizedNumber = (value) => new Intl.NumberFormat(numberLocale, {
    useGrouping: false,
    minimumIntegerDigits: 2
  }).format(value);

  const updateToggle = () => {
    const isPaused = video.paused;
    toggle?.classList.toggle("is-playing", !isPaused);
    toggle?.setAttribute("aria-label", isPaused ? videoUi.playVideo : videoUi.pauseVideo);
    if (toggleLabel) toggleLabel.textContent = isPaused ? videoUi.play : videoUi.pause;
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
    current.textContent = toLocalizedNumber(currentIndex + 1);
    total.textContent = toLocalizedNumber(library.length);
    tags.replaceChildren(...item.tags.map((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      return span;
    }));
    progress.style.setProperty("--video-progress", `${((currentIndex + 1) / library.length) * 100}%`);
    if (announce) status.textContent = `${videoUi.video} ${toLocalizedNumber(currentIndex + 1)} ${videoUi.of} ${toLocalizedNumber(library.length)}: ${item.title}`;
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
