(() => {
  "use strict";

  const $ = window.jQuery;
  if (!$) return;

  const axios = window.axios;

  const DEFAULTS = {
    formSelector: '[data-contact-form], form[data-contact-form="true"], #contactForm',
    statusSelector: "[data-contact-status], .js-contact-status",
    submitSelector: 'button[type="submit"], input[type="submit"]',
    endpoint: "/api/contact",
    method: "POST",
    timeoutMs: 10000,
    requiredFields: ["name", "email", "message"],
    emailField: "email",
    honeyField: "_hp"
  };

  const asString = (value) => (value == null ? "" : String(value));
  const trim = (value) => asString(value).replace(/^\s+|\s+$/g, "");
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(email));

  const getEndpoint = ($form, options) => {
    const fromData = $form.attr("data-endpoint") || $form.data("endpoint");
    const fromAction = $form.attr("action");
    return trim(fromData || fromAction || options.endpoint);
  };

  const setStatus = ($form, options, kind, message) => {
    const $status = $form.find(options.statusSelector).first();
    if (!$status.length) return;

    $status
      .attr("role", "status")
      .attr("aria-live", "polite")
      .attr("data-status", kind)
      .text(message);
  };

  const setBusy = ($form, options, busy) => {
    $form.attr("aria-busy", busy ? "true" : "false");
    const $submit = $form.find(options.submitSelector).first();
    if ($submit.length) $submit.prop("disabled", !!busy);
  };

  const readPayload = ($form, options) => {
    const payload = {};
    const fields = $form.serializeArray();
    for (let i = 0; i < fields.length; i++) {
      payload[fields[i].name] = fields[i].value;
    }

    payload._client = "pizza-place";
    payload._ts = new Date().toISOString();
    payload[options.honeyField] = trim(payload[options.honeyField]);

    return payload;
  };

  const validatePayload = (payload, options) => {
    const errors = [];

    if (payload[options.honeyField]) {
      errors.push("Spam detected.");
      return errors;
    }

    for (let i = 0; i < options.requiredFields.length; i++) {
      const field = options.requiredFields[i];
      if (!trim(payload[field])) errors.push("Missing " + field + ".");
    }

    const email = trim(payload[options.emailField]);
    if (email && !isValidEmail(email)) errors.push("Invalid email address.");

    return errors;
  };

  const attachValidation = ($form, options) => {
    $form.on("blur input", "input, textarea", () => {
      const payload = readPayload($form, options);
      const errors = validatePayload(payload, options);
      setStatus($form, options, errors.length ? "error" : "idle", errors[0] || "");
    });
  };

  const attachSubmit = ($form, options) => {
    $form.on("submit", (event) => {
      event.preventDefault();
      if ($form.data("inFlight")) return;

      if (!axios) {
        setStatus($form, options, "error", "Axios is not loaded.");
        return;
      }

      const endpoint = getEndpoint($form, options);
      if (!endpoint || endpoint === "#") {
        setStatus($form, options, "error", "No server endpoint configured for this form.");
        return;
      }

      const payload = readPayload($form, options);
      const errors = validatePayload(payload, options);
      if (errors.length) {
        setStatus($form, options, "error", errors[0]);
        return;
      }

      $form.data("inFlight", true);
      setBusy($form, options, true);
      setStatus($form, options, "sending", "Sending…");

      axios({
        url: endpoint,
        method: options.method,
        timeout: options.timeoutMs,
        data: payload,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      })
        .then((response) => {
          const data = response && response.data;
          const message = data && data.message ? data.message : "Message sent. Thanks!";
          setStatus($form, options, "success", message);
          $form.trigger("reset");
        })
        .catch((error) => {
          const isTimeout = error && (error.code === "ECONNABORTED" || /timeout/i.test(error.message || ""));
          const isOffline = error && !error.response;
          const serverMessage = error && error.response && error.response.data && error.response.data.message;

          let message = serverMessage || "Sorry—something went wrong. Please try again.";
          if (isOffline) message = "Could not reach the server (it may not be running yet).";
          if (isTimeout) message = "Request timed out. Please try again.";
          setStatus($form, options, "error", message);
        })
        .finally(() => {
          $form.data("inFlight", false);
          setBusy($form, options, false);
        });
    });
  };

  const init = (userOptions) => {
    const options = $.extend({}, DEFAULTS, userOptions || {});
    $(() => {
      $(options.formSelector).each((_, el) => {
        const $form = $(el);
        attachValidation($form, options);
        attachSubmit($form, options);
      });
    });
  };

  window.PizzaPlaceContactForm = { init, defaults: DEFAULTS };
  init();
})();
