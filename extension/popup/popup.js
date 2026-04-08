/**
 * popup.js
 * Main popup orchestrator with 3-state flow:
 *   Login -> Master Password -> Vault
 *
 * Handles Supabase auth, master password unlock/setup,
 * vault rendering, search, and autofill.
 */

(function () {
  "use strict";

  // State
  var vaultItems = [];
  var currentUser = null;
  var masterPwMode = "unlock"; // "setup" or "unlock"
  var webAppVaultPollTimer = null;

  // Helpers

  function sendMessage(msg) {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage(msg, function (response) {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      });
    });
  }

  function showToast(text, type) {
    type = type || "success";
    var container = document.getElementById("toast-container");
    var t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = text;
    container.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label, "success");
    } catch (err) {
      console.error("[Popup] Copy failed:", err);
      showToast("Copy failed", "error");
    }
  }

  function clearWebAppPollTimer() {
    if (webAppVaultPollTimer) {
      clearTimeout(webAppVaultPollTimer);
      webAppVaultPollTimer = null;
    }
  }

  function getWebAppBaseUrl() {
    if (typeof CONFIG !== "undefined" && typeof CONFIG.APP_URL === "string" && CONFIG.APP_URL) {
      return CONFIG.APP_URL.replace(/\/+$/, "");
    }

    var apiUrl = typeof CONFIG !== "undefined" && typeof CONFIG.API_URL === "string"
      ? CONFIG.API_URL
      : "";

    if (apiUrl) {
      try {
        var derivedUrl = new URL(apiUrl);
        if (derivedUrl.pathname.indexOf("/api") === 0) {
          derivedUrl.pathname = derivedUrl.pathname.replace(/^\/api\/?/, "/");
        }
        if (
          (derivedUrl.hostname === "localhost" || derivedUrl.hostname === "127.0.0.1")
          && derivedUrl.port === "3001"
        ) {
          derivedUrl.port = "5173";
        }
        return derivedUrl.toString().replace(/\/+$/, "");
      } catch (_) {}
    }

    return "https://vestiga.vercel.app";
  }

  function buildWebAppUrl(pathname) {
    var baseUrl = getWebAppBaseUrl();
    if (!pathname) {
      return baseUrl;
    }
    return baseUrl + (pathname.charAt(0) === "/" ? pathname : "/" + pathname);
  }

  // Screen Control

  function showLoginScreen() {
    clearWebAppPollTimer();
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("master-pw-screen").classList.add("hidden");
    document.getElementById("vault-view").classList.add("hidden");
    document.getElementById("settings-bar").classList.add("hidden");
    vaultItems = [];
    currentUser = null;
  }

  function showMasterPwScreen(mode) {
    clearWebAppPollTimer();
    masterPwMode = mode;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("master-pw-screen").classList.remove("hidden");
    document.getElementById("vault-view").classList.add("hidden");
    document.getElementById("settings-bar").classList.add("hidden");

    var titleEl = document.getElementById("master-pw-title");
    var subtitleEl = document.getElementById("master-pw-subtitle");
    var submitBtn = document.getElementById("btn-master-pw-submit");
    var confirmWrap = document.getElementById("master-pw-confirm-wrap");
    var warningEl = document.getElementById("master-pw-warning");
    var errorEl = document.getElementById("master-pw-error");

    errorEl.classList.add("hidden");
    document.getElementById("master-pw-input").value = "";
    document.getElementById("master-pw-confirm").value = "";

    if (mode === "setup") {
      titleEl.textContent = "Create Master Password";
      subtitleEl.textContent = "This password encrypts all your vault data";
      submitBtn.textContent = "Create & Encrypt Vault";
      confirmWrap.classList.remove("hidden");
      warningEl.classList.remove("hidden");
    } else {
      titleEl.textContent = "Unlock Vault";
      subtitleEl.textContent = "Enter your master password to decrypt your vault";
      submitBtn.textContent = "Unlock Vault";
      confirmWrap.classList.add("hidden");
      warningEl.classList.add("hidden");
    }

    setTimeout(function () {
      document.getElementById("master-pw-input").focus();
    }, 50);
  }

  function showVaultView(user) {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("master-pw-screen").classList.add("hidden");
    document.getElementById("vault-view").classList.remove("hidden");
    window.SettingsBar.show(user);
    window.SearchView.clear();
  }

  // Auth Flow

  async function syncSessionFromWebApp() {
    try {
      var res = await sendMessage({ type: "AUTH", action: "syncFromTabs" });
      if (res && res.success && res.data) {
        currentUser = res.data;
        await checkMasterKeyStatus();
        return true;
      }
    } catch (err) {
      console.error("[Popup] Web app session sync failed:", err);
    }

    return false;
  }

  async function checkAuthStatus() {
    try {
      var res = await sendMessage({ type: "AUTH", action: "getSession" });
      if (res && res.success && res.data && res.data.user) {
        currentUser = res.data.user;
        await checkMasterKeyStatus();
        return;
      }
    } catch (err) {
      console.error("[Popup] Session check failed:", err);
    }

    var synced = await syncSessionFromWebApp();
    if (synced) {
      return;
    }

    showLoginScreen();
  }

  async function checkMasterKeyStatus(pollCount) {
    pollCount = typeof pollCount === "number" ? pollCount : 0;

    try {
      var res = await sendMessage({ type: "MASTER_KEY", action: "status" });
      if (res && res.success && res.data) {
        if (res.data.isSet) {
          clearWebAppPollTimer();
          showVaultView(currentUser);
          await fetchVault();
          return;
        }

        if (res.data.source === "webapp") {
          showVaultView(currentUser);

          if (res.data.isLoading && pollCount < 8) {
            window.ItemList.showLoading();
            clearWebAppPollTimer();
            webAppVaultPollTimer = setTimeout(function () {
              checkMasterKeyStatus(pollCount + 1);
            }, 250);
            return;
          }

          clearWebAppPollTimer();
          vaultItems = Array.isArray(res.data.items) ? res.data.items : [];
          await renderCurrentItems();
          return;
        }

        if (res.data.needsSetup) {
          showMasterPwScreen("setup");
          return;
        }

        showMasterPwScreen("unlock");
        return;
      }

      showMasterPwScreen("unlock");
    } catch (err) {
      console.error("[Popup] Master key status check failed:", err);
      showMasterPwScreen("unlock");
    }
  }

  async function handleSignIn() {
    var emailInput = document.getElementById("login-email");
    var passwordInput = document.getElementById("login-password");
    var errorEl = document.getElementById("login-error");
    var btn = document.getElementById("btn-signin");

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email) {
      errorEl.textContent = "Please enter your email.";
      errorEl.classList.remove("hidden");
      return;
    }
    if (!password) {
      errorEl.textContent = "Please enter your password.";
      errorEl.classList.remove("hidden");
      return;
    }

    errorEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      var res = await sendMessage({
        type: "AUTH",
        action: "signIn",
        payload: { email: email, password: password }
      });

      if (res && res.success) {
        showToast("Signed in!", "success");
        currentUser = res.data;
        await checkMasterKeyStatus();
      } else {
        errorEl.textContent = (res && res.error) || "Sign in failed. Check your credentials.";
        errorEl.classList.remove("hidden");
        errorEl.classList.remove("animate-shake");
        void errorEl.offsetWidth;
        errorEl.classList.add("animate-shake");
      }
    } catch (err) {
      errorEl.textContent = err.message || "Sign in failed.";
      errorEl.classList.remove("hidden");
      errorEl.classList.remove("animate-shake");
      void errorEl.offsetWidth;
      errorEl.classList.add("animate-shake");
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  }

  function handleSignOut() {
    sendMessage({ type: "AUTH", action: "signOut" })
      .then(function () {
        vaultItems = [];
        currentUser = null;
        showLoginScreen();
        showToast("Signed out", "success");
      })
      .catch(function (err) { console.error("[Popup] Sign out failed:", err); });
  }

  function handleLock() {
    sendMessage({ type: "MASTER_KEY", action: "lock" })
      .then(function () {
        vaultItems = [];
        showMasterPwScreen("unlock");
        showToast("Vault locked", "success");
      })
      .catch(function (err) { console.error("[Popup] Lock failed:", err); });
  }

  // Master Password Flow

  async function handleMasterPwSubmit() {
    var pwInput = document.getElementById("master-pw-input");
    var confirmInput = document.getElementById("master-pw-confirm");
    var errorEl = document.getElementById("master-pw-error");
    var btn = document.getElementById("btn-master-pw-submit");

    var password = pwInput.value;
    var confirmPassword = confirmInput.value;

    if (!password) {
      errorEl.textContent = "Please enter your master password.";
      errorEl.classList.remove("hidden");
      return;
    }

    if (masterPwMode === "setup") {
      if (password.length < 8) {
        errorEl.textContent = "Master password must be at least 8 characters.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (password !== confirmPassword) {
        errorEl.textContent = "Passwords do not match.";
        errorEl.classList.remove("hidden");
        return;
      }
    }

    errorEl.classList.add("hidden");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-sm"></span> ${masterPwMode === "setup" ? "Creating..." : "Unlocking..."}`;

    try {
      var action = masterPwMode === "setup" ? "setup" : "unlock";
      var res = await sendMessage({
        type: "MASTER_KEY",
        action: action,
        payload: { password: password }
      });

      if (res && res.success) {
        showToast(masterPwMode === "setup" ? "Vault encrypted!" : "Vault unlocked!", "success");
        showVaultView(currentUser);
        setTimeout(function () { fetchVault(); }, 100);
      } else {
        errorEl.textContent = (res && res.error) || "Failed. Please try again.";
        errorEl.classList.remove("hidden");
        errorEl.classList.remove("animate-shake");
        void errorEl.offsetWidth;
        errorEl.classList.add("animate-shake");
      }
    } catch (err) {
      errorEl.textContent = err.message || "Operation failed.";
      errorEl.classList.remove("hidden");
      errorEl.classList.remove("animate-shake");
      void errorEl.offsetWidth;
      errorEl.classList.add("animate-shake");
    } finally {
      btn.disabled = false;
      btn.textContent = masterPwMode === "setup" ? "Create & Encrypt Vault" : "Unlock Vault";
    }
  }

  // Vault Data

  async function fetchVault() {
    window.ItemList.showLoading();

    try {
      var startTime = Date.now();
      var res = await sendMessage({ type: "VAULT", action: "getAll" });
      var duration = Date.now() - startTime;
      if (duration < 400) {
        await new Promise(function (resolve) { setTimeout(resolve, 400 - duration); });
      }

      vaultItems = (res && res.success && Array.isArray(res.data)) ? res.data : [];
    } catch (err) {
      vaultItems = [];
      console.error("[Popup] Fetch vault failed:", err);
    }

    await renderCurrentItems();
  }

  async function renderCurrentItems(query) {
    query = query || "";
    var items = vaultItems;

    var currentDomain = "";
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith("http")) {
        currentDomain = new URL(tabs[0].url).hostname.replace(/^www\./, "").toLowerCase();
      }
    } catch (_) {}

    if (query) {
      items = vaultItems.filter(function (item) {
        return (item.title || "").toLowerCase().includes(query) ||
               (item.username || "").toLowerCase().includes(query) ||
               (item.url || "").toLowerCase().includes(query);
      });
    } else if (currentDomain) {
      items = vaultItems.slice().sort(function (a, b) {
        var aUrl = (a.url || "").toLowerCase();
        var bUrl = (b.url || "").toLowerCase();
        var aMatch = aUrl.includes(currentDomain) ? 1 : 0;
        var bMatch = bUrl.includes(currentDomain) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    var mappedItems = items.map(function (item) {
      var copy = Object.assign({}, item);
      if (currentDomain && !query && (copy.url || "").toLowerCase().includes(currentDomain)) {
        copy.isSuggested = true;
      }
      return copy;
    });

    window.ItemList.render(mappedItems, {
      onCopyUsername: function (val) { copyToClipboard(val, "Username copied"); },
      onCopyPassword: function (val) { copyToClipboard(val, "Password copied"); },
      onAutofill: function (item) { handleAutofill(item); }
    });
  }

  // Autofill

  async function handleAutofill(item) {
    try {
      var res = await sendMessage({
        type: "AUTOFILL",
        action: "fill",
        payload: {
          username: item.username || "",
          password: item.password || ""
        }
      });

      if (res && res.success) {
        showToast("Credentials filled!", "success");
        var cards = document.querySelectorAll(".item-card");
        cards.forEach(function (card) {
          if (card.dataset.id === item.id) {
            card.classList.add("active-fill");
            setTimeout(function () { card.classList.remove("active-fill"); }, 1200);
          }
        });
      } else {
        showToast((res && res.error) || "Autofill failed", "error");
      }
    } catch (err) {
      showToast("Autofill failed: " + (err.message || ""), "error");
    }
  }

  // Init Components

  window.LockScreen.init({
    onSignIn: handleSignIn
  });

  window.SearchView.init({
    onSearch: function (query) { renderCurrentItems(query); }
  });

  window.SettingsBar.init({
    onSignOut: handleSignOut,
    onLock: handleLock,
    onDashboard: function () {
      chrome.tabs.create({ url: buildWebAppUrl("/dashboard") });
    }
  });

  // Master password screen events
  document.getElementById("btn-master-pw-submit").addEventListener("click", handleMasterPwSubmit);

  document.getElementById("master-pw-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (masterPwMode === "setup") {
        document.getElementById("master-pw-confirm").focus();
      } else {
        handleMasterPwSubmit();
      }
    }
  });

  document.getElementById("master-pw-confirm").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMasterPwSubmit();
    }
  });

  document.getElementById("btn-toggle-master-pw").addEventListener("click", function () {
    var input = document.getElementById("master-pw-input");
    input.type = input.type === "password" ? "text" : "password";
  });

  // Boot
  var signupEl = document.getElementById("btn-signup-link");
  if (signupEl) {
    signupEl.href = buildWebAppUrl("/login");
  }

  checkAuthStatus();
})();
