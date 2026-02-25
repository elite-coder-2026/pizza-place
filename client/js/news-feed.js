(function () {
  const DEBUG = location.search.includes("debug=1");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const segmented = document.querySelector(".segmented");
  const filterButtons = Array.from(document.querySelectorAll("button[data-filter]"));
  const cards = Array.from(document.querySelectorAll(".news-card[data-category]"));
  if (!segmented || !filterButtons.length || !cards.length) {
    if (DEBUG) console.log("[news-feed] init skipped", { segmented: !!segmented, filterButtons: filterButtons.length, cards: cards.length });
    return;
  }

  function setActiveFilter(next) {
    for (const button of filterButtons) {
      const isActive = button.dataset.filter === next;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    for (const card of cards) {
      const category = card.getAttribute("data-category");
      const show = next === "all" || category === next;
      card.hidden = !show;
    }
  }

  segmented.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-filter]");
    if (!target) return;
    setActiveFilter(target.dataset.filter || "all");
  });

  const initial =
    segmented.querySelector("button[data-filter].is-active") ||
    segmented.querySelector("button[data-filter][aria-selected='true']");
  setActiveFilter((initial && initial.dataset.filter) || "all");
})();
