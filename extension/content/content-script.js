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
  const WEBAPP_SOURCE = "vestiga-webapp";
  const EXTENSION_SOURCE = "vestiga-extension";
  const WEBAPP_AUTH_REQUEST = "VESTIGA_AUTH_SESSION_REQUEST";
  const WEBAPP_AUTH_RESPONSE = "VESTIGA_AUTH_SESSION_RESPONSE";
  const WEBAPP_AUTH_CHANGED = "VESTIGA_AUTH_SESSION_CHANGED";

  function isSessionPayload(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      typeof value.access_token === "string" &&
      typeof value.refresh_token === "string" &&
      typeof value.expires_at === "number" &&
      value.user &&
      typeof value.user.id === "string"
    );
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      });
    });
  }

  function createRequestId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function requestSessionFromWebApp() {
    if (!/^https?:$/.test(window.location.protocol)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const requestId = createRequestId();
      let settled = false;

      const cleanup = () => {
        settled = true;
        clearTimeout(timeoutId);
        window.removeEventListener("message", handleMessage);
      };

      const finish = (session) => {
        if (settled) return;
        cleanup();
        resolve(session);
      };

      const handleMessage = (event) => {
        if (event.source !== window) return;

        const data = event.data;
        if (
          !data ||
          data.source !== WEBAPP_SOURCE ||
          data.type !== WEBAPP_AUTH_RESPONSE ||
          data.requestId !== requestId
        ) {
          return;
        }

        finish(isSessionPayload(data.session) ? data.session : null);
      };

      const timeoutId = setTimeout(() => finish(null), 1500);

      window.addEventListener("message", handleMessage);
      window.postMessage(
        {
          source: EXTENSION_SOURCE,
          type: WEBAPP_AUTH_REQUEST,
          requestId
        },
        window.location.origin
      );
    });
  }

  async function importWebAppSession(session) {
    if (!isSessionPayload(session)) {
      return { success: false, error: "Invalid session payload" };
    }

    return sendRuntimeMessage({
      type: "AUTH",
      action: "importSession",
      payload: { session }
    });
  }

  async function clearExtensionSession() {
    return sendRuntimeMessage({
      type: "AUTH",
      action: "signOut"
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const data = event.data;
    if (
      !data ||
      data.source !== WEBAPP_SOURCE ||
      data.type !== WEBAPP_AUTH_CHANGED
    ) {
      return;
    }

    if (isSessionPayload(data.session)) {
      importWebAppSession(data.session).catch((error) => {
        console.warn("[Vestiga] Failed to import web app session:", error);
      });
      return;
    }

    if (data.session === null) {
      clearExtensionSession().catch((error) => {
        console.warn("[Vestiga] Failed to clear extension session:", error);
      });
    }
  });

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

      // Inject inline icon into the specified field
      const injectIcon = (inputEl) => {
        if (!inputEl || inputEl.dataset.vestigaIconAttached) return;
        inputEl.dataset.vestigaIconAttached = "true";

        const iconContainer = document.createElement('div');
        iconContainer.style.position = 'fixed';
        iconContainer.style.cursor = 'pointer';
        iconContainer.style.zIndex = '2147483646';
        iconContainer.style.width = '18px';
        iconContainer.style.height = '18px';
        // Ensure chrome.runtime.getURL can resolve the icon
        iconContainer.style.backgroundImage = `url(${chrome.runtime.getURL('assets/icon32.png')})`;
        iconContainer.style.backgroundSize = 'contain';
        iconContainer.style.backgroundRepeat = 'no-repeat';
        iconContainer.style.backgroundPosition = 'center';
        iconContainer.style.opacity = '0.7';
        iconContainer.style.transition = 'opacity 0.2s';
        
        iconContainer.addEventListener('mouseenter', () => iconContainer.style.opacity = '1');
        iconContainer.addEventListener('mouseleave', () => iconContainer.style.opacity = '0.7');

        const updatePosition = () => {
          const rect = inputEl.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(inputEl).visibility === 'hidden') {
            iconContainer.style.display = 'none';
          } else {
            iconContainer.style.display = 'block';
            iconContainer.style.top = `${rect.top + (rect.height - 18) / 2}px`;
            iconContainer.style.left = `${rect.right - 28}px`; // 10px padding from right
          }
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition, true);

        document.body.appendChild(iconContainer);

        iconContainer.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.MyVaultDropdown.show(inputEl, formDescriptor);
        });

        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            iconContainer.style.opacity = entry.isIntersecting ? '0.7' : '0';
            iconContainer.style.pointerEvents = entry.isIntersecting ? 'auto' : 'none';
          });
        });
        io.observe(inputEl);
      };

      if (usernameField) injectIcon(usernameField);
      injectIcon(passwordField);

      // Attach save-on-submit listener
      window.MyVaultSavePrompt.attachSubmitListener(formDescriptor);


    }
  }

  // --- Listen for AUTOFILL_CREDENTIALS from popup → background → here ---
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "AUTH_SYNC_REQUEST") {
      requestSessionFromWebApp()
        .then((session) => {
          if (!session) {
            sendResponse({ success: false, error: "No web app session found" });
            return null;
          }

          return importWebAppSession(session).then((result) => {
            sendResponse(result);
            return null;
          });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message || "Session sync failed" });
        });

      return true;
    }

    if (message && message.type === "AUTOFILL_CREDENTIALS" && message.credentials) {
      const credentials = message.credentials;
      const detectedForms = window.MyVaultFormDetector.detectForms();

      if (detectedForms.length > 0) {
        window.MyVaultAutofill.fill(credentials, detectedForms[0]);
        sendResponse({ success: true });
      } else {
        console.warn("[Vestiga] No login forms detected on this page.");
        sendResponse({ success: false, error: "No login forms found" });
      }

      return true;
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
