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
    const emailInput = document.getElementById(emailId);
    const passwordInput = document.getElementById(passwordId);
    const loginButton = document.getElementById(buttonId);
    const successMessage = document.getElementById(successDivId);
    const errorMessage = document.getElementById(errorDivId);

    if (!emailInput || !passwordInput || !loginButton) return;

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

// setupSendVerificationEmailWithCooldown
// ✉️ Envoi de l’email de vérification avec cooldown et redirection si déjà vérifié
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

        button.addEventListener("click", async function (event) {
          event.preventDefault();
          event.stopPropagation();

          // 🔄 Reset messages
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

            // ✅ Déjà vérifié
            if (refreshedUser.emailVerified) {
              if (successMsg) {
                successMsg.textContent = "Ton email est déjà vérifié ✅";
                successMsg.style.display = "block";
              }
              setTimeout(() => window.location.href = redirectIfVerified, 2000);
              return;
            }

            // 📩 Envoie l'email de vérification
            console.log("📨 Sending verification email...");
            await refreshedUser.sendEmailVerification();

            if (successMsg) {
              successMsg.textContent = "Email de vérification envoyé ! 📩";
              successMsg.style.display = "block";
            }

            // ⏳ Cooldown bouton avec affichage immédiat (modif pour input[type=submit])
            button.disabled = true;
            let remaining = parseInt(cooldownSeconds, 10) || 30;

            button.value = `Renvoyer dans ${remaining}s...`;
            remaining--;

            const cooldownInterval = setInterval(() => {
              if (remaining <= 0) {
                clearInterval(cooldownInterval);
                button.value = "⏳ Vérifie ta boîte mail";
                return;
              }

              button.value = `Renvoyer dans ${remaining}s...`;
              remaining--;
            }, 1000);

            // 🔁 Polling vérification
            const polling = setInterval(async () => {
              try {
                await refreshedUser.reload();
                if (refreshedUser.emailVerified) {
                  clearInterval(polling);
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
          }
        });
      });
    });
  });
}


// function setupCheckEmailVerifiedButton(buttonId, errorDivId, redirectOnVerified = "/firebase/dashboard") {
//   document.addEventListener("DOMContentLoaded", function () {
//     waitForFirebase(() => {
//       const button = document.getElementById(buttonId);
//       const errorMsg = document.getElementById(errorDivId);
//       if (!button) return;

//       button.addEventListener("click", () => {
//         firebase.auth().onAuthStateChanged(async function (user) {
//           if (!user) {
//             window.location.href = "/firebase/login"; // Redirige si déconnecté
//             return;
//           }

//           await user.reload(); // Rafraîchit les infos utilisateur

//           if (user.emailVerified || user.providerData[0].providerId !== "password") {
//             // ✅ Email vérifié → redirection
//             window.location.href = redirectOnVerified;
//           } else {
//             // ❌ Toujours pas vérifié → message d'erreur
//             if (errorMsg) {
//               errorMsg.textContent = "Ton email n’est pas encore vérifié. Clique sur le lien dans l’email reçu.";
//               errorMsg.style.display = "block";
//               errorMsg.style.color = "red";
//             }
//           }
//         });
//       });
//     });
//   });
// }

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

function feedUserEmail(emailId) {
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;

      const emailEl = document.getElementById(emailId);
      if (emailEl) emailEl.textContent = user.email;
      });
  });
}

// Fonction pour récupérer le displayName
function getUserDisplayName() {
  const user = firebase.auth().currentUser;
  return user ? user.displayName : null;
}

// Fonction pour injecter les infos dans des input text
function getUserInfo(emailId, displayNameId) {
  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) return;

      const emailEl = document.getElementById(emailId);
      const displayNameEl = document.getElementById(displayNameId);

      if (emailEl) emailEl.textContent = user.email;
      if (displayNameEl) displayNameEl.textContent = user.displayName || "";
    });
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
window.feedUserEmail = feedUserEmail;
window.getUserInfo = getUserInfo;