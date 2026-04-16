/**
 * savePrompt.js
 * Detects form submissions and prompts the user to save new credentials.
 * Uses Shadow DOM for style isolation.
 * Exposes window.MyVaultSavePrompt
 */

(function () {
  "use strict";

  function brandIconHtml() {
    return `<img class="mv-brand-icon" src="${chrome.runtime.getURL("assets/icon48.png")}" alt="" />`;
  }

  let promptHost = null;
  let autoDismissTimer = null;

  /**
   * Shows a save-credential prompt.
   * @param {{ username: string, password: string }} credentials
   */
  function showPrompt(credentials) {
    // Don't show if either field is missing
    if (!credentials || !credentials.password) return;

    // Remove any existing prompt
    dismiss();

    promptHost = document.createElement("div");
    promptHost.id = "my-vault-save-host";
    const shadow = promptHost.attachShadow({ mode: "closed" });

    // Inject styles
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("content/autofill-ui.css");
    shadow.appendChild(link);

    const prompt = document.createElement("div");
    prompt.className = "mv-save-prompt";

    const maskedPassword = "•".repeat(Math.min(credentials.password.length, 12));

    prompt.innerHTML = `
      <div class="mv-save-header">
        ${brandIconHtml()}
        <span>Save to Vestiga?</span>
      </div>
      <div class="mv-save-body">
        <div class="mv-save-field"><strong>Username:</strong> ${escapeHtml(credentials.username || "(none)")}</div>
        <div class="mv-save-field"><strong>Password:</strong> ${maskedPassword}</div>
      </div>
      <div class="mv-save-actions">
        <button class="mv-save-btn secondary" id="mv-dismiss">Dismiss</button>
        <button class="mv-save-btn primary" id="mv-save">Save</button>
      </div>
      <div class="mv-unlock-panel" id="mv-unlock-panel" style="display:none;">
        <label class="mv-unlock-label" for="mv-master-password">Master password</label>
        <input class="mv-unlock-input" id="mv-master-password" type="password" autocomplete="off" placeholder="Enter master password" />
        <input class="mv-unlock-input" id="mv-master-confirm" type="password" autocomplete="off" placeholder="Confirm master password" style="display:none;" />
        <button class="mv-save-btn primary" id="mv-unlock-save" type="button">Unlock & Save</button>
      </div>
      <div class="mv-save-actions" id="mv-help-actions" style="display:none; gap: 10px; margin-top: 10px;">
        <button class="mv-save-btn secondary" id="mv-open-extension" type="button">Open Extension</button>
        <button class="mv-save-btn secondary" id="mv-open-webapp" type="button">Open Web App</button>
      </div>
      <div class="mv-save-status" id="mv-status" aria-live="polite"></div>
    `;

    shadow.appendChild(prompt);
    document.body.appendChild(promptHost);

    prompt.addEventListener("keydown", (event) => event.stopPropagation());
    prompt.addEventListener("keyup", (event) => event.stopPropagation());
    prompt.addEventListener("input", (event) => event.stopPropagation());

    // Event handlers inside shadow
    shadow.getElementById("mv-save").addEventListener("click", async () => {
      const saveButton = shadow.getElementById("mv-save");
      const dismissButton = shadow.getElementById("mv-dismiss");
      const statusEl = shadow.getElementById("mv-status");
      const helpActions = shadow.getElementById("mv-help-actions");

      saveButton.disabled = true;
      dismissButton.disabled = true;
      saveButton.textContent = "Saving...";
      statusEl.textContent = "Saving...";
      helpActions.style.display = "none";

      const result = await saveCredentials(credentials);
      if (result.success) {
        dismiss();
        return;
      }

      if (result.pending) {
        await showInlineUnlock(shadow, credentials);
        return;
      }

      saveButton.disabled = false;
      dismissButton.disabled = false;
      saveButton.textContent = "Save";
      const msg = (result && typeof result.error === "string" && result.error.trim())
        ? result.error.trim()
        : "Save failed. Please try again.";
      statusEl.textContent = msg;

      // If we can detect a likely cause, offer a one-click escape hatch.
      const lower = msg.toLowerCase();
      const showHelp =
        lower.includes("not authenticated") ||
        lower.includes("vault is locked") ||
        lower.includes("open vestiga") ||
        lower.includes("no signed-in vestiga") ||
        lower.includes("no unlocked vestiga");
      if (showHelp) {
        helpActions.style.display = "flex";
      }
    });

    shadow.getElementById("mv-unlock-save").addEventListener("click", async () => {
      await unlockAndFlushPending(shadow);
    });

    shadow.getElementById("mv-master-password").addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const confirmInput = shadow.getElementById("mv-master-confirm");
        if (confirmInput.style.display !== "none" && !confirmInput.value) {
          confirmInput.focus();
          return;
        }
        await unlockAndFlushPending(shadow);
      }
    });

    shadow.getElementById("mv-master-confirm").addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await unlockAndFlushPending(shadow);
      }
    });

    shadow.getElementById("mv-dismiss").addEventListener("click", () => {
      dismiss();
    });

    shadow.getElementById("mv-open-extension").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "NAV", action: "openExtensionUnlock" }, () => {});
    });

    shadow.getElementById("mv-open-webapp").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "NAV", action: "openWebApp" }, () => {});
    });

    // Auto-dismiss after 15 seconds
    autoDismissTimer = setTimeout(dismiss, 15000);
  }

  /**
   * Sends credentials to the background for saving.
   */
  function saveCredentials(credentials) {
    const payload = {
      type: "password",
      title: window.location.hostname,
      username: credentials.username || "",
      password: credentials.password,
      url: window.location.href,
    };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "VAULT", action: "add", payload },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[Vestiga] Failed to save credentials:", chrome.runtime.lastError.message);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }

          if (response && response.success) {
            resolve({ success: true });
          } else {
            console.warn("[Vestiga] Save failed:", response?.error);
            resolve({
              success: false,
              pending: Boolean(response && response.pending),
              error: response?.error || "Save failed"
            });
          }
        }
      );
    });
  }

  function sendExtensionMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: "No response from extension" });
      });
    });
  }

  async function showInlineUnlock(shadow) {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }

    const saveButton = shadow.getElementById("mv-save");
    const dismissButton = shadow.getElementById("mv-dismiss");
    const unlockPanel = shadow.getElementById("mv-unlock-panel");
    const confirmInput = shadow.getElementById("mv-master-confirm");
    const statusEl = shadow.getElementById("mv-status");

    const status = await sendExtensionMessage({ type: "MASTER_KEY", action: "status" });
    const needsSetup = Boolean(status && status.success && status.data && status.data.needsSetup);

    saveButton.style.display = "none";
    dismissButton.disabled = false;
    unlockPanel.style.display = "block";
    confirmInput.style.display = needsSetup ? "block" : "none";
    statusEl.textContent = needsSetup
      ? "Create your master password to encrypt and save this login."
      : "Enter your master password to encrypt and save this login.";

    shadow.getElementById("mv-unlock-save").dataset.mode = needsSetup ? "setup" : "unlock";
    setTimeout(() => shadow.getElementById("mv-master-password").focus(), 50);
  }

  async function unlockAndFlushPending(shadow) {
    const passwordInput = shadow.getElementById("mv-master-password");
    const confirmInput = shadow.getElementById("mv-master-confirm");
    const unlockButton = shadow.getElementById("mv-unlock-save");
    const statusEl = shadow.getElementById("mv-status");
    const mode = unlockButton.dataset.mode === "setup" ? "setup" : "unlock";
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (!password) {
      statusEl.textContent = "Please enter your master password.";
      return;
    }

    if (mode === "setup") {
      if (password.length < 8) {
        statusEl.textContent = "Master password must be at least 8 characters.";
        return;
      }
      if (password !== confirmPassword) {
        statusEl.textContent = "Passwords do not match.";
        return;
      }
    }

    unlockButton.disabled = true;
    unlockButton.textContent = mode === "setup" ? "Creating..." : "Unlocking...";
    statusEl.textContent = mode === "setup" ? "Creating encrypted vault..." : "Unlocking vault...";

    const unlockResult = await sendExtensionMessage({
      type: "MASTER_KEY",
      action: mode,
      payload: { password }
    });

    passwordInput.value = "";
    confirmInput.value = "";

    if (!unlockResult || !unlockResult.success) {
      unlockButton.disabled = false;
      unlockButton.textContent = "Unlock & Save";
      statusEl.textContent = (unlockResult && unlockResult.error) || "Master password failed.";
      return;
    }

    statusEl.textContent = "Saving encrypted login...";
    const flushResult = await sendExtensionMessage({ type: "VAULT", action: "flushPendingAdd" });
    if (flushResult && flushResult.success) {
      dismiss();
      return;
    }

    unlockButton.disabled = false;
    unlockButton.textContent = "Unlock & Save";
    statusEl.textContent = (flushResult && flushResult.error) || "Save failed. Please try again.";
  }

  /**
   * Removes the prompt from the DOM.
   */
  function dismiss() {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }
    if (promptHost && promptHost.parentNode) {
      promptHost.parentNode.removeChild(promptHost);
    }
    promptHost = null;
  }

  /**
   * Attaches submit listeners to a detected form.
   * @param {{ usernameField: HTMLInputElement|null, passwordField: HTMLInputElement, form: HTMLFormElement|null }} formDescriptor
   */
  function attachSubmitListener(formDescriptor) {
    const { usernameField, passwordField, form } = formDescriptor;

    let debounceTimer;
    const handler = (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const username = usernameField ? usernameField.value : "";
        const password = passwordField ? passwordField.value : "";

        if (password) {
          showPrompt({ username, password });
        }
      }, 50);
    };

    if (form) {
      form.addEventListener("submit", handler, { capture: true });
    }

    // Also listen for button clicks that might submit without a form event
    const submitBtn =
      form?.querySelector('button[type="submit"], input[type="submit"]') ||
      form?.querySelector("button:not([type])");

    if (submitBtn) {
      submitBtn.addEventListener("click", handler, { capture: true });
    }

    // Listen for Enter key on the password field
    passwordField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handler(e);
      }
    });
  }

  /**
   * Basic HTML escape.
   */
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Expose globally
  window.MyVaultSavePrompt = { showPrompt, attachSubmitListener, dismiss };
})();
