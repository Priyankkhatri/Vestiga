/**
 * LockScreen.js
 * Renders and manages the lock screen UI state.
 */

(function () {
  "use strict";

  let currentMode = "unlock";

  window.LockScreen = {
    /**
     * Initializes the lock screen with event bindings.
     * @param {object} opts
     * @param {Function} opts.onUnlock - Called with (password, mode).
     */
    init(opts) {
      const input = document.getElementById("master-password");
      const btn = document.getElementById("btn-unlock");
      const toggle = document.getElementById("btn-toggle-pw");

      btn.addEventListener("click", () => {
        const pw = input.value.trim();
        if (!pw) {
          this.showError(currentMode === "setup" ? "Please create a password." : "Please enter your password.");
          return;
        }
        if (opts.onUnlock) opts.onUnlock(pw, currentMode);
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btn.click();
      });

      toggle.addEventListener("click", () => {
        input.type = input.type === "password" ? "text" : "password";
      });
    },

    setMode(mode) {
      currentMode = mode;
      const title = document.querySelector("#lock-screen h2");
      const desc = document.querySelector("#lock-screen p");
      const btn = document.getElementById("btn-unlock");
      const input = document.getElementById("master-password");

      if (mode === "setup") {
        title.textContent = "Welcome to My-Vault";
        desc.textContent = "Create a master password to secure your vault.";
        btn.textContent = "Set Password";
        input.placeholder = "New master password";
      } else {
        title.textContent = "My-Vault";
        desc.textContent = "Enter master password to unlock";
        btn.textContent = "Unlock";
        input.placeholder = "••••••••";
      }
    },

    show() {
      document.getElementById("lock-screen").classList.remove("hidden");
      document.getElementById("vault-view").classList.add("hidden");
      document.getElementById("settings-bar").classList.add("hidden");
      const input = document.getElementById("master-password");
      input.value = "";
      this.hideError();
      setTimeout(() => input.focus(), 50);
    },

    showError(msg) {
      const el = document.getElementById("lock-error");
      el.textContent = msg;
      el.classList.remove("hidden");
    },

    hideError() {
      document.getElementById("lock-error").classList.add("hidden");
    },

    setLoading(loading) {
      const btn = document.getElementById("btn-unlock");
      btn.disabled = loading;
      if (loading) {
        btn.textContent = currentMode === "setup" ? "Initializing…" : "Unlocking…";
      } else {
        btn.textContent = currentMode === "setup" ? "Set Password" : "Unlock";
      }
    }
  };
})();
