/**
 * SettingsBar.js
 * Top bar with lock and dashboard actions.
 */

(function () {
  "use strict";

  window.SettingsBar = {
    /**
     * Initializes settings bar buttons.
     * @param {object} opts
     * @param {Function} opts.onLock
     * @param {Function} opts.onDashboard
     */
    init(opts) {
      document.getElementById("btn-lock").addEventListener("click", () => {
        if (opts.onLock) opts.onLock();
      });

      document.getElementById("btn-dashboard").addEventListener("click", () => {
        if (opts.onDashboard) opts.onDashboard();
      });
    },

    show() {
      document.getElementById("settings-bar").classList.remove("hidden");
    },

    hide() {
      document.getElementById("settings-bar").classList.add("hidden");
    }
  };
})();
