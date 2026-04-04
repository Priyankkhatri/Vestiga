/**
 * service-worker.js
 * Main entry point for the extension.
 */

// Load services in the correct dependency order.
// Using absolute-style paths from the extension root for maximum reliability in MV3.
importScripts(
  "/services/storageService.js",
  "/services/cryptoService.js",
  "/services/apiClient.js",
  "/services/authService.js",
  "/services/vaultService.js",
  "/background/alarmManager.js",
  "/background/syncManager.js",
  "/background/messageHandler.js"
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Guard against uninitialized state
  if (typeof self.handleMessage !== 'function') {
    console.error("Background service worker handleMessage not found. Scripts may have failed to load.");
    sendResponse({ 
      success: false, 
      error: "Service worker not initialized. Please reload the extension." 
    });
    return true;
  }

  self.handleMessage(request)
    .then(res => {
      // Ensure we send a valid response object
      sendResponse(res || { success: true });
    })
    .catch(err => {
      console.error("Background message error:", err);
      sendResponse({ success: false, error: err.message });
    });
  
  // Return true to indicate we will send a response asynchronously
  return true;
});
