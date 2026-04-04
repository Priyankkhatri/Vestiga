/**
 * popup.js
 * Main popup orchestrator.
 * Delegates UI rendering to component modules (LockScreen, ItemList, SearchView, SettingsBar).
 * ALL data flows through chrome.runtime.sendMessage → background → services.
 */

(function () {
  "use strict";

  // ─── State ───
  let vaultItems = [];

  // ─── Helpers ───

  function sendMessage(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      });
    });
  }

  function showToast(text, type = "success") {
    const container = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = text;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2200);
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

  // ─── Vault View Control ───

  function showVaultView() {
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("vault-view").classList.remove("hidden");
    window.SettingsBar.show();
    window.SearchView.clear();
  }

  // ─── Auth ───

  async function checkAuthStatus() {
    try {
      // 1. Is it unlocked?
      const statusRes = await sendMessage({ type: "AUTH", action: "status" });
      if (statusRes && statusRes.success && statusRes.data === true) {
        showVaultView();
        await fetchVault();
        return;
      }

      // 2. If locked, is it even initialized?
      const initRes = await sendMessage({ type: "AUTH", action: "isInitialized" });
      const initialized = initRes && initRes.success && initRes.data === true;

      window.LockScreen.setMode(initialized ? "unlock" : "setup");
      window.LockScreen.show();
    } catch (err) {
      console.error("[Popup] Auth check failed:", err);
      window.LockScreen.show();
    }
  }

  async function handleUnlock(password, mode) {
    window.LockScreen.setLoading(true);
    window.LockScreen.hideError();

    try {
      const action = mode === "setup" ? "setup" : "unlock";
      const res = await sendMessage({
        type: "AUTH",
        action,
        payload: { password }
      });

      if (res && res.success) {
        if (mode === "setup") showToast("Vault initialized!", "success");
        showVaultView();
        await fetchVault();
      } else {
        window.LockScreen.showError(res?.error || (mode === "setup" ? "Setup failed." : "Incorrect password."));
      }
    } catch (err) {
      window.LockScreen.showError(err.message || "Operation failed.");
    } finally {
      window.LockScreen.setLoading(false);
    }
  }

  function handleLock() {
    sendMessage({ type: "AUTH", action: "lock" })
      .then(() => {
        vaultItems = [];
        window.LockScreen.show();
        showToast("Vault locked", "success");
      })
      .catch((err) => console.error("[Popup] Lock failed:", err));
  }

  // ─── Vault Data ───

  async function fetchVault() {
    window.ItemList.showLoading();

    try {
      const res = await sendMessage({ type: "VAULT", action: "getAll" });
      vaultItems = (res && res.success && Array.isArray(res.data)) ? res.data : [];
    } catch (err) {
      vaultItems = [];
      console.error("[Popup] Fetch vault failed:", err);
    }

    renderCurrentItems();
  }

  function renderCurrentItems(query = "") {
    let items = vaultItems;

    if (query) {
      items = vaultItems.filter((item) =>
        (item.title || "").toLowerCase().includes(query) ||
        (item.username || "").toLowerCase().includes(query) ||
        (item.url || "").toLowerCase().includes(query)
      );
    }

    window.ItemList.render(items, {
      onCopyUsername: (val) => copyToClipboard(val, "Username copied"),
      onCopyPassword: (val) => copyToClipboard(val, "Password copied"),
    });
  }

  // ─── Init Components ───

  window.LockScreen.init({
    onUnlock: handleUnlock
  });

  window.SearchView.init({
    onSearch: (query) => renderCurrentItems(query)
  });

  window.SettingsBar.init({
    onLock: handleLock,
    onDashboard: () => showToast("Dashboard coming soon", "success")
  });

  // ─── Boot ───
  checkAuthStatus();
})();
