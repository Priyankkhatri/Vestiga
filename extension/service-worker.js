/**
 * service-worker.js
 * Main entry point for the extension background.
 */

// Load services in dependency order.
try {
  importScripts(
    "config.js",
    "services/storageService.js",
    "services/supabaseClient.js",
    "services/cryptoService.js",
    "services/authService.js",
    "services/vaultService.js",
    "background/alarmManager.js",
    "background/syncManager.js",
    "background/messageHandler.js"
  );

} catch (e) {
  console.error("Vestiga Service Worker: Script loading failed:", e);
}

chrome.runtime.onInstalled.addListener(() => {

});

// Robust message listener with retry support and initialization check
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Defensive check: Is the background script ready?
  if (typeof handleMessage !== "function") {
    console.error("[ServiceWorker] handleMessage not found. Dependencies may have failed to load.");
    sendResponse({
      success: false,
      error: "Background service worker not initialized. Please reload the extension."
    });
    return false;
  }

  // Execution with error boundary
  const executeHandler = async (retryCount = 0) => {
    try {
      const result = await handleMessage(request);
      sendResponse(result || { success: true });
    } catch (error) {
      if (retryCount < 2) {
        console.warn(`[ServiceWorker] Handler failed, retrying (${retryCount + 1})...`, error);
        setTimeout(() => executeHandler(retryCount + 1), 100);
      } else {
        console.error("[ServiceWorker] Handler failed after retries:", error);
        sendResponse({ success: false, error: error.message || "Background execution failed" });
      }
    }
  };

  executeHandler();
  return true; // Keep channel open for async response
});
