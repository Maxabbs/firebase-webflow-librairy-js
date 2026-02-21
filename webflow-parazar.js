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

function getParazarTokenFromUrl(tokenParam) {
  const param = tokenParam || "token";
  const searchParams = new URLSearchParams(window.location.search);
  const directToken = searchParams.get(param);
  if (directToken && directToken.trim()) {
    return directToken.trim();
  }

  const payload = searchParams.get("payload");
  if (!payload) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(payload);
    const tokenValue = parsedPayload && parsedPayload[param];
    if (tokenValue != null && String(tokenValue).trim()) {
      return String(tokenValue).trim();
    }
  } catch (_) {
    // ignore parsing errors
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const parsedPayload = JSON.parse(decoded);
    const tokenValue = parsedPayload && parsedPayload[param];
    if (tokenValue != null && String(tokenValue).trim()) {
      return String(tokenValue).trim();
    }
  } catch (_) {
    // ignore parsing errors
  }

  return null;
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
    apiUrl: "https://backend.parazar.co/api/pro/tables",
    missingIdRedirectUrl: "https://pro.parazar.co",
    title: "Tables disponibles",
    titleFontSize: "clamp(26px,3.4vw,38px)",
    timeLabelFontSize: "clamp(18px,2.4vw,28px)",
    timeLabelTopSpacing: "8px",
    timeChipFontSize: "clamp(20px,2.6vw,34px)",
    counterFontSize: "clamp(19px,3.2vw,29px)",
    counterFontWeight: "520",
    stepControlSize: "clamp(44px,7vw,56px)",
    stepControlFontSize: "clamp(36px,5.5vw,46px)",
    stepControlFontWeight: "500",
    submitLabel: "Envoyer à Parazar",
    minTables: 1,
    minPeoplePerTable: 6,
    maxPeoplePerTable: 10,
    peopleStep: 2,
    minHour: "18:00",
    maxHour: "23:55",
    intervalMinutes: 15,
    startOffsetIntervals: 0,
    preselectFirstHour: false,
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
    if (h < 0 || h > 23 || m < 0 || m > 59) {
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
  const peopleStepValue = Math.max(1, Math.floor(Number(options.peopleStep) || 2));
  const intervalMinutesValue = Math.max(1, Number(options.intervalMinutes) || 15);
  const startOffsetIntervalsValue = Math.max(0, Math.floor(Number(options.startOffsetIntervals) || 0));
  const minHourMinutesValue = toMinutes(options.minHour);
  const maxHourMinutesValue = toMinutes(options.maxHour);
  const preselectFirstHour = Boolean(options.preselectFirstHour);
  const resolvedMinHourMinutes = Number.isFinite(minHourMinutesValue) ? minHourMinutesValue : toMinutes("18:00");
  const resolvedMaxHourMinutes = Number.isFinite(maxHourMinutesValue) ? maxHourMinutesValue : toMinutes("23:55");

  function buildDateAtMinutes(referenceDate, minutesOfDay, dayOffset) {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    date.setMinutes(minutesOfDay, 0, 0);
    return date;
  }

  function getMinutesOfDay(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function ceilDateToInterval(date) {
    const base = new Date(date);
    base.setSeconds(0, 0);
    const totalMinutes = getMinutesOfDay(base);
    const roundedMinutes = Math.ceil(totalMinutes / intervalMinutesValue) * intervalMinutesValue;
    const dayShift = Math.floor(roundedMinutes / 1440);
    const minuteInDay = ((roundedMinutes % 1440) + 1440) % 1440;
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + dayShift);
    base.setMinutes(minuteInDay, 0, 0);
    return base;
  }

  function resolveBookingWindow(now) {
    const isOvernightWindow = resolvedMaxHourMinutes < resolvedMinHourMinutes;
    if (!isOvernightWindow) {
      return {
        start: buildDateAtMinutes(now, resolvedMinHourMinutes, 0),
        end: buildDateAtMinutes(now, resolvedMaxHourMinutes, 0)
      };
    }

    const todayMax = buildDateAtMinutes(now, resolvedMaxHourMinutes, 0);
    if (now.getTime() < todayMax.getTime()) {
      return {
        start: buildDateAtMinutes(now, resolvedMinHourMinutes, -1),
        end: todayMax
      };
    }

    return {
      start: buildDateAtMinutes(now, resolvedMinHourMinutes, 0),
      end: buildDateAtMinutes(now, resolvedMaxHourMinutes, 1)
    };
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
      ".pzr-pro-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#000;color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}",
      ".pzr-pro-card{position:relative;width:min(520px,95vw);border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);box-shadow:none;padding:22px;--pzr-pro-title-font-size:clamp(26px,3.4vw,38px);--pzr-pro-time-label-font-size:clamp(18px,2.4vw,28px);--pzr-pro-time-label-top-spacing:8px;--pzr-pro-time-chip-font-size:clamp(20px,2.6vw,34px);--pzr-pro-counter-font-size:clamp(19px,3.2vw,29px);--pzr-pro-counter-font-weight:520;--pzr-pro-step-size:clamp(44px,7vw,56px);--pzr-pro-step-font-size:clamp(36px,5.5vw,46px);--pzr-pro-step-font-weight:500}",
      ".pzr-pro-card::after{display:none}",
      ".pzr-pro-title{margin:0 0 16px 0;font-size:var(--pzr-pro-title-font-size);line-height:1.08;font-weight:420;letter-spacing:-0.01em;color:#f3f3f3;text-align:center}",
      ".pzr-pro-block{border-radius:16px;border:0.5px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));padding:14px}",
      ".pzr-pro-row{display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:0 18px;border-radius:14px;border:0.5px solid rgba(255,255,255,.16);background:#101010;margin-bottom:12px;font-size:var(--pzr-pro-counter-font-size);font-weight:var(--pzr-pro-counter-font-weight);letter-spacing:-0.005em;line-height:1.1}",
      ".pzr-pro-row:last-child{margin-bottom:0}",
      ".pzr-pro-row>span{flex:1;min-width:0;padding-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pzr-pro-stepper{display:flex;align-items:center;gap:8px}",
      ".pzr-pro-step{width:var(--pzr-pro-step-size);height:var(--pzr-pro-step-size);border:0;border-radius:10px;background:transparent;color:#fff;font-family:inherit;font-size:var(--pzr-pro-step-font-size);font-weight:var(--pzr-pro-step-font-weight);line-height:1;cursor:pointer;transition:background .16s ease,color .16s ease}",
      ".pzr-pro-step:hover{background:rgba(255,255,255,.08)}",
      ".pzr-pro-time-label{display:block;width:100%;margin:var(--pzr-pro-time-label-top-spacing) 2px 10px 2px;font-size:var(--pzr-pro-time-label-font-size);font-weight:560;line-height:1.15;color:#e2e2e2;letter-spacing:.005em;text-align:center;white-space:normal;text-wrap:balance}",
      ".pzr-pro-time-wrap{position:relative;margin-bottom:12px}",
      ".pzr-pro-time-chips{display:flex;flex-direction:column;gap:10px;padding:2px 2px 6px;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden}",
      ".pzr-pro-time-row{display:flex;justify-content:center;gap:10px;width:100%}",
      ".pzr-pro-time-chip{display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;flex:0 1 calc((100% - 20px)/3);width:calc((100% - 20px)/3);max-width:126px;min-width:0;height:56px;padding:0;border-radius:16px;border:0.5px solid rgba(255,255,255,.16);background:#1a1d23;color:#fff;font-family:inherit;font-size:var(--pzr-pro-time-chip-font-size);font-weight:520;letter-spacing:-0.01em;cursor:pointer;transition:all .14s ease}",
      ".pzr-pro-time-chip:hover{border-color:rgba(255,255,255,.3)}",
      ".pzr-pro-time-chip.is-selected{background:#c0f333;color:#0b0b0b;border-color:#c0f333;box-shadow:0 8px 20px rgba(192,243,51,.22)}",
      ".pzr-pro-time-chip:focus{outline:none;border-color:rgba(192,243,51,.55);box-shadow:0 0 0 2px rgba(192,243,51,.15)}",
      ".pzr-pro-time-empty-pill{display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:0 18px;border-radius:16px;border:0.5px solid rgba(255,255,255,.16);background:#101010;color:#b9b9b9;font-size:clamp(14px,2.2vw,18px);font-weight:500;letter-spacing:.01em}",
      ".pzr-pro-time-wrap::after{display:none}",
      ".pzr-pro-submit{width:100%;height:64px;border:0;border-radius:13px;background:#c0f333;color:#0b0b0b;font-family:inherit;font-size:clamp(19px,3vw,28px);font-weight:620;letter-spacing:-0.01em;cursor:pointer;box-shadow:0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .14s ease,filter .14s ease}",
      ".pzr-pro-submit:hover{filter:brightness(1.03)}",
      ".pzr-pro-submit:active{transform:translateY(1px)}",
      ".pzr-pro-submit:disabled{opacity:.55;cursor:not-allowed}",
      ".pzr-pro-status{min-height:22px;margin:12px 2px 0;font-size:14px;color:#bbb}",
      ".pzr-pro-status.success{color:#c0f333}",
      ".pzr-pro-status.error{color:#ff8f8f}",
      "@media (max-width:480px){.pzr-pro-wrap{padding:14px}.pzr-pro-card{padding:16px;border-radius:16px}.pzr-pro-row{min-height:62px;padding:0 14px}.pzr-pro-time-row{gap:8px}.pzr-pro-time-chip{flex-basis:calc((100% - 16px)/3);width:calc((100% - 16px)/3);max-width:none;height:50px;padding:0}.pzr-pro-submit{height:58px;font-size:24px}}"
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
      '      <div class="pzr-pro-time-label">Vos créneaux disponibles</div>',
      '      <div class="pzr-pro-time-wrap">',
      '        <div id="pzr-pro-hour-chips" class="pzr-pro-time-chips" role="listbox" aria-label="Heure de réservation"></div>',
      "      </div>",
      '      <button id="pzr-pro-submit" class="pzr-pro-submit" type="button"></button>',
      '      <p id="pzr-pro-status" class="pzr-pro-status"></p>',
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    const titleNode = root.querySelector(".pzr-pro-title");
    if (titleNode) {
      titleNode.textContent = options.title;
    }
    const cardNode = root.querySelector(".pzr-pro-card");
    if (cardNode) {
      cardNode.style.setProperty("--pzr-pro-title-font-size", String(options.titleFontSize || "clamp(26px,3.4vw,38px)"));
      cardNode.style.setProperty("--pzr-pro-time-label-font-size", String(options.timeLabelFontSize || "clamp(18px,2.4vw,28px)"));
      cardNode.style.setProperty("--pzr-pro-time-label-top-spacing", String(options.timeLabelTopSpacing || "8px"));
      cardNode.style.setProperty("--pzr-pro-time-chip-font-size", String(options.timeChipFontSize || "clamp(20px,2.6vw,34px)"));
      cardNode.style.setProperty("--pzr-pro-counter-font-size", String(options.counterFontSize || "clamp(19px,3.2vw,29px)"));
      cardNode.style.setProperty("--pzr-pro-counter-font-weight", String(options.counterFontWeight || "520"));
      cardNode.style.setProperty("--pzr-pro-step-size", String(options.stepControlSize || "clamp(44px,7vw,56px)"));
      cardNode.style.setProperty("--pzr-pro-step-font-size", String(options.stepControlFontSize || "clamp(36px,5.5vw,46px)"));
      cardNode.style.setProperty("--pzr-pro-step-font-weight", String(options.stepControlFontWeight || "500"));
    }

    return {
      root: root,
      tablesLabel: document.getElementById("pzr-pro-tables-label"),
      peopleLabel: document.getElementById("pzr-pro-people-label"),
      hourChips: document.getElementById("pzr-pro-hour-chips"),
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

  function getSelectedHours(ui) {
    return Array.from(ui.hourChips.querySelectorAll(".pzr-pro-time-chip.is-selected"))
      .map(function (button) { return String(button.dataset.value || "").trim(); })
      .filter(Boolean);
  }

  function updateSubmitButtonAvailability(ui) {
    const hasNoSlots = ui.hourChips.getAttribute("data-empty") === "1";
    ui.submitButton.disabled = hasNoSlots || getSelectedHours(ui).length === 0;
  }

  function buildTimeOptions(ui) {
    ui.hourChips.innerHTML = "";
    ui.hourChips.setAttribute("data-empty", "0");

    const now = new Date();
    const bookingWindow = resolveBookingWindow(now);
    const earliestWithOffset = new Date(
      now.getTime() + (startOffsetIntervalsValue * intervalMinutesValue * 60000)
    );
    const baseStart = new Date(Math.max(bookingWindow.start.getTime(), earliestWithOffset.getTime()));
    const startSlot = ceilDateToInterval(baseStart);

    if (startSlot.getTime() > bookingWindow.end.getTime()) {
      const emptyNode = document.createElement("span");
      emptyNode.className = "pzr-pro-time-empty-pill";
      emptyNode.textContent = "Fini pour aujourd'hui";
      ui.hourChips.appendChild(emptyNode);
      ui.hourChips.setAttribute("data-empty", "1");
      updateSubmitButtonAvailability(ui);
      setStatus(ui, "", "");
      return;
    }

    let lastAddedTimestamp = null;
    let optionsCount = 0;
    let currentRow = null;
    let chipsInCurrentRow = 0;

    function getOrCreateRow() {
      if (!currentRow || chipsInCurrentRow >= 3) {
        currentRow = document.createElement("div");
        currentRow.className = "pzr-pro-time-row";
        ui.hourChips.appendChild(currentRow);
        chipsInCurrentRow = 0;
      }
      return currentRow;
    }

    function appendChip(label, selectedByDefault) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pzr-pro-time-chip" + (selectedByDefault ? " is-selected" : "");
      chip.textContent = label;
      chip.dataset.value = label;
      chip.setAttribute("aria-pressed", selectedByDefault ? "true" : "false");
      chip.addEventListener("click", function () {
        const nextSelected = !chip.classList.contains("is-selected");
        chip.classList.toggle("is-selected", nextSelected);
        chip.setAttribute("aria-pressed", nextSelected ? "true" : "false");
        updateSubmitButtonAvailability(ui);
      });
      getOrCreateRow().appendChild(chip);
      chipsInCurrentRow += 1;
    }

    for (
      let slot = new Date(startSlot);
      slot.getTime() <= bookingWindow.end.getTime();
      slot = new Date(slot.getTime() + (intervalMinutesValue * 60000))
    ) {
      const label = toHourLabel(getMinutesOfDay(slot));
      appendChip(label, preselectFirstHour && optionsCount === 0);
      lastAddedTimestamp = slot.getTime();
      optionsCount += 1;
    }

    if (lastAddedTimestamp !== bookingWindow.end.getTime()) {
      const label = toHourLabel(getMinutesOfDay(bookingWindow.end));
      appendChip(label, preselectFirstHour && optionsCount === 0);
      optionsCount += 1;
    }

    updateSubmitButtonAvailability(ui);
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

    const selectedHours = getSelectedHours(ui);
    if (!selectedHours.length) {
      return;
    }

    ui.submitButton.disabled = true;
    setStatus(ui, "Envoi en cours...", "");

    try {
      const body = {
        id: payloadId,
        table_number: state.tableNumber,
        people_number_per_table: state.peopleNumberPerTable,
        hour_booked: selectedHours.map(function (value) { return String(value); })
      };

      const response = await fetch(options.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const responsePayload = await response.json().catch(function () { return {}; });
      const redirectUrl = responsePayload && typeof responsePayload.redirect_url === "string"
        ? responsePayload.redirect_url.trim()
        : "";
      const errorMessage = responsePayload && typeof responsePayload.error === "string"
        ? responsePayload.error.trim()
        : "";

      if (response.status === 200 || response.status === 404) {
        if (!redirectUrl) {
          throw new Error("Réponse serveur invalide.");
        }
        if (typeof options.onSubmitSuccess === "function") {
          options.onSubmitSuccess({ response: response, payload: body, data: responsePayload });
        }
        window.location.href = redirectUrl;
        return;
      }

      if (response.status === 400 || response.status === 403 || response.status === 500) {
        const message = errorMessage || "Impossible d'envoyer pour le moment.";
        setStatus(ui, message, "error");
        if (typeof options.onSubmitError === "function") {
          options.onSubmitError(new Error(message), { response: response, payload: body, data: responsePayload });
        }
        return;
      }

      if (!response.ok) {
        throw new Error(errorMessage || "Impossible d'envoyer pour le moment.");
      }

      setStatus(ui, "Envoyé à Parazar.", "success");
      if (typeof options.onSubmitSuccess === "function") {
        options.onSubmitSuccess({ response: response, payload: body, data: responsePayload });
      }
    } catch (error) {
      setStatus(ui, (error && error.message) ? error.message : "Impossible d'envoyer pour le moment.", "error");
      if (typeof options.onSubmitError === "function") {
        options.onSubmitError(error);
      }
    } finally {
      updateSubmitButtonAvailability(ui);
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
    state.peopleNumberPerTable = Math.max(minPeoplePerTableValue, state.peopleNumberPerTable - peopleStepValue);
    renderPeople(ui);
  });

  ui.peoplePlus.addEventListener("click", function () {
    state.peopleNumberPerTable = Math.min(maxPeoplePerTableValue, state.peopleNumberPerTable + peopleStepValue);
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
      const selectedHours = getSelectedHours(ui);
      return {
        tableNumber: state.tableNumber,
        peopleNumberPerTable: state.peopleNumberPerTable,
        hourBooked: selectedHours.map(function (value) { return String(value); }),
        hourBookedList: selectedHours.map(function (value) { return String(value); })
      };
    }
  };
}

// Token guard for instant user flow
function setupParazarInstantUserTokenGuard(config) {
  const options = Object.assign({
    apiBase: "https://backend.parazar.co",
    tokenParam: "token",
    token: "",
    tokenCheckPath: "/api/parazar_instant/webflow/token_checking/",
    tokenCheckUrl: "",
    missingTokenRedirectUrl: "https://getapp.parazar.co/p"
  }, config || {});

  function joinUrl(base, path) {
    const baseValue = String(base || "").trim();
    if (!baseValue) {
      return path;
    }
    if (baseValue.endsWith("/") && path.startsWith("/")) {
      return baseValue.slice(0, -1) + path;
    }
    if (!baseValue.endsWith("/") && !path.startsWith("/")) {
      return baseValue + "/" + path;
    }
    return baseValue + path;
  }

  function resolveTokenCheckUrl(tokenValue) {
    if (options.tokenCheckUrl) {
      const raw = String(options.tokenCheckUrl);
      if (raw.indexOf("{token}") !== -1) {
        return raw.replace("{token}", encodeURIComponent(tokenValue));
      }
      if (raw.endsWith("/")) {
        return raw + encodeURIComponent(tokenValue);
      }
      return raw + "/" + encodeURIComponent(tokenValue);
    }

    const path = String(options.tokenCheckPath || "/api/parazar_instant/webflow/token_checking/");
    const withToken = path.endsWith("/") ? path + encodeURIComponent(tokenValue) : path + "/" + encodeURIComponent(tokenValue);
    return joinUrl(options.apiBase, withToken);
  }

  function redirectIfNeeded() {
    if (options.missingTokenRedirectUrl) {
      window.location.replace(options.missingTokenRedirectUrl);
    }
  }

  const tokenValue = options.token
    ? String(options.token).trim()
    : getParazarTokenFromUrl(options.tokenParam);

  const readyPromise = (async function () {
    if (!tokenValue) {
      redirectIfNeeded();
      return { ok: false, token: "" };
    }

    try {
      const response = await fetch(resolveTokenCheckUrl(tokenValue), { method: "GET" });
      if (response.status === 200) {
        return { ok: true, token: tokenValue, response: response };
      }
    } catch (_) {
      // ignore network errors
    }

    redirectIfNeeded();
    return { ok: false, token: tokenValue };
  })();

  return {
    token: tokenValue || "",
    ready: readyPromise
  };
}

// User instant reservation widget
function setupParazarInstantUserForm(config) {
  const options = Object.assign({
    mountSelector: "body",
    apiBase: "https://backend.parazar.co",
    apiUrl: "",
    submitPath: "/api/parazar_instant/webflow",
    tokenParam: "token",
    token: "",
    missingTokenRedirectUrl: "https://getapp.parazar.co/p",
    title: "Lancer mon Parazar",
    titleFontSize: "clamp(26px,3.4vw,38px)",
    labelFontSize: "clamp(18px,2.4vw,28px)",
    chipFontSize: "clamp(18px,2.6vw,30px)",
    submitFontSize: "clamp(19px,3vw,28px)",
    whenLabel: "Quand ?",
    withWhoLabel: "Avec qui ?",
    whereLabel: "Où-tu te situes actuellement ?",
    nowLabel: "Maintenant",
    defaultWhenValue: "",
    defaultWithWhoValue: "",
    defaultWhereValue: "",
    wherePlaceholder: "Sélectionne ta zone",
    withWhoOptions: ["Solo", "Une pote 💃", "Un pote 🕺"],
    whereOptions: [
      "Paris - Ouest",
      "Paris - Est",
      "Paris - Nord",
      "Paris - Sud",
      "Paris - Centre",
      "Banlieue Parisienne (77, 78, 91, 92, 93, 94, 95)"
    ],
    successRedirectUrl: "",
    submitLabel: "Lancer mon Parazar",
    minHour: "18:00",
    maxHour: "23:55",
    intervalMinutes: 15,
    startOffsetIntervals: 0,
    onSubmitSuccess: null,
    onSubmitError: null
  }, config || {});

  const STYLE_ID = "pzr-user-instant-style";
  const ROOT_ID = "pzr-user-instant-root";

  function joinUrl(base, path) {
    const baseValue = String(base || "").trim();
    if (!baseValue) {
      return path;
    }
    if (baseValue.endsWith("/") && path.startsWith("/")) {
      return baseValue.slice(0, -1) + path;
    }
    if (!baseValue.endsWith("/") && !path.startsWith("/")) {
      return baseValue + "/" + path;
    }
    return baseValue + path;
  }

  function resolveSubmitUrl() {
    if (options.apiUrl) {
      return String(options.apiUrl);
    }
    const path = options.submitPath || "/api/parazar_instant/webflow";
    return joinUrl(options.apiBase, String(path));
  }

  function resolveSuccessRedirectUrl() {
    const target = String(options.successRedirectUrl || "").trim();
    if (!target) {
      return "";
    }
    try {
      return new URL(target, window.location.origin).toString();
    } catch (_) {
      return target;
    }
  }

  function toMinutes(hhmm) {
    const parts = String(hhmm).split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      return null;
    }
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }
    return h * 60 + m;
  }

  function toHourLabel(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return String(h).padStart(2, "0") + "h" + String(m).padStart(2, "0");
  }

  const intervalMinutesValue = Math.max(1, Number(options.intervalMinutes) || 15);
  const startOffsetIntervalsValue = Math.max(0, Math.floor(Number(options.startOffsetIntervals) || 0));
  const minHourMinutesValue = toMinutes(options.minHour);
  const maxHourMinutesValue = toMinutes(options.maxHour);
  const resolvedMinHourMinutes = Number.isFinite(minHourMinutesValue) ? minHourMinutesValue : toMinutes("18:00");
  const resolvedMaxHourMinutes = Number.isFinite(maxHourMinutesValue) ? maxHourMinutesValue : toMinutes("23:55");

  function buildDateAtMinutes(referenceDate, minutesOfDay, dayOffset) {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    date.setMinutes(minutesOfDay, 0, 0);
    return date;
  }

  function getMinutesOfDay(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function ceilDateToInterval(date) {
    const base = new Date(date);
    base.setSeconds(0, 0);
    const totalMinutes = getMinutesOfDay(base);
    const roundedMinutes = Math.ceil(totalMinutes / intervalMinutesValue) * intervalMinutesValue;
    const dayShift = Math.floor(roundedMinutes / 1440);
    const minuteInDay = ((roundedMinutes % 1440) + 1440) % 1440;
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + dayShift);
    base.setMinutes(minuteInDay, 0, 0);
    return base;
  }

  function resolveBookingWindow(now) {
    const isOvernightWindow = resolvedMaxHourMinutes < resolvedMinHourMinutes;
    if (!isOvernightWindow) {
      return {
        start: buildDateAtMinutes(now, resolvedMinHourMinutes, 0),
        end: buildDateAtMinutes(now, resolvedMaxHourMinutes, 0)
      };
    }

    const todayMax = buildDateAtMinutes(now, resolvedMaxHourMinutes, 0);
    if (now.getTime() < todayMax.getTime()) {
      return {
        start: buildDateAtMinutes(now, resolvedMinHourMinutes, -1),
        end: todayMax
      };
    }

    return {
      start: buildDateAtMinutes(now, resolvedMinHourMinutes, 0),
      end: buildDateAtMinutes(now, resolvedMaxHourMinutes, 1)
    };
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');",
      ".pzr-user-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#000;color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}",
      ".pzr-user-card{position:relative;width:min(520px,95vw);border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);box-shadow:none;padding:22px;--pzr-user-title-font-size:clamp(26px,3.4vw,38px);--pzr-user-label-font-size:clamp(18px,2.4vw,28px);--pzr-user-chip-font-size:clamp(18px,2.6vw,30px);--pzr-user-submit-font-size:clamp(19px,3vw,28px)}",
      ".pzr-user-title{margin:0 0 16px 0;font-size:var(--pzr-user-title-font-size);line-height:1.08;font-weight:420;letter-spacing:-0.01em;color:#f3f3f3;text-align:center}",
      ".pzr-user-block{border-radius:16px;border:0.5px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));padding:14px}",
      ".pzr-user-section{margin-bottom:14px}",
      ".pzr-user-section:last-of-type{margin-bottom:18px}",
      ".pzr-user-label{display:block;margin:8px 2px 10px 2px;font-size:var(--pzr-user-label-font-size);font-weight:560;line-height:1.15;color:#e2e2e2;letter-spacing:.005em;text-align:left;text-wrap:balance}",
      ".pzr-user-chips{display:flex;flex-wrap:wrap;gap:10px;padding:2px 2px 6px;width:100%;max-width:100%;box-sizing:border-box}",
      ".pzr-user-chip{display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;flex:0 1 calc((100% - 20px)/3);width:calc((100% - 20px)/3);max-width:126px;min-width:0;height:56px;padding:0 6px;border-radius:16px;border:0.5px solid rgba(255,255,255,.16);background:#1a1d23;color:#fff;font-family:inherit;font-size:var(--pzr-user-chip-font-size);font-weight:520;letter-spacing:-0.01em;cursor:pointer;transition:all .14s ease}",
      ".pzr-user-chip:hover{border-color:rgba(255,255,255,.3)}",
      ".pzr-user-chip.is-selected{background:#c0f333;color:#0b0b0b;border-color:#c0f333;box-shadow:0 8px 20px rgba(192,243,51,.22)}",
      ".pzr-user-chip:focus{outline:none;border-color:rgba(192,243,51,.55);box-shadow:0 0 0 2px rgba(192,243,51,.15)}",
      ".pzr-user-select-wrap{position:relative}",
      ".pzr-user-select-wrap::after{content:'▾';position:absolute;right:16px;top:50%;transform:translateY(-50%);color:#bfbfbf;pointer-events:none;font-size:18px}",
      ".pzr-user-select{width:100%;height:56px;padding:0 46px 0 16px;border-radius:14px;border:0.5px solid rgba(255,255,255,.16);background:#101010;color:#fff;font-family:inherit;font-size:clamp(16px,2.3vw,20px);appearance:none;cursor:pointer}",
      ".pzr-user-select:focus{outline:none;border-color:rgba(192,243,51,.55);box-shadow:0 0 0 2px rgba(192,243,51,.12)}",
      ".pzr-user-submit{width:100%;height:64px;border:0;border-radius:13px;background:#c0f333;color:#0b0b0b;font-family:inherit;font-size:var(--pzr-user-submit-font-size);font-weight:620;letter-spacing:-0.01em;cursor:pointer;box-shadow:0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .14s ease,filter .14s ease}",
      ".pzr-user-submit:hover{filter:brightness(1.03)}",
      ".pzr-user-submit:active{transform:translateY(1px)}",
      ".pzr-user-submit:disabled{opacity:.55;cursor:not-allowed}",
      ".pzr-user-status{min-height:22px;margin:12px 2px 0;font-size:14px;color:#bbb}",
      ".pzr-user-status.success{color:#c0f333}",
      ".pzr-user-status.error{color:#ff8f8f}",
      "@media (max-width:480px){.pzr-user-wrap{padding:14px}.pzr-user-card{padding:16px;border-radius:16px}.pzr-user-chip{flex-basis:calc((100% - 16px)/3);width:calc((100% - 16px)/3);max-width:none;height:50px}.pzr-user-submit{height:58px;font-size:24px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function getMountNode() {
    const target = document.querySelector(options.mountSelector);
    if (!target) {
      throw new Error("setupParazarInstantUserForm: conteneur introuvable");
    }
    return target;
  }

  function ensureRoot(mountNode) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      mountNode.appendChild(root);
    }
    return root;
  }

  function normalizeOption(option) {
    if (option == null) {
      return null;
    }
    if (typeof option === "string") {
      const label = option.trim();
      return label ? { label: label, value: label } : null;
    }
    if (typeof option === "object") {
      const label = option.label != null ? String(option.label).trim() : "";
      const value = option.value != null ? String(option.value).trim() : label;
      if (!label) {
        return null;
      }
      return { label: label, value: value };
    }
    return null;
  }

  function createUi(root) {
    root.innerHTML = [
      '<div class="pzr-user-wrap">',
      '  <div class="pzr-user-card">',
      '    <h2 class="pzr-user-title"></h2>',
      '    <div class="pzr-user-block">',
      '      <div class="pzr-user-section">',
      '        <div class="pzr-user-label" id="pzr-user-when-label"></div>',
      '        <div id="pzr-user-when-chips" class="pzr-user-chips" role="listbox" aria-label="Quand"></div>',
      "      </div>",
      '      <div class="pzr-user-section">',
      '        <div class="pzr-user-label" id="pzr-user-who-label"></div>',
      '        <div id="pzr-user-who-chips" class="pzr-user-chips" role="listbox" aria-label="Avec qui"></div>',
      "      </div>",
      '      <div class="pzr-user-section">',
      '        <label class="pzr-user-label" id="pzr-user-where-label" for="pzr-user-where"></label>',
      '        <div class="pzr-user-select-wrap">',
      '          <select id="pzr-user-where" class="pzr-user-select"></select>',
      "        </div>",
      "      </div>",
      '      <button id="pzr-user-submit" class="pzr-user-submit" type="button"></button>',
      '      <p id="pzr-user-status" class="pzr-user-status"></p>',
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    const titleNode = root.querySelector(".pzr-user-title");
    if (titleNode) {
      titleNode.textContent = options.title;
    }
    const cardNode = root.querySelector(".pzr-user-card");
    if (cardNode) {
      cardNode.style.setProperty("--pzr-user-title-font-size", String(options.titleFontSize || "clamp(26px,3.4vw,38px)"));
      cardNode.style.setProperty("--pzr-user-label-font-size", String(options.labelFontSize || "clamp(18px,2.4vw,28px)"));
      cardNode.style.setProperty("--pzr-user-chip-font-size", String(options.chipFontSize || "clamp(18px,2.6vw,30px)"));
      cardNode.style.setProperty("--pzr-user-submit-font-size", String(options.submitFontSize || "clamp(19px,3vw,28px)"));
    }

    const whenLabel = document.getElementById("pzr-user-when-label");
    if (whenLabel) {
      whenLabel.textContent = options.whenLabel;
    }
    const whoLabel = document.getElementById("pzr-user-who-label");
    if (whoLabel) {
      whoLabel.textContent = options.withWhoLabel;
    }
    const whereLabel = document.getElementById("pzr-user-where-label");
    if (whereLabel) {
      whereLabel.textContent = options.whereLabel;
    }

    return {
      root: root,
      whenChips: document.getElementById("pzr-user-when-chips"),
      whoChips: document.getElementById("pzr-user-who-chips"),
      whereSelect: document.getElementById("pzr-user-where"),
      submitButton: document.getElementById("pzr-user-submit"),
      statusNode: document.getElementById("pzr-user-status")
    };
  }

  function setStatus(ui, message, type) {
    ui.statusNode.textContent = message || "";
    ui.statusNode.className = "pzr-user-status" + (type ? " " + type : "");
  }

  function setSelectedChip(container, selectedChip) {
    const chips = Array.from(container.querySelectorAll(".pzr-user-chip"));
    chips.forEach(function (chip) {
      const isSelected = chip === selectedChip;
      chip.classList.toggle("is-selected", isSelected);
      chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function getSelectedChipValue(container) {
    const selected = container.querySelector(".pzr-user-chip.is-selected");
    if (!selected) {
      return "";
    }
    return String(selected.dataset.value || "").trim();
  }

  function updateSubmitButtonAvailability(ui) {
    const whenValue = getSelectedChipValue(ui.whenChips);
    const whoValue = getSelectedChipValue(ui.whoChips);
    const whereValue = ui.whereSelect ? String(ui.whereSelect.value || "").trim() : "";
    ui.submitButton.disabled = !(whenValue && whoValue && whereValue);
  }

  function buildChips(container, items, defaultValue, onChange) {
    container.innerHTML = "";
    const normalizedDefault = defaultValue != null ? String(defaultValue).trim() : "";
    const hasDefault = normalizedDefault !== "";
    const normalizedItems = items
      .map(normalizeOption)
      .filter(function (item) { return item; });

    normalizedItems.forEach(function (item, index) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pzr-user-chip";
      chip.textContent = item.label;
      chip.dataset.value = item.value;
      const shouldSelect = hasDefault ? item.value === normalizedDefault : false;
      if (shouldSelect) {
        chip.classList.add("is-selected");
        chip.setAttribute("aria-pressed", "true");
      } else {
        chip.setAttribute("aria-pressed", "false");
      }
      chip.addEventListener("click", function () {
        if (chip.classList.contains("is-selected")) {
          return;
        }
        setSelectedChip(container, chip);
        if (typeof onChange === "function") {
          onChange(item.value);
        }
      });
      container.appendChild(chip);
    });
  }

  function buildWhenChips(ui) {
    const now = new Date();
    const bookingWindow = resolveBookingWindow(now);
    const earliestWithOffset = new Date(
      now.getTime() + (startOffsetIntervalsValue * intervalMinutesValue * 60000)
    );
    const baseStart = new Date(Math.max(bookingWindow.start.getTime(), earliestWithOffset.getTime()));
    const startSlot = ceilDateToInterval(baseStart);

    const items = [{ label: options.nowLabel, value: options.nowLabel }];
    let lastAddedTimestamp = null;

    if (startSlot.getTime() <= bookingWindow.end.getTime()) {
      for (
        let slot = new Date(startSlot);
        slot.getTime() <= bookingWindow.end.getTime();
        slot = new Date(slot.getTime() + (intervalMinutesValue * 60000))
      ) {
        const label = toHourLabel(getMinutesOfDay(slot));
        items.push({ label: label, value: label });
        lastAddedTimestamp = slot.getTime();
      }

      if (lastAddedTimestamp !== bookingWindow.end.getTime()) {
        const label = toHourLabel(getMinutesOfDay(bookingWindow.end));
        items.push({ label: label, value: label });
      }
    }

    buildChips(ui.whenChips, items, options.defaultWhenValue, function () {
      updateSubmitButtonAvailability(ui);
    });
  }

  function buildWhoChips(ui) {
    buildChips(ui.whoChips, options.withWhoOptions, options.defaultWithWhoValue, function () {
      updateSubmitButtonAvailability(ui);
    });
  }

  function buildWhereOptions(ui) {
    ui.whereSelect.innerHTML = "";
    const normalizedDefault = options.defaultWhereValue != null
      ? String(options.defaultWhereValue).trim()
      : "";
    const hasDefault = normalizedDefault !== "";
    const normalized = options.whereOptions
      .map(normalizeOption)
      .filter(function (item) { return item; });
    let matchedDefault = false;

    if (options.wherePlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = String(options.wherePlaceholder);
      placeholder.disabled = true;
      placeholder.selected = !hasDefault;
      ui.whereSelect.appendChild(placeholder);
    }

    normalized.forEach(function (item, index) {
      const optionNode = document.createElement("option");
      optionNode.value = item.value;
      optionNode.textContent = item.label;
      if (hasDefault && item.value === normalizedDefault) {
        optionNode.selected = true;
        matchedDefault = true;
      }
      ui.whereSelect.appendChild(optionNode);
    });

    if (!matchedDefault) {
      ui.whereSelect.value = "";
    }
  }

  let isSubmitting = false;
  let currentToken = null;
  let ui = null;

  function getState() {
    if (!ui) {
      return null;
    }
    return {
      token: currentToken,
      when: getSelectedChipValue(ui.whenChips),
      with_who: getSelectedChipValue(ui.whoChips),
      where: ui.whereSelect ? String(ui.whereSelect.value || "").trim() : ""
    };
  }

  async function submitInstant(uiRef) {
    if (isSubmitting || !currentToken) {
      return;
    }

    const whenValue = getSelectedChipValue(uiRef.whenChips);
    const whoValue = getSelectedChipValue(uiRef.whoChips);
    const whereValue = uiRef.whereSelect ? String(uiRef.whereSelect.value || "").trim() : "";

    if (!whenValue || !whoValue || !whereValue) {
      updateSubmitButtonAvailability(uiRef);
      return;
    }

    isSubmitting = true;
    uiRef.submitButton.disabled = true;
    setStatus(uiRef, "Envoi en cours...", "");

    const payload = {
      token: currentToken,
      when: whenValue,
      with_who: whoValue,
      where: whereValue
    };

    try {
      const response = await fetch(resolveSubmitUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responsePayload = await response.json().catch(function () { return {}; });
      const redirectUrl = resolveSuccessRedirectUrl();
      if (response.status === 200 && redirectUrl) {
        if (typeof options.onSubmitSuccess === "function") {
          options.onSubmitSuccess({ response: response, payload: payload, data: responsePayload });
        }
        window.location.href = redirectUrl;
        return;
      }
      if (!response.ok) {
        const errorMessage = responsePayload && typeof responsePayload.error === "string"
          ? responsePayload.error.trim()
          : "";
        throw new Error(errorMessage || "Impossible d'envoyer pour le moment.");
      }

      setStatus(uiRef, "Parazar lancé.", "success");
      if (typeof options.onSubmitSuccess === "function") {
        options.onSubmitSuccess({ response: response, payload: payload, data: responsePayload });
      }
    } catch (error) {
      setStatus(
        uiRef,
        (error && error.message) ? error.message : "Impossible d'envoyer pour le moment.",
        "error"
      );
      if (typeof options.onSubmitError === "function") {
        options.onSubmitError(error);
      }
    } finally {
      isSubmitting = false;
      updateSubmitButtonAvailability(uiRef);
    }
  }

  ensureStyles();
  const mountNode = getMountNode();
  const root = ensureRoot(mountNode);
  currentToken = options.token
    ? String(options.token).trim()
    : getParazarTokenFromUrl(options.tokenParam);
  if (!currentToken) {
    if (options.missingTokenRedirectUrl) {
      window.location.replace(options.missingTokenRedirectUrl);
    }
    return {
      destroy: function () {},
      getState: function () { return null; },
      ready: Promise.resolve(false)
    };
  }

  ui = createUi(root);
  ui.submitButton.textContent = options.submitLabel;

  buildWhenChips(ui);
  buildWhoChips(ui);
  buildWhereOptions(ui);
  updateSubmitButtonAvailability(ui);

  ui.whereSelect.addEventListener("change", function () {
    updateSubmitButtonAvailability(ui);
  });

  ui.submitButton.addEventListener("click", function () {
    submitInstant(ui);
  });

  const readyPromise = Promise.resolve(true);

  return {
    destroy: function () {
      if (ui && ui.root) {
        ui.root.remove();
      }
    },
    getState: getState,
    ready: readyPromise
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
  window.setupParazarInstantUserTokenGuard = setupParazarInstantUserTokenGuard;
  window.setupParazarInstantUserForm = setupParazarInstantUserForm;
}
