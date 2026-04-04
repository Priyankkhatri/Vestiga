/**
 * vaultService.js
 * Manages encrypted vault items (CRUD operations).
 */

var VAULT_STORAGE_KEY = 'vaultItems';

var vaultService = {
  _requireUnlock() {
    const aService = self.authService;
    if (!aService || !aService.isUnlocked()) {
      throw new Error("Vault is locked");
    }
    return aService.getActiveKey();
  },

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  async getAll() {
    const key = this._requireUnlock();
    const sService = self.storageService;
    const cService = self.cryptoService;

    const encryptedItems = await sService.get(VAULT_STORAGE_KEY);
    if (!encryptedItems || !Array.isArray(encryptedItems)) {
      return [];
    }

    const decryptedItems = [];
    for (const encryptedBase64 of encryptedItems) {
      try {
        const item = await cService.decrypt(encryptedBase64, key);
        decryptedItems.push(item);
      } catch (err) {
        console.error("Failed to decrypt an item.", err);
      }
    }
    return decryptedItems;
  },

  async getById(id) {
    const items = await this.getAll();
    return items.find(item => item.id === id) || null;
  },

  async add(item) {
    const key = this._requireUnlock();
    const sService = self.storageService;
    const cService = self.cryptoService;

    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: this._generateId(),
      createdAt: now,
      updatedAt: now
    };

    const encryptedBase64 = await cService.encrypt(newItem, key);

    const encryptedItems = await sService.get(VAULT_STORAGE_KEY) || [];
    const newItemsList = Array.isArray(encryptedItems) ? encryptedItems : [];
    
    newItemsList.push(encryptedBase64);
    await sService.set(VAULT_STORAGE_KEY, newItemsList);

    return newItem;
  },

  async update(id, updatedItem) {
    const key = this._requireUnlock();
    const sService = self.storageService;
    const cService = self.cryptoService;

    const encryptedItems = await sService.get(VAULT_STORAGE_KEY);
    if (!encryptedItems || !Array.isArray(encryptedItems)) {
      throw new Error("Vault is empty");
    }

    let found = false;
    let modifiedItem = null;
    const updatedEncryptedItems = [];
    
    for (const encryptedBase64 of encryptedItems) {
      try {
        const item = await cService.decrypt(encryptedBase64, key);
        if (item.id === id) {
          modifiedItem = {
            ...item,
            ...updatedItem,
            id: item.id,
            createdAt: item.createdAt,
            updatedAt: new Date().toISOString()
          };
          const newEncrypted = await cService.encrypt(modifiedItem, key);
          updatedEncryptedItems.push(newEncrypted);
          found = true;
        } else {
          updatedEncryptedItems.push(encryptedBase64);
        }
      } catch (err) {
        updatedEncryptedItems.push(encryptedBase64);
      }
    }

    if (!found) {
      throw new Error("Item not found");
    }

    await sService.set(VAULT_STORAGE_KEY, updatedEncryptedItems);
    return modifiedItem;
  },

  async remove(id) {
    const key = this._requireUnlock();
    const sService = self.storageService;
    const cService = self.cryptoService;

    const encryptedItems = await sService.get(VAULT_STORAGE_KEY);
    if (!encryptedItems || !Array.isArray(encryptedItems)) {
      return;
    }

    const updatedEncryptedItems = [];
    
    for (const encryptedBase64 of encryptedItems) {
      try {
        const item = await cService.decrypt(encryptedBase64, key);
        if (item.id !== id) {
          updatedEncryptedItems.push(encryptedBase64);
        }
      } catch (err) {
        updatedEncryptedItems.push(encryptedBase64);
      }
    }

    await sService.set(VAULT_STORAGE_KEY, updatedEncryptedItems);
  }
};

if (typeof self !== 'undefined') {
  self.vaultService = vaultService;
}
