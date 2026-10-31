(() => {
  const grid = document.querySelector("#portfolioMixGrid");
  if (!grid) return;

  const selected = { kind: "all", category: "all" };
  const cards = [...grid.querySelectorAll(".mix-card")];
  const emptyState = document.querySelector(".portfolio-mix-empty");

  const applyFilters = () => {
    let visible = 0;
    cards.forEach((card) => {
      const matchesKind = selected.kind === "all" || card.dataset.kind === selected.kind;
      const matchesCategory = selected.category === "all" || card.dataset.category === selected.category;
      const show = matchesKind && matchesCategory;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyState) emptyState.hidden = visible > 0;
  };

  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter-value]");
      if (!button) return;
      const filter = group.dataset.filterGroup;
      selected[filter] = button.dataset.filterValue;
      group.querySelectorAll("button[data-filter-value]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      applyFilters();
    });
  });
})();
