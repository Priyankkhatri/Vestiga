/**
 * messageHandler.js
 * Central router for messages from popup & content scripts.
 */

var handleMessage = async function(request) {
  try {
    if (!request || !request.type || !request.action) {
      throw new Error("Invalid request format");
    }

    const { type, action, payload } = request;

    if (type === "AUTH") {
      switch (action) {
        case "unlock":
          await self.authService.unlock(payload.password);
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: null };
          
        case "lock":
          self.authService.lock();
          return { success: true, data: null };
          
        case "status":
          const status = self.authService.isUnlocked();
          return { success: true, data: status };
          
        case "isInitialized":
          const initialized = await self.authService.isInitialized();
          return { success: true, data: initialized };
          
        case "setup":
          await self.authService.setMasterPassword(payload.password);
          return { success: true, data: null };
          
        default:
          throw new Error(`Unknown AUTH action: ${action}`);
      }
    }

    if (type === "VAULT") {
      switch (action) {
        case "getAll":
          const items = await self.vaultService.getAll();
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: items };

        case "add":
          const added = await self.vaultService.add(payload);
          self.alarmManager.startAutoLockTimer();
          self.syncManager.syncVault();
          return { success: true, data: added };

        case "update":
          const updated = await self.vaultService.update(payload.id, payload.data);
          self.alarmManager.startAutoLockTimer();
          self.syncManager.syncVault();
          return { success: true, data: updated };

        case "delete":
          await self.vaultService.remove(payload.id);
          self.alarmManager.startAutoLockTimer();
          self.syncManager.syncVault();
          return { success: true, data: null };

        default:
          throw new Error(`Unknown VAULT action: ${action}`);
      }
    }

    throw new Error(`Unknown message type: ${type}`);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Global export for background service worker
if (typeof self !== 'undefined') {
  self.handleMessage = handleMessage;
}
