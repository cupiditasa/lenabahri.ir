const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const glow = document.querySelector(".cursor-glow");
const bookingForm = document.querySelector("#bookingForm");

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
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(bookingForm);
    const name = data.get("name").trim();
    const phone = data.get("phone").trim();
    const service = data.get("service");
    const message = data.get("message").trim();

    const text = [
      "سلام، برای مشاوره و رزرو وقت پیام می‌دهم.",
      `نام: ${name}`,
      `شماره تماس: ${phone}`,
      `خدمت موردنظر: ${service}`,
      message ? `توضیحات: ${message}` : ""
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/989178280812?text=${encodeURIComponent(text)}`, "_blank", "noopener");
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
