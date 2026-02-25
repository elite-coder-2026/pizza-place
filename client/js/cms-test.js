(function () {
  const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
  function setActiveTab(next) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === next;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab || "general"));
  });

  const scrollTopBtn = document.querySelector("[data-scroll-top]");
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();

