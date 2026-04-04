/**
 * content-script.js
 * Entry point for all content-script modules.
 * Orchestrates form detection, autofill dropdown, and save prompts.
 */

(function () {
  "use strict";

  console.log("[My-Vault] Content script loaded.");

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

      console.log("[My-Vault] Autofill bound to a login form.");
    }
  }

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
