(() => {
  "use strict";

  const dashboard = document.getElementById("dashboard");
  const launcher = document.getElementById("tutorialButton");
  const menu = document.getElementById("tutorialMenu");
  const currentButton = document.getElementById("tutorialCurrent");
  const allButton = document.getElementById("tutorialAll");
  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const sections = [
    {
      key: "overview",
      name: "گزارش عملکرد",
      target: "#reportSummary",
      summary: "آمار رزروها و وضعیت کلی را در بازهٔ زمانی انتخابی ببینید.",
      steps: [
        { target: "#reportFrom", title: "بازهٔ گزارش را انتخاب کنید", text: "تاریخ شروع و پایان را تنظیم کنید؛ برای بارگذاری دوبارهٔ آمار، «به‌روزرسانی گزارش» را بزنید." },
        { target: "#reportSummary", title: "خلاصهٔ آمار را بخوانید", text: "تعداد درخواست‌ها، وضعیت‌ها و نرخ تأیید به‌صورت تجمیعی نمایش داده می‌شود؛ اطلاعات تماس مشتری در این گزارش نیست." }
      ]
    },
    {
      key: "bookings",
      name: "رزروها",
      target: "#searchInput",
      summary: "درخواست‌ها را پیدا کنید، وضعیتشان را پیگیری و جزئیات را بررسی کنید.",
      steps: [
        { target: "#searchInput", title: "درخواست را پیدا کنید", text: "با نام، شماره یا کد پیگیری جست‌وجو کنید؛ برای دیدن تازه‌ترین موارد، «تازه‌سازی» را بزنید." },
        { target: "#statusFilter", title: "وضعیت‌ها را فیلتر کنید", text: "رزروهای در انتظار، تأییدشده، انجام‌شده یا لغوشده را جدا ببینید؛ وضعیت هر درخواست از کارت همان رزرو تغییر می‌کند." },
        { target: "#bookingList", title: "جزئیات و یادداشت را بررسی کنید", text: "کارت رزرو، اطلاعات و پیوست‌های ارسالی را نشان می‌دهد؛ یادداشت داخلی برای ثبت پیگیری‌های تیم است." }
      ]
    },
    {
      key: "services",
      name: "خدمات و قیمت‌ها",
      target: "#serviceEditor",
      summary: "نام، توضیح، قیمت و وضعیت نمایش خدمات را ویرایش کنید.",
      steps: [
        { target: "#serviceEditor", title: "اطلاعات خدمت را ویرایش کنید", text: "فیلدهای هر خدمت و ترجمه‌های آن را با دقت تغییر دهید؛ قیمت‌ها برحسب تومان هستند." },
        { target: "#saveServices", title: "تغییرات را ذخیره کنید", text: "پس از بازبینی فیلدها، «ذخیرهٔ فهرست» را بزنید تا نسخهٔ عمومی خدمات به‌روز شود." }
      ]
    },
    {
      key: "portfolio",
      name: "نمونه‌کارها",
      target: "#mediaUpload",
      summary: "تصویر مجاز را بارگذاری و توضیحات گالری را مدیریت کنید.",
      steps: [
        { target: "#mediaUpload", title: "تصویر را با اجازه بارگذاری کنید", text: "فقط تصویر مجاز و متن جایگزین دقیق وارد کنید؛ تأیید اجازهٔ نمایش عمومی برای بارگذاری لازم است." },
        { target: "#portfolioEditor", title: "اطلاعات گالری را بازبینی کنید", text: "عنوان، توضیح، دسته‌بندی و وضعیت نمایش هر مورد را بررسی و اصلاح کنید." },
        { target: "#savePortfolio", title: "گالری را ذخیره کنید", text: "پس از بازبینی نهایی، «ذخیرهٔ گالری» را بزنید تا تغییرات اعمال شوند." }
      ]
    },
    {
      key: "news",
      name: "خبرها",
      target: "#newArticle",
      summary: "مقاله‌ها را ابتدا پیش‌نویس کنید و فقط پس از بررسی منبع منتشر کنید.",
      steps: [
        { target: "#newArticle", title: "پیش‌نویس تازه بسازید", text: "از «خبر تازه» شروع کنید؛ برای هر مقاله نشانی یکتا و محتوای کامل لازم است." },
        { target: "#newsSearch", title: "خبر موجود را پیدا کنید", text: "عنوان یا شناسه را جست‌وجو کنید و خبر مناسب را برای ویرایش انتخاب کنید." },
        { target: "#newsList", title: "پیش از انتشار راستی‌آزمایی کنید", text: "منبع مستقیم، ترجمه‌ها، تصویر و متن مقاله را بازبینی کنید؛ انتشار را فقط پس از تأیید صحت محتوا انجام دهید." }
      ]
    },
    {
      key: "comments",
      name: "دیدگاه‌ها",
      target: "#commentFilter",
      summary: "دیدگاه‌ها را بررسی کنید؛ فقط موارد تأییدشده عمومی می‌شوند.",
      steps: [
        { target: "#commentFilter", title: "صف دیدگاه‌ها را انتخاب کنید", text: "دیدگاه‌های منتظر، تأییدشده یا ردشده را از این فهرست جدا کنید." },
        { target: "#commentsList", title: "هر دیدگاه را مدیریت کنید", text: "متن را بررسی کنید و در صورت مناسب‌بودن تأیید یا در غیر این صورت رد کنید؛ موارد در انتظار برای عموم نمایش ندارند." }
      ]
    },
    {
      key: "settings",
      name: "تنظیمات سایت",
      target: "#settingsForm",
      summary: "شمارهٔ واتساپ، اطلاعیهٔ عمومی و بازبودن رزرو را تنظیم کنید.",
      steps: [
        { target: "#settingsForm", title: "تنظیمات را بازبینی کنید", text: "شمارهٔ واتساپ باید بین‌المللی و فقط شامل رقم باشد؛ اطلاعیهٔ عمومی اختیاری است." },
        { target: "[name='bookingsOpen']", title: "دریافت رزرو را کنترل کنید", text: "برای توقف موقت درخواست‌های جدید، گزینهٔ دریافت رزرو را خاموش و سپس تنظیمات را ذخیره کنید." }
      ]
    },
    {
      key: "activity",
      name: "سوابق تغییرات",
      target: "#activityList",
      summary: "عملیات مدیریتی و زمان انجام آن‌ها را برای پیگیری ببینید.",
      steps: [
        { target: "#activityList", title: "ردپای تغییرات را بررسی کنید", text: "سوابق، خلاصهٔ عملیات مدیریتی را نشان می‌دهد و متن سفارش یا اطلاعات تماس مشتری را ثبت نمی‌کند." }
      ]
    }
  ];
  const sectionByKey = new Map(sections.map((section) => [section.key, section]));
  const shade = document.createElement("div");
  shade.className = "tutorial-shade";
  shade.setAttribute("aria-hidden", "true");
  shade.hidden = true;
  const dialog = document.createElement("section");
  dialog.className = "tutorial-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "tutorialTitle");
  dialog.hidden = true;

  const closeButton = document.createElement("button");
  closeButton.className = "tutorial-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "بستن آموزش");
  closeButton.textContent = "×";
  const character = document.createElement("div");
  character.className = "tutorial-character";
  const characterImage = document.createElement("img");
  characterImage.src = "/assets/assistant/lena-character-v2.png";
  characterImage.alt = "ربات لنا";
  character.append(characterImage);
  const copy = document.createElement("div");
  copy.className = "tutorial-copy";
  const kicker = document.createElement("p");
  kicker.className = "tutorial-kicker";
  kicker.textContent = "راهنمای همراه لنا";
  const title = document.createElement("h2");
  title.id = "tutorialTitle";
  const description = document.createElement("p");
  copy.append(kicker, title, description);
  const footer = document.createElement("div");
  footer.className = "tutorial-footer";
  const progress = document.createElement("span");
  progress.className = "tutorial-progress";
  const actions = document.createElement("div");
  actions.className = "tutorial-actions";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "قبلی";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "tutorial-next";
  const finish = document.createElement("button");
  finish.type = "button";
  finish.className = "tutorial-next";
  finish.textContent = "پایان آموزش";
  actions.append(previous, next, finish);
  footer.append(progress, actions);
  dialog.append(closeButton, character, copy, footer);
  document.body.append(shade, dialog);

  let tour = null;
  let lastFocus = null;

  function activeSection() {
    return document.querySelector("[data-admin-tab][aria-selected='true']")?.dataset.adminTab || "overview";
  }

  function setSection(key) {
    const tab = tabs.find((item) => item.dataset.adminTab === key);
    if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
  }

  function closeMenu(restoreFocus = false) {
    menu.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    if (restoreFocus) launcher.focus();
  }

  function clearHighlights() {
    document.querySelectorAll(".is-tutorial-target").forEach((element) => element.classList.remove("is-tutorial-target"));
  }

  function renderStep() {
    if (!tour) return;
    const step = tour.steps[tour.index];
    setSection(step.section);
    clearHighlights();
    title.textContent = step.title;
    description.textContent = step.text;
    progress.textContent = sectionByKey.get(step.section).name + " · آموزش " + (tour.index + 1) + " از " + tour.steps.length;
    previous.disabled = tour.index === 0;
    previous.hidden = tour.index === 0;
    next.hidden = tour.index === tour.steps.length - 1;
    finish.hidden = tour.index !== tour.steps.length - 1;
    requestAnimationFrame(() => {
      if (!tour) return;
      const target = document.querySelector(step.target);
      const panel = document.querySelector('[data-admin-panel="' + step.section + '"]');
      const visibleTarget = target && !target.closest("[hidden]") ? target : panel;
      if (visibleTarget) {
        visibleTarget.classList.add("is-tutorial-target");
        visibleTarget.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center", inline: "nearest" });
      }
    });
  }

  function endTour() {
    if (!tour) return;
    const restoreSection = tour.originalSection;
    tour = null;
    clearHighlights();
    shade.hidden = true;
    dialog.hidden = true;
    if (restoreSection) setSection(restoreSection);
    const focusTarget = lastFocus;
    lastFocus = null;
    if (focusTarget?.isConnected && !dashboard.hidden) focusTarget.focus();
  }

  function startTour(mode) {
    const originalSection = activeSection();
    const selected = sectionByKey.get(originalSection) || sections[0];
    const steps = mode === "all"
      ? sections.map((section) => ({ section: section.key, target: section.target, title: section.name, text: section.summary }))
      : selected.steps.map((step) => ({ ...step, section: selected.key }));
    closeMenu();
    lastFocus = launcher;
    tour = { originalSection, steps, index: 0 };
    shade.hidden = false;
    dialog.hidden = false;
    renderStep();
    next.focus();
  }

  launcher.addEventListener("click", () => {
    const shouldOpen = menu.hidden;
    menu.hidden = !shouldOpen;
    launcher.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) currentButton.focus();
  });
  currentButton.addEventListener("click", () => startTour("current"));
  allButton.addEventListener("click", () => startTour("all"));
  previous.addEventListener("click", () => {
    if (!tour || tour.index === 0) return;
    tour.index -= 1;
    renderStep();
  });
  next.addEventListener("click", () => {
    if (!tour) return;
    tour.index += 1;
    renderStep();
  });
  finish.addEventListener("click", endTour);
  closeButton.addEventListener("click", endTour);
  document.getElementById("logoutButton").addEventListener("click", () => {
    closeMenu();
    endTour();
  });
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !event.target.closest(".admin-header-actions")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (tour) {
        event.preventDefault();
        endTour();
      } else if (!menu.hidden) {
        event.preventDefault();
        closeMenu(true);
      }
      return;
    }
    if (!tour || event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll("button:not([hidden]):not(:disabled)")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener("lena:admin-ready", () => {
    if (!dashboard.hidden && !launcher.hidden) {
      closeMenu();
      launcher.setAttribute("aria-expanded", "false");
    }
  });
})();
