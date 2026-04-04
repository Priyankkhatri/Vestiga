/**
 * storageService.js
 * Handles all storage operations using chrome.storage.local
 */

var storageService = {
  async get(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (typeof key === 'string') {
          resolve(result[key]);
        } else {
          resolve(result);
        }
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve, reject) => {
      let data = {};
      if (typeof key === 'object' && key !== null) {
        data = key;
      } else if (typeof key === 'string') {
        data[key] = value;
      } else {
        return reject(new Error('Invalid key type for storageService.set'));
      }

      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
  },

  async remove(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
  },

  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve();
      });
    });
  }
};

// Global assignment for importScripts compatibility
if (typeof self !== 'undefined') {
  self.storageService = storageService;
}
