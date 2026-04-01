// The Vault — Background Service Worker (stub)
// Handles extension lifecycle events and message passing

chrome.runtime.onInstalled.addListener(() => {
  console.log('[The Vault] Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VAULT_STATUS') {
    sendResponse({ locked: true });
  }
  return true;
});
