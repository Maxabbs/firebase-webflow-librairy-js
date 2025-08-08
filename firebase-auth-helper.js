// === firebase-auth-helper.js ===

// ⚙️ Initialiser Firebase
function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyDpSD7DH9ZqNGbKV9cY5qlc9YbPlyAc7GY",
        authDomain: "parazar-client-project.firebaseapp.com",
        projectId: "parazar-client-project",
        storageBucket: "parazar-client-project.firebasestorage.app",
        messagingSenderId: "684169267322",
        appId: "1:684169267322:web:4309a01b1943e3f8ff53c3",
        measurementId: "G-T7BGTDKPLN"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}

function hideBody() {
    document.body.style.visibility = "hidden";
}

function showBody() {
    document.body.style.visibility = "visible";
}

// Vérifie que l’utilisateur est connecté (sans exiger email vérifié)
function requireAuth(redirectIfNotLoggedIn = "/firebase/login") {
  waitForFirebase(() => {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) {
        window.location.href = redirectIfNotLoggedIn;
      } else {
        showBody();
        console.log("✅ Connecté :", user.email);
      }
    });
  });
}

function requireEmailVerified(redirectIfNotLoggedIn = "/firebase/login", redirectIfNotVerified = "/firebase/verify-email") {
  waitForFirebase(() => {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) {
        window.location.href = redirectIfNotLoggedIn;
      } else if (!user.emailVerified && user.providerData[0].providerId === "password") {
        window.location.href = redirectIfNotVerified;
      } else {
        showBody();
        console.log("✅ Email vérifié pour :", user.email);
      }
    });
  });
}

// 🔑 Login Email & Mot de passe
function setupLogin(
  emailId,
  passwordId,
  buttonId,
  successDivId,
  errorDivId,
  redirectOnSuccess = "/firebase/dashboard"
) {
  document.addEventListener("DOMContentLoaded", function () {
    waitForFirebase(() => {
      firebase.auth().onAuthStateChanged(function(user) {
        console.log("[setupLogin] onAuthStateChanged triggered, user =", user);
        if (user) {
          console.log("[setupLogin] User is connected, redirecting...");
          window.location.href = redirectOnSuccess;
          return;
        }
        console.log("[setupLogin] No user connected, setting up login form");

        const emailInput = document.getElementById(emailId);
        const passwordInput = document.getElementById(passwordId);
        const loginButton = document.getElementById(buttonId);
        const successMessage = document.getElementById(successDivId);
        const errorMessage = document.getElementById(errorDivId);

        if (!emailInput || !passwordInput || !loginButton) {
          console.error("[setupLogin] Un élément du formulaire est manquant");
          return;
        }

        loginButton.addEventListener("click", function (e) {
          e.preventDefault();

          const email = emailInput.value.trim();
          const password = passwordInput.value;

          // Reset messages
          if (successMessage) successMessage.style.display = "none";
          if (errorMessage) errorMessage.style.display = "none";

          firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
              if (successMessage) {
                successMessage.textContent = "Connexion réussie !";
                successMessage.style.display = "block";
                successMessage.style.color = "green";
              }

              window.location.href = redirectOnSuccess;
            })
            .catch(() => {
              if (errorMessage) {
                errorMessage.textContent = "L'email ou le mot de passe est incorrect, ou votre compte est lié à une connexion Google.";
                errorMessage.style.display = "block";
                errorMessage.style.color = "red";
              } else {
                alert("L'email ou le mot de passe est incorrect, ou votre compte est lié à une connexion Google.");
              }
            });
        });
      });
    });
  });
}


// ✍️ Inscription Email & Mot de passe (avec vérification mot de passe identique + longueur mini)
function setupSignup(
  emailId,
  passwordId1,
  passwordId2,
  buttonId,
  successDivId,
  errorDivId,
  redirectAfterSignup = "/firebase/verify-email"
) {
  document.addEventListener("DOMContentLoaded", function () {
    const emailInput = document.getElementById(emailId);
    const passwordInput1 = document.getElementById(passwordId1);
    const passwordInput2 = document.getElementById(passwordId2);
    const signupButton = document.getElementById(buttonId);
    const successMessage = document.getElementById(successDivId);
    const errorMessage = document.getElementById(errorDivId);

    if (!emailInput || !passwordInput1 || !passwordInput2 || !signupButton) return;

    signupButton.addEventListener("click", function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password1 = passwordInput1.value;
      const password2 = passwordInput2.value;

      // Réinitialise les messages
      if (successMessage) successMessage.style.display = "none";
      if (errorMessage) errorMessage.style.display = "none";

      // 💥 Vérification : mots de passe identiques
      if (password1 !== password2) {
        if (errorMessage) {
          errorMessage.textContent = "❌ Les mots de passe ne sont pas identiques.";
          errorMessage.style.display = "block";
          errorMessage.style.color = "red";
        }
        return;
      }

      // 🔒 Vérification : longueur minimale
      if (password1.length < 8) {
        if (errorMessage) {
          errorMessage.textContent = "❌ Le mot de passe doit contenir au moins 8 caractères.";
          errorMessage.style.display = "block";
          errorMessage.style.color = "red";
        }
        return;
      }

      // ✅ Créer le compte
      firebase.auth().createUserWithEmailAndPassword(email, password1)
        .then(() => {
          if (successMessage) {
            successMessage.textContent = "Inscription réussie.";
            successMessage.style.display = "block";
            successMessage.style.color = "green";
          }

          // Redirection
          window.location.href = redirectAfterSignup;
        })
        .catch((error) => {
          if (errorMessage) {
            errorMessage.textContent = `Erreur : ${error.message}`;
            errorMessage.style.display = "block";
            errorMessage.style.color = "red";
          } else {
            alert("Erreur lors de l'inscription : " + error.message);
          }
        });
    });
  });
}

function setupSendVerificationEmail(
  buttonId,
  successDivId,
  errorDivId,
  emailInputId,
  cooldownSeconds = 30,
  redirectIfVerified = "/firebase/dashboard"
) {
  document.addEventListener("DOMContentLoaded", function () {
    waitForFirebase(() => {
      const button = document.getElementById(buttonId);
      const successMsg = document.getElementById(successDivId);
      const errorMsg = document.getElementById(errorDivId);
      const emailInput = document.getElementById(emailInputId);

      if (!button) return;

      firebase.auth().onAuthStateChanged(function (user) {
        if (!user) return;

        // Pré-remplit l’email
        if (emailInput) emailInput.value = user.email;

        let cooldownInterval = null;
        let pollingInterval = null;

        button.addEventListener("click", async function (event) {
          event.preventDefault();
          event.stopPropagation();

          // Reset messages
          if (successMsg) {
            successMsg.textContent = "";
            successMsg.style.display = "none";
          }
          if (errorMsg) {
            errorMsg.textContent = "";
            errorMsg.style.display = "none";
          }

          try {
            console.log("🔄 Reloading user...");
            await user.reload();
            const refreshedUser = firebase.auth().currentUser;

            // Si déjà vérifié, redirige
            if (refreshedUser.emailVerified) {
              if (successMsg) {
                successMsg.textContent = "Ton email est déjà vérifié ✅";
                successMsg.style.display = "block";
              }
              setTimeout(() => window.location.href = redirectIfVerified, 2000);
              return;
            }

            // Envoie l'email de vérification
            console.log("📨 Sending verification email...");
            await refreshedUser.sendEmailVerification();

            if (successMsg) {
              successMsg.textContent = "Email de vérification envoyé ! 📩";
              successMsg.style.display = "block";
            }

            // Cooldown : désactive le bouton et affiche le timer
            button.disabled = true;
            let remaining = parseInt(cooldownSeconds, 10) || 30;

            const originalText = button.value || "Envoyer l'email de vérification";
            button.value = `Renvoyer dans ${remaining}s...`;
            remaining--;

            clearInterval(cooldownInterval);
            cooldownInterval = setInterval(() => {
              if (remaining <= 0) {
                clearInterval(cooldownInterval);
                button.disabled = false;
                button.value = originalText; // Remet le texte d’origine
                return;
              }
              button.value = `Renvoyer dans ${remaining}s...`;
              remaining--;
            }, 1000);

            // Polling toutes les 5s pour vérifier si l’email est validé
            clearInterval(pollingInterval);
            pollingInterval = setInterval(async () => {
              try {
                await refreshedUser.reload();
                if (refreshedUser.emailVerified) {
                  clearInterval(pollingInterval);
                  clearInterval(cooldownInterval);
                  button.disabled = false;
                  button.value = originalText;

                  if (successMsg) {
                    successMsg.textContent = "Email vérifié avec succès ✅";
                    successMsg.style.display = "block";
                  }
                  setTimeout(() => window.location.href = redirectIfVerified, 1500);
                }
              } catch (pollError) {
                console.error("Erreur pendant le polling :", pollError);
              }
            }, 5000);

          } catch (error) {
            console.error("💥 Erreur lors de l'envoi :", error);
            if (errorMsg) {
              errorMsg.textContent = "Erreur : " + error.message;
              errorMsg.style.display = "block";
            }
            button.disabled = false;
            button.value = "Réessayer";
          }
        });
      });
    });
  });
}

// 🔑 Login & Signup avec Google
function setupGoogleLogin(buttonId, redirectOnSuccess = "/firebase/dashboard") {
  document.addEventListener("DOMContentLoaded", function () {
    const googleBtn = document.getElementById(buttonId);

    if (!googleBtn) return;

    googleBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const provider = new firebase.auth.GoogleAuthProvider();

      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          console.log("Connexion Google réussie :", result.user.email);
          window.location.href = redirectOnSuccess;
        })
        .catch((error) => {
          console.error("Erreur connexion Google :", error.message);
          alert("Erreur : " + error.message);
        });
    });
  });
}

// 🚪 Logout (utiliser dans les pages protégées)
function setupLogout(buttonId, redirectAfterLogout = "/") {
    document.addEventListener("DOMContentLoaded", function () {
        const logoutButton = document.getElementById(buttonId);

        if (!logoutButton) return;

        logoutButton.addEventListener("click", function (e) {
            e.preventDefault();

            firebase.auth().signOut()
                .then(() => {
                    console.log("Déconnexion réussie.");
                    window.location.href = redirectAfterLogout;
                })
                .catch((error) => {
                    console.error("Erreur lors de la déconnexion :", error);
                });
        });
    });
}

// 🔄 Réinitialisation mot de passe par email (version debug + retry + fallback)
function setupForgotPassword(
  emailId,
  buttonId,
  successDivId,
  errorDivId,
  cooldownSeconds = 30
) {
  document.addEventListener("DOMContentLoaded", function () {
    waitForFirebase(() => {
      console.log("[forgotPwd] waitForFirebase callback — firebase:", !!window.firebase, "apps:", (firebase && firebase.apps) ? firebase.apps.length : 0);

      const emailInput = document.getElementById(emailId);
      const resetButton = document.getElementById(buttonId);
      const successMsg = document.getElementById(successDivId);
      const errorMsg = document.getElementById(errorDivId);

      if (!emailInput || !resetButton) {
        console.error("[forgotPwd] Elements non trouvés:", { emailId, buttonId });
        return;
      }

      let cooldownInterval = null;

      resetButton.addEventListener("click", async function (e) {
        e.preventDefault();
        console.log("[forgotPwd] Click reçu");

        const rawEmail = emailInput.value;
        console.log("[forgotPwd] Valeur email brute :", rawEmail);

        const email = (rawEmail || "").trim();
        // On ne force pas toLowerCase systématiquement — on logge la normalisation pour debug.
        const normalizedEmail = email.toLowerCase();

        // Reset messages visuels
        if (successMsg) {
          successMsg.textContent = "";
          successMsg.style.display = "none";
        }
        if (errorMsg) {
          errorMsg.textContent = "";
          errorMsg.style.display = "none";
        }

        if (!email) {
          setError("❌ Merci d’entrer ton email.");
          console.warn("[forgotPwd] email vide");
          return;
        }

        try {
          // Retry fetchSignInMethodsForEmail (3 tentatives)
          let methods = [];
          let fetched = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`[forgotPwd] fetchSignInMethodsForEmail attempt ${attempt} for "${normalizedEmail}"`);
              methods = await firebase.auth().fetchSignInMethodsForEmail(normalizedEmail);
              console.log("[forgotPwd] fetchSignInMethodsForEmail réponse :", methods);
              fetched = true;
              break;
            } catch (fetchErr) {
              console.warn(`[forgotPwd] fetchSignInMethodsForEmail échec attempt ${attempt}:`, fetchErr);
              // si erreur réseau ou temporaire, attendre un petit peu puis retenter
              if (attempt < 3) await new Promise((r) => setTimeout(r, 300 * attempt));
              else throw fetchErr;
            }
          }

          // Si on a bien exécuté la requête mais méthode vide -> fallback try sendPasswordResetEmail
          if (fetched && (!methods || methods.length === 0)) {
            console.warn("[forgotPwd] fetchSignInMethodsForEmail a retourné [] — tentative fallback sendPasswordResetEmail (pour diagnostiquer)");
            try {
              await firebase.auth().sendPasswordResetEmail(normalizedEmail);
              console.log("[forgotPwd] Fallback sendPasswordResetEmail success (email existe ou Firebase a accepté la requête)");
              showSuccess("📩 Email de réinitialisation envoyé ! Vérifie ta boîte de réception.");
              startCooldown();
              return;
            } catch (fallbackErr) {
              console.error("[forgotPwd] Fallback sendPasswordResetEmail a échoué :", fallbackErr);
              handleFirebaseError(fallbackErr);
              return;
            }
          }

          // Si méthodes trouvées
          if (!methods || methods.length === 0) {
            // Si on arrive ici, cela veut dire qu'on n'a pas pu fetcher correctement (mais on aurait fait fallback). On le signale.
            setError("❌ Aucun compte trouvé avec cet email (fetchSignInMethodsForEmail a renvoyé []). Vérifie l'orthographe ou réessaie plus tard.");
            console.warn("[forgotPwd] Aucun provider trouvé et fallback déjà tenté.");
            return;
          }

          console.log("[forgotPwd] providers détectés :", methods);

          // Si compte lié uniquement à Google (pas de 'password'), on bloque
          if (methods.includes("google.com") && !methods.includes("password")) {
            setError("❌ Ce compte utilise Google, réinitialisation par email impossible.");
            console.log("[forgotPwd] Compte Google-only détecté — providers:", methods);
            return;
          }

          // OK, envoi du mail
          console.log("[forgotPwd] Envoi email reset pour:", normalizedEmail);
          await firebase.auth().sendPasswordResetEmail(normalizedEmail);
          console.log("[forgotPwd] sendPasswordResetEmail resolved (succès)");
          showSuccess("📩 Email de réinitialisation envoyé ! Vérifie ta boîte de réception.");
          startCooldown();
        } catch (error) {
          console.error("[forgotPwd] Erreur attrapée :", error);
          handleFirebaseError(error);
        }
      }); // end click handler

      // ---------- helper functions ----------
      function showSuccess(text) {
        if (successMsg) {
          successMsg.textContent = text;
          successMsg.style.display = "block";
          successMsg.style.color = "green";
        } else {
          console.log("[forgotPwd] success:", text);
        }
      }

      function setError(text) {
        if (errorMsg) {
          errorMsg.textContent = text;
          errorMsg.style.display = "block";
          errorMsg.style.color = "red";
        } else {
          console.warn("[forgotPwd] error:", text);
        }
      }

      function handleFirebaseError(err) {
        const code = err && err.code ? err.code : null;
        console.log("[forgotPwd] handleFirebaseError code:", code, "message:", err && err.message);
        let userMsg = err && err.message ? err.message : "Erreur inconnue";

        // Mapping des codes fréquents côté client
        if (code === "auth/user-not-found") {
          userMsg = "❌ Aucun compte trouvé avec cet email.";
        } else if (code === "auth/invalid-email") {
          userMsg = "❌ Email invalide.";
        } else if (code === "auth/too-many-requests") {
          userMsg = "⏳ Trop de tentatives. Réessaie plus tard.";
        } else if (code === "auth/network-request-failed") {
          userMsg = "⚠️ Erreur réseau. Vérifie ta connexion et réessaie.";
        }

        setError(userMsg);
      }

      function startCooldown() {
        // Cooldown anti-spam
        resetButton.disabled = true;
        let remaining = parseInt(cooldownSeconds, 10) || 30;
        const originalText = resetButton.value || resetButton.textContent || "Réinitialiser le mot de passe";
        const setBtnText = (txt) =>
          resetButton.tagName === "INPUT" ? (resetButton.value = txt) : (resetButton.textContent = txt);

        setBtnText(`Renvoyer dans ${remaining}s...`);
        remaining--;

        clearInterval(cooldownInterval);
        cooldownInterval = setInterval(() => {
          if (remaining <= 0) {
            clearInterval(cooldownInterval);
            resetButton.disabled = false;
            setBtnText(originalText);
            return;
          }
          setBtnText(`Renvoyer dans ${remaining}s...`);
          remaining--;
        }, 1000);
      }
      // ---------- end helpers ----------
    }); // end waitForFirebase
  }); // end DOMContentLoaded
}


// ⏳ Utilitaire : attendre que Firebase soit prêt
function waitForFirebase(callback) {
    if (typeof firebase !== "undefined" && firebase.auth) {
        callback();
    } else {
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

function getUserEmail() {
  const user = firebase.auth().currentUser;
  return user ? user.email : null;
}


function fillElementById(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[fillElementById] Élément avec l'id "${id}" non trouvé.`);
    return;
  }
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) {
    el.value = value;
  } else {
    el.textContent = value;
  }
}

function feedUserEmail(emailId) {
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;
      fillElementById(emailId, user.email || "");
    });
  });
}

function feedUserProfilInfo(emailId, displayNameId) {
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;
      fillElementById(emailId, user.email || "");
      fillElementById(displayNameId, user.displayName || "");
    });
  });
}

function setupDisplayNameSave(saveBtnId, inputId, successDivId, errorDivId) {
  document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById(saveBtnId);
    const input = document.getElementById(inputId);
    const successMsg = document.getElementById(successDivId);
    const errorMsg = document.getElementById(errorDivId);

    if (!saveBtn || !input) {
      console.error("Bouton save ou input non trouvés");
      return;
    }

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!firebase.auth().currentUser) {
        showError("Utilisateur non connecté.");
        return;
      }

      const newDisplayName = input.value.trim();
      const currentDisplayName = firebase.auth().currentUser.displayName || "";

      clearMessages();

      if (newDisplayName === "") {
        showError("Le nom d'affichage ne peut pas être vide.");
        return;
      }
      if (newDisplayName === currentDisplayName) {
        showError("Le nom d'affichage n'a pas changé.");
        return;
      }

      try {
        saveBtn.disabled = true;
        await firebase.auth().currentUser.updateProfile({ displayName: newDisplayName });
        console.log("DisplayName mis à jour :", newDisplayName);
        showSuccess("Nom d'affichage mis à jour avec succès !");
      } catch (error) {
        console.error("Erreur mise à jour displayName:", error);
        showError("Erreur lors de la mise à jour. Réessaie plus tard.");
      } finally {
        saveBtn.disabled = false;
      }
    });

    function showSuccess(msg) {
      if (successMsg) {
        successMsg.textContent = msg;
        successMsg.style.color = "green";
        successMsg.style.display = "block";
      }
      if (errorMsg) errorMsg.style.display = "none";
    }
    function showError(msg) {
      if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.color = "red";
        errorMsg.style.display = "block";
      }
      if (successMsg) successMsg.style.display = "none";
    }
    function clearMessages() {
      if (successMsg) successMsg.style.display = "none";
      if (errorMsg) errorMsg.style.display = "none";
    }
  });
}




// 📦 Exposer les fonctions globalement
window.initFirebase = initFirebase;
window.requireAuth = requireAuth;
window.requireEmailVerified = requireEmailVerified;
window.setupLogin = setupLogin;
window.setupSignup = setupSignup;
window.setupSendVerificationEmail = setupSendVerificationEmail;
window.setupCheckEmailVerified = setupCheckEmailVerified;
window.setupGoogleLogin = setupGoogleLogin;
window.setupLogout = setupLogout;
window.setupForgotPassword = setupForgotPassword;
window.feedUserEmail = feedUserEmail;
window.feedUserProfilInfo = feedUserProfilInfo;
window.setupDisplayNameSave = setupDisplayNameSave;