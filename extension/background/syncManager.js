/**
 * syncManager.js
 */

var syncManager = {
  syncVault() {
    console.log("Sync triggered");
  }
};

if (typeof self !== 'undefined') {
  self.syncManager = syncManager;
}
