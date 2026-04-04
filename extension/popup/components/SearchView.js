/**
 * SearchView.js
 * Manages the search input and real-time filtering.
 */

(function () {
  "use strict";

  window.SearchView = {
    /**
     * Initializes the search input.
     * @param {object} opts
     * @param {Function} opts.onSearch - Called with the current query string.
     */
    init(opts) {
      const input = document.getElementById("search-input");
      input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        if (opts.onSearch) opts.onSearch(query);
      });
    },

    clear() {
      document.getElementById("search-input").value = "";
    },

    show() {
      document.querySelector(".search-wrap").classList.remove("hidden");
    },

    hide() {
      document.querySelector(".search-wrap").classList.add("hidden");
    }
  };
})();
