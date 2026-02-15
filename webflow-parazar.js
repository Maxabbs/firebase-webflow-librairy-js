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
  const errorId = "parazar-secure-error";
  const confirmButtonId = "parazar-secure-confirm";
  const closeButtonId = "parazar-secure-close";
  const titleId = "parazar-secure-title";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      ".parazar-secure-modal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.36);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}",
      ".parazar-secure-modal.parazar-open{display:flex}",
      ".parazar-secure-panel{position:relative;width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:16px;padding:20px;background:#fff;box-shadow:0 16px 48px rgba(2,6,23,.24)}",
      ".parazar-secure-title{margin:0 36px 12px 0;font-family:inherit;font-size:22px;line-height:1.2;color:#0f172a}",
      ".parazar-secure-close{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:28px;line-height:1;color:#334155;cursor:pointer;padding:4px 8px}",
      ".parazar-secure-error{margin:8px 0 14px 0;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.4;background:#fee2e2;color:#991b1b}",
      ".parazar-secure-error[hidden]{display:none}",
      ".parazar-secure-confirm{width:100%;margin-top:16px;padding:12px 14px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-size:15px;cursor:pointer}",
      ".parazar-secure-confirm:disabled{opacity:.55;cursor:not-allowed}",
      "@media (max-width:480px){.parazar-secure-modal{padding:10px}.parazar-secure-panel{padding:14px;border-radius:12px}.parazar-secure-title{font-size:19px}}"
    ].join("");
    document.head.appendChild(style);
  }

  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "parazar-secure-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="parazar-secure-panel" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '">',
      '<button id="' + closeButtonId + '" class="parazar-secure-close" type="button" aria-label="Fermer">x</button>',
      '<h2 id="' + titleId + '" class="parazar-secure-title"></h2>',
      '<div id="' + errorId + '" class="parazar-secure-error" hidden></div>',
      '<div id="' + paymentElementId + '"></div>',
      '<button id="' + confirmButtonId + '" class="parazar-secure-confirm" type="button"></button>',
      "</div>"
    ].join("");
    document.body.appendChild(modal);
  }

  const titleNode = document.getElementById(titleId);
  const confirmButton = document.getElementById(confirmButtonId);
  if (titleNode) {
    titleNode.textContent = options.modalTitle;
  }
  if (confirmButton) {
    confirmButton.textContent = options.confirmButtonLabel;
  }

  return {
    modal: modal,
    paymentElementContainer: document.getElementById(paymentElementId),
    errorContainer: document.getElementById(errorId),
    confirmButton: document.getElementById(confirmButtonId),
    closeButton: document.getElementById(closeButtonId)
  };
}

function setupParazarSecurePayment(config) {
  const options = Object.assign({
    buttonId: "secure-btn-id",
    stripePublicKey: "",
    apiBase: "https://backend.parazar.co",
    modalTitle: "Finaliser la securisation",
    confirmButtonLabel: "Valider la carte",
    openButtonLoadingLabel: "Chargement...",
    redirectMode: "if_required",
    redirectIfMissingId: "",
    createRequestBody: function () { return null; },
    paymentElementOptions: {}
  }, config || {});

  if (!options.stripePublicKey) {
    throw new Error("setupParazarSecurePayment: stripePublicKey est obligatoire");
  }

  const openButton = document.getElementById(options.buttonId);
  if (!openButton) {
    throw new Error("setupParazarSecurePayment: bouton introuvable #" + options.buttonId);
  }

  if (openButton.__parazarSecureController) {
    return openButton.__parazarSecureController;
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

  async function createSecureIntent(checkinId) {
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

    if (typeof options.onIntentCreated === "function") {
      options.onIntentCreated(payload);
    }

    return payload.client_secret;
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

    elementsInstance = stripeInstance.elements({ clientSecret: clientSecret });
    const userPaymentOptions = options.paymentElementOptions && typeof options.paymentElementOptions === "object"
      ? options.paymentElementOptions
      : {};
    const paymentOptions = Object.assign(
      {},
      { wallets: { applePay: "auto", googlePay: "auto" } },
      userPaymentOptions
    );
    paymentOptions.wallets = Object.assign(
      {},
      { applePay: "auto", googlePay: "auto" },
      userPaymentOptions.wallets || {}
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
    }
    setLoadingState(true, false);
    showError("");
    openModal();

    try {
      const checkinId = resolveCheckinId();
      if (!checkinId) {
        throw new Error("checkin_id introuvable dans l'URL");
      }

      const clientSecret = await createSecureIntent(checkinId);
      await mountPaymentElement(clientSecret);
      if (ui.confirmButton) {
        ui.confirmButton.disabled = false;
      }
    } catch (error) {
      const isNetworkFetchError = error instanceof TypeError && /fetch/i.test(String(error.message || ""));
      showError(
        isNetworkFetchError
          ? "Connexion API impossible (CORS, reseau ou certificat)."
          : (error && error.message ? error.message : "Erreur")
      );
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
      const result = await stripeInstance.confirmPayment({
        elements: elementsInstance,
        redirect: options.redirectMode
      });

      if (result.error) {
        throw new Error(result.error.message || "Paiement refuse");
      }

      const status = result.paymentIntent && result.paymentIntent.status
        ? result.paymentIntent.status
        : "unknown";

      if (typeof options.onPaymentConfirmed === "function") {
        options.onPaymentConfirmed(result.paymentIntent || null);
      }

      if (status === "requires_capture" || status === "succeeded" || status === "processing") {
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

  if (ui.confirmButton) {
    ui.confirmButton.disabled = true;
    ui.confirmButton.addEventListener("click", onConfirmClick);
  }

  if (ui.closeButton) {
    ui.closeButton.addEventListener("click", closeModal);
  }

  ui.modal.addEventListener("click", function (event) {
    if (event.target === ui.modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && ui.modal.classList.contains("parazar-open")) {
      closeModal();
    }
  });

  openButton.addEventListener("click", onOpenClick);

  const controller = {
    open: onOpenClick,
    close: closeModal
  };

  openButton.__parazarSecureController = controller;
  return controller;
}
