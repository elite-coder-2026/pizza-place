(() => {
  "use strict";

  if (typeof window === "undefined") return;
  if (!window.PizzaPlaceFormCore) return;

  const DEFAULTS = {
    formSelector: 'form[data-reservation-form="true"], [data-reservation-form], #reservationForm, .reservation-form',
    statusSelector: "[data-reservation-status], .js-reservation-status, .reservation-form__status, [data-contact-status], .js-contact-status",
    submitSelector: 'button[type="submit"], input[type="submit"]',
    endpoint: "/api/reservations",
    method: "POST",
    timeoutMs: 10000,
    requiredFields: ["name", "email", "message", "reservation_date", "reservation_time", "guests", "consent"],
    emailField: "email",
    honeyField: "_hp",
    consentField: "consent",
    successMessage: "Reservation sent. Thanks!"
  };

  const module = window.PizzaPlaceFormCore.wireForm(DEFAULTS);
  window.PizzaPlaceReservationForm = module;

  if (module && module.init) {
    window.jQuery(() => module.init());
  }
})();

