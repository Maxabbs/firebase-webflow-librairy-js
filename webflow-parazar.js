// === webflow-url-id-helper.js ===

function getUrlPayloadId() {
  const searchParams = new URLSearchParams(window.location.search);

  // Most common case: https://example.com/page?id=123
  const directId = searchParams.get("id");
  if (directId && directId.trim()) {
    return directId.trim();
  }

  // Fallback: payload can be a JSON string with an `id` field
  const payload = searchParams.get("payload");
  if (!payload) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(payload);
    if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
      return String(parsedPayload.id).trim();
    }
  } catch (_) {
    // Ignore parsing errors and continue fallback attempts.
  }

  // Fallback: payload can be base64url encoded JSON
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const parsedPayload = JSON.parse(decoded);

    if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
      return String(parsedPayload.id).trim();
    }
  } catch (_) {
    // Ignore parsing errors.
  }

  return null;
}

function requireUrlPayloadId(redirectUrl = "https://getapp.parazar.co/p") {
  const id = getUrlPayloadId();

  if (!id) {
    window.location.replace(redirectUrl);
    return null;
  }

  return id;
}

function isUrlPayloadFormattedId(value) {
  if (value == null) {
    return false;
  }
  const normalized = String(value).trim();
  return /^[A-Z]{4}\d{5}$/.test(normalized);
}

function getUrlPayloadFormattedId() {
  const id = getUrlPayloadId();
  if (!id) {
    return null;
  }
  return isUrlPayloadFormattedId(id) ? id : null;
}

function requireUrlPayloadFormattedId(redirectUrl = "https://getapp.parazar.co/p") {
  const id = getUrlPayloadFormattedId();

  if (!id) {
    window.location.replace(redirectUrl);
    return null;
  }

  return id;
}

function loadStripeJs() {
  if (window.Stripe) {
    return Promise.resolve();
  }

  if (window.__parazarStripeLoaderPromise) {
    return window.__parazarStripeLoaderPromise;
  }

  window.__parazarStripeLoaderPromise = new Promise(function (resolve, reject) {
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existingScript) {
      existingScript.addEventListener("load", function () { resolve(); });
      existingScript.addEventListener("error", function () {
        reject(new Error("Service de paiement indisponible"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = function () { resolve(); };
    script.onerror = function () {
      reject(new Error("Service de paiement indisponible"));
    };
    document.head.appendChild(script);
  });

  return window.__parazarStripeLoaderPromise;
}

function ensureParazarSecureModal(options) {
  const modalId = "parazar-secure-modal";
  const styleId = "parazar-secure-modal-style";
  const paymentElementId = "parazar-payment-element";
  const preauthTextId = "parazar-secure-preauth";
  const errorId = "parazar-secure-error";
  const confirmButtonId = "parazar-secure-confirm";
  const closeButtonId = "parazar-secure-close";

  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.textContent = [
    ".parazar-secure-modal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.66);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}",
    ".parazar-secure-modal.parazar-open{display:flex}",
    ".parazar-secure-panel{position:relative;width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:16px;padding:20px;background:#0b0b0b;border:0.5px solid #2a2a2a;box-shadow:0 20px 60px rgba(0,0,0,.55)}",
    ".parazar-secure-close{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:28px;line-height:1;color:#ffffff;cursor:pointer;padding:4px 8px}",
    ".parazar-secure-close:hover{opacity:.85}",
    ".parazar-secure-preauth{margin:0 36px 10px 0;color:#ffffff;font-size:14px;line-height:1.4;font-weight:500}",
    ".parazar-secure-error{margin:8px 0 14px 0;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.4;background:#2c0d0d;color:#ffb4b4;border:0.5px solid #5a1a1a}",
    ".parazar-secure-error[hidden]{display:none}",
    ".parazar-secure-confirm{width:100%;margin-top:16px;padding:12px 14px;border:0.5px solid #c0f333 !important;border-radius:10px;background:#c0f333 !important;color:#0b0b0b !important;font-size:20px;line-height:20px;cursor:pointer;transition:all .16s ease}",
    ".parazar-secure-confirm:hover{background:#b7eb33 !important}",
    ".parazar-secure-confirm:disabled{opacity:.45;cursor:not-allowed}",
    "@media (max-width:480px){.parazar-secure-modal{padding:10px}.parazar-secure-panel{padding:14px;border-radius:12px}}"
  ].join("");

  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement("div");
    modal.id = modalId;
    document.body.appendChild(modal);
  }
  modal.className = "parazar-secure-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = [
    '<div class="parazar-secure-panel" role="dialog" aria-modal="true" aria-label="Enregistrement sécurisé">',
    '<button id="' + closeButtonId + '" class="parazar-secure-close" type="button" aria-label="Fermer">x</button>',
    '<div id="' + preauthTextId + '" class="parazar-secure-preauth"></div>',
    '<div id="' + errorId + '" class="parazar-secure-error" hidden></div>',
    '<div id="' + paymentElementId + '"></div>',
    '<button id="' + confirmButtonId + '" class="parazar-secure-confirm" type="button"></button>',
    "</div>"
  ].join("");

  const confirmButton = document.getElementById(confirmButtonId);
  const preauthNode = document.getElementById(preauthTextId);
  if (confirmButton) {
    confirmButton.textContent = options.confirmButtonLabel;
  }
  if (preauthNode) {
    preauthNode.textContent = options.preauthorizationLabel;
  }

  return {
    modal: modal,
    paymentElementContainer: document.getElementById(paymentElementId),
    preauthTextContainer: document.getElementById(preauthTextId),
    errorContainer: document.getElementById(errorId),
    confirmButton: document.getElementById(confirmButtonId),
    closeButton: document.getElementById(closeButtonId)
  };
}

function setupParazarSecureSetupIntent(config) {
  const defaultClientTypeOverrides = {
    p: {
      confirmButtonLabel: "Activer mon établissement",
      preauthorizationLabel: "",
      walletMerchantName: "Parazar",
      successRedirectUrl: "pro/confirm"
    }
  };

  const options = Object.assign({
    buttonId: "secure-btn-id",
    stripePublicKey: "",
    apiBase: "https://backend.parazar.co",
    confirmButtonLabel: "Confirmer ma place",
    preauthorizationLabel: "100% gratuit - Aucun débit si tu viens",
    walletMerchantName: "Parazar - Zéro débit si tu viens",
    openButtonLoadingLabel: "Chargement...",
    redirectMode: "if_required",
    returnUrl: window.location.href,
    successRedirectUrl: "/instant/confirm",
    clientTypeOverrides: defaultClientTypeOverrides,
    statusPollIntervalMs: 1000,
    statusPollMaxDurationMs: 120000,
    redirectIfMissingId: "",
    createRequestBody: function () { return null; },
    paymentElementOptions: {},
    elementAppearance: {},
    onIntentCreated: null,
    onSetupConfirmed: null,
    onError: null
  }, config || {});

  if (!options.stripePublicKey) {
    throw new Error("Configuration de paiement incomplète");
  }

  const openButton = document.getElementById(options.buttonId);
  if (!openButton) {
    throw new Error("Bouton de paiement introuvable");
  }

  if (openButton.__parazarSecureController && typeof openButton.__parazarSecureController.destroy === "function") {
    openButton.__parazarSecureController.destroy();
  } else {
    openButton.__parazarSecureController = null;
  }

  const ui = ensureParazarSecureModal(options);
  let stripeInstance = null;
  let elementsInstance = null;
  let paymentElement = null;
  let isBusy = false;
  let currentCheckinId = null;
  let statusPollIntervalId = null;
  let statusPollInFlight = false;
  const clientTypeOverrides = Object.assign(
    {},
    defaultClientTypeOverrides,
    options.clientTypeOverrides && typeof options.clientTypeOverrides === "object"
      ? options.clientTypeOverrides
      : {}
  );
  let runtimePaymentUi = {
    confirmButtonLabel: options.confirmButtonLabel,
    preauthorizationLabel: options.preauthorizationLabel,
    walletMerchantName: options.walletMerchantName,
    successRedirectUrl: options.successRedirectUrl
  };

  function showError(message) {
    if (!ui.errorContainer) {
      return;
    }

    if (!message) {
      ui.errorContainer.hidden = true;
      ui.errorContainer.textContent = "";
      return;
    }

    ui.errorContainer.hidden = false;
    ui.errorContainer.textContent = message;
  }

  function applyClientTypeSettings(clientType) {
    const normalizedClientType = String(clientType || "u").trim().toLowerCase();
    const typeOverrides = clientTypeOverrides[normalizedClientType] && typeof clientTypeOverrides[normalizedClientType] === "object"
      ? clientTypeOverrides[normalizedClientType]
      : null;

    runtimePaymentUi = Object.assign(
      {},
      {
        confirmButtonLabel: options.confirmButtonLabel,
        preauthorizationLabel: options.preauthorizationLabel,
        walletMerchantName: options.walletMerchantName,
        successRedirectUrl: options.successRedirectUrl
      },
      typeOverrides || {}
    );

    if (ui.confirmButton) {
      ui.confirmButton.textContent = runtimePaymentUi.confirmButtonLabel || options.confirmButtonLabel;
    }
    updatePreauthorizationLabel();
  }

  function updatePreauthorizationLabel() {
    if (!ui.preauthTextContainer) {
      return;
    }
    const label = runtimePaymentUi.preauthorizationLabel || "";
    ui.preauthTextContainer.textContent = label;
    ui.preauthTextContainer.style.display = label ? "" : "none";
  }

  function setLoadingState(active, lockConfirmButton) {
    isBusy = active;
    openButton.disabled = active;
    if (ui.confirmButton && lockConfirmButton) {
      ui.confirmButton.disabled = active;
    }
    openButton.dataset.previousLabel = openButton.dataset.previousLabel || openButton.textContent;
    openButton.textContent = active ? options.openButtonLoadingLabel : openButton.dataset.previousLabel;
  }

  function openModal() {
    ui.modal.classList.add("parazar-open");
    ui.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    ui.modal.classList.remove("parazar-open");
    ui.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function stopStatusPolling() {
    if (statusPollIntervalId) {
      window.clearInterval(statusPollIntervalId);
      statusPollIntervalId = null;
    }
    statusPollInFlight = false;
  }

  function resolveSuccessRedirectUrl() {
    const fallbackUrl = "https://parazar.co";
    const target = runtimePaymentUi.successRedirectUrl || fallbackUrl;

    try {
      const parsed = new URL(target, window.location.origin);
      if (/\.webflow\.io$/i.test(parsed.hostname) && /^www\./i.test(parsed.hostname)) {
        parsed.hostname = parsed.hostname.replace(/^www\./i, "");
      }
      return parsed.toString();
    } catch (_) {
      return fallbackUrl;
    }
  }

  function startStatusPolling(checkinId) {
    if (!checkinId) {
      return;
    }

    stopStatusPolling();
    const startedAt = Date.now();
    const maxDurationMs = Number(options.statusPollMaxDurationMs);
    const hasTimeout = Number.isFinite(maxDurationMs) && maxDurationMs > 0;

    statusPollIntervalId = window.setInterval(async function () {
      if (statusPollInFlight) {
        return;
      }
      statusPollInFlight = true;

      try {
        const response = await fetch(options.apiBase + "/api/parazar/secure/" + encodeURIComponent(checkinId), {
          method: "GET"
        });

        if (response.status === 200) {
          stopStatusPolling();
          window.location.href = resolveSuccessRedirectUrl();
          return;
        }

        if (hasTimeout && Date.now() - startedAt >= maxDurationMs) {
          stopStatusPolling();
          closeModal();
        }
      } catch (_) {
        if (hasTimeout && Date.now() - startedAt >= maxDurationMs) {
          stopStatusPolling();
          closeModal();
        }
      } finally {
        statusPollInFlight = false;
      }
    }, options.statusPollIntervalMs);
  }

  function resolveCheckinId() {
    const id = getUrlPayloadId();
    if (id) {
      return id;
    }

    if (options.redirectIfMissingId) {
      window.location.replace(options.redirectIfMissingId);
      return null;
    }

    return null;
  }

  async function createSetupIntent(checkinId) {
    const path = "/api/parazar/secure/" + encodeURIComponent(checkinId);
    const requestBody = typeof options.createRequestBody === "function"
      ? options.createRequestBody(checkinId)
      : null;

    const requestInit = { method: "POST" };
    if (requestBody !== null && requestBody !== undefined) {
      requestInit.headers = { "Content-Type": "application/json" };
      requestInit.body = JSON.stringify(requestBody);
    }

    const response = await fetch(options.apiBase + path, requestInit);

    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error("Action impossible pour le moment");
    }

    if (!payload.client_secret) {
      throw new Error("Action impossible pour le moment");
    }
    if (!/^seti_[^_]+_secret_/.test(String(payload.client_secret))) {
      throw new Error("Action impossible pour le moment");
    }

    if (typeof options.onIntentCreated === "function") {
      options.onIntentCreated(payload);
    }

    return payload;
  }

  async function mountPaymentElement(clientSecret) {
    await loadStripeJs();

    if (!window.Stripe) {
      throw new Error("Service de paiement indisponible");
    }

    stripeInstance = stripeInstance || window.Stripe(options.stripePublicKey);
    if (paymentElement) {
      paymentElement.destroy();
      paymentElement = null;
    }
    if (ui.paymentElementContainer) {
      ui.paymentElementContainer.innerHTML = "";
    }

    const userAppearance = options.elementAppearance && typeof options.elementAppearance === "object"
      ? options.elementAppearance
      : {};
    const defaultAppearance = {
      theme: "night",
      variables: {
        colorPrimary: "#c0f333",
        colorBackground: "#0b0b0b",
        colorText: "#ffffff",
        colorDanger: "#ffb4b4",
        colorSuccess: "#c0f333",
        colorTextSecondary: "#c4c4c4",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        borderRadius: "10px"
      },
      rules: {
        ".Label": { color: "#ffffff" },
        ".Input": {
          backgroundColor: "#0b0b0b",
          color: "#ffffff",
          border: "0.5px solid #2a2a2a"
        },
        ".Tab": {
          backgroundColor: "#0b0b0b",
          color: "#ffffff",
          border: "0.5px solid #2a2a2a"
        },
        ".TabLabel": { color: "#ffffff" },
        ".TabIcon": { color: "#ffffff" },
        ".Tab--selected": {
          backgroundColor: "#c0f333",
          color: "#0b0b0b",
          borderColor: "#c0f333",
          boxShadow: "0 0 0 0.5px #c0f333"
        },
        ".TabLabel--selected": { color: "#0b0b0b" },
        ".TabIcon--selected": { color: "#0b0b0b" },
        ".Block": {
          backgroundColor: "#0b0b0b",
          color: "#ffffff",
          border: "0.5px solid #2a2a2a"
        },
        ".BlockDivider": { backgroundColor: "#2a2a2a" }
      }
    };

    elementsInstance = stripeInstance.elements({
      clientSecret: clientSecret,
      appearance: Object.assign({}, defaultAppearance, userAppearance, {
        variables: Object.assign({}, defaultAppearance.variables, userAppearance.variables || {}),
        rules: Object.assign({}, defaultAppearance.rules, userAppearance.rules || {})
      })
    });
    const userPaymentOptions = options.paymentElementOptions && typeof options.paymentElementOptions === "object"
      ? options.paymentElementOptions
      : {};
    const paymentOptions = Object.assign(
      {},
      {
        wallets: { applePay: "auto", googlePay: "auto" },
        paymentMethodOrder: ["apple_pay", "google_pay", "card"],
        terms: { card: "never", applePay: "always", googlePay: "always" }
      },
      userPaymentOptions
    );
    paymentOptions.wallets = Object.assign(
      {},
      { applePay: "auto", googlePay: "auto" },
      userPaymentOptions.wallets || {}
    );
    paymentOptions.business = Object.assign(
      {},
      { name: runtimePaymentUi.walletMerchantName || "PARAZAR" },
      userPaymentOptions.business || {}
    );

    paymentElement = elementsInstance.create("payment", paymentOptions);

    await new Promise(function (resolve, reject) {
      let settled = false;
      const settleOnce = function (fn) {
        if (settled) {
          return;
        }
        settled = true;
        fn();
      };

      const timeoutId = window.setTimeout(function () {
        settleOnce(resolve);
      }, 2500);

      paymentElement.on("ready", function () {
        window.clearTimeout(timeoutId);
        settleOnce(resolve);
      });

      try {
        paymentElement.mount("#parazar-payment-element");
      } catch (error) {
        window.clearTimeout(timeoutId);
        settleOnce(function () { reject(error); });
      }
    });
  }

  async function onOpenClick() {
    if (isBusy) {
      return;
    }

    if (ui.confirmButton) {
      ui.confirmButton.disabled = true;
      ui.confirmButton.style.display = "none";
    }
    setLoadingState(true, false);
    showError("");
    applyClientTypeSettings("u");

    try {
      const checkinId = resolveCheckinId();
      if (!checkinId) {
        throw new Error("Lien invalide ou expiré");
      }
      currentCheckinId = checkinId;

      const intentPayload = await createSetupIntent(checkinId);
      applyClientTypeSettings(intentPayload.client_type);
      await mountPaymentElement(intentPayload.client_secret);
      openModal();
      if (ui.confirmButton) {
        ui.confirmButton.style.display = "block";
        ui.confirmButton.disabled = false;
      }
    } catch (error) {
      const isNetworkFetchError = error instanceof TypeError && /fetch/i.test(String(error.message || ""));
      showError(isNetworkFetchError ? "Connexion impossible. Réessaie." : "Une erreur est survenue. Réessaie.");
      if (ui.modal && !ui.modal.classList.contains("parazar-open")) {
        openModal();
      }
      if (typeof options.onError === "function") {
        options.onError(error);
      }
    } finally {
      setLoadingState(false, false);
    }
  }

  async function onConfirmClick() {
    if (isBusy || !stripeInstance || !elementsInstance) {
      return;
    }

    setLoadingState(true, true);
    showError("");

    try {
      const confirmSetupParams = {
        elements: elementsInstance,
        redirect: options.redirectMode
      };
      if (options.returnUrl) {
        confirmSetupParams.confirmParams = { return_url: options.returnUrl };
      }

      const result = await stripeInstance.confirmSetup(confirmSetupParams);

      if (result.error) {
        throw new Error("Impossible de confirmer pour le moment");
      }

      const status = result.setupIntent && result.setupIntent.status
        ? result.setupIntent.status
        : "unknown";

      if (typeof options.onSetupConfirmed === "function") {
        options.onSetupConfirmed(result.setupIntent || null);
      }
      if (typeof options.onPaymentConfirmed === "function") {
        options.onPaymentConfirmed(result.setupIntent || null);
      }

      if (status === "succeeded" || status === "processing") {
        const checkinId = currentCheckinId || resolveCheckinId();
        startStatusPolling(checkinId);
        closeModal();
        return;
      }

      showError("Confirmation en attente. Réessaie dans quelques instants.");
    } catch (error) {
      showError("Impossible de confirmer pour le moment");
      if (typeof options.onError === "function") {
        options.onError(error);
      }
    } finally {
      setLoadingState(false, true);
    }
  }

  function onModalBackdropClick(event) {
    if (event.target === ui.modal) {
      closeModal();
    }
  }

  function onEscapeKeyDown(event) {
    if (event.key === "Escape" && ui.modal.classList.contains("parazar-open")) {
      closeModal();
    }
  }

  applyClientTypeSettings("u");

  if (ui.confirmButton) {
    ui.confirmButton.disabled = true;
    ui.confirmButton.addEventListener("click", onConfirmClick);
  }

  if (ui.closeButton) {
    ui.closeButton.addEventListener("click", closeModal);
  }

  ui.modal.addEventListener("click", onModalBackdropClick);
  document.addEventListener("keydown", onEscapeKeyDown);

  openButton.addEventListener("click", onOpenClick);

  const controller = {
    open: onOpenClick,
    close: closeModal,
    destroy: function () {
      stopStatusPolling();
      closeModal();
      openButton.removeEventListener("click", onOpenClick);
      if (ui.confirmButton) {
        ui.confirmButton.removeEventListener("click", onConfirmClick);
      }
      if (ui.closeButton) {
        ui.closeButton.removeEventListener("click", closeModal);
      }
      ui.modal.removeEventListener("click", onModalBackdropClick);
      document.removeEventListener("keydown", onEscapeKeyDown);
    }
  };

  openButton.__parazarSecureController = controller;
  return controller;
}

// Compat: ancien nom conservé, redirige vers le flow SetupIntent.
function setupParazarSecurePayment(config) {
  return setupParazarSecureSetupIntent(config);
}

// Pro reservation widget
function setupParazarProReservationForm(config) {
  const options = Object.assign({
    mountSelector: "body",
    apiUrl: "https://backend.parazar.co/api/pro/reservation",
    missingIdRedirectUrl: "https://pro.parazar.co",
    title: "Tables disponibles",
    submitLabel: "Envoyer à Parazar",
    minTables: 1,
    minPeoplePerTable: 6,
    maxPeoplePerTable: 10,
    minHour: "18:00",
    maxHour: "23:55",
    intervalMinutes: 15,
    startOffsetIntervals: 0,
    locale: "fr-FR",
    onSubmitSuccess: null,
    onSubmitError: null
  }, config || {});

  const STYLE_ID = "pzr-pro-reservation-style";
  const ROOT_ID = "pzr-pro-reservation-root";

  function toMinutes(hhmm) {
    const parts = String(hhmm).split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return null;
    }
    return h * 60 + m;
  }

  function toHourLabel(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return String(h).padStart(2, "0") + "h" + String(m).padStart(2, "0");
  }

  const minTablesValue = Math.max(1, Number(options.minTables) || 1);
  const minPeoplePerTableValue = Math.max(1, Number(options.minPeoplePerTable) || 6);
  const maxPeoplePerTableValue = Math.max(
    minPeoplePerTableValue,
    Number(options.maxPeoplePerTable) || 10
  );
  const intervalMinutesValue = Math.max(1, Number(options.intervalMinutes) || 15);
  const startOffsetIntervalsValue = Math.max(0, Math.floor(Number(options.startOffsetIntervals) || 0));
  const minHourMinutesValue = toMinutes(options.minHour);
  const maxHourMinutesValue = toMinutes(options.maxHour);
  const resolvedMinHourMinutes = Number.isFinite(minHourMinutesValue) ? minHourMinutesValue : toMinutes("18:00");
  const resolvedMaxHourMinutes = Number.isFinite(maxHourMinutesValue)
    ? Math.max(resolvedMinHourMinutes, maxHourMinutesValue)
    : toMinutes("23:55");

  function getEarliestSlotMinutes() {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const withOffset = nowMinutes + (startOffsetIntervalsValue * intervalMinutesValue);
    return Math.ceil(withOffset / intervalMinutesValue) * intervalMinutesValue;
  }

  function getPayloadIdFromUrl() {
    if (typeof window.getUrlPayloadId === "function") {
      return window.getUrlPayloadId();
    }

    const searchParams = new URLSearchParams(window.location.search);
    const directId = searchParams.get("id");
    if (directId && directId.trim()) {
      return directId.trim();
    }

    const payload = searchParams.get("payload");
    if (!payload) {
      return null;
    }

    try {
      const parsedPayload = JSON.parse(payload);
      if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
        return String(parsedPayload.id).trim();
      }
    } catch (_) {
      // ignore
    }

    try {
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsedPayload = JSON.parse(decoded);
      if (parsedPayload && parsedPayload.id != null && String(parsedPayload.id).trim()) {
        return String(parsedPayload.id).trim();
      }
    } catch (_) {
      // ignore
    }

    return null;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');",
      ".pzr-pro-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(120% 90% at 50% -8%,#232323 0%,#101010 48%,#050505 78%,#000 100%);color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}",
      ".pzr-pro-card{width:min(520px,95vw);border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);box-shadow:0 30px 78px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08);padding:22px}",
      ".pzr-pro-title{margin:0 0 16px 0;font-size:clamp(26px,3.4vw,38px);line-height:1.08;font-weight:420;letter-spacing:-0.01em;color:#f3f3f3}",
      ".pzr-pro-block{border-radius:16px;border:0.5px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));padding:14px}",
      ".pzr-pro-row{display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:0 18px;border-radius:14px;border:0.5px solid rgba(255,255,255,.16);background:#101010;margin-bottom:12px;font-size:clamp(19px,3.2vw,29px);font-weight:520;letter-spacing:-0.005em;line-height:1.1}",
      ".pzr-pro-row:last-child{margin-bottom:0}",
      ".pzr-pro-stepper{display:flex;align-items:center;gap:8px}",
      ".pzr-pro-step{width:42px;height:42px;border:0;border-radius:10px;background:transparent;color:#fff;font-family:inherit;font-size:34px;font-weight:400;line-height:1;cursor:pointer;transition:background .16s ease,color .16s ease}",
      ".pzr-pro-step:hover{background:rgba(255,255,255,.08)}",
      ".pzr-pro-time-wrap{position:relative;margin-bottom:12px}",
      ".pzr-pro-time-select{width:100%;height:78px;border-radius:14px;border:0.5px solid rgba(255,255,255,.16);background:#101010;color:#fff;font-family:inherit;font-size:clamp(19px,3.2vw,29px);font-weight:520;letter-spacing:-0.005em;padding:0 56px 0 18px;appearance:none;cursor:pointer;line-height:1.1}",
      ".pzr-pro-time-select:focus{outline:none;border-color:rgba(192,243,51,.55);box-shadow:0 0 0 2px rgba(192,243,51,.15)}",
      ".pzr-pro-time-select.pzr-pro-time-empty{font-size:clamp(14px,2.2vw,18px);font-weight:500;color:#b9b9b9;letter-spacing:.01em;line-height:1.2}",
      ".pzr-pro-time-wrap::after{content:'▾';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:18px;color:#fff;pointer-events:none}",
      ".pzr-pro-submit{width:100%;height:64px;border:0;border-radius:13px;background:#c0f333;color:#0b0b0b;font-family:inherit;font-size:clamp(19px,3vw,28px);font-weight:620;letter-spacing:-0.01em;cursor:pointer;box-shadow:0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .14s ease,filter .14s ease}",
      ".pzr-pro-submit:hover{filter:brightness(1.03)}",
      ".pzr-pro-submit:active{transform:translateY(1px)}",
      ".pzr-pro-submit:disabled{opacity:.55;cursor:not-allowed}",
      ".pzr-pro-status{min-height:22px;margin:12px 2px 0;font-size:14px;color:#bbb}",
      ".pzr-pro-status.success{color:#c0f333}",
      ".pzr-pro-status.error{color:#ff8f8f}",
      "@media (max-width:480px){.pzr-pro-wrap{padding:14px}.pzr-pro-card{padding:16px;border-radius:16px}.pzr-pro-row{min-height:62px;padding:0 14px}.pzr-pro-step{width:34px;height:34px;font-size:26px}.pzr-pro-time-select{height:68px;padding:0 46px 0 14px}.pzr-pro-submit{height:58px;font-size:24px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function getMountNode() {
    const target = document.querySelector(options.mountSelector);
    if (!target) {
      throw new Error("setupParazarProReservationForm: conteneur introuvable");
    }
    return target;
  }

  function createUi(mountNode) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      mountNode.appendChild(root);
    }

    root.innerHTML = [
      '<div class="pzr-pro-wrap">',
      '  <div class="pzr-pro-card">',
      '    <h2 class="pzr-pro-title"></h2>',
      '    <div class="pzr-pro-block">',
      '      <div class="pzr-pro-row">',
      '        <span id="pzr-pro-tables-label"></span>',
      '        <div class="pzr-pro-stepper">',
      '          <button id="pzr-pro-tables-minus" class="pzr-pro-step" type="button" aria-label="Moins de tables">−</button>',
      '          <button id="pzr-pro-tables-plus" class="pzr-pro-step" type="button" aria-label="Plus de tables">+</button>',
      "        </div>",
      "      </div>",
      '      <div class="pzr-pro-row">',
      '        <span id="pzr-pro-people-label"></span>',
      '        <div class="pzr-pro-stepper">',
      '          <button id="pzr-pro-people-minus" class="pzr-pro-step" type="button" aria-label="Moins de personnes">−</button>',
      '          <button id="pzr-pro-people-plus" class="pzr-pro-step" type="button" aria-label="Plus de personnes">+</button>',
      "        </div>",
      "      </div>",
      '      <div class="pzr-pro-time-wrap">',
      '        <select id="pzr-pro-hour-select" class="pzr-pro-time-select" aria-label="Heure de réservation"></select>',
      "      </div>",
      '      <button id="pzr-pro-submit" class="pzr-pro-submit" type="button"></button>',
      '      <p id="pzr-pro-status" class="pzr-pro-status"></p>',
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    root.querySelector(".pzr-pro-title").textContent = options.title;

    return {
      root: root,
      tablesLabel: document.getElementById("pzr-pro-tables-label"),
      peopleLabel: document.getElementById("pzr-pro-people-label"),
      hourSelect: document.getElementById("pzr-pro-hour-select"),
      submitButton: document.getElementById("pzr-pro-submit"),
      statusNode: document.getElementById("pzr-pro-status"),
      tablesMinus: document.getElementById("pzr-pro-tables-minus"),
      tablesPlus: document.getElementById("pzr-pro-tables-plus"),
      peopleMinus: document.getElementById("pzr-pro-people-minus"),
      peoplePlus: document.getElementById("pzr-pro-people-plus")
    };
  }

  function setStatus(ui, message, type) {
    ui.statusNode.textContent = message || "";
    ui.statusNode.className = "pzr-pro-status" + (type ? " " + type : "");
  }

  function buildTimeOptions(ui) {
    ui.hourSelect.innerHTML = "";
    ui.hourSelect.classList.remove("pzr-pro-time-empty");

    const roundedNow = getEarliestSlotMinutes();
    const startMinutes = Math.max(resolvedMinHourMinutes, roundedNow);

    if (startMinutes > resolvedMaxHourMinutes) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Fini pour aujourd'hui";
      ui.hourSelect.appendChild(option);
      ui.hourSelect.classList.add("pzr-pro-time-empty");
      ui.hourSelect.disabled = true;
      ui.submitButton.disabled = true;
      setStatus(ui, "", "");
      return;
    }

    let lastAddedMinutes = null;
    for (let minutes = startMinutes; minutes <= resolvedMaxHourMinutes; minutes += intervalMinutesValue) {
      const option = document.createElement("option");
      const label = toHourLabel(minutes);
      option.value = label;
      option.textContent = label;
      ui.hourSelect.appendChild(option);
      lastAddedMinutes = minutes;
    }

    if (lastAddedMinutes !== resolvedMaxHourMinutes) {
      const option = document.createElement("option");
      const label = toHourLabel(resolvedMaxHourMinutes);
      option.value = label;
      option.textContent = label;
      ui.hourSelect.appendChild(option);
    }

    ui.hourSelect.disabled = false;
    ui.submitButton.disabled = false;
    setStatus(ui, "", "");
  }

  const state = {
    tableNumber: minTablesValue,
    peopleNumberPerTable: minPeoplePerTableValue
  };
  const payloadId = getPayloadIdFromUrl();

  if (!payloadId) {
    window.location.replace(options.missingIdRedirectUrl || "https://pro.parazar.co");
    return {
      destroy: function () {},
      getState: function () { return null; }
    };
  }

  function renderTables(ui) {
    ui.tablesLabel.textContent = state.tableNumber + " table" + (state.tableNumber > 1 ? "s" : "");
  }

  function renderPeople(ui) {
    ui.peopleLabel.textContent =
      state.peopleNumberPerTable +
      " personne" + (state.peopleNumberPerTable > 1 ? "s" : "") +
      " / table";
  }

  async function submitReservation(ui) {
    if (!payloadId) {
      window.location.replace(options.missingIdRedirectUrl || "https://pro.parazar.co");
      return;
    }

    const selectedHour = ui.hourSelect.value;
    if (!selectedHour) {
      return;
    }

    ui.submitButton.disabled = true;
    setStatus(ui, "Envoi en cours...", "");

    try {
      const body = {
        id: payloadId,
        table_number: state.tableNumber,
        people_number_per_table: state.peopleNumberPerTable,
        hour_booked: selectedHour
      };

      const response = await fetch(options.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error("submit_error");
      }

      setStatus(ui, "Envoyé à Parazar.", "success");
      if (typeof options.onSubmitSuccess === "function") {
        options.onSubmitSuccess({ response: response, payload: body });
      }
    } catch (error) {
      setStatus(ui, "Impossible d'envoyer pour le moment.", "error");
      if (typeof options.onSubmitError === "function") {
        options.onSubmitError(error);
      }
    } finally {
      ui.submitButton.disabled = ui.hourSelect.disabled;
    }
  }

  ensureStyles();
  const mountNode = getMountNode();
  const ui = createUi(mountNode);

  ui.submitButton.textContent = options.submitLabel;
  renderTables(ui);
  renderPeople(ui);
  buildTimeOptions(ui);

  ui.tablesMinus.addEventListener("click", function () {
    state.tableNumber = Math.max(minTablesValue, state.tableNumber - 1);
    renderTables(ui);
  });

  ui.tablesPlus.addEventListener("click", function () {
    state.tableNumber += 1;
    renderTables(ui);
  });

  ui.peopleMinus.addEventListener("click", function () {
    state.peopleNumberPerTable = Math.max(minPeoplePerTableValue, state.peopleNumberPerTable - 1);
    renderPeople(ui);
  });

  ui.peoplePlus.addEventListener("click", function () {
    state.peopleNumberPerTable = Math.min(maxPeoplePerTableValue, state.peopleNumberPerTable + 1);
    renderPeople(ui);
  });

  ui.submitButton.addEventListener("click", function () {
    submitReservation(ui);
  });

  return {
    destroy: function () {
      if (ui && ui.root) {
        ui.root.remove();
      }
    },
    getState: function () {
      return {
        tableNumber: state.tableNumber,
        peopleNumberPerTable: state.peopleNumberPerTable,
        hourBooked: ui.hourSelect.value || null
      };
    }
  };
}

if (typeof window !== "undefined") {
  window.getUrlPayloadId = getUrlPayloadId;
  window.requireUrlPayloadId = requireUrlPayloadId;
  window.isUrlPayloadFormattedId = isUrlPayloadFormattedId;
  window.getUrlPayloadFormattedId = getUrlPayloadFormattedId;
  window.requireUrlPayloadFormattedId = requireUrlPayloadFormattedId;
  window.setupParazarSecureSetupIntent = setupParazarSecureSetupIntent;
  window.setupParazarSecurePayment = setupParazarSecurePayment;
  window.setupParazarProReservationForm = setupParazarProReservationForm;
}
