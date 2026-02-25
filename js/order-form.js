(() => {
  "use strict";

  if (typeof window === "undefined") return;
  if (!window.PizzaPlaceFormCore) return;
  if (!window.jQuery) return;

  const $ = window.jQuery;

  const moneyFromCents = (cents) => {
    const safe = Number.isFinite(cents) ? cents : 0;
    return "$" + (safe / 100).toFixed(2);
  };

  const parseIntSafe = (value) => {
    const n = Number.parseInt(String(value), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const priceForSizeCents = (size) => {
    if (size === "sm") return 1099;
    if (size === "md") return 1399;
    if (size === "lg") return 1699;
    return 1399;
  };

  const toppingPriceCents = 150;

  const readPizzaItem = ($item) => {
    const size = String($item.find('[name="pizza_size"]').val() || "md");
    const crust = String($item.find('[name="pizza_crust"]').val() || "regular");
    const quantity = Math.max(1, parseIntSafe($item.find('[name="pizza_qty"]').val() || "1"));
    const toppings = $item
      .find('[name="pizza_toppings[]"]:checked')
      .map((_, el) => $(el).val())
      .get()
      .map((t) => String(t));

    const base = priceForSizeCents(size);
    const toppingsTotal = toppings.length * toppingPriceCents;
    const unitCents = base + toppingsTotal;
    const lineCents = unitCents * quantity;

    return {
      size,
      crust,
      toppings,
      quantity,
      unit_cents: unitCents,
      line_cents: lineCents
    };
  };

  const computeTotals = ($form) => {
    const items = $form.find("[data-order-item]").map((_, el) => readPizzaItem($(el))).get();
    const subtotalCents = items.reduce((sum, item) => sum + item.line_cents, 0);
    return { items, subtotalCents };
  };

  const renderTotals = ($form) => {
    const { items, subtotalCents } = computeTotals($form);
    const $out = $form.find("[data-order-total]").first();
    if ($out.length) $out.text(moneyFromCents(subtotalCents));

    const $count = $form.find("[data-order-count]").first();
    if ($count.length) $count.text(String(items.length));
  };

  const ensureOneItem = ($form) => {
    if ($form.find("[data-order-item]").length) return;
    addItem($form);
  };

  const addItem = ($form) => {
    const $tpl = $form.find("#orderItemTemplate").first();
    if (!$tpl.length) return;

    const html = $tpl.html();
    const $item = $(html);

    $item.find("[data-remove-item]").on("click", (e) => {
      e.preventDefault();
      $item.remove();
      ensureOneItem($form);
      renderTotals($form);
    });

    $item.on("change input", "input, select", () => renderTotals($form));

    $form.find("[data-order-items]").append($item);
    renderTotals($form);
  };

  const syncDeliveryFields = ($form) => {
    const method = String($form.find('[name="fulfillment"]').val() || "pickup");
    const isDelivery = method === "delivery";

    $form.find("[data-delivery-only]").toggle(isDelivery);
    $form.find("[data-delivery-required]").prop("required", isDelivery);
  };

  const DEFAULTS = {
    formSelector: 'form[data-order-form="true"], [data-order-form], #orderForm',
    statusSelector: "[data-order-status], .js-order-status",
    submitSelector: 'button[type="submit"], input[type="submit"]',
    endpoint: "/api/orders",
    method: "POST",
    timeoutMs: 10000,
    requiredFields: ["customer_name", "email"],
    emailField: "email",
    honeyField: "_hp",
    consentField: "terms",
    successMessage: "Order sent. Thanks!",

    preparePayload: (payload, $form) => {
      const { items, subtotalCents } = computeTotals($form);

      if (!items.length) return "Add at least one pizza.";

      payload.items = items;
      payload.subtotal_cents = subtotalCents;

      payload.fulfillment = String(payload.fulfillment || "pickup");

      if (payload.fulfillment === "delivery") {
        const addr1 = String(payload.address_1 || "").trim();
        const city = String(payload.city || "").trim();
        const zip = String(payload.zip || "").trim();
        if (!addr1 || !city || !zip) return "Delivery address is required.";
      }

      return "";
    },

    validateExtra: (payload, $form) => {
      const errors = [];

      if (!$form.find("[data-order-item]").length) errors.push("Add at least one pizza.");

      const fulfillment = String(payload.fulfillment || "pickup");
      if (fulfillment !== "pickup" && fulfillment !== "delivery") {
        errors.push("Choose pickup or delivery.");
      }

      return errors;
    }
  };

  const module = window.PizzaPlaceFormCore.wireForm(DEFAULTS);
  window.PizzaPlaceOrderForm = module;

  $(() => {
    $(DEFAULTS.formSelector).each((_, el) => {
      const $form = $(el);

      ensureOneItem($form);
      renderTotals($form);
      syncDeliveryFields($form);

      $form.on("change", '[name="fulfillment"]', () => {
        syncDeliveryFields($form);
        renderTotals($form);
      });

      $form.find("[data-add-item]").on("click", (e) => {
        e.preventDefault();
        addItem($form);
      });
    });

    if (module && module.init) module.init();
  });
})();

