(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const menuItems = Array.from(document.querySelectorAll(".menu-item[data-category]"));

  function setActiveFilter(next) {
    for (const button of filterButtons) {
      const isActive = button.dataset.filter === next;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    for (const item of menuItems) {
      const category = item.getAttribute("data-category");
      const show = next === "all" || category === next;
      item.hidden = !show;
    }
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => setActiveFilter(button.dataset.filter || "all"));
  }

  // Testimonials: minimal previous/next + progress bar (keeps layout 1:1; on desktop it's static 3-up)
  const slider = document.querySelector("[data-testimonials]");
  const track = document.querySelector("[data-testimonials-track]");
  const progress = document.querySelector("[data-testimonials-progress]");
  if (slider && track && progress) {
    const cards = Array.from(track.querySelectorAll(".t-card"));
    let index = 0;

    function update() {
      cards.forEach((card, i) => card.classList.toggle("is-active", i === index));
      const pct = cards.length ? ((index + 1) / cards.length) * 100 : 0;
      progress.style.width = `${pct}%`;
    }

    const prev = slider.querySelector("[data-testimonials-prev]");
    const next = slider.querySelector("[data-testimonials-next]");
    if (prev) prev.addEventListener("click", () => { index = (index - 1 + cards.length) % cards.length; update(); });
    if (next) next.addEventListener("click", () => { index = (index + 1) % cards.length; update(); });

    update();
  }
})();

