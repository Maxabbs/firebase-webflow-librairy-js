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

// 🔐 Vérifier que l’utilisateur est connecté avant d’afficher la page
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


// 🔑 Login avec Google
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

      const emailInput = document.getElementById(emailId);
      const displayNameInput = document.getElementById(displayNameId);

      if (emailInput) emailInput.value = user.email;
      if (displayNameInput) displayNameInput.value = user.displayName || "";
    });
  });
}


// 📦 Exposer les fonctions globalement
window.initFirebase = initFirebase;
window.requireAuth = requireAuth;
window.setupLogin = setupLogin;
window.setupGoogleLogin = setupGoogleLogin;
window.setupLogout = setupLogout;
window.getUserInfo = getUserInfo;