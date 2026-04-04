/**
 * autofillEngine.js
 * Fills credentials into detected login form fields.
 * Dispatches native-like events so frameworks (React, Angular, Vue) pick up the changes.
 * Exposes window.MyVaultAutofill
 */

(function () {
  "use strict";

  /**
   * Sets the value on an input element and dispatches the events browsers/frameworks expect.
   * @param {HTMLInputElement} element
   * @param {string} value
   */
  function setNativeValue(element, value) {
    // Use the native setter so React's synthetic event system picks it up
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Dispatch events in order that mimics real user interaction
    element.dispatchEvent(new Event("focus", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  /**
   * Fills credentials into a detected form.
   * @param {{ username: string, password: string }} credentials
   * @param {{ usernameField: HTMLInputElement|null, passwordField: HTMLInputElement }} formDescriptor
   */
  function fill(credentials, formDescriptor) {
    if (!credentials || !formDescriptor) {
      console.warn("[My-Vault] fill() called with missing arguments.");
      return;
    }

    const { usernameField, passwordField } = formDescriptor;

    if (usernameField && credentials.username) {
      setNativeValue(usernameField, credentials.username);
      console.log("[My-Vault] Username filled.");
    }

    if (passwordField && credentials.password) {
      setNativeValue(passwordField, credentials.password);
      console.log("[My-Vault] Password filled.");
    }
  }

  // Expose globally
  window.MyVaultAutofill = { fill, setNativeValue };
})();
