(() => {
  "use strict";

  if (typeof window === "undefined") return;
  if (!window.PizzaPlaceFormCore) return;

  const DEFAULTS = {
    formSelector: 'form[data-contact-form="true"], [data-contact-form], #contactForm',
    statusSelector: "[data-contact-status], .js-contact-status",
    submitSelector: 'button[type="submit"], input[type="submit"]',
    endpoint: "/api/contact",
    method: "POST",
    timeoutMs: 10000,
    requiredFields: ["name", "email", "message"],
    emailField: "email",
    honeyField: "_hp",
    consentField: "consent",
    successMessage: "Message sent. Thanks!"
  };

  const module = window.PizzaPlaceFormCore.wireForm(DEFAULTS);
  window.PizzaPlaceContactForm = module;

  if (module && module.init) {
    window.jQuery(() => module.init());
  }
})();

