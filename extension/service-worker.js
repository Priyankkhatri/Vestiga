/**
 * service-worker.js
 * Main entry point for the extension.
 */

// Load services in the correct dependency order.
// Using relative paths from the perspective of the root.
try {
  importScripts(
    "services/storageService.js",
    "services/cryptoService.js",
    "services/apiClient.js",
    "services/authService.js",
    "services/vaultService.js",
    "background/alarmManager.js",
    "background/syncManager.js",
    "background/messageHandler.js"
  );
  console.log("My-Vault Service Worker: Scripts loaded successfully.");
} catch (e) {
  console.error("My-Vault Service Worker: Script loading failed:", e);
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("My-Vault Extension Installed");
});

// Robust message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Background] Received message:", request.type, request.action);

  // Check if handleMessage is available
  if (typeof handleMessage !== 'function') {
    sendResponse({ 
      success: false, 
      error: "Background service worker not initialized properly. Please refresh the extension." 
    });
    return false; // No async response if we fail early
  }

  // Wrap everything in a try-catch to ensure we ALWAYS call sendResponse
  try {
    handleMessage(request)
      .then(result => {
        console.log("[Background] Message handled successfully:", request.action);
        sendResponse(result || { success: true });
      })
      .catch(error => {
        console.error("[Background] Handler error:", error);
        sendResponse({ success: false, error: error.message || "Unknown error" });
      });
  } catch (error) {
    console.error("[Background] Synchronous error in listener:", error);
    sendResponse({ success: false, error: error.message || "Synchronous background error" });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});
