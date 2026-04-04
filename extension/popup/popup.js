/**
 * popup.js
 * Main popup orchestrator with 3-state flow:
 *   Login → Master Password → Vault
 *
 * Handles Supabase auth, master password unlock/setup,
 * vault rendering, search, and autofill.
 */

(function () {
  "use strict";

  // ─── State ───
  var vaultItems = [];
  var currentUser = null;
  var masterPwMode = "unlock"; // "setup" or "unlock"

  // ─── Helpers ───

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

  // ─── Screen Control ───

  function showLoginScreen() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("master-pw-screen").classList.add("hidden");
    document.getElementById("vault-view").classList.add("hidden");
    document.getElementById("settings-bar").classList.add("hidden");
    vaultItems = [];
    currentUser = null;
  }

  function showMasterPwScreen(mode) {
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

  // ─── Auth Flow ───

  async function checkAuthStatus() {
    try {
      var res = await sendMessage({ type: "AUTH", action: "getSession" });
      if (res && res.success && res.data && res.data.user) {
        currentUser = res.data.user;
        // Check master key status
        await checkMasterKeyStatus();
        return;
      }
    } catch (err) {
      console.error("[Popup] Session check failed:", err);
    }
    showLoginScreen();
  }

  async function checkMasterKeyStatus() {
    try {
      var res = await sendMessage({ type: "MASTER_KEY", action: "status" });
      if (res && res.success && res.data) {
        if (res.data.isSet) {
          // Master key is in memory — go straight to vault
          showVaultView(currentUser);
          await fetchVault();
        } else if (res.data.needsSetup) {
          // First time — show setup screen
          showMasterPwScreen("setup");
        } else {
          // Key expired/cleared — show unlock screen
          showMasterPwScreen("unlock");
        }
      } else {
        showMasterPwScreen("unlock");
      }
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
    btn.textContent = "Signing in…";

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
        void errorEl.offsetWidth; // trigger reflow
        errorEl.classList.add("animate-shake");
      }
    } catch (err) {
      errorEl.textContent = err.message || "Sign in failed.";
      errorEl.classList.remove("hidden");
      errorEl.classList.remove("animate-shake");
      void errorEl.offsetWidth; // trigger reflow
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

  // ─── Master Password Flow ───

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
        // Added a tiny delay for skeleton feel
        setTimeout(() => fetchVault(), 100);
      } else {
        errorEl.textContent = (res && res.error) || "Failed. Please try again.";
        errorEl.classList.remove("hidden");
        errorEl.classList.remove("animate-shake");
        void errorEl.offsetWidth; // trigger reflow
        errorEl.classList.add("animate-shake");
      }
    } catch (err) {
      errorEl.textContent = err.message || "Operation failed.";
      errorEl.classList.remove("hidden");
      errorEl.classList.remove("animate-shake");
      void errorEl.offsetWidth; // trigger reflow
      errorEl.classList.add("animate-shake");
    } finally {
      btn.disabled = false;
      btn.textContent = masterPwMode === "setup" ? "Create & Encrypt Vault" : "Unlock Vault";
    }
  }

  // ─── Vault Data ───

  async function fetchVault() {
    window.ItemList.showLoading();

    try {
      // Minimum duration for skeletons to avoid flicker
      const startTime = Date.now();
      var res = await sendMessage({ type: "VAULT", action: "getAll" });
      const duration = Date.now() - startTime;
      if (duration < 400) await new Promise(r => setTimeout(r, 400 - duration));

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

    // Domain matching
    var currentDomain = "";
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith("http")) {
        currentDomain = new URL(tabs[0].url).hostname.replace(/^www\./, "").toLowerCase();
      }
    } catch(e) {}

    if (query) {
      items = vaultItems.filter(function (item) {
        return (item.title || "").toLowerCase().includes(query) ||
               (item.username || "").toLowerCase().includes(query) ||
               (item.url || "").toLowerCase().includes(query);
      });
    } else if (currentDomain) {
      // Sort matches to top
      items = vaultItems.slice().sort(function(a, b) {
        var aUrl = (a.url || "").toLowerCase();
        var bUrl = (b.url || "").toLowerCase();
        var aMatch = aUrl.includes(currentDomain) ? 1 : 0;
        var bMatch = bUrl.includes(currentDomain) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    var mappedItems = items.map(function(item) {
      // Create a shallow copy so we can attach a transient isSuggested flag
      var i = Object.assign({}, item);
      if (currentDomain && !query && (i.url || "").toLowerCase().includes(currentDomain)) {
        i.isSuggested = true;
      }
      return i;
    });

    window.ItemList.render(mappedItems, {
      onCopyUsername: function (val) { copyToClipboard(val, "Username copied"); },
      onCopyPassword: function (val) { copyToClipboard(val, "Password copied"); },
      onAutofill: function (item) { handleAutofill(item); },
    });
  }

  // ─── Autofill ───

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

  // ─── Init Components ───

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
      var dashUrl = (typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '').replace('/api', '').replace(':3001', ':5173');
      chrome.tabs.create({ url: dashUrl || "http://localhost:5174" });
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
    var inp = document.getElementById("master-pw-input");
    inp.type = inp.type === "password" ? "text" : "password";
  });

  // ─── Boot ───
  if (typeof CONFIG !== 'undefined') {
    var signupEl = document.getElementById("btn-signup-link");
    if (signupEl) {
      signupEl.href = CONFIG.API_URL.replace('/api', '').replace(':3001', ':5173') + '/signup';
    }
  }

  checkAuthStatus();
})();
