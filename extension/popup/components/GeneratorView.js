/**
 * GeneratorView.js
 * Password generator UI (placeholder for future feature).
 */

(function () {
  "use strict";

  window.GeneratorView = {
    /**
     * Generates a random password.
     * @param {number} length
     * @param {object} opts
     * @param {boolean} opts.uppercase
     * @param {boolean} opts.lowercase
     * @param {boolean} opts.numbers
     * @param {boolean} opts.symbols
     * @returns {string}
     */
    generate(length = 16, opts = {}) {
      const upper  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower  = "abcdefghijklmnopqrstuvwxyz";
      const nums   = "0123456789";
      const syms   = "!@#$%^&*()_+-=[]{}|;:,.<>?";

      let chars = "";
      if (opts.uppercase !== false) chars += upper;
      if (opts.lowercase !== false) chars += lower;
      if (opts.numbers   !== false) chars += nums;
      if (opts.symbols   !== false) chars += syms;

      if (!chars) chars = lower + nums;

      const array = new Uint32Array(length);
      crypto.getRandomValues(array);

      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
      return result;
    }
  };
})();
