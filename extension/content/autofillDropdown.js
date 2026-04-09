/**
 * autofillDropdown.js
 * Shows a credential suggestion dropdown near focused login inputs.
 * Uses Shadow DOM to isolate styles from the host page.
 * Exposes window.MyVaultDropdown
 */

(function () {
  "use strict";

  function brandIconHtml() {
    return `<img class="mv-brand-icon" src="${chrome.runtime.getURL("assets/icon48.png")}" alt="" />`;
  }

  let activeHost = null;    // The container element currently in the DOM
  let activeShadow = null;  // Its shadow root
  let activeInput = null;   // The input the dropdown is attached to

  /**
   * Injects the CSS into a shadow root.
   */
  function injectStyles(shadow) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("content/autofill-ui.css");
    shadow.appendChild(link);
  }

  /**
   * Positions the dropdown below the target input.
   */
  function positionDropdown(container, input) {
    const rect = input.getBoundingClientRect();
    container.style.position = "fixed";
    container.style.top = `${rect.bottom + 4}px`;
    container.style.left = `${rect.left}px`;
    container.style.zIndex = "2147483647";
  }

  /**
   * Renders the dropdown content (list of credentials or empty state).
   * @param {Array} credentials - Array of vault items
   * @param {{ usernameField, passwordField }} formDescriptor
   */
  function renderDropdown(shadow, credentials, formDescriptor) {
    // Clear previous dropdown content (keep styles)
    const existing = shadow.querySelector(".mv-dropdown");
    if (existing) existing.remove();

    const dropdown = document.createElement("div");
    dropdown.className = "mv-dropdown";

    // Header
    const header = document.createElement("div");
    header.className = "mv-dropdown-header";
    header.innerHTML = `${brandIconHtml()} <span>Vestiga Autofill</span>`;
    dropdown.appendChild(header);

    if (!credentials || credentials.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mv-dropdown-empty";
      empty.textContent = "No saved credentials for this site.";
      dropdown.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "mv-dropdown-list";

      credentials.forEach((cred) => {
        const item = document.createElement("button");
        item.className = "mv-dropdown-item";

        const initial = (cred.title || cred.username || "?").charAt(0).toUpperCase();

        item.innerHTML = `
          <div class="mv-dropdown-item-icon">${initial}</div>
          <div class="mv-dropdown-item-info">
            <div class="mv-dropdown-item-title">${escapeHtml(cred.title || cred.username || "Untitled")}</div>
            <div class="mv-dropdown-item-sub">${escapeHtml(cred.username || "")}</div>
          </div>
        `;

        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.MyVaultAutofill.fill(
            { username: cred.username, password: cred.password },
            formDescriptor
          );
          hide();
        });

        list.appendChild(item);
      });

      dropdown.appendChild(list);
    }

    shadow.appendChild(dropdown);
  }

  /**
   * Shows the dropdown for a given input and form descriptor.
   * @param {HTMLInputElement} input
   * @param {{ usernameField, passwordField, form }} formDescriptor
   */
  function show(input, formDescriptor) {
    // If already showing for the same input, skip
    if (activeInput === input && activeHost) return;

    hide(); // close any previous dropdown

    activeInput = input;

    // Create a host element and attach shadow DOM
    activeHost = document.createElement("div");
    activeHost.id = "my-vault-dropdown-host";
    activeShadow = activeHost.attachShadow({ mode: "closed" });

    injectStyles(activeShadow);
    positionDropdown(activeHost, input);
    document.body.appendChild(activeHost);

    // Fetch credentials from the background
    chrome.runtime.sendMessage(
      { type: "VAULT", action: "getAll" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[Vestiga] Could not fetch credentials:", chrome.runtime.lastError.message);
          renderDropdown(activeShadow, [], formDescriptor);
          return;
        }

        let credentials = [];
        if (response && response.success && Array.isArray(response.data)) {
          // Filter by current domain if items have a url/domain field
          const currentHost = window.location.hostname;
          credentials = response.data.filter((item) => {
            if (item.url) {
              try {
                return new URL(item.url).hostname === currentHost;
              } catch (_) {
                return item.url.includes(currentHost);
              }
            }
            // If no URL stored, show all items
            return true;
          });
        }

        renderDropdown(activeShadow, credentials, formDescriptor);
      }
    );
  }

  /**
   * Removes the dropdown from the DOM.
   */
  function hide() {
    if (activeHost && activeHost.parentNode) {
      activeHost.parentNode.removeChild(activeHost);
    }
    activeHost = null;
    activeShadow = null;
    activeInput = null;
  }

  /**
   * Basic HTML escape to prevent injection.
   */
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Close dropdown when clicking outside
  document.addEventListener("mousedown", (e) => {
    if (activeHost && !activeHost.contains(e.target) && e.target !== activeInput) {
      hide();
    }
  }, true);

  // Reposition on scroll/resize
  function reposition() {
    if (activeHost && activeInput) {
      positionDropdown(activeHost, activeInput);
    }
  }
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition, true);

  // Expose globally
  window.MyVaultDropdown = { show, hide };
})();
