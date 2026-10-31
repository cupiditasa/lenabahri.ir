 (async () => {
  const data = window.LENA_GALLERY;
  if (!data) return;
  const staticProjects = data.projects || [];
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  try {
    const response = await fetch("/api/public/content/portfolio", { cache: "no-cache" });
    if (response.ok) {
      const { content } = await response.json();
      if (content) {
        const cmsProjects = Array.isArray(content.projects) ? content.projects : null;
        Object.assign(data, content);
        if (cmsProjects) {
          const additions = staticProjects.filter((project) => project.id >= 14);
          const additionIds = new Set(additions.map((project) => project.id));
          const cmsById = new Map(cmsProjects.map((project) => [project.id, project]));
          data.projects = [
            ...additions.map((project) => ({ ...project, ...(cmsById.get(project.id) || {}) })),
            ...cmsProjects.filter((project) => !additionIds.has(project.id))
          ];
        }
      }
    }
  } catch {}
  const language = ["fa", "en", "ar", "zh"].includes(locale) ? locale : "fa";
  for (const item of [...(data.projects || []), ...(data.awards || []), ...(data.people || [])]) {
    if (item.translations?.[language]) Object.assign(item, item.translations[language]);
  }
  data.projects = (data.projects || []).filter((item) => item.active !== false);
  data.projects = data.projects.filter((item) => {
    if (String(item.image || "").endsWith("/work-02.jpg")) return false;
    if (String(item.detailImage || "").endsWith("/work-02.jpg")) delete item.detailImage;
    return true;
  });
  data.awards = (data.awards || []).filter((item) => item.active !== false);
  data.people = (data.people || []).filter((item) => item.active !== false);
  if (locale !== "fa") {
    let catalog = await window.LenaLocale?.catalogReady;
    if (!catalog) {
      catalog = await new Promise((resolve) => {
        const timeout = window.setTimeout(() => resolve({ common: {} }), 2000);
        window.addEventListener("lena:locale-ready", () => {
          window.clearTimeout(timeout);
          resolve(window.LenaLocaleCatalog || { common: {} });
        }, { once: true });
      });
    }
    const common = catalog.common || {};
    const translateData = (value) => {
      if (typeof value === "string") return window.LenaLocale?.formatDigits(common[value] ?? value) ?? value;
      if (Array.isArray(value)) return value.map(translateData);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateData(item)]));
      return value;
    };
    Object.assign(data, translateData(data));
  }

  const body = document.body;
  const motionToggle = document.querySelector("#motionToggle");
  const storedMotion = localStorage.getItem("lena-reduced-motion");
  if (storedMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    body.classList.add("reduced-motion");
  }

  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(body.classList.contains("reduced-motion")));
    motionToggle.addEventListener("click", () => {
      const enabled = body.classList.toggle("reduced-motion");
      motionToggle.setAttribute("aria-pressed", String(enabled));
      localStorage.setItem("lena-reduced-motion", String(enabled));
    });
  }

  const rail = document.querySelector("#galleryRail");
  const filters = document.querySelector("#galleryFilters");
  const currentLabel = document.querySelector("#galleryCurrent");
  const totalLabel = document.querySelector("#galleryTotal");
  const progress = document.querySelector("#galleryProgress");
  const archiveGrid = document.querySelector("#archiveGrid");
  const loadMore = document.querySelector("#loadMore");
  const modal = document.querySelector("#projectModal");
  const photoViewer = document.querySelector("#photoViewer");
  const photoViewerImage = document.querySelector("#photoViewerImage");
  const photoViewerTitle = document.querySelector("#photoViewerTitle");
  const photoViewerCurrent = document.querySelector("#photoViewerCurrent");
  const photoViewerTotal = document.querySelector("#photoViewerTotal");
  let category = "all";
  let currentIndex = 0;
  let visibleArchive = 6;
  let dragStart = null;
  let railDragPointer = null;
  let railWasDragged = false;
  let modalSlide = 0;
  let modalDragPointer = null;
  let modalDragStart = 0;
  let modalDragDistance = 0;
  let photoViewerIndex = 0;
  let photoViewerTrigger = null;
  let photoViewerPointer = null;
  let photoViewerStartX = 0;

  const filteredProjects = () => data.projects.filter((project) => category === "all" || project.category === category);

  function setCardPositions() {
    if (!rail) return;
    const cards = [...rail.querySelectorAll(".museum-card")];
    cards.forEach((card, index) => {
      let offset = index - currentIndex;
      const length = cards.length;
      if (offset > length / 2) offset -= length;
      if (offset < -length / 2) offset += length;
      card.style.setProperty("--offset", offset);
      card.style.setProperty("--abs-offset", Math.abs(offset));
      card.style.zIndex = String(20 - Math.abs(offset));
      card.setAttribute("aria-hidden", String(Math.abs(offset) > 2));
      card.tabIndex = offset === 0 ? 0 : -1;
      const image = card.querySelector("img");
      if (image) image.tabIndex = Math.abs(offset) <= 2 ? 0 : -1;
    });
    if (currentLabel) currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
    if (totalLabel) totalLabel.textContent = String(cards.length).padStart(2, "0");
    if (progress) progress.style.setProperty("--progress", `${((currentIndex + 1) / cards.length) * 100}%`);
  }

  function renderRail() {
    if (!rail) return;
    const projects = filteredProjects();
    if (currentIndex >= projects.length) currentIndex = 0;
    rail.innerHTML = projects.map((project, index) => `
      <article class="museum-card" data-project="${project.id}" aria-label="${escapeHtml(project.title)}">
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" role="button" aria-label="${escapeHtml(project.title)}" tabindex="-1" draggable="false" ${index > 2 ? 'loading="lazy"' : ""}>
        <div class="museum-card-copy">
          <span>${escapeHtml(project.subtitle)}</span>
          <strong>${escapeHtml(project.title)}</strong>
        </div>
      </article>
    `).join("");
    rail.querySelectorAll(".museum-card").forEach((card) => {
      const image = card.querySelector("img");
      image?.addEventListener("pointerdown", (event) => event.stopPropagation());
      image?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!railWasDragged) openPhotoViewer(Number(card.dataset.project), image);
      });
      image?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        openPhotoViewer(Number(card.dataset.project), image);
      });
      card.addEventListener("click", () => {
        if (!railWasDragged) openProject(Number(card.dataset.project));
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") openProject(Number(card.dataset.project));
      });
    });
    setCardPositions();
  }

  function move(direction) {
    const length = filteredProjects().length;
    currentIndex = (currentIndex + direction + length) % length;
    setCardPositions();
  }

  document.querySelector("#galleryNext")?.addEventListener("click", () => move(1));
  document.querySelector("#galleryPrev")?.addEventListener("click", () => move(-1));

  if (rail) {
    rail.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragStart = event.clientX;
      railDragPointer = event.pointerId;
      railWasDragged = false;
      rail.classList.add("is-dragging");
      rail.setPointerCapture?.(event.pointerId);
    });
    rail.addEventListener("pointermove", (event) => {
      if (event.pointerId !== railDragPointer || dragStart === null) return;
      if (Math.abs(event.clientX - dragStart) > 8) railWasDragged = true;
    });
    const endRailDrag = (event) => {
      if (event.pointerId !== railDragPointer || dragStart === null) return;
      const distance = event.clientX - dragStart;
      if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
      dragStart = null;
      railDragPointer = null;
      rail.classList.remove("is-dragging");
      if (rail.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      window.setTimeout(() => { railWasDragged = false; }, 0);
    };
    rail.addEventListener("pointerup", endRailDrag);
    rail.addEventListener("pointercancel", endRailDrag);
  }

  if (filters) {
    filters.innerHTML = data.categories.map((item) => `
      <button class="filter-button ${item.id === "all" ? "active" : ""}" type="button" data-category="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>
    `).join("");
    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-button");
      if (!button) return;
      category = button.dataset.category;
      currentIndex = 0;
      filters.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
      renderRail();
    });
  }

  function renderArchive() {
    if (!archiveGrid) return;
    archiveGrid.innerHTML = data.projects.slice(0, visibleArchive).map((project) => `
      <article class="archive-card" data-project="${project.id}" tabindex="0">
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" role="button" aria-label="${escapeHtml(project.title)}" tabindex="0" draggable="false" loading="lazy">
        <div><small>${escapeHtml(project.subtitle)}</small><strong>${escapeHtml(project.title)}</strong></div>
      </article>
    `).join("");
    archiveGrid.querySelectorAll(".archive-card").forEach((card) => {
      const image = card.querySelector("img");
      image?.addEventListener("click", (event) => {
        event.stopPropagation();
        openPhotoViewer(Number(card.dataset.project), image);
      });
      image?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        openPhotoViewer(Number(card.dataset.project), image);
      });
      card.addEventListener("click", () => openProject(Number(card.dataset.project)));
      card.addEventListener("keydown", (event) => {
        if (event.target === card && (event.key === "Enter" || event.key === " ")) openProject(Number(card.dataset.project));
      });
    });
    if (loadMore) loadMore.hidden = visibleArchive >= data.projects.length;
  }

  loadMore?.addEventListener("click", () => {
    visibleArchive += 6;
    renderArchive();
  });

  const modalMedia = modal?.querySelector("#modalMedia");
  const modalMediaTrack = modal?.querySelector("#modalMediaTrack");
  const modalMediaCurrent = modal?.querySelector("#modalMediaCurrent");

  const setModalSlide = (nextSlide, animate = true) => {
    const slideCount = modalMedia?.querySelectorAll(".modal-shot:not([hidden])").length || 1;
    modalSlide = ((nextSlide % slideCount) + slideCount) % slideCount;
    if (modalMediaTrack) {
      modalMediaTrack.classList.toggle("without-transition", !animate);
      modalMediaTrack.style.transform = `translate3d(${-modalSlide * 50}%, 0, 0)`;
    }
    if (modalMediaCurrent) modalMediaCurrent.textContent = window.LenaLocale?.formatDigits(modalSlide + 1) || String(modalSlide + 1);
    modalMedia?.querySelectorAll(".modal-shot").forEach((shot, index) => {
      shot.setAttribute("aria-hidden", String(index !== modalSlide));
    });
  };

  const moveModal = (direction) => setModalSlide(modalSlide + direction);

  const formatViewerNumber = (value) => window.LenaLocale?.formatDigits(String(value)) || String(value);

  function updatePhotoViewer() {
    if (!photoViewer || !data.projects.length) return;
    const project = data.projects[photoViewerIndex];
    photoViewerImage.src = project.image;
    photoViewerImage.alt = project.title;
    photoViewerTitle.textContent = project.title;
    photoViewerCurrent.textContent = formatViewerNumber(photoViewerIndex + 1);
    photoViewerTotal.textContent = formatViewerNumber(data.projects.length);
  }

  function openPhotoViewer(id, trigger) {
    if (!photoViewer) return;
    const index = data.projects.findIndex((project) => project.id === id);
    if (index < 0) return;
    photoViewerIndex = index;
    photoViewerTrigger = trigger || document.activeElement;
    updatePhotoViewer();
    photoViewer.classList.add("open");
    photoViewer.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    photoViewer.querySelector("#photoViewerClose")?.focus();
  }

  function movePhotoViewer(direction) {
    if (!data.projects.length) return;
    photoViewerIndex = (photoViewerIndex + direction + data.projects.length) % data.projects.length;
    updatePhotoViewer();
  }

  function closePhotoViewer() {
    if (!photoViewer) return;
    photoViewer.classList.remove("open");
    photoViewer.setAttribute("aria-hidden", "true");
    photoViewerImage?.removeAttribute("src");
    body.style.overflow = "";
    if (photoViewerTrigger?.isConnected) photoViewerTrigger.focus();
    photoViewerTrigger = null;
  }

  photoViewer?.querySelector("#photoViewerClose")?.addEventListener("click", closePhotoViewer);
  photoViewer?.querySelector("#photoViewerBackdrop")?.addEventListener("click", closePhotoViewer);
  photoViewer?.querySelector("#photoViewerPrevious")?.addEventListener("click", () => movePhotoViewer(-1));
  photoViewer?.querySelector("#photoViewerNext")?.addEventListener("click", () => movePhotoViewer(1));

  const photoViewerMedia = photoViewer?.querySelector("#photoViewerMedia");
  photoViewerMedia?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    photoViewerPointer = event.pointerId;
    photoViewerStartX = event.clientX;
    photoViewerMedia.setPointerCapture?.(event.pointerId);
  });
  const endPhotoViewerSwipe = (event) => {
    if (event.pointerId !== photoViewerPointer) return;
    const distance = event.clientX - photoViewerStartX;
    photoViewerPointer = null;
    if (photoViewerMedia.hasPointerCapture?.(event.pointerId)) photoViewerMedia.releasePointerCapture(event.pointerId);
    if (Math.abs(distance) >= Math.min(72, photoViewerMedia.clientWidth * .12)) {
      movePhotoViewer(distance < 0 ? 1 : -1);
    }
  };
  photoViewerMedia?.addEventListener("pointerup", endPhotoViewerSwipe);
  photoViewerMedia?.addEventListener("pointercancel", endPhotoViewerSwipe);

  function openProject(id, syncHash = true) {
    if (!modal) return;
    const project = data.projects.find((item) => item.id === id);
    if (!project) return;
    if (syncHash && window.location.hash !== `#project-${id}`) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#project-${id}`);
    }
    modal.querySelector("#modalImageMain").src = project.image;
    const detailImage = modal.querySelector("#modalImageDetail");
    const detailShot = detailImage.closest(".modal-shot");
    detailShot.hidden = !project.detailImage;
    if (project.detailImage) detailImage.src = project.detailImage;
    else detailImage.removeAttribute("src");
    modalMedia.classList.toggle("single-shot", !project.detailImage);
    modal.querySelectorAll(".modal-media-arrow, .modal-media-status, .modal-swipe-note").forEach((control) => {
      control.hidden = !project.detailImage;
    });
    modal.querySelector("#modalCategory").textContent = project.subtitle;
    modal.querySelector("#modalTitle").textContent = project.title;
    modal.querySelector("#modalDescription").textContent = project.description;
    modal.querySelector("#modalTechnique").textContent = project.technique;
    modal.querySelector("#modalDuration").textContent = project.duration;
    setModalSlide(0, false);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    modal.querySelector(".modal-close").focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    if (/^#project-\d+$/.test(window.location.hash)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  modal?.querySelector(".modal-close")?.addEventListener("click", closeModal);
  modal?.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);
  modal?.querySelector(".modal-media-arrow.prev")?.addEventListener("click", () => moveModal(-1));
  modal?.querySelector(".modal-media-arrow.next")?.addEventListener("click", () => moveModal(1));

  modalMedia?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    modalDragPointer = event.pointerId;
    modalDragStart = event.clientX;
    modalDragDistance = 0;
    modalMedia.classList.add("is-dragging");
    modalMedia.setPointerCapture?.(event.pointerId);
  });
  modalMedia?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== modalDragPointer) return;
    modalDragDistance = event.clientX - modalDragStart;
    const width = Math.max(1, modalMedia.clientWidth);
    const base = -modalSlide * 50;
    const resistance = modalDragDistance / width * 42;
    modalMediaTrack?.classList.add("without-transition");
    if (modalMediaTrack) modalMediaTrack.style.transform = `translate3d(${base + resistance}%, 0, 0)`;
  });
  const endModalDrag = (event) => {
    if (event.pointerId !== modalDragPointer) return;
    const threshold = Math.min(72, modalMedia.clientWidth * .12);
    modalMedia.classList.remove("is-dragging");
    if (modalMedia.hasPointerCapture?.(event.pointerId)) modalMedia.releasePointerCapture(event.pointerId);
    modalDragPointer = null;
    if (Math.abs(modalDragDistance) >= threshold) {
      moveModal(modalDragDistance < 0 ? 1 : -1);
    } else {
      setModalSlide(modalSlide);
    }
  };
  modalMedia?.addEventListener("pointerup", endModalDrag);
  modalMedia?.addEventListener("pointercancel", endModalDrag);

  window.addEventListener("keydown", (event) => {
    if (photoViewer?.classList.contains("open")) {
      if (event.key === "Escape") closePhotoViewer();
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movePhotoViewer(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        movePhotoViewer(1);
      }
      return;
    }
    if (event.key === "Escape") closeModal();
    if (modal?.classList.contains("open") && event.key === "ArrowLeft") moveModal(-1);
    if (modal?.classList.contains("open") && event.key === "ArrowRight") moveModal(1);
    if (!modal?.classList.contains("open") && event.key === "ArrowLeft") move(1);
    if (!modal?.classList.contains("open") && event.key === "ArrowRight") move(-1);
  });

  const awardsStage = document.querySelector("#awardsStage");
  const awardLoadMore = document.querySelector("#awardLoadMore");
  let visibleAwards = 8;
  if (awardsStage) {
    const renderAwards = () => {
      awardsStage.innerHTML = data.awards.slice(0, visibleAwards).map((award) => `
        <button class="award-item media-trigger" type="button" data-type="${escapeHtml(award.type)}" data-image="${escapeHtml(award.image)}" data-title="${escapeHtml(award.title)}">
          <span class="award-frame"><img src="${escapeHtml(award.image)}" alt="${escapeHtml(award.title)}" loading="lazy"></span>
          <span class="award-copy">
            ${award.year ? `<time>${escapeHtml(award.year)}</time>` : ""}
            <strong>${escapeHtml(award.title)}</strong>
            <small>${escapeHtml([award.subtitle, award.location].filter(Boolean).join(" • "))}</small>
          </span>
        </button>
      `).join("");
      if (awardLoadMore) awardLoadMore.hidden = visibleAwards >= data.awards.length;
    };
    awardLoadMore?.addEventListener("click", () => {
      visibleAwards += 8;
      renderAwards();
    });
    renderAwards();
  }

  const peopleGallery = document.querySelector("#peopleGallery");
  if (peopleGallery && data.people) {
    const peopleSummaries = {
      "branko-babic": {
        fa: "بنیان‌گذار PhiAcademy؛ مرور مستند مسیر حرفه‌ای و دیدار با لنا بحری.",
        en: "Founder of PhiAcademy; a sourced overview of his career and meeting with Lena Bahri.",
        ar: "مؤسس PhiAcademy؛ لمحة موثقة عن مسيرته المهنية ولقائه مع لنا بحري.",
        zh: "PhiAcademy 创始人；通过可查资料介绍其职业经历及与 Lena Bahri 的交流。"
      },
      "emil-ilhamoglu": {
        fa: "مدرس کارگاه NanoBrows در PhiAcademy؛ معرفی بر پایه منابع رسمی.",
        en: "A PhiAcademy NanoBrows workshop instructor, profiled using official sources.",
        ar: "مدرب ورشة NanoBrows في PhiAcademy؛ نبذة تستند إلى مصادر رسمية.",
        zh: "PhiAcademy NanoBrows 工作坊讲师；简介依据官方资料整理。"
      },
      "mohamed-hanafy": {
        fa: "هم‌بنیان‌گذار Hanafy Colors Pigments؛ معرفی دیدار و اطلاعات رسمی.",
        en: "Co-founder of Hanafy Colors Pigments; a profile of the meeting and official information.",
        ar: "شريك مؤسس Hanafy Colors Pigments؛ نبذة عن اللقاء ومعلومات رسمية.",
        zh: "Hanafy Colors Pigments 联合创始人；介绍交流记录与官方信息。"
      },
      "katarina-lupsinova": {
        fa: "سازندهٔ تکنیک Hairstrokes و مدرس دوره‌های تخصصی؛ بر پایه وب‌سایت رسمی.",
        en: "Creator of the Hairstrokes technique and specialist-course educator, according to her official site.",
        ar: "مطورة تقنية Hairstrokes ومدربة دورات متخصصة، وفقاً لموقعها الرسمي.",
        zh: "据其官方网站介绍，她是 Hairstrokes 技法创作者及专业课程讲师。"
      },
      "brady-kirkpatrick": {
        fa: "اطلاعات مستقل دربارهٔ سوابق تخصصی محدود است؛ منابع و جزئیات دیدار را ببینید.",
        en: "Independent details about his professional background are limited; see the sources and meeting notes.",
        ar: "المعلومات المستقلة عن خبرته المهنية محدودة؛ اطلعي على المصادر وتفاصيل اللقاء.",
        zh: "目前可独立核实的职业经历有限；请查看来源与交流记录。"
      },
      "mersida-hodzic-ramic": {
        fa: "مدرس کارگاه BoldBrows در PhiAcademy؛ معرفی بر پایه منابع رسمی.",
        en: "A PhiAcademy BoldBrows workshop instructor, profiled using official sources.",
        ar: "مدربة ورشة BoldBrows في PhiAcademy؛ نبذة تستند إلى مصادر رسمية.",
        zh: "PhiAcademy BoldBrows 工作坊讲师；简介依据官方资料整理。"
      },
      "olga-hanafy": {
        fa: "مستر آرتیست و مدیر مدرسهٔ تخصصی مسکو؛ فعال در آرایش دائم از ۲۰۰۵.",
        en: "A master artist and head of a specialist school in Moscow; active in permanent makeup since 2005.",
        ar: "فنانة خبيرة ومديرة مدرسة متخصصة في موسكو؛ تعمل في المكياج الدائم منذ ٢٠٠٥.",
        zh: "资深艺术家及莫斯科专业学校负责人；自 2005 年起从事半永久妆。"
      },
      "nue-conceal": {
        fa: "برند راهکارهای پارامدیکال پوست؛ معرفی برند و دیدار حرفه‌ای.",
        en: "A paramedical skin-solutions brand, introduced alongside the professional meeting.",
        ar: "علامة لحلول الجلد شبه الطبية، مع تعريف بالعلامة واللقاء المهني.",
        zh: "提供辅助性皮肤解决方案的品牌；本页介绍该品牌及专业交流。"
      },
      "juan-cordero": {
        fa: "هم‌بنیان‌گذار Trazos Perfectos و مدرس تکنیک HairStrokes.",
        en: "Co-founder of Trazos Perfectos and HairStrokes technique instructor.",
        ar: "شريك مؤسس Trazos Perfectos ومدرب تقنية HairStrokes.",
        zh: "Trazos Perfectos 联合创始人及 HairStrokes 技法讲师。"
      },
      "d-chris": {
        fa: "DCHRIS در آموزش و خدمات اسکالپ میکروپیگمنتیشن فعالیت می‌کند.",
        en: "DCHRIS provides scalp micropigmentation education and services.",
        ar: "تقدم DCHRIS التدريب والخدمات في تصبغ فروة الرأس.",
        zh: "DCHRIS 提供头皮微色素技术培训与服务。"
      }
    };
    const locale = document.documentElement.lang.toLowerCase().startsWith("zh")
      ? "zh"
      : document.documentElement.lang.toLowerCase().startsWith("ar")
        ? "ar"
        : document.documentElement.lang.toLowerCase().startsWith("en")
          ? "en"
          : "fa";
    peopleGallery.innerHTML = data.people.map((person, index) => `
      <a class="connection-item" href="${escapeHtml(person.href)}" aria-label="${escapeHtml(person.name)} — ${escapeHtml(person.category)}">
        ${person.image ? `<img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.alt)}" loading="lazy" draggable="false">` : `<span class="connection-placeholder" aria-hidden="true">${escapeHtml(person.name)}</span>`}
        <span class="connection-card-copy">
          <span class="connection-caption"><b>${String(index + 1).padStart(2, "0")}</b><strong>${escapeHtml(person.name)}</strong></span>
          <span class="connection-summary">${escapeHtml(peopleSummaries[person.href.split("/").filter(Boolean).pop()]?.[locale] || "")}</span>
        </span>
      </a>
    `).join("");

    const prevButton = document.querySelector("#peoplePrev");
    const nextButton = document.querySelector("#peopleNext");
    const current = document.querySelector("#peopleCurrent");
    const total = document.querySelector("#peopleTotal");
    const progressBar = document.querySelector("#peopleProgress");
    let isDragging = false;
    let wasDragged = false;
    let activePointerId = null;
    let dragResetTimer = 0;
    let startX = 0;
    let startScroll = 0;

    const getStep = () => {
      const card = peopleGallery.querySelector(".connection-item");
      return card ? card.getBoundingClientRect().width + 15 : 300;
    };
    const updatePeopleStatus = () => {
      const step = getStep();
      const index = Math.min(data.people.length - 1, Math.max(0, Math.round(peopleGallery.scrollLeft / step)));
      if (current) current.textContent = String(index + 1).padStart(2, "0");
      if (total) total.textContent = String(data.people.length).padStart(2, "0");
      if (progressBar) progressBar.style.width = `${((index + 1) / data.people.length) * 100}%`;
    };
    const scrollPeople = (direction) => peopleGallery.scrollBy({ left: direction * getStep(), behavior: "smooth" });

    prevButton?.addEventListener("click", () => scrollPeople(-1));
    nextButton?.addEventListener("click", () => scrollPeople(1));
    peopleGallery.addEventListener("scroll", updatePeopleStatus, { passive: true });
    peopleGallery.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        peopleGallery.scrollLeft += event.deltaY;
      }
    }, { passive: false });
    peopleGallery.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      window.clearTimeout(dragResetTimer);
      isDragging = true;
      wasDragged = false;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startScroll = peopleGallery.scrollLeft;
      peopleGallery.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 6) wasDragged = true;
      if (wasDragged) event.preventDefault();
      peopleGallery.scrollLeft = startScroll - distance;
    }, { passive: false });
    const endDrag = (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;
      isDragging = false;
      activePointerId = null;
      peopleGallery.classList.remove("is-dragging");
      if (event.type === "pointercancel") wasDragged = false;
      const target = Math.round(peopleGallery.scrollLeft / getStep()) * getStep();
      peopleGallery.scrollTo({ left: target, behavior: "smooth" });
      if (wasDragged) {
        window.clearTimeout(dragResetTimer);
        dragResetTimer = window.setTimeout(() => { wasDragged = false; }, 500);
      }
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    peopleGallery.addEventListener("click", (event) => {
      if (wasDragged) {
        event.preventDefault();
        event.stopPropagation();
        wasDragged = false;
        window.clearTimeout(dragResetTimer);
      }
    }, true);
    updatePeopleStatus();
  }

  const mediaModal = document.querySelector("#mediaModal");
  const openMedia = (image, title) => {
    if (!mediaModal) return;
    mediaModal.querySelector("#mediaModalImage").src = image;
    mediaModal.querySelector("#mediaModalImage").alt = title;
    mediaModal.querySelector("#mediaModalTitle").textContent = title;
    mediaModal.classList.add("open");
    mediaModal.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
  };
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".media-trigger");
    if (trigger) openMedia(trigger.dataset.image, trigger.dataset.title);
  });
  const closeMedia = () => {
    if (!mediaModal) return;
    mediaModal.classList.remove("open");
    mediaModal.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
  };
  mediaModal?.querySelector(".modal-close")?.addEventListener("click", closeMedia);
  mediaModal?.querySelector(".modal-backdrop")?.addEventListener("click", closeMedia);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mediaModal?.classList.contains("open")) closeMedia();
  });

  renderRail();
  renderArchive();
  const projectHash = window.location.hash.match(/^#project-(\d+)$/);
  if (projectHash) openProject(Number(projectHash[1]), false);
})();
