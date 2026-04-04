/**
 * ItemCard.js
 * Creates a single vault item card DOM element.
 * Includes copy username, copy password, and autofill actions.
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  /**
   * Creates an item card element.
   * @param {object} item - Vault item { id, title, username, password, url, ... }
   * @param {object} opts
   * @param {Function} opts.onCopyUsername
   * @param {Function} opts.onCopyPassword
   * @param {Function} opts.onAutofill
   * @returns {HTMLElement}
   */
  window.ItemCard = {
    create(item, opts = {}) {
      const card = document.createElement("div");
      card.className = "item-card";
      card.dataset.id = item.id;

      const initial = (item.title || item.username || "?").charAt(0).toUpperCase();

      card.innerHTML = `
        <div class="item-avatar">${escapeHtml(initial)}</div>
        <div class="item-info">
          <div class="item-title">${escapeHtml(item.title || "Untitled")}</div>
          <div class="item-username">
            ${escapeHtml(item.username || "")}
            ${item.isSuggested ? '<span class="suggested-badge">Suggested</span>' : ''}
          </div>
        </div>
        <div class="item-actions">
          <button class="action-btn autofill-btn" data-action="autofill" title="Autofill on page">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </button>
          <button class="action-btn" data-action="copy-user" title="Copy username">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button class="action-btn" data-action="copy-pass" title="Copy password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      `;

      // Autofill button
      card.querySelector('[data-action="autofill"]').addEventListener("click", (e) => {
        e.stopPropagation();
        if (opts.onAutofill) opts.onAutofill(item);
      });

      // Copy username
      card.querySelector('[data-action="copy-user"]').addEventListener("click", (e) => {
        e.stopPropagation();
        if (opts.onCopyUsername) opts.onCopyUsername(item.username || "");
      });

      // Copy password
      card.querySelector('[data-action="copy-pass"]').addEventListener("click", (e) => {
        e.stopPropagation();
        if (opts.onCopyPassword) opts.onCopyPassword(item.password || "");
      });

      // Click on the card itself also triggers autofill
      card.addEventListener("click", () => {
        if (opts.onAutofill) opts.onAutofill(item);
      });

      return card;
    }
  };
})();
