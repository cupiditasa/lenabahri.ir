const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const glow = document.querySelector(".cursor-glow");
const bookingForm = document.querySelector("#bookingForm");
const paymentMethod = bookingForm?.querySelector('[name="payment_method"]');
const bookingPhotoField = document.querySelector("#bookingPhotoField");
const bookingPhotoInput = bookingPhotoField?.querySelector('input[type="file"]');
const bookingFormStatus = document.querySelector("#bookingFormStatus");
const siteLocale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
const bookingMessages = {
  fa: {
    photoSize: "حجم عکس باید حداکثر ۱٫۵ مگابایت باشد.",
    photoType: "فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.",
    submitting: "در حال ثبت امن درخواست…",
    failed: "ثبت درخواست انجام نشد.",
    success: (reference) => `درخواست شما با کد پیگیری ${reference} در سایت ثبت شد و برای مدیر در پنل مدیریت قرار گرفت. این پیام تأیید ثبت درخواست است؛ هماهنگی نهایی پس از بررسی انجام می‌شود.`,
    connection: "اتصال برقرار نشد؛ کمی بعد دوباره تلاش کنید.",
    errors: {
      400: "اطلاعات فرم را بررسی کنید و دوباره تلاش کنید.",
      401: "نشست شما معتبر نیست؛ صفحه را تازه‌سازی کنید.",
      403: "درخواست معتبر نیست؛ صفحه را تازه‌سازی کنید.",
      413: "حجم عکس یا درخواست بیشتر از حد مجاز است.",
      415: "فرمت عکس پشتیبانی نمی‌شود؛ JPG، PNG یا WebP انتخاب کنید.",
      429: "درخواست‌های زیادی ارسال شده؛ کمی بعد دوباره تلاش کنید.",
      503: "سامانه رزرو موقتاً آماده نیست؛ کمی بعد دوباره تلاش کنید."
    }
  },
  en: {
    photoSize: "The photo must be no larger than 1.5 MB.",
    photoType: "Please upload a JPG, PNG, or WebP image.",
    submitting: "Submitting your request securely…",
    failed: "We could not submit your request.",
    success: (reference) => `Your request was submitted to the website and is available to the manager in the admin panel. Reference: ${reference}. This confirms receipt; final coordination follows review.`,
    connection: "Could not connect. Please try again shortly.",
    errors: {
      400: "Please check the form details and try again.",
      401: "Your session is invalid. Refresh the page and try again.",
      403: "The request could not be verified. Refresh the page and try again.",
      413: "The photo or request exceeds the allowed size.",
      415: "Unsupported photo format. Choose JPG, PNG, or WebP.",
      429: "Too many requests. Please try again shortly.",
      503: "Booking is temporarily unavailable. Please try again shortly."
    }
  },
  ar: {
    photoSize: "يجب ألا يتجاوز حجم الصورة 1.5 ميغابايت.",
    photoType: "يرجى رفع صورة بصيغة JPG أو PNG أو WebP.",
    submitting: "جارٍ إرسال طلبك بأمان…",
    failed: "تعذّر إرسال الطلب.",
    success: (reference) => `تم تسجيل طلبك في الموقع وإتاحته للمديرة في لوحة الإدارة. رقم المتابعة: ${reference}. تؤكد هذه الرسالة استلام الطلب، وسيتم التنسيق النهائي بعد مراجعته.`,
    connection: "تعذّر الاتصال. يرجى المحاولة بعد قليل.",
    errors: {
      400: "يرجى مراجعة بيانات النموذج والمحاولة مجدداً.",
      401: "الجلسة غير صالحة. حدّثي الصفحة ثم حاولي مجدداً.",
      403: "تعذّر التحقق من الطلب. حدّثي الصفحة ثم حاولي مجدداً.",
      413: "حجم الصورة أو الطلب يتجاوز الحد المسموح.",
      415: "صيغة الصورة غير مدعومة. اختاري JPG أو PNG أو WebP.",
      429: "تم إرسال طلبات كثيرة. يرجى المحاولة بعد قليل.",
      503: "الحجوزات غير متاحة مؤقتاً. يرجى المحاولة بعد قليل."
    }
  },
  zh: {
    photoSize: "照片大小不能超过 1.5 MB。",
    photoType: "请上传 JPG、PNG 或 WebP 格式的图片。",
    submitting: "正在安全提交您的请求…",
    failed: "无法提交请求。",
    success: (reference) => `您的申请已提交至网站，管理员可在后台查看。查询编号：${reference}。此消息确认网站已收到申请；最终安排将在审核后协调。`,
    connection: "连接失败，请稍后重试。",
    errors: {
      400: "请检查表单信息后重试。",
      401: "会话无效，请刷新页面后重试。",
      403: "无法验证此请求，请刷新页面后重试。",
      413: "照片或请求内容超过允许大小。",
      415: "不支持此图片格式，请选择 JPG、PNG 或 WebP。",
      429: "请求过于频繁，请稍后重试。",
      503: "预约服务暂时不可用，请稍后重试。"
    }
  }
};
const bookingCopy = bookingMessages[siteLocale] || bookingMessages.fa;

// Cloudflare Web Analytics RUM beacon (site token configured for lenabahri.ir).
// Inject once from the shared script so every static page is measured consistently.
if (!document.querySelector('script[data-lena-cf-analytics]')) {
  const analyticsScript = document.createElement("script");
  analyticsScript.type = "module";
  analyticsScript.src = "https://static.cloudflareinsights.com/beacon.min.js";
  analyticsScript.dataset.cfBeacon = JSON.stringify({ token: "059abd4ecd4c4c779af40a804df79e75" });
  analyticsScript.dataset.lenaCfAnalytics = "true";
  document.head.appendChild(analyticsScript);
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 30);
}, { passive: true });

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
  revealObserver.observe(element);
});

document.querySelectorAll(".service-card").forEach((card) => {
  const target = card.querySelector(".card-arrow")?.getAttribute("href");
  if (!target) return;
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "link");
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    window.location.href = target;
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = target;
    }
  });
});

document.querySelectorAll(".video-service-tile video").forEach((video) => {
  const tile = video.closest(".video-service-tile");
  tile?.addEventListener("pointerenter", () => video.play().catch(() => {}));
  tile?.addEventListener("pointerleave", () => { video.pause(); video.currentTime = 0; });
});

if (glow) {
  window.addEventListener("mousemove", (event) => {
    glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    glow.style.opacity = "1";
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });

  window.addEventListener("blur", () => {
    glow.style.opacity = "0";
  });

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(5px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
}

if (bookingForm) {
  const serviceSelect = bookingForm.querySelector('[name="service"]');
  const bookingQuery = new URLSearchParams(window.location.search);
  const requestedService = bookingQuery.get("service");
  const requestedPayment = bookingQuery.get("payment");
  if (requestedService && serviceSelect) {
    serviceSelect.value = requestedService;
  }
  if (requestedPayment && paymentMethod && ["cash", "consult"].includes(requestedPayment)) {
    paymentMethod.value = requestedPayment;
  }

  const updatePhotoRequirement = () => {
    const cashBooking = paymentMethod?.value === "cash";
    if (bookingPhotoField) bookingPhotoField.hidden = !cashBooking;
    if (bookingPhotoInput) {
      bookingPhotoInput.required = cashBooking;
      if (!cashBooking) {
        bookingPhotoInput.setCustomValidity("");
        bookingPhotoInput.value = "";
      }
    }
  };

  paymentMethod?.addEventListener("change", updatePhotoRequirement);
  bookingPhotoInput?.addEventListener("change", () => bookingPhotoInput.setCustomValidity(""));
  updatePhotoRequirement();

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(bookingForm);
    const photo = data.get("photo");
    const submitButton = bookingForm.querySelector('[type="submit"]');

    if (photo instanceof File && photo.size > 1_500_000) {
      bookingPhotoInput.setCustomValidity(bookingCopy.photoSize);
      bookingPhotoInput.reportValidity();
      return;
    }
    if (photo instanceof File && photo.size && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      bookingPhotoInput.setCustomValidity(bookingCopy.photoType);
      bookingPhotoInput.reportValidity();
      return;
    }

    bookingPhotoInput?.setCustomValidity("");
    if (bookingFormStatus) bookingFormStatus.textContent = bookingCopy.submitting;
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await fetch("/api/bookings", { method: "POST", body: data, credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(bookingCopy.errors[response.status] || (siteLocale === "fa" ? result.error : "") || bookingCopy.failed);
      }
      window.dispatchEvent(new Event("lena:booking-submitted"));

      if (bookingFormStatus) bookingFormStatus.textContent = bookingCopy.success(result.reference);
      bookingForm.reset();
      updatePhotoRequirement();
    } catch (error) {
      if (bookingFormStatus) bookingFormStatus.textContent = error.message || bookingCopy.connection;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

const resultCards = document.querySelectorAll("[data-result-card]");
const finePointer = window.matchMedia("(pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function closeResultMenus(exceptCard) {
  resultCards.forEach((card) => {
    if (card === exceptCard) return;
    card.classList.remove("is-menu-open");
    const trigger = card.querySelector(".result-card__trigger");
    const menu = card.querySelector(".result-card__menu");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (menu) menu.setAttribute("aria-hidden", "true");
  });
}

resultCards.forEach((card) => {
  const surface = card.querySelector(".result-card__surface");
  const trigger = card.querySelector(".result-card__trigger");
  const menu = card.querySelector(".result-card__menu");
  const previousButton = card.querySelector(".result-card__nav-button--previous");
  const nextButton = card.querySelector(".result-card__nav-button--next");
  const progressLabels = card.querySelectorAll(".result-card__nav-progress b");
  let pointerStart = null;
  let pointerDelta = 0;
  let dragged = false;
  let activeView = 0;

  const resetTilt = () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
  };

  const toggleResultMenu = () => {
    const willOpen = !card.classList.contains("is-menu-open");
    closeResultMenus(willOpen ? card : null);
    card.classList.toggle("is-menu-open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
    menu.setAttribute("aria-hidden", String(!willOpen));
  };

  const setView = (view, direction = 0) => {
    activeView = Math.max(0, Math.min(1, view));
    card.classList.toggle("is-secondary", activeView === 1);
    card.classList.remove("slide-next", "slide-previous");
    if (direction > 0) card.classList.add("slide-next");
    if (direction < 0) card.classList.add("slide-previous");
    progressLabels.forEach((label, index) => {
      label.setAttribute("aria-current", index === activeView ? "true" : "false");
    });
    window.setTimeout(() => card.classList.remove("slide-next", "slide-previous"), 420);
  };

  const changeView = (direction) => {
    const nextView = (activeView + (direction > 0 ? 1 : -1) + 2) % 2;
    setView(nextView, direction);
  };

  setView(0);

  surface.addEventListener("pointermove", (event) => {
    if (finePointer.matches && !reducedMotion.matches) {
      const rect = surface.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    }

    if (pointerStart) {
      pointerDelta = event.clientX - pointerStart.x;
      if (Math.abs(pointerDelta) > 8) {
        dragged = true;
        card.classList.add("is-dragging");
      }
    }
  });

  surface.addEventListener("pointerleave", () => {
    if (pointerStart) return;
    pointerStart = null;
    pointerDelta = 0;
    dragged = false;
    card.classList.remove("is-dragging");
    resetTilt();
  });

  surface.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".result-card__trigger, .result-card__nav-button, .result-card__menu")) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    pointerDelta = 0;
    dragged = false;
    surface.setPointerCapture?.(event.pointerId);
  });

  const finishPress = (event) => {
    if (!pointerStart) return;
    const threshold = Math.min(58, surface.clientWidth * 0.16);
    if (Math.abs(pointerDelta) >= threshold) {
      changeView(pointerDelta < 0 ? 1 : -1);
      if (navigator.vibrate) navigator.vibrate(12);
    } else if (!dragged && event?.type === "pointerup") {
      const rect = surface.getBoundingClientRect();
      const isLeftHalf = event.clientX < rect.left + rect.width / 2;
      changeView(isLeftHalf ? -1 : 1);
    }
    pointerStart = null;
    pointerDelta = 0;
    window.setTimeout(() => {
      dragged = false;
      card.classList.remove("is-dragging");
    }, 30);
  };

  surface.addEventListener("pointerup", finishPress);
  surface.addEventListener("pointercancel", finishPress);

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleResultMenu();
  });

  previousButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    changeView(-1);
  });

  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    changeView(1);
  });

  surface.setAttribute("tabindex", "0");
  surface.setAttribute("role", "group");
  surface.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeView(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeView(1);
    }
  });

  menu.addEventListener("click", () => closeResultMenus());
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-result-card]")) closeResultMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeResultMenus();
});
