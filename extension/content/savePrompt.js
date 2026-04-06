/**
 * savePrompt.js
 * Detects form submissions and prompts the user to save new credentials.
 * Uses Shadow DOM for style isolation.
 * Exposes window.MyVaultSavePrompt
 */

(function () {
  "use strict";

  const SHIELD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

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
        ${SHIELD_SVG}
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
    `;

    shadow.appendChild(prompt);
    document.body.appendChild(promptHost);

    // Event handlers inside shadow
    shadow.getElementById("mv-save").addEventListener("click", () => {
      saveCredentials(credentials);
      dismiss();
    });

    shadow.getElementById("mv-dismiss").addEventListener("click", () => {
      dismiss();
    });

    // Auto-dismiss after 15 seconds
    autoDismissTimer = setTimeout(dismiss, 15000);
  }

  /**
   * Sends credentials to the background for saving.
   */
  function saveCredentials(credentials) {
    const payload = {
      type: "login",
      title: window.location.hostname,
      username: credentials.username || "",
      password: credentials.password,
      url: window.location.href,
    };

    chrome.runtime.sendMessage(
      { type: "VAULT", action: "add", payload },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[Vestiga] Failed to save credentials:", chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {

        } else {
          console.warn("[Vestiga] Save failed:", response?.error);
        }
      }
    );
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

    const handler = (e) => {
      const username = usernameField ? usernameField.value : "";
      const password = passwordField ? passwordField.value : "";

      if (password) {
        showPrompt({ username, password });
      }
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
