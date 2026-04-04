/**
 * formDetector.js
 * Detects login/registration forms on web pages.
 * Exposes window.MyVaultFormDetector
 */

(function () {
  "use strict";

  const USERNAME_SELECTORS = [
    'input[type="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][autocomplete="username"]',
    'input[type="text"][autocomplete="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[name="login"]',
    'input[name="user"]',
    'input[id*="user"]',
    'input[id*="email"]',
    'input[id*="login"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="username" i]',
    'input[placeholder*="user" i]',
  ];

  /**
   * Finds the closest username/email field relative to a password field.
   * @param {HTMLElement} passwordField
   * @param {HTMLElement|null} formEl - The parent form, if any.
   * @returns {HTMLInputElement|null}
   */
  function findUsernameField(passwordField, formEl) {
    const scope = formEl || passwordField.closest("div, section, main, body") || document;

    for (const selector of USERNAME_SELECTORS) {
      const candidates = scope.querySelectorAll(selector);
      if (candidates.length > 0) {
        // Return the one visually closest (appearing before the password field in DOM order)
        for (const c of candidates) {
          if (c !== passwordField && isVisible(c)) {
            return c;
          }
        }
      }
    }

    // Fallback: grab the first visible text input before the password field
    const allInputs = scope.querySelectorAll('input');
    let lastText = null;
    for (const inp of allInputs) {
      if (inp === passwordField) break;
      const t = (inp.type || "text").toLowerCase();
      if ((t === "text" || t === "email") && isVisible(inp)) {
        lastText = inp;
      }
    }
    return lastText;
  }

  /**
   * Checks if an element is visible on screen.
   */
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
  }

  /**
   * Scans the document and returns an array of detected login form descriptors.
   * Each descriptor: { usernameField, passwordField, form }
   * @returns {Array<{usernameField: HTMLInputElement|null, passwordField: HTMLInputElement, form: HTMLFormElement|null}>}
   */
  function detectForms() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const results = [];
    const seen = new Set();

    for (const pwField of passwordFields) {
      if (seen.has(pwField) || !isVisible(pwField)) continue;
      seen.add(pwField);

      const formEl = pwField.closest("form");
      const usernameField = findUsernameField(pwField, formEl);

      results.push({
        usernameField: usernameField || null,
        passwordField: pwField,
        form: formEl || null,
      });
    }

    console.log(`[My-Vault] Detected ${results.length} login form(s).`);
    return results;
  }

  // Expose globally
  window.MyVaultFormDetector = { detectForms, isVisible };
})();
