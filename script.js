const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const glow = document.querySelector(".cursor-glow");
const bookingForm = document.querySelector("#bookingForm");
const paymentMethod = bookingForm?.querySelector('[name="payment_method"]');
const bookingPhotoField = document.querySelector("#bookingPhotoField");
const bookingPhotoInput = bookingPhotoField?.querySelector('input[type="file"]');
const bookingFormStatus = document.querySelector("#bookingFormStatus");

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
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const service = serviceSelect?.selectedOptions[0]?.textContent.trim() || "";
    const payment = String(data.get("payment_method") || "");
    const message = String(data.get("message") || "").trim();
    const photo = data.get("photo");
    const submitButton = bookingForm.querySelector('[type="submit"]');

    if (photo instanceof File && photo.size > 1_500_000) {
      bookingPhotoInput.setCustomValidity("حجم عکس باید حداکثر ۱٫۵ مگابایت باشد.");
      bookingPhotoInput.reportValidity();
      return;
    }
    if (photo instanceof File && photo.size && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      bookingPhotoInput.setCustomValidity("فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.");
      bookingPhotoInput.reportValidity();
      return;
    }

    bookingPhotoInput?.setCustomValidity("");
    if (bookingFormStatus) bookingFormStatus.textContent = "در حال ثبت امن درخواست…";
    if (submitButton) submitButton.disabled = true;
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;

    try {
      const response = await fetch("/api/bookings", { method: "POST", body: data, credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "ثبت درخواست انجام نشد.");

      const text = [
        "سلام، درخواست رزرو/مشاوره از وب‌سایت لنا بحری دارم.",
        `کد پیگیری: ${result.reference}`,
        `نام: ${name}`,
        `شماره تماس: ${phone}`,
        `خدمت موردنظر: ${service}`,
        `روش پرداخت/درخواست: ${payment === "cash" ? "رزرو با پرداخت نقدی و حضوری، پس از تأیید هماهنگی" : "درخواست مشاوره و هماهنگی"}`,
        message ? `توضیحات: ${message}` : "",
        photo instanceof File && photo.size ? "عکس در فرم سایت ثبت شده و از پنل مدیریت قابل مشاهده است." : ""
      ].filter(Boolean).join("\n");
      const whatsappUrl = `https://wa.me/989178280812?text=${encodeURIComponent(text)}`;
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else if (bookingFormStatus) {
        bookingFormStatus.textContent = `درخواست با کد ${result.reference} ثبت شد. `;
        const link = document.createElement("a");
        link.href = whatsappUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "برای اطلاع مدیر، ادامه در واتساپ";
        bookingFormStatus.append(link);
      }
      bookingForm.reset();
      updatePhotoRequirement();
      if (bookingFormStatus && whatsappWindow) bookingFormStatus.textContent = `درخواست با کد ${result.reference} ثبت شد؛ پیش‌نویس واتساپ باز شد. ارسال نهایی را در واتساپ تأیید کنید.`;
    } catch (error) {
      whatsappWindow?.close();
      if (bookingFormStatus) bookingFormStatus.textContent = error.message || "اتصال برقرار نشد؛ کمی بعد دوباره تلاش کنید.";
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
