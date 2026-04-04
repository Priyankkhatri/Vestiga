/**
 * authService.js
 * Manages vault lock/unlock state and master password verification.
 */

var activeKey = null; // Stored in memory only

var authService = {
  async setMasterPassword(password) {
    const cService = self.cryptoService;
    const sService = self.storageService;

    const derived = await cService.deriveKey(password);
    
    const rawKey = await self.crypto.subtle.exportKey("raw", derived.key);
    const keyHashBuffer = await self.crypto.subtle.digest("SHA-256", rawKey);
    const keyHash = cService.bufferToBase64(keyHashBuffer);

    await sService.set('vaultAuth', {
      salt: derived.salt,
      hash: keyHash
    });

    activeKey = derived.key;
  },

  async unlock(password) {
    const cService = self.cryptoService;
    const sService = self.storageService;

    const authData = await sService.get('vaultAuth');
    if (!authData || !authData.salt || !authData.hash) {
      throw new Error("No master password has been set.");
    }

    const derived = await cService.deriveKey(password, authData.salt);
    
    const rawKey = await self.crypto.subtle.exportKey("raw", derived.key);
    const keyHashBuffer = await self.crypto.subtle.digest("SHA-256", rawKey);
    const keyHash = cService.bufferToBase64(keyHashBuffer);

    if (keyHash !== authData.hash) {
      throw new Error("Incorrect master password.");
    }

    activeKey = derived.key;
  },

  lock() {
    activeKey = null;
  },

  isUnlocked() {
    return activeKey !== null;
  },

  /**
   * Checks if a master password has been set up.
   * @returns {Promise<boolean>}
   */
  async isInitialized() {
    const authData = await self.storageService.get('vaultAuth');
    return !!(authData && authData.hash && authData.salt);
  },

  getActiveKey() {
    return activeKey;
  }
};

if (typeof self !== 'undefined') {
  self.authService = authService;
}
