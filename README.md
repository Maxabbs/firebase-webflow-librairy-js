# firebase-webflow-librairy-js
A JS librairy which permit to communicate between Firebase and Webflow

# In Webflow -> Custom Code Footer:

<!-- Firebase core SDK (compat) -->
<script src="https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"></script>

<!-- Firebase Authentication SDK (compat) -->
<script src="https://www.gstatic.com/firebasejs/12.0.0/firebase-auth-compat.js"></script>

<script src="https://maxabbs.github.io/firebase-webflow-librairy-js/firebase-auth-helper.js"></script>

<script>
  initFirebase();
</script>


# In login page
## Before body part
<script>
  setupLogin("login-email", "login-password", "login-button", "login-message", "/firebase/dashboard");
</script>


# In restricted pages
## Head part
<style>
  body {
    visibility: hidden;
  }
</style>

## Before body part
<script>
  requireAuth("/firebase/login");
</script>

# To logout
<script>
  setupLogout("logout-btn", "/");
</script>



