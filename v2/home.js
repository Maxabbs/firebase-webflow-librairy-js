// === v2/home.js ===
// Page Home Parazar V2 — test qual
//
// Usage (page HTML) :
//   <script src=".../firebase-auth-helper.js"></script>
//   <script src=".../v2/home.js"></script>
//   <script>
//     initFirebase();
//     setupParazarHome({ apiBase: "https://backend-qual.parazar.co" });
//   </script>
//
// La fonction monte l'UI dans <body> (ou dans le container passé en config).
// Elle appelle :
//   GET /api/parazar/generalSettings?country=&city=   → parazar_status + settings
//   GET /api/v2/parazar?country=&city=               → liste des slots disponibles

(function () {

  // ─────────────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .pz-home {
      font-family: 'Inter', sans-serif;
      background: #0c0c0c;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 48px 24px 32px;
      user-select: none;
    }

    /* Header */
    .pz-header {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #888;
    }
    .pz-city { font-weight: 600; color: #fff; }
    .pz-points { color: #c8ff00; font-weight: 700; }

    /* Title */
    .pz-title {
      font-size: clamp(28px, 8vw, 40px);
      font-weight: 900;
      text-align: center;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }

    /* Question mark orb */
    .pz-orb-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      flex: 1;
      justify-content: center;
    }
    .pz-orb {
      width: clamp(140px, 40vw, 180px);
      height: clamp(140px, 40vw, 180px);
      border-radius: 50%;
      background: radial-gradient(circle at 38% 35%, #8fff00 0%, #4db800 45%, #1a4400 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 0 48px 8px rgba(140, 255, 0, 0.22), 0 0 0 1px rgba(140,255,0,0.08);
      position: relative;
    }
    .pz-orb:hover  { transform: scale(1.04); box-shadow: 0 0 64px 16px rgba(140,255,0,0.32); }
    .pz-orb:active { transform: scale(0.97); }
    .pz-orb--dim {
      background: radial-gradient(circle at 38% 35%, #444 0%, #222 60%, #111 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.06);
      cursor: default;
    }
    .pz-orb-q {
      font-size: clamp(56px, 16vw, 80px);
      font-weight: 900;
      color: #fff;
      line-height: 1;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    .pz-orb-loading {
      width: 32px; height: 32px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #c8ff00;
      border-radius: 50%;
      animation: pz-spin 0.8s linear infinite;
    }
    @keyframes pz-spin { to { transform: rotate(360deg); } }

    /* Subtitle + badge */
    .pz-subtitle {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #c8ff00;
      text-align: center;
    }
    .pz-sub-text {
      font-size: 14px;
      color: #aaa;
      text-align: center;
      margin-top: -8px;
    }

    /* Badges row */
    .pz-badges {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .pz-badge {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #ddd;
    }
    .pz-badge--green { background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.25); color: #c8ff00; }

    /* Countdown */
    .pz-countdown {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #fff;
      letter-spacing: 1px;
    }

    /* CTAs bottom */
    .pz-ctas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
      max-width: 360px;
    }
    .pz-cta {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 14px 12px;
      text-align: center;
      cursor: pointer;
    }
    .pz-cta-icon { font-size: 22px; margin-bottom: 4px; }
    .pz-cta-label { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #aaa; }
    .pz-cta-sub   { font-size: 10px; color: #555; margin-top: 2px; }

    /* ── BOOKING SCREEN ── */
    .pz-booking {
      font-family: 'Inter', sans-serif;
      background: #0c0c0c;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 48px 24px 32px;
    }
    .pz-booking-back {
      font-size: 20px;
      cursor: pointer;
      color: #888;
      margin-bottom: 32px;
    }
    .pz-booking-back:hover { color: #fff; }
    .pz-booking-title {
      font-size: clamp(22px, 6vw, 30px);
      font-weight: 900;
      margin-bottom: 28px;
      line-height: 1.2;
    }
    .pz-slots { display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .pz-slot {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 18px;
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s;
    }
    .pz-slot--selected {
      background: rgba(200,255,0,0.08);
      border-color: rgba(200,255,0,0.35);
    }
    .pz-slot--loading { opacity: 0.4; pointer-events: none; }
    .pz-slot:hover:not(.pz-slot--selected) { background: rgba(255,255,255,0.07); }
    .pz-slot-icon { font-size: 16px; color: #888; flex-shrink: 0; }
    .pz-slot--selected .pz-slot-icon { color: #c8ff00; }
    .pz-slot-label { font-size: 15px; font-weight: 600; }
    .pz-slot-hour  { font-size: 13px; color: #666; margin-top: 2px; }
    .pz-slot--selected .pz-slot-hour { color: #8fbb00; }
    .pz-slot-empty { text-align: center; color: #555; font-size: 14px; padding: 32px 0; }

    .pz-btn-continue {
      background: #c8ff00;
      color: #0c0c0c;
      font-weight: 800;
      font-size: 16px;
      border: none;
      border-radius: 14px;
      padding: 18px;
      width: 100%;
      cursor: pointer;
      margin-top: 24px;
      transition: opacity 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .pz-btn-continue:disabled { opacity: 0.3; cursor: not-allowed; }
    .pz-btn-continue:not(:disabled):hover { opacity: 0.88; }

    /* Error banner */
    .pz-error {
      background: rgba(255,60,60,0.1);
      border: 1px solid rgba(255,60,60,0.25);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #ff8080;
      text-align: center;
      margin-top: 16px;
    }
  `;

  function injectStyles() {
    if (document.getElementById("pz-home-styles")) return;
    const s = document.createElement("style");
    s.id = "pz-home-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  const FR_DAYS   = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  const FR_MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

  function formatSlotLabel(slotId) {
    // slotId format : FR_Paris_20260509
    const parts = slotId.split("_");
    const rawDate = parts[parts.length - 1]; // "20260509"
    if (!rawDate || rawDate.length !== 8) return slotId;
    const y = parseInt(rawDate.slice(0, 4));
    const m = parseInt(rawDate.slice(4, 6)) - 1;
    const d = parseInt(rawDate.slice(6, 8));
    const date = new Date(y, m, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();
    const dayName = FR_DAYS[date.getDay()];
    const dayNum  = d;
    const ordinal = dayNum === 1 ? "er" : "";
    const monthName = FR_MONTHS[m];
    const label = `${dayName} ${dayNum}${ordinal} ${monthName}`;
    return isToday ? `Ce soir — ${label}` : label;
  }

  function isToday(slotId) {
    const parts = slotId.split("_");
    const rawDate = parts[parts.length - 1];
    if (!rawDate || rawDate.length !== 8) return false;
    const y = parseInt(rawDate.slice(0, 4));
    const m = parseInt(rawDate.slice(4, 6)) - 1;
    const d = parseInt(rawDate.slice(6, 8));
    const date = new Date(y, m, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }

  function formatCountdown(targetTs) {
    if (!targetTs) return null;
    const diff = targetTs * 1000 - Date.now();
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function formatCountdownLong(targetTs) {
    if (!targetTs) return null;
    const diff = targetTs * 1000 - Date.now();
    if (diff <= 0) return "maintenant";
    const days = Math.floor(diff / 86400000);
    const h    = Math.floor((diff % 86400000) / 3600000);
    const m    = Math.floor((diff % 3600000) / 60000);
    const s    = Math.floor((diff % 60000) / 1000);
    const pad  = n => String(n).padStart(2, "0");
    if (days > 0) return `${days}j ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  async function getFirebaseToken() {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (typeof firebase === "undefined" || !firebase.auth) {
          return setTimeout(check, 100);
        }
        const user = firebase.auth().currentUser;
        if (user) {
          user.getIdToken(true).then(resolve).catch(reject);
        } else {
          firebase.auth().onAuthStateChanged(u => {
            if (u) u.getIdToken(true).then(resolve).catch(reject);
            else reject(new Error("non connecté"));
          });
        }
      };
      check();
    });
  }

  async function apiFetch(url, token) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — HOME
  // ─────────────────────────────────────────────────────────────
  function renderHome(container, settings, cfg, onBookingClick) {
    const status = settings.parazar_status || "NotToday";
    const isInstant = status === "Instant";
    const isToday_  = status === "Today";

    let titleHtml, subtitle, subText, countdownTs, countdownFn;

    if (isInstant) {
      titleHtml  = "On sort<br>ce soir&nbsp;?";
      subtitle   = "Lance ta soirée maintenant";
      subText    = null;
      countdownTs = settings.next_closed_instant_ts;
      countdownFn = formatCountdown;
    } else if (isToday_) {
      titleHtml  = "On sort<br>ce soir&nbsp;?";
      subtitle   = "Inscris-toi pour ce soir";
      subText    = `à partir de ${(settings.parazar_start_hour || "19:30")}`;
      countdownTs = settings.next_opened_instant_ts;
      countdownFn = formatCountdown;
    } else {
      titleHtml  = "On sort<br>cette semaine&nbsp;?";
      subtitle   = "Choisis ta soirée";
      subText    = "pour cette semaine";
      countdownTs = settings.next_opened_instant_ts;
      countdownFn = formatCountdownLong;
    }

    const orbClickable = isInstant || isToday_;

    container.innerHTML = `
      <div class="pz-home" id="pz-home-root">
        <div class="pz-header">
          <span class="pz-city">📍 ${cfg.city}</span>
          <span class="pz-points">⚡ ${settings.points != null ? settings.points : "—"} pts</span>
        </div>

        <div class="pz-title">${titleHtml}</div>

        <div class="pz-orb-wrap">
          <div class="pz-orb${orbClickable ? "" : " pz-orb--dim"}" id="pz-orb">
            <span class="pz-orb-q">?</span>
          </div>
          <div class="pz-subtitle">${subtitle}</div>
          ${subText ? `<div class="pz-sub-text">${subText}</div>` : ""}
          <div class="pz-badges">
            <span class="pz-badge pz-badge--green">100% GRATUIT</span>
            ${countdownTs ? `<span class="pz-countdown" id="pz-countdown">${countdownFn(countdownTs)}</span>` : ""}
          </div>
        </div>

        <div class="pz-ctas">
          <div class="pz-cta">
            <div class="pz-cta-icon">👥</div>
            <div class="pz-cta-label">Ajoute tes amis</div>
            <div class="pz-cta-sub">Gagne 50 pts par ami</div>
          </div>
          <div class="pz-cta">
            <div class="pz-cta-icon">🍺</div>
            <div class="pz-cta-label">Gagne des verres</div>
            <div class="pz-cta-sub">Débloque des récompenses</div>
          </div>
        </div>
      </div>
    `;

    // Countdown live
    if (countdownTs) {
      const cdEl = container.querySelector("#pz-countdown");
      if (cdEl) {
        const tick = setInterval(() => {
          const val = countdownFn(countdownTs);
          if (!val || val === "00:00:00") {
            clearInterval(tick);
            window.location.reload();
            return;
          }
          cdEl.textContent = val;
        }, 1000);
      }
    }

    // Orb click
    const orb = container.querySelector("#pz-orb");
    if (orb && orbClickable) {
      orb.addEventListener("click", onBookingClick);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — BOOKING
  // ─────────────────────────────────────────────────────────────
  function renderBooking(container, slots, cfg, onBack, onConfirm) {
    let selectedSlotId = null;

    // Trier par date croissante, "Ce soir" en premier
    const sorted = [...slots].sort((a, b) => a.slot_id < b.slot_id ? -1 : 1);

    const slotsHtml = sorted.length === 0
      ? `<div class="pz-slot-empty">Aucune soirée disponible pour le moment.</div>`
      : sorted.map(slot => `
          <div class="pz-slot${isToday(slot.slot_id) ? " pz-slot--selected" : ""}"
               data-slot="${slot.slot_id}">
            <div class="pz-slot-icon">🕐</div>
            <div>
              <div class="pz-slot-label">${formatSlotLabel(slot.slot_id)}</div>
              <div class="pz-slot-hour">${slot.start_hour || cfg.start_hour || "19:30"}</div>
            </div>
          </div>
        `).join("");

    container.innerHTML = `
      <div class="pz-booking" id="pz-booking-root">
        <div class="pz-booking-back" id="pz-back">←</div>
        <div class="pz-booking-title">À quelle date<br>souhaites-tu t'inscrire&nbsp;?</div>
        <div class="pz-slots" id="pz-slots">${slotsHtml}</div>
        <button class="pz-btn-continue" id="pz-continue" disabled>Continuer →</button>
      </div>
    `;

    // Init selected (today if present)
    const todaySlot = sorted.find(s => isToday(s.slot_id));
    if (todaySlot) selectedSlotId = todaySlot.slot_id;

    const continueBtn = container.querySelector("#pz-continue");
    if (selectedSlotId && continueBtn) continueBtn.disabled = false;

    // Slot clicks
    container.querySelectorAll(".pz-slot").forEach(el => {
      el.addEventListener("click", () => {
        container.querySelectorAll(".pz-slot").forEach(e => e.classList.remove("pz-slot--selected"));
        el.classList.add("pz-slot--selected");
        selectedSlotId = el.dataset.slot;
        if (continueBtn) continueBtn.disabled = false;
      });
    });

    // Back
    const backBtn = container.querySelector("#pz-back");
    if (backBtn) backBtn.addEventListener("click", onBack);

    // Continue
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (selectedSlotId) onConfirm(selectedSlotId);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — LOADING
  // ─────────────────────────────────────────────────────────────
  function renderLoading(container) {
    container.innerHTML = `
      <div class="pz-home" style="justify-content:center;align-items:center;">
        <div class="pz-orb pz-orb--dim" style="pointer-events:none;">
          <div class="pz-orb-loading"></div>
        </div>
      </div>
    `;
  }

  function renderError(container, msg, onRetry) {
    container.innerHTML = `
      <div class="pz-home" style="justify-content:center;align-items:center;gap:24px;">
        <div class="pz-orb pz-orb--dim" style="pointer-events:none;">
          <span class="pz-orb-q" style="font-size:40px;">!</span>
        </div>
        <div class="pz-error">${msg}</div>
        <button class="pz-btn-continue" id="pz-retry-btn" style="max-width:240px;">
          Réessayer
        </button>
      </div>
    `;
    var retryFn = typeof onRetry === "function" ? onRetry : function () { window.location.reload(); };
    container.querySelector("#pz-retry-btn").addEventListener("click", retryFn);
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────────────────────
  function setupParazarHome(userConfig) {
    const cfg = Object.assign({
      apiBase:       "https://backend-qual.parazar.co",
      country:       "FR",
      city:          "Paris",
      loginRedirect: "/login",
      containerId:   null,   // null = injecte dans <body> directement
      onSlotConfirmed: null, // callback(slotId) quand l'user confirme un slot
    }, userConfig || {});

    injectStyles();

    function init() {
      // Résoudre le container
      const container = cfg.containerId
        ? document.getElementById(cfg.containerId)
        : document.body;

      if (!container) {
        console.error("[setupParazarHome] Container introuvable :", cfg.containerId);
        return;
      }

      renderLoading(container);

      // ── Auth ──
      getFirebaseToken().then(token => {
        const settingsUrl = `${cfg.apiBase}/api/parazar/generalSettings?country=${encodeURIComponent(cfg.country)}&city=${encodeURIComponent(cfg.city)}`;

        apiFetch(settingsUrl, token)
          .then(settings => {

            // Callback "?" bouton
            const onBookingClick = () => {
              renderLoading(container);

              getFirebaseToken().then(tok => {
                const slotsUrl = `${cfg.apiBase}/api/v2/parazar?country=${encodeURIComponent(cfg.country)}&city=${encodeURIComponent(cfg.city)}`;

                apiFetch(slotsUrl, tok)
                  .then(data => {
                    const slots = data.slots || [];
                    renderBooking(
                      container,
                      slots,
                      settings,
                      // onBack
                      () => renderHome(container, settings, cfg, onBookingClick),
                      // onConfirm
                      (slotId) => {
                        console.log("[Parazar] Slot sélectionné :", slotId);
                        if (typeof cfg.onSlotConfirmed === "function") {
                          cfg.onSlotConfirmed(slotId, tok);
                        } else {
                          // Par défaut : redirige vers la page de soumission
                          window.location.href = `/v2/submit?slot_id=${encodeURIComponent(slotId)}`;
                        }
                      }
                    );
                  })
                  .catch(err => {
                    console.error("[Parazar] Erreur slots :", err);
                    renderError(container, "Impossible de charger les soirées disponibles.");
                  });
              }).catch(() => {
                window.location.href = cfg.loginRedirect;
              });
            };

            renderHome(container, settings, cfg, onBookingClick);
          })
          .catch(err => {
            console.error("[Parazar] Erreur generalSettings :", err);
            renderError(container, "Impossible de charger les paramètres.");
          });

      }).catch(() => {
        window.location.href = cfg.loginRedirect;
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────────────
  window.setupParazarHome = setupParazarHome;

})();
