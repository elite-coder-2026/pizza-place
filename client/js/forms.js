(() => {
  "use strict";

  if (typeof window === "undefined") return;
  if (!window.jQuery) return;

  const $ = window.jQuery;

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

    $form
      .find("input, textarea, select, button")
      .not(options.submitSelector)
      .prop("disabled", !!busy);
  };

  const readPayload = ($form, options) => {
    const payload = {};
    const fields = $form.serializeArray();
    for (let i = 0; i < fields.length; i++) payload[fields[i].name] = fields[i].value;

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
    $form.on("blur input change", "input, textarea, select", () => {
      const payload = readPayload($form, options);
      const errors = validatePayload(payload, options);
      const extraErrors = options.validateExtra ? options.validateExtra(payload, $form) : [];
      const firstError = (errors[0] || extraErrors[0] || "");
      setStatus($form, options, (errors.length || extraErrors.length) ? "error" : "idle", firstError);
    });
  };

  const attachSubmit = ($form, options) => {
    $form.on("submit", (event) => {
      event.preventDefault();
      if ($form.data("inFlight")) return;

      const axios = window.axios;
      if (!axios) {
        setStatus($form, options, "error", "Axios is not loaded.");
        return;
      }

      const endpoint = getEndpoint($form, options);
      if (!endpoint || endpoint === "#") {
        setStatus($form, options, "error", "No server endpoint configured for this form.");
        return;
      }

      const formEl = $form.get(0);
      if (formEl && formEl.checkValidity && !formEl.checkValidity()) {
        const firstInvalid = formEl.querySelector ? formEl.querySelector(":invalid") : null;
        const invalidName = firstInvalid && firstInvalid.getAttribute ? firstInvalid.getAttribute("name") : "";

        let invalidMessage = "Please complete the required fields.";
        if (invalidName === options.consentField) {
          invalidMessage = "Please agree to the Terms of Service and Privacy Policy.";
        }

        setStatus($form, options, "error", invalidMessage);
        if (formEl.reportValidity) formEl.reportValidity();
        if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
        return;
      }

      const payload = readPayload($form, options);
      const prepareError = options.preparePayload ? options.preparePayload(payload, $form) : "";
      if (prepareError) {
        setStatus($form, options, "error", prepareError);
        return;
      }

      const errors = validatePayload(payload, options);
      const extraErrors = options.validateExtra ? options.validateExtra(payload, $form) : [];
      if (errors.length) {
        setStatus($form, options, "error", errors[0]);
        return;
      }
      if (extraErrors.length) {
        setStatus($form, options, "error", extraErrors[0]);
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
          const ok = data && typeof data.ok === "boolean" ? data.ok : true;
          const message = data && data.message ? data.message : options.successMessage;

          if (!ok) {
            setStatus($form, options, "error", message || "Sorry—something went wrong. Please try again.");
            return;
          }

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

    $form.on("reset", () => {
      setStatus($form, options, "idle", "");
    });
  };

  const wireForm = (defaults, userOptions) => {
    const options = $.extend({}, defaults, userOptions || {});

    const init = () => {
      $(options.formSelector).each((_, el) => {
        const $form = $(el);
        attachValidation($form, options);
        attachSubmit($form, options);
      });
    };

    return { init, defaults };
  };

  window.PizzaPlaceFormCore = { wireForm };
})();

