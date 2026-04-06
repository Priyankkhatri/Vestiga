/**
 * content-script.js
 * Entry point for all content-script modules.
 * Orchestrates form detection, autofill dropdown, save prompts,
 * and listens for AUTOFILL_CREDENTIALS messages from the background.
 */

(function () {
  "use strict";



  /** Tracks forms we've already processed so we don't double-bind. */
  const processedForms = new WeakSet();

  /**
   * Scans the page for login forms and wires up autofill + save logic.
   */
  function scanAndBind() {
    const detectedForms = window.MyVaultFormDetector.detectForms();

    for (const formDescriptor of detectedForms) {
      const { usernameField, passwordField } = formDescriptor;

      // Skip if we've already processed this password field
      if (processedForms.has(passwordField)) continue;
      processedForms.add(passwordField);

      // Show dropdown on focus for both fields
      const showDropdown = (inputEl) => {
        inputEl.addEventListener("focus", () => {
          window.MyVaultDropdown.show(inputEl, formDescriptor);
        });
      };

      if (usernameField) showDropdown(usernameField);
      showDropdown(passwordField);

      // Attach save-on-submit listener
      window.MyVaultSavePrompt.attachSubmitListener(formDescriptor);


    }
  }

  // --- Listen for AUTOFILL_CREDENTIALS from popup → background → here ---
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "AUTOFILL_CREDENTIALS" && message.credentials) {


      const credentials = message.credentials;
      const detectedForms = window.MyVaultFormDetector.detectForms();

      if (detectedForms.length > 0) {
        // Fill the first detected form
        window.MyVaultAutofill.fill(credentials, detectedForms[0]);

        sendResponse({ success: true });
      } else {
        console.warn("[Vestiga] No login forms detected on this page.");
        sendResponse({ success: false, error: "No login forms found" });
      }

      return true; // async response
    }
  });

  // --- Initial scan (after a short delay to let SPAs render) ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(scanAndBind, 300));
  } else {
    setTimeout(scanAndBind, 300);
  }

  // --- Observe DOM mutations for dynamically injected forms ---
  const observer = new MutationObserver((mutations) => {
    let hasNewInputs = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (
            node.matches?.('input[type="password"]') ||
            node.querySelector?.('input[type="password"]')
          ) {
            hasNewInputs = true;
            break;
          }
        }
      }
      if (hasNewInputs) break;
    }

    if (hasNewInputs) {
      // Debounce slightly to let the DOM settle
      clearTimeout(scanAndBind._debounce);
      scanAndBind._debounce = setTimeout(scanAndBind, 500);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
