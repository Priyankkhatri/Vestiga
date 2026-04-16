/**
 * formDetector.js
 * Detects login/registration forms on web pages.
 * Exposes window.MyVaultFormDetector
 */

(function () {
  "use strict";

  const USERNAME_SELECTORS = [
    'input[type="email"]',
    'input[type="text"][name*="user" i]',
    'input[type="text"][name*="login" i]',
    'input[type="text"][name*="email" i]',
    'input[type="text"][autocomplete="username"]',
    'input[type="text"][autocomplete="email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[name="username" i]',
    'input[name="email" i]',
    'input[name="login" i]',
    'input[name="user" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[id*="login" i]',
    'input[placeholder*="email" i]',
    'input[placeholder*="username" i]',
    'input[placeholder*="user" i]',
  ];

  const FIELD_TEXT_TYPES = new Set(["", "text", "email", "tel", "number", "search"]);

  function getFieldText(el) {
    return [
      el.name,
      el.id,
      el.getAttribute("autocomplete"),
      el.getAttribute("aria-label"),
      el.getAttribute("placeholder"),
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isUsableInput(el) {
    if (!el || el.tagName !== "INPUT") return false;
    if (el.disabled || el.readOnly) return false;
    return isVisible(el);
  }

  function isUsernameCandidate(el) {
    if (!isUsableInput(el)) return false;
    const type = (el.type || "text").toLowerCase();
    if (!FIELD_TEXT_TYPES.has(type)) return false;

    const text = getFieldText(el);
    if (/\b(otp|2fa|mfa|code|captcha|search|coupon|promo)\b/.test(text)) {
      return false;
    }

    return true;
  }

  function getDomDistance(a, b) {
    const all = Array.from(document.querySelectorAll("input"));
    const ai = all.indexOf(a);
    const bi = all.indexOf(b);
    if (ai === -1 || bi === -1) return Number.MAX_SAFE_INTEGER;
    return Math.abs(bi - ai);
  }

  function scoreUsernameCandidate(candidate, passwordField) {
    const text = getFieldText(candidate);
    let score = 0;

    if (candidate.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) {
      score += 30;
    }
    if (candidate.form && candidate.form === passwordField.form) {
      score += 20;
    }
    if (candidate.type === "email") score += 12;
    if (/\b(email|username|user|login|account)\b/.test(text)) score += 18;

    score -= Math.min(getDomDistance(candidate, passwordField), 20);
    return score;
  }

  /**
   * Finds the closest username/email field relative to a password field.
   * @param {HTMLElement} passwordField
   * @param {HTMLElement|null} formEl - The parent form, if any.
   * @returns {HTMLInputElement|null}
   */
  function findUsernameField(passwordField, formEl) {
    const scope = formEl || passwordField.closest("form, div, section, main, body") || document;
    const candidates = new Set();

    for (const selector of USERNAME_SELECTORS) {
      scope.querySelectorAll(selector).forEach((input) => {
        if (input !== passwordField && isUsernameCandidate(input)) {
          candidates.add(input);
        }
      });
    }

    scope.querySelectorAll("input").forEach((input) => {
      if (input !== passwordField && isUsernameCandidate(input)) {
        candidates.add(input);
      }
    });

    return Array.from(candidates).sort((a, b) => (
      scoreUsernameCandidate(b, passwordField) - scoreUsernameCandidate(a, passwordField)
    ))[0] || null;
  }

  /**
   * Checks if an element is visible on screen.
   */
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function isPasswordCandidate(el) {
    if (!isUsableInput(el)) return false;
    const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
    return autocomplete !== "one-time-code";
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
    const seenForms = new Set();

    for (const pwField of passwordFields) {
      if (seen.has(pwField) || !isPasswordCandidate(pwField)) continue;
      seen.add(pwField);

      const formEl = pwField.closest("form");
      if (formEl && seenForms.has(formEl)) continue;
      if (formEl) seenForms.add(formEl);
      const usernameField = findUsernameField(pwField, formEl);

      results.push({
        usernameField: usernameField || null,
        passwordField: pwField,
        form: formEl || null,
      });
    }


    return results;
  }

  // Expose globally
  window.MyVaultFormDetector = { detectForms, isVisible };
})();
