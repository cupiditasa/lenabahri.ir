(() => {
  const data = window.LENA_GALLERY;
  if (!data) return;

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
      <article class="museum-card" data-project="${project.id}" aria-label="${project.title}">
        <img src="${project.image}" alt="${project.title}" ${index > 2 ? 'loading="lazy"' : ""}>
        <div class="museum-card-copy">
          <span>${project.subtitle}</span>
          <strong>${project.title}</strong>
        </div>
      </article>
    `).join("");
    rail.querySelectorAll(".museum-card").forEach((card) => {
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
      <button class="filter-button ${item.id === "all" ? "active" : ""}" type="button" data-category="${item.id}">${item.label}</button>
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
        <img src="${project.image}" alt="${project.title}" loading="lazy">
        <div><small>${project.subtitle}</small><strong>${project.title}</strong></div>
      </article>
    `).join("");
    archiveGrid.querySelectorAll(".archive-card").forEach((card) => {
      card.addEventListener("click", () => openProject(Number(card.dataset.project)));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter") openProject(Number(card.dataset.project));
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
    modalSlide = (nextSlide + 2) % 2;
    if (modalMediaTrack) {
      modalMediaTrack.classList.toggle("without-transition", !animate);
      modalMediaTrack.style.transform = `translate3d(${-modalSlide * 50}%, 0, 0)`;
    }
    if (modalMediaCurrent) modalMediaCurrent.textContent = modalSlide === 0 ? "۱" : "۲";
    modalMedia?.querySelectorAll(".modal-shot").forEach((shot, index) => {
      shot.setAttribute("aria-hidden", String(index !== modalSlide));
    });
  };

  const moveModal = (direction) => setModalSlide(modalSlide + direction);

  function openProject(id) {
    if (!modal) return;
    const project = data.projects.find((item) => item.id === id);
    if (!project) return;
    modal.querySelector("#modalImageMain").src = project.image;
    modal.querySelector("#modalImageDetail").src = project.detailImage;
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
        <button class="award-item media-trigger" type="button" data-type="${award.type}" data-image="${award.image}" data-title="${award.title}">
          <span class="award-frame"><img src="${award.image}" alt="${award.title}" loading="lazy"></span>
          <span class="award-copy">
            ${award.year ? `<time>${award.year}</time>` : ""}
            <strong>${award.title}</strong>
            <small>${[award.subtitle, award.location].filter(Boolean).join(" • ")}</small>
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
    peopleGallery.innerHTML = data.people.map((person, index) => `
      <button class="connection-item media-trigger" type="button" data-image="${person.image}" data-title="${person.title}">
        <img src="${person.image}" alt="${person.title} ${index + 1}" loading="lazy">
        <span><b>${String(index + 1).padStart(2, "0")}</b>${person.title}</span>
      </button>
    `).join("");

    const prevButton = document.querySelector("#peoplePrev");
    const nextButton = document.querySelector("#peopleNext");
    const current = document.querySelector("#peopleCurrent");
    const total = document.querySelector("#peopleTotal");
    const progressBar = document.querySelector("#peopleProgress");
    let isDragging = false;
    let wasDragged = false;
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
      isDragging = true;
      wasDragged = false;
      startX = event.clientX;
      startScroll = peopleGallery.scrollLeft;
      peopleGallery.classList.add("is-dragging");
      peopleGallery.setPointerCapture(event.pointerId);
    });
    peopleGallery.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 6) wasDragged = true;
      peopleGallery.scrollLeft = startScroll - distance;
    });
    const endDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      peopleGallery.classList.remove("is-dragging");
      if (peopleGallery.hasPointerCapture(event.pointerId)) peopleGallery.releasePointerCapture(event.pointerId);
      const target = Math.round(peopleGallery.scrollLeft / getStep()) * getStep();
      peopleGallery.scrollTo({ left: target, behavior: "smooth" });
    };
    peopleGallery.addEventListener("pointerup", endDrag);
    peopleGallery.addEventListener("pointercancel", endDrag);
    peopleGallery.addEventListener("click", (event) => {
      if (wasDragged) {
        event.preventDefault();
        event.stopPropagation();
        wasDragged = false;
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
})();
