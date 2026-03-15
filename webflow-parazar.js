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
      successRedirectUrl: "pro/confirm",
      paymentElementOptions: {
        // RIB (SEPA) uniquement pour les pros (on garde aussi Apple Pay / Google Pay / Carte)
        paymentMethodOrder: ["sepa_debit", "apple_pay", "google_pay", "card"]
      }
    }
  };

  const options = Object.assign({
    buttonId: "secure-btn-id",
    stripePublicKey: "",
    apiBase: "https://backend.parazar.co",
    confirmButtonLabel: "Confirmer ma place",
    preauthorizationLabel: "100% gratuit - Aucun débit si tu viens",
    walletMerchantName: "Parazar",
    openButtonLoadingLabel: "Chargement...",
    redirectMode: "if_required",
    returnUrl: window.location.href,
    successRedirectUrl: "/instant/confirm",
    clientTypeOverrides: defaultClientTypeOverrides,
    statusPollIntervalMs: 1000,
    statusPollMaxDurationMs: 120000,
    submissionToken: "",
    submissionTokenParam: "id",
    submissionTokenGuard: null,
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
  let currentSubmissionToken = null;
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
    successRedirectUrl: options.successRedirectUrl,
    paymentElementOptions: options.paymentElementOptions,
    elementAppearance: options.elementAppearance
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
        successRedirectUrl: options.successRedirectUrl,
        paymentElementOptions: options.paymentElementOptions,
        elementAppearance: options.elementAppearance
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
    const fallbackUrl = "https://www.parazar.co";
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

  function startStatusPolling(submissionToken) {
    if (!submissionToken) {
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
        const response = await fetch(options.apiBase + "/api/parazar/secure/" + encodeURIComponent(submissionToken), {
          method: "GET"
        });
        const payload = await response.json().catch(function () { return {}; });

        if (response.status === 200) {
          const clientType = payload && payload.client_type ? String(payload.client_type) : "";
          if (clientType) {
            applyClientTypeSettings(clientType);
          }
          stopStatusPolling();
          window.location.href = resolveSuccessRedirectUrl();
          return;
        }

        if (response.status === 202) {
          return;
        }

        if (response.status === 302) {
          stopStatusPolling();
          const redirectUrl = response.redirected ? response.url : (response.headers.get("Location") || "");
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        }

        if (response.status === 408 || response.status === 409) {
          stopStatusPolling();
          showError(payload && payload.state === "timeout"
            ? "Temps expiré. Réessaie."
            : "Une erreur est survenue. Réessaie.");
          openModal();
          return;
        }

        if (response.status === 400 || response.status === 403) {
          stopStatusPolling();
          const message = payload && (payload.error || payload.message)
            ? String(payload.error || payload.message).trim()
            : "Impossible d'envoyer pour le moment.";
          showError(message || "Impossible d'envoyer pour le moment.");
          openModal();
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

  async function resolveSubmissionToken() {
    const directToken = options.submissionToken ? String(options.submissionToken).trim() : "";
    if (directToken) {
      return directToken;
    }

    const guard = options.submissionTokenGuard;
    if (guard && guard.ready && typeof guard.ready.then === "function") {
      try {
        const result = await guard.ready;
        if (result && result.ok && result.token) {
          return String(result.token).trim();
        }
      } catch (_) {
        // ignore
      }
    }

    const urlToken = typeof window.getUrlPayloadId === "function"
      ? window.getUrlPayloadId()
      : getUrlPayloadId();
    if (urlToken && String(urlToken).trim()) {
      return String(urlToken).trim();
    }

    return getParazarTokenFromUrl(options.submissionTokenParam || "id") || "";
  }

  async function createSetupIntent(submissionToken) {
    const path = "/api/parazar/secure/" + encodeURIComponent(submissionToken);
    const requestBody = typeof options.createRequestBody === "function"
      ? options.createRequestBody(submissionToken)
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

    const userAppearance = runtimePaymentUi.elementAppearance && typeof runtimePaymentUi.elementAppearance === "object"
      ? runtimePaymentUi.elementAppearance
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
    const userPaymentOptions = runtimePaymentUi.paymentElementOptions && typeof runtimePaymentUi.paymentElementOptions === "object"
      ? runtimePaymentUi.paymentElementOptions
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
      const submissionToken = await resolveSubmissionToken();
      if (!submissionToken) {
        throw new Error("Lien invalide ou expiré");
      }
      currentSubmissionToken = submissionToken;

      const intentPayload = await createSetupIntent(submissionToken);
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
        const submissionToken = currentSubmissionToken || await resolveSubmissionToken();
        startStatusPolling(submissionToken);
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
    titleImageUrl: "https://cdn.prod.website-files.com/6665627cae20cb25d5ffa6af/698cb46b188c3fb591e3ffa1_Parazar_Logo_PureWhite_RVB.svg",
    titleImageAlt: "Parazar",
    titleImageHeight: "56px",
    titleImageMaxWidth: "260px",
    subtitleHtml: "Tables disponibles pour ce soir",
    subtitleText: "",
    subtitleTextColor: "#c0f333",
    subtitleTextFontSize: "clamp(14px,2.2vw,18px)",
    subtitleTextFontWeight: "600",
    subtitleTextLineHeight: "1.3",
    subtitleTextMaxWidth: "min(420px,90%)",
    subtitleSpacing: "6px",
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
    minHour: "19:00",
    maxHour: "21:00",
    intervalMinutes: 30,
    startOffsetIntervals: 0,
    preselectFirstHour: false,
    locale: "fr-FR",
    lockHorizontalScroll: true,
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
      ".pzr-pro-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#000;color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;width:100%;overflow-x:hidden}",
      ".pzr-pro-card{position:relative;width:min(520px,95vw);border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);box-shadow:none;padding:22px;--pzr-pro-title-font-size:clamp(26px,3.4vw,38px);--pzr-pro-time-label-font-size:clamp(18px,2.4vw,28px);--pzr-pro-time-label-top-spacing:8px;--pzr-pro-time-chip-font-size:clamp(20px,2.6vw,34px);--pzr-pro-counter-font-size:clamp(19px,3.2vw,29px);--pzr-pro-counter-font-weight:520;--pzr-pro-step-size:clamp(44px,7vw,56px);--pzr-pro-step-font-size:clamp(36px,5.5vw,46px);--pzr-pro-step-font-weight:500}",
      ".pzr-pro-card::after{display:none}",
      ".pzr-pro-title{margin:0 0 8px 0;font-size:var(--pzr-pro-title-font-size);line-height:1.08;font-weight:420;letter-spacing:-0.01em;color:#f3f3f3;text-align:center}",
      ".pzr-pro-title img{display:block;height:var(--pzr-pro-title-image-height,32px);width:auto;max-width:var(--pzr-pro-title-image-max-width,min(240px,70vw));margin:0 auto}",
      ".pzr-pro-subtitle{margin:var(--pzr-pro-subtitle-spacing,6px) 0 16px 0;text-align:center}",
      ".pzr-pro-subtitle-text{margin:0 auto;max-width:var(--pzr-pro-subtitle-text-max-width,min(420px,90%));font-size:var(--pzr-pro-subtitle-text-font-size,clamp(14px,2.2vw,18px));font-weight:var(--pzr-pro-subtitle-text-font-weight,600);line-height:var(--pzr-pro-subtitle-text-line-height,1.3);color:var(--pzr-pro-subtitle-text-color,#c0f333);text-align:center;white-space:pre-line}",
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

  function applyHorizontalScrollLock() {
    if (!options.lockHorizontalScroll) {
      return;
    }
    const htmlEl = document.documentElement;
    if (htmlEl && !htmlEl.dataset.pzrProOverflowX) {
      htmlEl.dataset.pzrProOverflowX = htmlEl.style.overflowX || "";
      htmlEl.style.overflowX = "hidden";
    }
    if (document.body && !document.body.dataset.pzrProOverflowX) {
      document.body.dataset.pzrProOverflowX = document.body.style.overflowX || "";
      document.body.style.overflowX = "hidden";
    }
  }

  function releaseHorizontalScrollLock() {
    const htmlEl = document.documentElement;
    if (htmlEl && htmlEl.dataset.pzrProOverflowX != null) {
      htmlEl.style.overflowX = htmlEl.dataset.pzrProOverflowX;
      delete htmlEl.dataset.pzrProOverflowX;
    }
    if (document.body && document.body.dataset.pzrProOverflowX != null) {
      document.body.style.overflowX = document.body.dataset.pzrProOverflowX;
      delete document.body.dataset.pzrProOverflowX;
    }
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
      '    <div class="pzr-pro-subtitle" id="pzr-pro-subtitle"></div>',
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
      const titleImageUrl = String(options.titleImageUrl || "").trim();
      const titleAlt = String(options.titleImageAlt || "").trim();
      const titleText = String(options.title || "").trim();
      titleNode.textContent = "";
      if (titleImageUrl) {
        const img = document.createElement("img");
        img.src = titleImageUrl;
        img.alt = titleAlt || "Parazar";
        img.loading = "lazy";
        img.decoding = "async";
        titleNode.appendChild(img);
      } else if (titleText) {
        titleNode.textContent = titleText;
      }
    }
    const subtitleNode = document.getElementById("pzr-pro-subtitle");
    if (subtitleNode) {
      const subtitleHtml = String(options.subtitleHtml || "").trim();
      const subtitleText = String(options.subtitleText || "").trim();
      if (subtitleHtml || subtitleText) {
        subtitleNode.textContent = "";
        const textNode = document.createElement("p");
        textNode.className = "pzr-pro-subtitle-text";
        if (subtitleHtml) {
          textNode.innerHTML = subtitleHtml;
        } else {
          textNode.textContent = subtitleText;
        }
        subtitleNode.appendChild(textNode);
        subtitleNode.style.display = "";
      } else {
        subtitleNode.textContent = "";
        subtitleNode.style.display = "none";
      }
    }
    const cardNode = root.querySelector(".pzr-pro-card");
    if (cardNode) {
      cardNode.style.setProperty("--pzr-pro-title-font-size", String(options.titleFontSize || "clamp(26px,3.4vw,38px)"));
      cardNode.style.setProperty("--pzr-pro-title-image-height", String(options.titleImageHeight || "56px"));
      cardNode.style.setProperty("--pzr-pro-title-image-max-width", String(options.titleImageMaxWidth || "260px"));
      cardNode.style.setProperty("--pzr-pro-subtitle-spacing", String(options.subtitleSpacing || "6px"));
      cardNode.style.setProperty("--pzr-pro-subtitle-text-color", String(options.subtitleTextColor || "#c0f333"));
      cardNode.style.setProperty("--pzr-pro-subtitle-text-font-size", String(options.subtitleTextFontSize || "clamp(14px,2.2vw,18px)"));
      cardNode.style.setProperty("--pzr-pro-subtitle-text-font-weight", String(options.subtitleTextFontWeight || "600"));
      cardNode.style.setProperty("--pzr-pro-subtitle-text-line-height", String(options.subtitleTextLineHeight || "1.3"));
      cardNode.style.setProperty("--pzr-pro-subtitle-text-max-width", String(options.subtitleTextMaxWidth || "min(420px,90%)"));
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
  applyHorizontalScrollLock();
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
      releaseHorizontalScrollLock();
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
    tokenCheckPath: "/api/parazar_instant/webflow/submission_token_checking/",
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

    const path = String(options.tokenCheckPath || "/api/parazar_instant/webflow/submission_token_checking/");
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

// Token guard for submission flow
function setupParazarInstantSubmissionTokenGuard(config) {
  const options = Object.assign({
    apiBase: "https://backend.parazar.co",
    tokenParam: "id",
    token: "",
    tokenCheckPath: "/api/parazar_instant/webflow/submission_token_checking/",
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

    const path = String(options.tokenCheckPath || "/api/parazar_instant/webflow/submission_token_checking/");
    const withToken = path.endsWith("/") ? path + encodeURIComponent(tokenValue) : path + "/" + encodeURIComponent(tokenValue);
    return joinUrl(options.apiBase, withToken);
  }

  function redirectIfNeeded() {
    if (options.missingTokenRedirectUrl) {
      window.location.replace(options.missingTokenRedirectUrl);
    }
  }

  let tokenValue = options.token ? String(options.token).trim() : "";
  if (!tokenValue) {
    const urlToken = typeof window.getUrlPayloadId === "function"
      ? window.getUrlPayloadId()
      : getUrlPayloadId();
    if (urlToken && String(urlToken).trim()) {
      tokenValue = String(urlToken).trim();
    }
  }
  if (!tokenValue) {
    tokenValue = getParazarTokenFromUrl(options.tokenParam || "id") || "";
  }

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

// Token guard for secure/checkin flow
function setupParazarInstantSecureTokenGuard(config) {
  const options = Object.assign({
    apiBase: "https://backend.parazar.co",
    tokenParam: "id",
    token: "",
    tokenCheckPath: "/api/parazar_instant/webflow/secure_token_checking/",
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

    const path = String(options.tokenCheckPath || "/api/parazar_instant/webflow/secure_token_checking/");
    const withToken = path.endsWith("/") ? path + encodeURIComponent(tokenValue) : path + "/" + encodeURIComponent(tokenValue);
    return joinUrl(options.apiBase, withToken);
  }

  function redirectIfNeeded() {
    if (options.missingTokenRedirectUrl) {
      window.location.replace(options.missingTokenRedirectUrl);
    }
  }

  let tokenValue = options.token ? String(options.token).trim() : "";
  if (!tokenValue) {
    const urlToken = typeof window.getUrlPayloadId === "function"
      ? window.getUrlPayloadId()
      : getUrlPayloadId();
    if (urlToken && String(urlToken).trim()) {
      tokenValue = String(urlToken).trim();
    }
  }
  if (!tokenValue) {
    tokenValue = getParazarTokenFromUrl(options.tokenParam || "id") || "";
  }

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
    title: "Parazar Instantané",
    showTitle: true,
    titleImageUrl: "https://cdn.prod.website-files.com/6665627cae20cb25d5ffa6af/698cb46b188c3fb591e3ffa1_Parazar_Logo_PureWhite_RVB.svg",
    titleImageAlt: "Parazar",
    titleImageHeight: "56px",
    titleImageMaxWidth: "260px",
    subtitleImageUrl: "",
    subtitleImageAlt: "",
    subtitleImageHeight: "",
    subtitleImageMaxWidth: "",
    subtitleSpacing: "6px",
    subtitleText: "",
    subtitleHtml:
      "<span style='font-size:clamp(28px,3.2vw,38px);font-weight:700;color:#ffffff'>Ce soir, tu sors.</span>" +
      "<br><br>" +
      "<span style='font-size:clamp(14px,1.8vw,18px);font-weight:600;color:#c0f333'>On te prépare une soirée avec 5‑7 personnes dans ta vibe.</span>",
    subtitleTextColor: "#c0f333",
    subtitleTextFontSize: "clamp(14px,2.2vw,18px)",
    subtitleTextFontWeight: "600",
    subtitleTextLineHeight: "1.3",
    subtitleTextMaxWidth: "min(420px,90%)",
    closedMessageHtml: "<p class=\"pzr-user-subtitle-text\">Fini pour aujourd'hui</p>",
    titleFontSize: "clamp(26px,3vw,34px)",
    titleFontSizeTablet: "clamp(24px,3.4vw,30px)",
    titleFontSizeMobile: "clamp(22px,5vw,28px)",
    labelFontSize: "clamp(20px,2.3vw,26px)",
    labelFontSizeTablet: "clamp(18px,3vw,24px)",
    labelFontSizeMobile: "clamp(20px,5vw,24px)",
    labelTopSpacing: "10px",
    chipFontSize: "clamp(14px,1.6vw,18px)",
    chipFontSizeTablet: "clamp(14px,2.4vw,18px)",
    chipFontSizeMobile: "clamp(14px,3.6vw,18px)",
    chipColumns: 3,
    chipColumnsMobile: 3,
    chipGap: "6px",
    chipGapMobile: "8px",
    chipMaxWidth: "126px",
    chipMaxWidthMobile: "none",
    chipHeight: "56px",
    chipHeightMobile: "50px",
    chipWideSpan: 2,
    chipWideMaxWidth: "260px",
    chipWideMaxWidthMobile: "none",
    submitFontSize: "clamp(18px,2vw,22px)",
    submitFontSizeTablet: "clamp(18px,3vw,22px)",
    submitFontSizeMobile: "clamp(18px,4.4vw,22px)",
    labelFontScale: 0.85,
    submitFontScale: 0.9,
    wrapMinHeight: "100vh",
    wrapPadding: "24px",
    wrapPaddingMobile: "14px",
    wrapBackground: "#000",
    wrapAlign: "center",
    wrapJustify: "center",
    lockHorizontalScroll: true,
    whenLabel: "Quand?",
    withWhoLabel: "Avec qui?",
    whereLabel: "Où es-tu actuellement?",
    nowLabel: "Maintenant",
    defaultWhenValue: "",
    defaultWithWhoValue: "",
    defaultWhereValue: "",
    wherePlaceholder: "Choisir",
    whereWideMatch: "banlieue",
    withWhoOptions: ["Solo", "Une pote 💃", "Un pote 🕺"],
    whereOptions: [
      "Paris\nCentre",
      "Paris\nEst",
      "Paris\nOuest",
      "Paris\nNord",
      "Paris\nSud",
      "Banlieue Parisienne\n(77, 78, 91, 92, 93, 94, 95)"
    ],
    successRedirectUrl: "https://www.parazar.co/instant/confirmation",
    submitLabel: "Lancer mon Parazar",
    minHour: "18:00",
    maxHour: "21:00",
    intervalMinutes: 30,
    startOffsetIntervals: 3,
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
      ".pzr-user-wrap{min-height:var(--pzr-user-wrap-min-height,100vh);display:flex;align-items:var(--pzr-user-wrap-align,center);justify-content:var(--pzr-user-wrap-justify,center);padding:var(--pzr-user-wrap-padding,24px);background:var(--pzr-user-wrap-bg,#000);color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;width:100%;overflow-x:hidden}",
      ".pzr-user-card{position:relative;width:min(520px,95vw);max-width:100%;border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);box-shadow:none;padding:22px;--pzr-user-title-font-size:clamp(26px,3.4vw,38px);--pzr-user-label-font-size:clamp(18px,2.4vw,28px);--pzr-user-label-top-spacing:8px;--pzr-user-chip-font-size:clamp(20px,2.6vw,34px);--pzr-user-submit-font-size:clamp(19px,3vw,28px)}",
      ".pzr-user-title{margin:0 0 16px 0;font-size:var(--pzr-user-title-font-size);line-height:1.08;font-weight:420;letter-spacing:-0.01em;color:#f3f3f3;text-align:center}",
      ".pzr-user-title img{display:block;height:var(--pzr-user-title-image-height,32px);width:auto;max-width:var(--pzr-user-title-image-max-width,min(240px,70vw));margin:0 auto}",
      ".pzr-user-subtitle{margin:var(--pzr-user-subtitle-spacing,8px) 0 14px 0;text-align:center}",
      ".pzr-user-subtitle img{display:block;height:var(--pzr-user-subtitle-image-height,18px);width:auto;max-width:var(--pzr-user-subtitle-image-max-width,min(320px,80vw));margin:0 auto}",
      ".pzr-user-subtitle-text{margin:0 auto;max-width:var(--pzr-user-subtitle-text-max-width,min(420px,90%));font-size:var(--pzr-user-subtitle-text-font-size,clamp(14px,2.2vw,18px));font-weight:var(--pzr-user-subtitle-text-font-weight,600);line-height:var(--pzr-user-subtitle-text-line-height,1.3);color:var(--pzr-user-subtitle-text-color,#c0f333);text-align:center;white-space:pre-line}",
      ".pzr-user-block{border-radius:16px;border:0.5px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));padding:14px}",
      ".pzr-user-section{margin-bottom:14px}",
      ".pzr-user-section:last-of-type{margin-bottom:18px}",
      ".pzr-user-label{display:block;width:100%;margin:var(--pzr-user-label-top-spacing,8px) 2px 10px 2px;font-size:var(--pzr-user-label-font-size);font-weight:560;line-height:1.15;color:#e2e2e2;letter-spacing:.005em;text-align:center;white-space:normal;text-wrap:balance}",
      ".pzr-user-chips{--pzr-user-chip-columns-current:var(--pzr-user-chip-columns,3);--pzr-user-chip-gap-current:var(--pzr-user-chip-gap,10px);display:flex;flex-wrap:wrap;justify-content:center;gap:var(--pzr-user-chip-gap-current);padding:2px 2px 6px;width:100%;max-width:100%;box-sizing:border-box}",
      ".pzr-user-chip{display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;min-width:0;flex:0 1 calc((100% - (var(--pzr-user-chip-columns-current) - 1) * var(--pzr-user-chip-gap-current)) / var(--pzr-user-chip-columns-current));max-width:var(--pzr-user-chip-max-width,126px);height:var(--pzr-user-chip-height,56px);padding:0 6px;border-radius:16px;border:0.5px solid rgba(255,255,255,.16);background:#1a1d23;color:#fff;font-family:inherit;font-size:var(--pzr-user-chip-font-size);font-weight:520;letter-spacing:-0.01em;line-height:1.15;white-space:pre-line;cursor:pointer;transition:all .14s ease}",
      ".pzr-user-chip.is-wide{flex-basis:calc(((100% - (var(--pzr-user-chip-columns-current) - 1) * var(--pzr-user-chip-gap-current)) / var(--pzr-user-chip-columns-current)) * var(--pzr-user-chip-wide-span,2) + (var(--pzr-user-chip-gap-current) * (var(--pzr-user-chip-wide-span,2) - 1)));max-width:var(--pzr-user-chip-wide-max-width,260px)}",
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
      "@media (max-width:991px){.pzr-user-title{font-size:var(--pzr-user-title-font-size-tablet,var(--pzr-user-title-font-size))}.pzr-user-label{font-size:var(--pzr-user-label-font-size-tablet,var(--pzr-user-label-font-size))}.pzr-user-chip{font-size:var(--pzr-user-chip-font-size-tablet,var(--pzr-user-chip-font-size))}.pzr-user-submit{font-size:var(--pzr-user-submit-font-size-tablet,var(--pzr-user-submit-font-size))}}",
      "@media (max-width:480px){.pzr-user-wrap{padding:var(--pzr-user-wrap-padding-mobile,14px)}.pzr-user-card{padding:16px;border-radius:16px}.pzr-user-title{font-size:var(--pzr-user-title-font-size-mobile,var(--pzr-user-title-font-size-tablet,var(--pzr-user-title-font-size)))}.pzr-user-label{font-size:var(--pzr-user-label-font-size-mobile,var(--pzr-user-label-font-size-tablet,var(--pzr-user-label-font-size)))}.pzr-user-chip{font-size:var(--pzr-user-chip-font-size-mobile,var(--pzr-user-chip-font-size-tablet,var(--pzr-user-chip-font-size)))}.pzr-user-chips{--pzr-user-chip-columns-current:var(--pzr-user-chip-columns-mobile,var(--pzr-user-chip-columns,3));--pzr-user-chip-gap-current:var(--pzr-user-chip-gap-mobile,var(--pzr-user-chip-gap,10px));gap:var(--pzr-user-chip-gap-current)}.pzr-user-chip{max-width:var(--pzr-user-chip-max-width-mobile,none);height:var(--pzr-user-chip-height-mobile,50px)}.pzr-user-chip.is-wide{max-width:var(--pzr-user-chip-wide-max-width-mobile,var(--pzr-user-chip-wide-max-width,260px))}.pzr-user-submit{height:58px;font-size:var(--pzr-user-submit-font-size-mobile,var(--pzr-user-submit-font-size-tablet,var(--pzr-user-submit-font-size)))}}"
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

  function applyHorizontalScrollLock() {
    if (!options.lockHorizontalScroll) {
      return;
    }
    const htmlEl = document.documentElement;
    if (htmlEl && !htmlEl.dataset.pzrOverflowX) {
      htmlEl.dataset.pzrOverflowX = htmlEl.style.overflowX || "";
      htmlEl.style.overflowX = "hidden";
    }
    if (document.body && !document.body.dataset.pzrOverflowX) {
      document.body.dataset.pzrOverflowX = document.body.style.overflowX || "";
      document.body.style.overflowX = "hidden";
    }
  }

  function releaseHorizontalScrollLock() {
    const htmlEl = document.documentElement;
    if (htmlEl && htmlEl.dataset.pzrOverflowX != null) {
      htmlEl.style.overflowX = htmlEl.dataset.pzrOverflowX;
      delete htmlEl.dataset.pzrOverflowX;
    }
    if (document.body && document.body.dataset.pzrOverflowX != null) {
      document.body.style.overflowX = document.body.dataset.pzrOverflowX;
      delete document.body.dataset.pzrOverflowX;
    }
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
      '    <div class="pzr-user-subtitle" id="pzr-user-subtitle"></div>',
      '    <div class="pzr-user-block" id="pzr-user-block">',
      '      <div class="pzr-user-section">',
      '        <div class="pzr-user-label" id="pzr-user-when-label"></div>',
      '        <div id="pzr-user-when-chips" class="pzr-user-chips" role="listbox" aria-label="Quand"></div>',
      "      </div>",
      '      <div class="pzr-user-section">',
      '        <div class="pzr-user-label" id="pzr-user-who-label"></div>',
      '        <div id="pzr-user-who-chips" class="pzr-user-chips" role="listbox" aria-label="Avec qui"></div>',
      "      </div>",
      '      <div class="pzr-user-section">',
      '        <div class="pzr-user-label" id="pzr-user-where-label"></div>',
      '        <div id="pzr-user-where-chips" class="pzr-user-chips" role="listbox" aria-label="Où tu te situes"></div>',
      "      </div>",
      '      <button id="pzr-user-submit" class="pzr-user-submit" type="button"></button>',
      '      <p id="pzr-user-status" class="pzr-user-status"></p>',
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    const titleNode = root.querySelector(".pzr-user-title");
    if (titleNode) {
      const titleText = String(options.title || "").trim();
      const imageUrl = String(options.titleImageUrl || "").trim();
      const shouldShowTitle = options.showTitle !== false && (titleText || imageUrl);
      if (!shouldShowTitle) {
        titleNode.remove();
      } else if (imageUrl) {
        titleNode.textContent = "";
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = String(options.titleImageAlt || titleText || "Parazar");
        img.loading = "lazy";
        img.decoding = "async";
        titleNode.appendChild(img);
      } else {
        titleNode.textContent = titleText;
      }
    }
    const subtitleNode = document.getElementById("pzr-user-subtitle");
    if (subtitleNode) {
      const subtitleHtml = String(options.subtitleHtml || "").trim();
      const subtitleText = String(options.subtitleText || "").trim();
      const subtitleImageUrl = String(options.subtitleImageUrl || "").trim();
      const subtitleAlt = String(options.subtitleImageAlt || "").trim();
      if (subtitleHtml || subtitleText) {
        subtitleNode.textContent = "";
        const textNode = document.createElement("p");
        textNode.className = "pzr-user-subtitle-text";
        if (subtitleHtml) {
          textNode.innerHTML = subtitleHtml;
        } else {
          textNode.textContent = subtitleText;
        }
        subtitleNode.appendChild(textNode);
        subtitleNode.style.display = "";
      } else if (subtitleImageUrl) {
        subtitleNode.textContent = "";
        const img = document.createElement("img");
        img.src = subtitleImageUrl;
        img.alt = subtitleAlt || "Parazar";
        img.loading = "lazy";
        img.decoding = "async";
        subtitleNode.appendChild(img);
        subtitleNode.style.display = "";
      } else {
        subtitleNode.textContent = "";
        subtitleNode.style.display = "none";
      }
    }
    const wrapNode = root.querySelector(".pzr-user-wrap");
    if (wrapNode) {
      wrapNode.style.setProperty("--pzr-user-wrap-min-height", String(options.wrapMinHeight || "100vh"));
      wrapNode.style.setProperty("--pzr-user-wrap-padding", String(options.wrapPadding || "24px"));
      wrapNode.style.setProperty("--pzr-user-wrap-padding-mobile", String(options.wrapPaddingMobile || "14px"));
      wrapNode.style.setProperty("--pzr-user-wrap-bg", String(options.wrapBackground || "#000"));
      wrapNode.style.setProperty("--pzr-user-wrap-align", String(options.wrapAlign || "center"));
      wrapNode.style.setProperty("--pzr-user-wrap-justify", String(options.wrapJustify || "center"));
    }
    const cardNode = root.querySelector(".pzr-user-card");
    if (cardNode) {
      const labelScale = Number(options.labelFontScale);
      const submitScale = Number(options.submitFontScale);
      const resolvedLabelScale = Number.isFinite(labelScale) && labelScale > 0 ? labelScale : 0.85;
      const resolvedSubmitScale = Number.isFinite(submitScale) && submitScale > 0 ? submitScale : 0.9;
      const resolvedLabelFont = options.labelFontSize
        ? String(options.labelFontSize)
        : "calc(var(--pzr-user-chip-font-size) * " + resolvedLabelScale + ")";
      const resolvedSubmitFont = options.submitFontSize
        ? String(options.submitFontSize)
        : "calc(var(--pzr-user-chip-font-size) * " + resolvedSubmitScale + ")";
      const resolvedTitleFontTablet = options.titleFontSizeTablet
        ? String(options.titleFontSizeTablet)
        : "";
      const resolvedTitleFontMobile = options.titleFontSizeMobile
        ? String(options.titleFontSizeMobile)
        : "";
      const resolvedChipFontTablet = options.chipFontSizeTablet
        ? String(options.chipFontSizeTablet)
        : "";
      const resolvedChipFontMobile = options.chipFontSizeMobile
        ? String(options.chipFontSizeMobile)
        : "";
      const resolvedLabelFontTablet = options.labelFontSizeTablet
        ? String(options.labelFontSizeTablet)
        : (!options.labelFontSize
          ? "calc(var(--pzr-user-chip-font-size-tablet, var(--pzr-user-chip-font-size)) * " + resolvedLabelScale + ")"
          : "");
      const resolvedLabelFontMobile = options.labelFontSizeMobile
        ? String(options.labelFontSizeMobile)
        : (!options.labelFontSize
          ? "calc(var(--pzr-user-chip-font-size-mobile, var(--pzr-user-chip-font-size)) * " + resolvedLabelScale + ")"
          : "");
      const resolvedSubmitFontTablet = options.submitFontSizeTablet
        ? String(options.submitFontSizeTablet)
        : (!options.submitFontSize
          ? "calc(var(--pzr-user-chip-font-size-tablet, var(--pzr-user-chip-font-size)) * " + resolvedSubmitScale + ")"
          : "");
      const resolvedSubmitFontMobile = options.submitFontSizeMobile
        ? String(options.submitFontSizeMobile)
        : (!options.submitFontSize
          ? "calc(var(--pzr-user-chip-font-size-mobile, var(--pzr-user-chip-font-size)) * " + resolvedSubmitScale + ")"
          : "");
      const resolvedTitleImageHeight = options.titleImageHeight
        ? String(options.titleImageHeight)
        : String(options.titleFontSize || "clamp(26px,3.4vw,38px)");
      const resolvedTitleImageMaxWidth = options.titleImageMaxWidth
        ? String(options.titleImageMaxWidth)
        : "min(240px,70vw)";
      const resolvedSubtitleImageHeight = options.subtitleImageHeight
        ? String(options.subtitleImageHeight)
        : "18px";
      const resolvedSubtitleImageMaxWidth = options.subtitleImageMaxWidth
        ? String(options.subtitleImageMaxWidth)
        : "min(320px,80vw)";
      const resolvedSubtitleSpacing = options.subtitleSpacing
        ? String(options.subtitleSpacing)
        : "8px";
      const resolvedSubtitleTextColor = options.subtitleTextColor
        ? String(options.subtitleTextColor)
        : "#c0f333";
      const resolvedSubtitleTextFontSize = options.subtitleTextFontSize
        ? String(options.subtitleTextFontSize)
        : "clamp(14px,2.2vw,18px)";
      const resolvedSubtitleTextFontWeight = options.subtitleTextFontWeight
        ? String(options.subtitleTextFontWeight)
        : "600";
      const resolvedSubtitleTextLineHeight = options.subtitleTextLineHeight
        ? String(options.subtitleTextLineHeight)
        : "1.3";
      const resolvedSubtitleTextMaxWidth = options.subtitleTextMaxWidth
        ? String(options.subtitleTextMaxWidth)
        : "min(420px,90%)";
      cardNode.style.setProperty("--pzr-user-title-font-size", String(options.titleFontSize || "clamp(26px,3.4vw,38px)"));
      cardNode.style.setProperty("--pzr-user-label-font-size", resolvedLabelFont);
      cardNode.style.setProperty("--pzr-user-label-top-spacing", String(options.labelTopSpacing || "8px"));
      cardNode.style.setProperty("--pzr-user-chip-font-size", String(options.chipFontSize || "clamp(20px,2.6vw,34px)"));
      if (resolvedTitleFontTablet) {
        cardNode.style.setProperty("--pzr-user-title-font-size-tablet", resolvedTitleFontTablet);
      }
      if (resolvedTitleFontMobile) {
        cardNode.style.setProperty("--pzr-user-title-font-size-mobile", resolvedTitleFontMobile);
      }
      if (resolvedChipFontTablet) {
        cardNode.style.setProperty("--pzr-user-chip-font-size-tablet", resolvedChipFontTablet);
      }
      if (resolvedChipFontMobile) {
        cardNode.style.setProperty("--pzr-user-chip-font-size-mobile", resolvedChipFontMobile);
      }
      if (resolvedLabelFontTablet) {
        cardNode.style.setProperty("--pzr-user-label-font-size-tablet", resolvedLabelFontTablet);
      }
      if (resolvedLabelFontMobile) {
        cardNode.style.setProperty("--pzr-user-label-font-size-mobile", resolvedLabelFontMobile);
      }
      cardNode.style.setProperty("--pzr-user-title-image-height", resolvedTitleImageHeight);
      cardNode.style.setProperty("--pzr-user-title-image-max-width", resolvedTitleImageMaxWidth);
      cardNode.style.setProperty("--pzr-user-subtitle-image-height", resolvedSubtitleImageHeight);
      cardNode.style.setProperty("--pzr-user-subtitle-image-max-width", resolvedSubtitleImageMaxWidth);
      cardNode.style.setProperty("--pzr-user-subtitle-spacing", resolvedSubtitleSpacing);
      cardNode.style.setProperty("--pzr-user-subtitle-text-color", resolvedSubtitleTextColor);
      cardNode.style.setProperty("--pzr-user-subtitle-text-font-size", resolvedSubtitleTextFontSize);
      cardNode.style.setProperty("--pzr-user-subtitle-text-font-weight", resolvedSubtitleTextFontWeight);
      cardNode.style.setProperty("--pzr-user-subtitle-text-line-height", resolvedSubtitleTextLineHeight);
      cardNode.style.setProperty("--pzr-user-subtitle-text-max-width", resolvedSubtitleTextMaxWidth);
      cardNode.style.setProperty("--pzr-user-chip-columns", String(options.chipColumns || 3));
      cardNode.style.setProperty("--pzr-user-chip-columns-mobile", String(options.chipColumnsMobile || options.chipColumns || 3));
      cardNode.style.setProperty("--pzr-user-chip-gap", String(options.chipGap || "10px"));
      cardNode.style.setProperty("--pzr-user-chip-gap-mobile", String(options.chipGapMobile || "8px"));
      cardNode.style.setProperty("--pzr-user-chip-max-width", String(options.chipMaxWidth || "126px"));
      cardNode.style.setProperty("--pzr-user-chip-max-width-mobile", String(options.chipMaxWidthMobile || "none"));
      cardNode.style.setProperty("--pzr-user-chip-height", String(options.chipHeight || "56px"));
      cardNode.style.setProperty("--pzr-user-chip-height-mobile", String(options.chipHeightMobile || "50px"));
      cardNode.style.setProperty("--pzr-user-chip-wide-span", String(options.chipWideSpan || 2));
      cardNode.style.setProperty("--pzr-user-chip-wide-max-width", String(options.chipWideMaxWidth || "260px"));
      cardNode.style.setProperty("--pzr-user-chip-wide-max-width-mobile", String(options.chipWideMaxWidthMobile || "none"));
      cardNode.style.setProperty("--pzr-user-submit-font-size", resolvedSubmitFont);
      if (resolvedSubmitFontTablet) {
        cardNode.style.setProperty("--pzr-user-submit-font-size-tablet", resolvedSubmitFontTablet);
      }
      if (resolvedSubmitFontMobile) {
        cardNode.style.setProperty("--pzr-user-submit-font-size-mobile", resolvedSubmitFontMobile);
      }
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
      whereChips: document.getElementById("pzr-user-where-chips"),
      submitButton: document.getElementById("pzr-user-submit"),
      statusNode: document.getElementById("pzr-user-status"),
      blockNode: document.getElementById("pzr-user-block")
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
    const whereValue = ui.whereChips ? getSelectedChipValue(ui.whereChips) : "";
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
    const offsetMinutes = startOffsetIntervalsValue * intervalMinutesValue;
    const earliestFromMin = new Date(bookingWindow.start.getTime() + (offsetMinutes * 60000));
    const baseStart = new Date(Math.max(earliestFromMin.getTime(), now.getTime()));
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
    scheduleChipLayout(ui);
  }

  function buildWhoChips(ui) {
    buildChips(ui.whoChips, options.withWhoOptions, options.defaultWithWhoValue, function () {
      updateSubmitButtonAvailability(ui);
    });
    scheduleChipLayout(ui);
  }

  function buildWhereChips(ui) {
    const normalizedDefault = options.defaultWhereValue != null
      ? String(options.defaultWhereValue).trim()
      : "";
    const wideMatch = String(options.whereWideMatch || "banlieue").toLowerCase();

    const normalized = options.whereOptions
      .map(normalizeOption)
      .filter(function (item) { return item; });

    let wideItem = null;
    const regularItems = [];
    normalized.forEach(function (item) {
      const labelLower = String(item.label || "").toLowerCase();
      const valueLower = String(item.value || "").toLowerCase();
      if (wideMatch && (labelLower.indexOf(wideMatch) !== -1 || valueLower.indexOf(wideMatch) !== -1)) {
        if (!wideItem) {
          wideItem = item;
          return;
        }
      }
      regularItems.push(item);
    });
    if (wideItem) {
      regularItems.push(wideItem);
    }

    buildChips(ui.whereChips, regularItems, normalizedDefault, function () {
      updateSubmitButtonAvailability(ui);
    });

    if (wideItem) {
      const chips = Array.from(ui.whereChips.querySelectorAll(".pzr-user-chip"));
      chips.forEach(function (chip) {
        if (String(chip.dataset.value || "") === String(wideItem.value || "")) {
          chip.classList.add("is-wide");
        }
      });
    }
    scheduleChipLayout(ui);
  }

  let isSubmitting = false;
  let currentToken = null;
  let ui = null;

  function resolveChipColumnsForViewport() {
    const baseColumns = Number(options.chipColumns) || 3;
    const mobileColumns = Number(options.chipColumnsMobile) || baseColumns;
    if (window.matchMedia && window.matchMedia("(max-width:480px)").matches) {
      return mobileColumns;
    }
    return baseColumns;
  }

  function applyChipLayout(container) {
    if (!container) {
      return;
    }
    const chips = Array.from(container.querySelectorAll(".pzr-user-chip"));
    if (!chips.length) {
      return;
    }
    const wideChips = chips.filter(function (chip) { return chip.classList.contains("is-wide"); });
    if (!wideChips.length) {
      return;
    }
    const normalChip = chips.find(function (chip) { return !chip.classList.contains("is-wide"); });
    if (!normalChip) {
      return;
    }
    const gapValue = getComputedStyle(container).gap || "0px";
    const gap = Number.parseFloat(gapValue) || 0;
    const span = Number(options.chipWideSpan) || 2;
    const normalWidth = normalChip.getBoundingClientRect().width;
    if (!normalWidth) {
      return;
    }
    const wideWidth = normalWidth * span + gap * (span - 1);
    wideChips.forEach(function (chip) {
      chip.style.flexBasis = wideWidth + "px";
      chip.style.width = wideWidth + "px";
      chip.style.maxWidth = wideWidth + "px";
    });
  }

  function scheduleChipLayout(uiRef) {
    if (!uiRef) {
      return;
    }
    window.requestAnimationFrame(function () {
      applyChipLayout(uiRef.whenChips);
      applyChipLayout(uiRef.whoChips);
      applyChipLayout(uiRef.whereChips);
    });
  }

  function isOutsideBookingWindow() {
    const now = new Date();
    const bookingWindow = resolveBookingWindow(now);
    return now.getTime() < bookingWindow.start.getTime() || now.getTime() > bookingWindow.end.getTime();
  }

  function showClosedMessage(uiRef) {
    if (!uiRef) {
      return;
    }
    if (uiRef.blockNode) {
      uiRef.blockNode.style.display = "none";
    }
    const subtitleNode = document.getElementById("pzr-user-subtitle");
    if (subtitleNode) {
      const html = String(options.closedMessageHtml || "").trim() || "<p class=\"pzr-user-subtitle-text\">Fini pour aujourd'hui</p>";
      subtitleNode.innerHTML = html;
      subtitleNode.style.display = "";
    }
  }

  function getState() {
    if (!ui) {
      return null;
    }
    return {
      token: currentToken,
      when: getSelectedChipValue(ui.whenChips),
      with_who: getSelectedChipValue(ui.whoChips),
      where: ui.whereChips ? getSelectedChipValue(ui.whereChips) : ""
    };
  }

  async function submitInstant(uiRef) {
    if (isSubmitting || !currentToken) {
      return;
    }

    const whenValue = getSelectedChipValue(uiRef.whenChips);
    const whoValue = getSelectedChipValue(uiRef.whoChips);
    const whereValue = uiRef.whereChips ? getSelectedChipValue(uiRef.whereChips) : "";

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
  applyHorizontalScrollLock();
  currentToken = options.token
    ? String(options.token).trim()
    : getParazarTokenFromUrl(options.tokenParam);
  if (!currentToken) {
    if (options.missingTokenRedirectUrl) {
      window.location.replace(options.missingTokenRedirectUrl);
    }
    return {
      destroy: function () {
        releaseHorizontalScrollLock();
      },
      getState: function () { return null; },
      ready: Promise.resolve(false)
    };
  }

  ui = createUi(root);
  ui.submitButton.textContent = options.submitLabel;

  if (isOutsideBookingWindow()) {
    showClosedMessage(ui);
    return {
      destroy: function () {
        if (ui && ui.root) {
          ui.root.remove();
        }
        releaseHorizontalScrollLock();
      },
      getState: getState,
      ready: Promise.resolve(false)
    };
  }

  buildWhenChips(ui);
  buildWhoChips(ui);
  buildWhereChips(ui);
  updateSubmitButtonAvailability(ui);

  ui.submitButton.addEventListener("click", function () {
    submitInstant(ui);
  });
  window.addEventListener("resize", function () {
    scheduleChipLayout(ui);
  });

  const readyPromise = Promise.resolve(true);

  return {
    destroy: function () {
      if (ui && ui.root) {
        ui.root.remove();
      }
      releaseHorizontalScrollLock();
    },
    getState: getState,
    ready: readyPromise
  };
}

// Checkin time guard (no UI)
function setupParazarCheckinWindowGuard(config) {
  const options = Object.assign({
    minHour: "19:00",
    maxHour: "21:00",
    outsideWindowRedirectUrl: "https://getapp.parazar.co"
  }, config || {});

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

  function buildDateAtMinutes(referenceDate, minutesOfDay, dayOffset) {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    date.setMinutes(minutesOfDay, 0, 0);
    return date;
  }

  const minHourMinutesValue = toMinutes(options.minHour);
  const maxHourMinutesValue = toMinutes(options.maxHour);
  const resolvedMinHourMinutes = Number.isFinite(minHourMinutesValue) ? minHourMinutesValue : toMinutes("18:00");
  const resolvedMaxHourMinutes = Number.isFinite(maxHourMinutesValue) ? maxHourMinutesValue : toMinutes("21:00");

  function resolveActiveWindow(now) {
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

  const now = new Date();
  const windowRange = resolveActiveWindow(now);
  const isOutside = now.getTime() < windowRange.start.getTime() || now.getTime() > windowRange.end.getTime();

  if (isOutside && options.outsideWindowRedirectUrl) {
    window.location.replace(options.outsideWindowRedirectUrl);
  }

  return {
    ok: !isOutside,
    now: now,
    window: windowRange
  };
}

// Checkin form UI
function setupParazarCheckinForm(config) {
  const options = Object.assign({
    mountSelector: "body",
    apiBase: "https://backend.parazar.co",
    apiUrl: "",
    checkinPath: "/api/parazar/checkin",
    sendCheckinInPayload: true,
    payloadKey: "checkin-id",
    title: "Parazar",
    showTitle: true,
    titleImageUrl: "https://cdn.prod.website-files.com/6665627cae20cb25d5ffa6af/698cb46b188c3fb591e3ffa1_Parazar_Logo_PureWhite_RVB.svg",
    titleImageAlt: "Parazar",
    titleImageHeight: "56px",
    titleImageMaxWidth: "260px",
    subtitleText: "Renseigne ton checkin ID afin de valider ta présence",
    subtitleHtml: "",
    subtitleSpacing: "10px",
    subtitleTextColor: "#c0f333",
    subtitleTextFontSize: "clamp(14px,2.2vw,18px)",
    subtitleTextFontWeight: "600",
    subtitleTextLineHeight: "1.35",
    subtitleTextMaxWidth: "min(420px,90%)",
    inputPlaceholder: "Checkin-id",
    inputAriaLabel: "Checkin ID",
    inputHeight: "56px",
    inputPadding: "0 16px",
    inputRadius: "14px",
    inputFontSize: "clamp(16px,2.4vw,20px)",
    inputBackground: "#101010",
    inputBorder: "0.5px solid rgba(255,255,255,.16)",
    inputTextColor: "#ffffff",
    inputTextAlign: "center",
    buttonLabel: "Je valide ma présence",
    buttonHeight: "60px",
    buttonRadius: "13px",
    buttonFontSize: "clamp(18px,2.6vw,22px)",
    buttonBackground: "#c0f333",
    buttonColor: "#0b0b0b",
    buttonShadow: "0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3)",
    wrapMinHeight: "100vh",
    wrapPadding: "24px",
    wrapPaddingMobile: "14px",
    wrapBackground: "#000",
    wrapAlign: "center",
    wrapJustify: "center",
    lockHorizontalScroll: true,
    statusMinHeight: "22px",
    statusFontSize: "14px",
    statusMutedColor: "#bfbfbf",
    statusSuccessColor: "#c0f333",
    statusErrorColor: "#ff8f8f",
    successMessage: "Présence confirmée",
    alreadyConfirmedMessage: "Présence déjà confirmée",
    invalidMessage: "Checkin ID non valide ou expiré",
    notFoundMessage: "Checkin ID introuvable",
    rateLimitMessage: "Trop de tentatives, réessaie plus tard",
    serverErrorMessage: "Erreur serveur, réessaie plus tard",
    genericErrorMessage: "Impossible de valider la présence",
    pendingMessage: "Validation en cours...",
    successRedirectUrl: "https://parazar-suivez-vos-envies.webflow.io/instant/checkin-confirmation",
    successRedirectDelayMs: 10000,
    errorClearDelayMs: 10000,
    successIcon: "→",
    errorIcon: "✕",
    successIconColor: "#49d37e",
    errorIconColor: "#ff6b6b",
    onSubmitSuccess: null,
    onSubmitError: null
  }, config || {});

  const STYLE_ID = "pzr-checkin-style";
  const ROOT_ID = "pzr-checkin-root";

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

  function resolveCheckinUrl(checkinId) {
    const idValue = encodeURIComponent(String(checkinId || "").trim());
    if (options.apiUrl) {
      const raw = String(options.apiUrl).trim();
      if (!raw) {
        return idValue;
      }
      if (raw.indexOf("{checkinId}") !== -1) {
        return raw.replace("{checkinId}", idValue);
      }
      if (!options.sendCheckinInPayload) {
        if (raw.endsWith("/")) {
          return raw + idValue;
        }
        return raw + "/" + idValue;
      }
      return raw;
    }
    const path = String(options.checkinPath || "/api/parazar/checkin");
    if (!options.sendCheckinInPayload) {
      const withId = path.endsWith("/") ? path + idValue : path + "/" + idValue;
      return joinUrl(options.apiBase, withId);
    }
    return joinUrl(options.apiBase, path);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');",
      ".pzr-checkin-wrap{min-height:var(--pzr-checkin-wrap-min-height,100vh);display:flex;align-items:var(--pzr-checkin-wrap-align,center);justify-content:var(--pzr-checkin-wrap-justify,center);padding:var(--pzr-checkin-wrap-padding,24px);background:var(--pzr-checkin-wrap-bg,#000);color:#fff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;width:100%;overflow-x:hidden}",
      ".pzr-checkin-card{position:relative;width:min(520px,95vw);max-width:100%;border-radius:22px;border:0.5px solid rgba(255,255,255,.2);background:linear-gradient(165deg,rgba(23,23,23,.96) 0%,rgba(9,9,9,.98) 100%);padding:22px}",
      ".pzr-checkin-title{margin:0 0 10px 0;text-align:center}",
      ".pzr-checkin-title img{display:block;height:var(--pzr-checkin-title-image-height,32px);width:auto;max-width:var(--pzr-checkin-title-image-max-width,min(240px,70vw));margin:0 auto}",
      ".pzr-checkin-subtitle{margin:var(--pzr-checkin-subtitle-spacing,10px) 0 18px 0;text-align:center}",
      ".pzr-checkin-subtitle-text{margin:0 auto;max-width:var(--pzr-checkin-subtitle-text-max-width,min(420px,90%));font-size:var(--pzr-checkin-subtitle-text-font-size,clamp(14px,2.2vw,18px));font-weight:var(--pzr-checkin-subtitle-text-font-weight,600);line-height:var(--pzr-checkin-subtitle-text-line-height,1.35);color:var(--pzr-checkin-subtitle-text-color,#c0f333);text-align:center;white-space:pre-line}",
      ".pzr-checkin-input{width:100%;height:var(--pzr-checkin-input-height,56px);padding:var(--pzr-checkin-input-padding,0 16px);border-radius:var(--pzr-checkin-input-radius,14px);border:var(--pzr-checkin-input-border,0.5px solid rgba(255,255,255,.16));background:var(--pzr-checkin-input-bg,#101010);color:var(--pzr-checkin-input-color,#fff);font-size:var(--pzr-checkin-input-font-size,clamp(16px,2.4vw,20px));text-align:var(--pzr-checkin-input-align,center);letter-spacing:.02em;box-sizing:border-box}",
      ".pzr-checkin-input::placeholder{color:#8b8b8b}",
      ".pzr-checkin-input:focus{outline:none;border-color:rgba(192,243,51,.55);box-shadow:0 0 0 2px rgba(192,243,51,.12)}",
      ".pzr-checkin-submit{width:100%;height:var(--pzr-checkin-button-height,60px);margin-top:14px;border:0;border-radius:var(--pzr-checkin-button-radius,13px);background:var(--pzr-checkin-button-bg,#c0f333);color:var(--pzr-checkin-button-color,#0b0b0b);font-family:inherit;font-size:var(--pzr-checkin-button-font-size,clamp(18px,2.6vw,22px));font-weight:620;letter-spacing:-0.01em;cursor:pointer;box-shadow:var(--pzr-checkin-button-shadow,0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3));transition:transform .14s ease,filter .14s ease}",
      ".pzr-checkin-submit:hover{filter:brightness(1.03)}",
      ".pzr-checkin-submit:active{transform:translateY(1px)}",
      ".pzr-checkin-submit:disabled{opacity:.55;cursor:not-allowed}",
      ".pzr-checkin-status{min-height:var(--pzr-checkin-status-min-height,22px);margin:12px 2px 0;font-size:var(--pzr-checkin-status-font-size,14px);color:var(--pzr-checkin-status-muted,#bfbfbf);text-align:center}",
      ".pzr-checkin-status.success{color:var(--pzr-checkin-status-success,#c0f333)}",
      ".pzr-checkin-status.error{color:var(--pzr-checkin-status-error,#ff8f8f)}",
      ".pzr-checkin-icon{margin-left:6px;font-weight:700}",
      ".pzr-checkin-icon.success{color:var(--pzr-checkin-success-icon-color,#49d37e)}",
      ".pzr-checkin-icon.error{color:var(--pzr-checkin-error-icon-color,#ff6b6b)}",
      "@media (max-width:480px){.pzr-checkin-wrap{padding:var(--pzr-checkin-wrap-padding-mobile,14px)}.pzr-checkin-card{padding:16px;border-radius:16px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function getMountNode() {
    const target = document.querySelector(options.mountSelector);
    if (!target) {
      throw new Error("setupParazarCheckinForm: conteneur introuvable");
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

  function applyHorizontalScrollLock() {
    if (!options.lockHorizontalScroll) {
      return;
    }
    const htmlEl = document.documentElement;
    if (htmlEl && !htmlEl.dataset.pzrOverflowX) {
      htmlEl.dataset.pzrOverflowX = htmlEl.style.overflowX || "";
      htmlEl.style.overflowX = "hidden";
    }
    if (document.body && !document.body.dataset.pzrOverflowX) {
      document.body.dataset.pzrOverflowX = document.body.style.overflowX || "";
      document.body.style.overflowX = "hidden";
    }
  }

  function releaseHorizontalScrollLock() {
    const htmlEl = document.documentElement;
    if (htmlEl && htmlEl.dataset.pzrOverflowX != null) {
      htmlEl.style.overflowX = htmlEl.dataset.pzrOverflowX;
      delete htmlEl.dataset.pzrOverflowX;
    }
    if (document.body && document.body.dataset.pzrOverflowX != null) {
      document.body.style.overflowX = document.body.dataset.pzrOverflowX;
      delete document.body.dataset.pzrOverflowX;
    }
  }

  function createUi(root) {
    root.innerHTML = [
      '<div class="pzr-checkin-wrap">',
      '  <div class="pzr-checkin-card">',
      '    <div class="pzr-checkin-title"></div>',
      '    <div class="pzr-checkin-subtitle"></div>',
      '    <input id="pzr-checkin-input" class="pzr-checkin-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />',
      '    <button id="pzr-checkin-submit" class="pzr-checkin-submit" type="button"></button>',
      '    <p id="pzr-checkin-status" class="pzr-checkin-status"></p>',
      "  </div>",
      "</div>"
    ].join("");

    const titleNode = root.querySelector(".pzr-checkin-title");
    if (titleNode) {
      const titleText = String(options.title || "").trim();
      const imageUrl = String(options.titleImageUrl || "").trim();
      const shouldShowTitle = options.showTitle !== false && (titleText || imageUrl);
      if (!shouldShowTitle) {
        titleNode.remove();
      } else if (imageUrl) {
        titleNode.textContent = "";
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = String(options.titleImageAlt || titleText || "Parazar");
        img.loading = "lazy";
        img.decoding = "async";
        titleNode.appendChild(img);
      } else {
        titleNode.textContent = titleText;
      }
    }

    const subtitleNode = root.querySelector(".pzr-checkin-subtitle");
    if (subtitleNode) {
      const subtitleHtml = String(options.subtitleHtml || "").trim();
      const subtitleText = String(options.subtitleText || "").trim();
      subtitleNode.textContent = "";
      if (subtitleHtml) {
        const textNode = document.createElement("p");
        textNode.className = "pzr-checkin-subtitle-text";
        textNode.innerHTML = subtitleHtml;
        subtitleNode.appendChild(textNode);
      } else if (subtitleText) {
        const textNode = document.createElement("p");
        textNode.className = "pzr-checkin-subtitle-text";
        textNode.textContent = subtitleText;
        subtitleNode.appendChild(textNode);
      }
    }

    const wrapNode = root.querySelector(".pzr-checkin-wrap");
    if (wrapNode) {
      wrapNode.style.setProperty("--pzr-checkin-wrap-min-height", String(options.wrapMinHeight || "100vh"));
      wrapNode.style.setProperty("--pzr-checkin-wrap-padding", String(options.wrapPadding || "24px"));
      wrapNode.style.setProperty("--pzr-checkin-wrap-padding-mobile", String(options.wrapPaddingMobile || "14px"));
      wrapNode.style.setProperty("--pzr-checkin-wrap-bg", String(options.wrapBackground || "#000"));
      wrapNode.style.setProperty("--pzr-checkin-wrap-align", String(options.wrapAlign || "center"));
      wrapNode.style.setProperty("--pzr-checkin-wrap-justify", String(options.wrapJustify || "center"));
    }

    const cardNode = root.querySelector(".pzr-checkin-card");
    if (cardNode) {
      cardNode.style.setProperty("--pzr-checkin-title-image-height", String(options.titleImageHeight || "56px"));
      cardNode.style.setProperty("--pzr-checkin-title-image-max-width", String(options.titleImageMaxWidth || "260px"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-spacing", String(options.subtitleSpacing || "10px"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-text-color", String(options.subtitleTextColor || "#c0f333"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-text-font-size", String(options.subtitleTextFontSize || "clamp(14px,2.2vw,18px)"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-text-font-weight", String(options.subtitleTextFontWeight || "600"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-text-line-height", String(options.subtitleTextLineHeight || "1.35"));
      cardNode.style.setProperty("--pzr-checkin-subtitle-text-max-width", String(options.subtitleTextMaxWidth || "min(420px,90%)"));
      cardNode.style.setProperty("--pzr-checkin-input-height", String(options.inputHeight || "56px"));
      cardNode.style.setProperty("--pzr-checkin-input-padding", String(options.inputPadding || "0 16px"));
      cardNode.style.setProperty("--pzr-checkin-input-radius", String(options.inputRadius || "14px"));
      cardNode.style.setProperty("--pzr-checkin-input-font-size", String(options.inputFontSize || "clamp(16px,2.4vw,20px)"));
      cardNode.style.setProperty("--pzr-checkin-input-bg", String(options.inputBackground || "#101010"));
      cardNode.style.setProperty("--pzr-checkin-input-border", String(options.inputBorder || "0.5px solid rgba(255,255,255,.16)"));
      cardNode.style.setProperty("--pzr-checkin-input-color", String(options.inputTextColor || "#ffffff"));
      cardNode.style.setProperty("--pzr-checkin-input-align", String(options.inputTextAlign || "center"));
      cardNode.style.setProperty("--pzr-checkin-button-height", String(options.buttonHeight || "60px"));
      cardNode.style.setProperty("--pzr-checkin-button-radius", String(options.buttonRadius || "13px"));
      cardNode.style.setProperty("--pzr-checkin-button-font-size", String(options.buttonFontSize || "clamp(18px,2.6vw,22px)"));
      cardNode.style.setProperty("--pzr-checkin-button-bg", String(options.buttonBackground || "#c0f333"));
      cardNode.style.setProperty("--pzr-checkin-button-color", String(options.buttonColor || "#0b0b0b"));
      cardNode.style.setProperty("--pzr-checkin-button-shadow", String(options.buttonShadow || "0 10px 28px rgba(192,243,51,.26),inset 0 1px 0 rgba(255,255,255,.3)"));
      cardNode.style.setProperty("--pzr-checkin-status-min-height", String(options.statusMinHeight || "22px"));
      cardNode.style.setProperty("--pzr-checkin-status-font-size", String(options.statusFontSize || "14px"));
      cardNode.style.setProperty("--pzr-checkin-status-muted", String(options.statusMutedColor || "#bfbfbf"));
      cardNode.style.setProperty("--pzr-checkin-status-success", String(options.statusSuccessColor || "#c0f333"));
      cardNode.style.setProperty("--pzr-checkin-status-error", String(options.statusErrorColor || "#ff8f8f"));
      cardNode.style.setProperty("--pzr-checkin-success-icon-color", String(options.successIconColor || "#49d37e"));
      cardNode.style.setProperty("--pzr-checkin-error-icon-color", String(options.errorIconColor || "#ff6b6b"));
    }

    const inputNode = document.getElementById("pzr-checkin-input");
    if (inputNode) {
      inputNode.placeholder = String(options.inputPlaceholder || "Checkin-id");
      inputNode.setAttribute("aria-label", String(options.inputAriaLabel || options.inputPlaceholder || "Checkin-id"));
    }
    const submitButton = document.getElementById("pzr-checkin-submit");
    if (submitButton) {
      submitButton.textContent = String(options.buttonLabel || "Je valide ma présence");
    }

    return {
      root: root,
      inputNode: document.getElementById("pzr-checkin-input"),
      submitButton: document.getElementById("pzr-checkin-submit"),
      statusNode: document.getElementById("pzr-checkin-status")
    };
  }

  function setStatus(uiRef, message, type, showIcon) {
    if (!uiRef || !uiRef.statusNode) {
      return;
    }
    uiRef.statusNode.className = "pzr-checkin-status" + (type ? " " + type : "");
    uiRef.statusNode.textContent = "";
    if (!message) {
      return;
    }
    const textNode = document.createElement("span");
    textNode.textContent = message;
    uiRef.statusNode.appendChild(textNode);
    if (showIcon) {
      const icon = document.createElement("span");
      icon.className = "pzr-checkin-icon " + (type || "");
      icon.textContent = type === "error"
        ? String(options.errorIcon || "✕")
        : String(options.successIcon || "→");
      uiRef.statusNode.appendChild(icon);
    }
  }

  function scheduleRedirect(url) {
    const target = String(url || "").trim();
    if (!target) {
      return;
    }
    const delayMs = Number(options.successRedirectDelayMs);
    const waitMs = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 10000;
    window.setTimeout(function () {
      window.location.replace(target);
    }, waitMs);
  }

  function scheduleStatusClear(uiRef) {
    const delayMs = Number(options.errorClearDelayMs);
    const waitMs = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 10000;
    window.setTimeout(function () {
      setStatus(uiRef, "", "");
    }, waitMs);
  }

  function getCheckinId(uiRef) {
    if (!uiRef || !uiRef.inputNode) {
      return "";
    }
    return String(uiRef.inputNode.value || "").trim();
  }

  function updateButtonState(uiRef) {
    if (!uiRef || !uiRef.submitButton) {
      return;
    }
    const value = getCheckinId(uiRef);
    uiRef.submitButton.disabled = !value;
  }

  ensureStyles();
  const mountNode = getMountNode();
  const root = ensureRoot(mountNode);
  applyHorizontalScrollLock();

  const ui = createUi(root);
  updateButtonState(ui);

  let isSubmitting = false;

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    const checkinId = getCheckinId(ui);
    if (!checkinId) {
      updateButtonState(ui);
      return;
    }

    isSubmitting = true;
    ui.submitButton.disabled = true;
    setStatus(ui, String(options.pendingMessage || "Validation en cours..."), "");

    try {
      const requestUrl = resolveCheckinUrl(checkinId);
      const payloadKey = String(options.payloadKey || "checkin-id");
      const payload = {};
      payload[payloadKey] = checkinId;
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.status === 200) {
        setStatus(ui, String(options.successMessage || "Présence confirmée"), "success", true);
        scheduleRedirect(options.successRedirectUrl);
        if (typeof options.onSubmitSuccess === "function") {
          options.onSubmitSuccess({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status === 204) {
        setStatus(ui, String(options.alreadyConfirmedMessage || "Présence déjà confirmé"), "success", true);
        scheduleRedirect(options.successRedirectUrl);
        if (typeof options.onSubmitSuccess === "function") {
          options.onSubmitSuccess({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status >= 200 && response.status < 300) {
        setStatus(ui, String(options.successMessage || "Présence confirmée"), "success", true);
        scheduleRedirect(options.successRedirectUrl);
        if (typeof options.onSubmitSuccess === "function") {
          options.onSubmitSuccess({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status === 400) {
        setStatus(ui, String(options.invalidMessage || "Checkin-id non valide ou expiré"), "error", true);
        scheduleStatusClear(ui);
        if (typeof options.onSubmitError === "function") {
          options.onSubmitError({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status === 404) {
        setStatus(ui, String(options.notFoundMessage || "Checkin-id introuvable"), "error", true);
        scheduleStatusClear(ui);
        if (typeof options.onSubmitError === "function") {
          options.onSubmitError({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status === 429) {
        setStatus(ui, String(options.rateLimitMessage || "Trop de tentatives, réessaie plus tard"), "error", true);
        scheduleStatusClear(ui);
        if (typeof options.onSubmitError === "function") {
          options.onSubmitError({ response: response, checkinId: checkinId });
        }
        return;
      }
      if (response.status >= 500) {
        setStatus(ui, String(options.serverErrorMessage || "Erreur serveur, réessaie plus tard"), "error", true);
        scheduleStatusClear(ui);
        if (typeof options.onSubmitError === "function") {
          options.onSubmitError({ response: response, checkinId: checkinId });
        }
        return;
      }

      setStatus(ui, String(options.genericErrorMessage || "Impossible de valider la présence"), "error", true);
      scheduleStatusClear(ui);
      if (typeof options.onSubmitError === "function") {
        options.onSubmitError({ response: response, checkinId: checkinId });
      }
    } catch (error) {
      setStatus(ui, String(options.genericErrorMessage || "Impossible de valider la présence"), "error", true);
      scheduleStatusClear(ui);
      if (typeof options.onSubmitError === "function") {
        options.onSubmitError(error);
      }
    } finally {
      isSubmitting = false;
      updateButtonState(ui);
    }
  }

  if (ui.inputNode) {
    ui.inputNode.addEventListener("input", function () {
      updateButtonState(ui);
    });
    ui.inputNode.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        handleSubmit();
      }
    });
  }

  if (ui.submitButton) {
    ui.submitButton.addEventListener("click", function () {
      handleSubmit();
    });
  }

  const readyPromise = Promise.resolve(true);

  return {
    destroy: function () {
      if (ui && ui.root) {
        ui.root.remove();
      }
      releaseHorizontalScrollLock();
    },
    getState: function () {
      return { checkinId: getCheckinId(ui) };
    },
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
  window.setupParazarInstantSecureTokenGuard = setupParazarInstantSecureTokenGuard;
  window.setupParazarInstantUserForm = setupParazarInstantUserForm;
  window.setupParazarCheckinWindowGuard = setupParazarCheckinWindowGuard;
  window.setupParazarCheckinForm = setupParazarCheckinForm;
}
