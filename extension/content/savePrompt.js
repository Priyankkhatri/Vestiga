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
      <div class="mv-save-actions" id="mv-help-actions" style="display:none; gap: 10px; margin-top: 10px;">
        <button class="mv-save-btn secondary" id="mv-open-extension" type="button">Open Extension</button>
        <button class="mv-save-btn secondary" id="mv-open-webapp" type="button">Open Web App</button>
      </div>
      <div class="mv-save-status" id="mv-status" aria-live="polite"></div>
    `;

    shadow.appendChild(prompt);
    document.body.appendChild(promptHost);

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
            resolve({ success: false, error: response?.error || "Save failed" });
          }
        }
      );
    });
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
