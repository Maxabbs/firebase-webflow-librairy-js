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
        reject(new Error("Impossible de charger Stripe.js"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = function () { resolve(); };
    script.onerror = function () {
      reject(new Error("Impossible de charger Stripe.js"));
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

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      ".parazar-secure-modal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}",
      ".parazar-secure-modal.parazar-open{display:flex}",
      ".parazar-secure-panel{position:relative;width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:16px;padding:20px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 20px 60px rgba(2,6,23,.24)}",
      ".parazar-secure-close{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:28px;line-height:1;color:#64748b;cursor:pointer;padding:4px 8px}",
      ".parazar-secure-close:hover{opacity:.85}",
      ".parazar-secure-preauth{margin:0 36px 10px 0;color:#334155;font-size:14px;line-height:1.4;font-weight:500}",
      ".parazar-secure-error{margin:8px 0 14px 0;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.4;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}",
      ".parazar-secure-error[hidden]{display:none}",
      ".parazar-secure-confirm{width:100%;margin-top:16px;padding:12px 14px;border:1px solid #1d4ed8;border-radius:10px;background:#2563eb;color:#ffffff;font-size:15px;cursor:pointer;transition:all .16s ease}",
      ".parazar-secure-confirm:hover{background:#1d4ed8}",
      ".parazar-secure-confirm:disabled{opacity:.45;cursor:not-allowed}",
      "@media (max-width:480px){.parazar-secure-modal{padding:10px}.parazar-secure-panel{padding:14px;border-radius:12px}}"
    ].join("");
    document.head.appendChild(style);
  }

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
    redirectIfMissingId: "",
    createRequestBody: function () { return null; },
    paymentElementOptions: {},
    elementAppearance: {},
    onIntentCreated: null,
    onSetupConfirmed: null,
    onError: null
  }, config || {});

  if (!options.stripePublicKey) {
    throw new Error("setupParazarSecureSetupIntent: stripePublicKey est obligatoire");
  }

  const openButton = document.getElementById(options.buttonId);
  if (!openButton) {
    throw new Error("setupParazarSecureSetupIntent: bouton introuvable #" + options.buttonId);
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

  function updatePreauthorizationLabel() {
    if (!ui.preauthTextContainer) {
      return;
    }
    ui.preauthTextContainer.textContent = options.preauthorizationLabel;
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
      throw new Error(payload.error || ("Erreur API (" + response.status + ")"));
    }

    if (!payload.client_secret) {
      throw new Error("Le backend n'a pas retourne client_secret");
    }
    if (!/^seti_[^_]+_secret_/.test(String(payload.client_secret))) {
      throw new Error("Le backend doit retourner un SetupIntent (client_secret seti_...)");
    }

    if (typeof options.onIntentCreated === "function") {
      options.onIntentCreated(payload);
    }

    return payload;
  }

  async function mountPaymentElement(clientSecret) {
    await loadStripeJs();

    if (!window.Stripe) {
      throw new Error("Stripe.js indisponible");
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
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb",
        colorBackground: "#ffffff",
        colorText: "#111827",
        colorDanger: "#dc2626",
        colorSuccess: "#16a34a",
        colorTextSecondary: "#6b7280",
        borderRadius: "10px"
      },
      rules: {
        ".Label": { color: "#374151" },
        ".Input": {
          backgroundColor: "#ffffff",
          color: "#111827",
          border: "1px solid #d1d5db"
        },
        ".Tab": {
          backgroundColor: "#f8fafc",
          color: "#111827",
          border: "1px solid #d1d5db"
        },
        ".Tab--selected": {
          borderColor: "#2563eb",
          boxShadow: "0 0 0 1px #2563eb"
        }
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
        paymentMethodOrder: ["apple_pay", "google_pay", "card"]
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
      { name: options.walletMerchantName || "PARAZAR" },
      userPaymentOptions.business || {}
    );

    paymentElement = elementsInstance.create("payment", paymentOptions);
    paymentElement.mount("#parazar-payment-element");
  }

  async function onOpenClick() {
    if (isBusy) {
      return;
    }

    if (ui.confirmButton) {
      ui.confirmButton.disabled = true;
      ui.confirmButton.style.display = "none";
      ui.confirmButton.textContent = options.confirmButtonLabel;
    }
    setLoadingState(true, false);
    showError("");

    try {
      const checkinId = resolveCheckinId();
      if (!checkinId) {
        throw new Error("checkin_id introuvable dans l'URL");
      }

      const intentPayload = await createSetupIntent(checkinId);
      updatePreauthorizationLabel();
      await mountPaymentElement(intentPayload.client_secret);
      openModal();
      if (ui.confirmButton) {
        ui.confirmButton.style.display = "block";
        ui.confirmButton.disabled = false;
      }
    } catch (error) {
      const isNetworkFetchError = error instanceof TypeError && /fetch/i.test(String(error.message || ""));
      const errorMessage =
        isNetworkFetchError
          ? "Connexion API impossible (CORS, reseau ou certificat)."
          : (error && error.message ? error.message : "Erreur");
      showError(errorMessage);
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
        throw new Error(result.error.message || "Echec de l'enregistrement");
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
        closeModal();
        return;
      }

      showError("Statut Stripe inattendu: " + status);
    } catch (error) {
      showError(error && error.message ? error.message : "Erreur");
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
