document.addEventListener("DOMContentLoaded", () => {
  const filters = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll(".news-card[data-category]");

  filters.forEach((filter) => {
    filter.addEventListener("click", (event) => {
      const category = filter.dataset.filter;
      if (!category) return;
      event.preventDefault();
      filters.forEach((item) => item.classList.toggle("active", item === filter));
      cards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
      });
      history.replaceState(null, "", category === "all" ? location.pathname : filter.getAttribute("href"));
    });
  });
});
