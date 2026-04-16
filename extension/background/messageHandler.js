/**
 * messageHandler.js
 * Central router for messages from popup & content scripts.
 * Handles AUTH, MASTER_KEY, VAULT, and AUTOFILL message types.
 */

var _failedAttempts = 0;
var _lockoutTime = 0;
var PENDING_VAULT_ADD_KEY = "vestiga_pending_vault_add";

function sendTabMessage(tabId, message) {
  return new Promise(function (resolve, reject) {
    chrome.tabs.sendMessage(tabId, message, function (response) {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(response);
    });
  });
}
function queryTabs(queryInfo) {
  return new Promise(function (resolve) {
    chrome.tabs.query(queryInfo, resolve);
  });
}

function storageSessionGet(key) {
  return new Promise(function (resolve, reject) {
    var area = chrome.storage && chrome.storage.session ? chrome.storage.session : chrome.storage.local;
    area.get(key, function (result) {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(result ? result[key] : null);
    });
  });
}

function storageSessionSet(key, value) {
  return new Promise(function (resolve, reject) {
    var area = chrome.storage && chrome.storage.session ? chrome.storage.session : chrome.storage.local;
    var data = {};
    data[key] = value;
    area.set(data, function () {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

function storageSessionRemove(key) {
  return new Promise(function (resolve, reject) {
    var area = chrome.storage && chrome.storage.session ? chrome.storage.session : chrome.storage.local;
    area.remove(key, function () {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

function sanitizePendingVaultItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    type: item.type || "password",
    title: typeof item.title === "string" ? item.title.slice(0, 255) : "Saved login",
    username: typeof item.username === "string" ? item.username : "",
    password: typeof item.password === "string" ? item.password : "",
    url: typeof item.url === "string" ? item.url : "",
    website: typeof item.website === "string" ? item.website : "",
    favorite: Boolean(item.favorite),
    tags: Array.isArray(item.tags) ? item.tags.slice(0, 20) : [],
    notes: typeof item.notes === "string" ? item.notes : ""
  };
}

async function storePendingVaultAdd(item) {
  var sanitized = sanitizePendingVaultItem(item);
  if (!sanitized || !sanitized.password) {
    return { success: false, error: "Nothing to save." };
  }

  await storageSessionSet(PENDING_VAULT_ADD_KEY, {
    item: sanitized,
    createdAt: Date.now()
  });

  return { success: true };
}

async function getPendingVaultAdd() {
  var pending = await storageSessionGet(PENDING_VAULT_ADD_KEY);
  if (!pending || !pending.item) return null;

  // Expire unsaved captured credentials after 10 minutes.
  if (!pending.createdAt || Date.now() - pending.createdAt > 10 * 60 * 1000) {
    await storageSessionRemove(PENDING_VAULT_ADD_KEY);
    return null;
  }

  return pending;
}

async function openExtensionUnlockTab() {
  var url = chrome.runtime.getURL("popup/index.html?pendingSave=1");
  await chrome.tabs.create({ url: url, active: true });
}

function getConfiguredWebAppOrigin() {
  var fallbackUrl = "https://vestiga.vercel.app"; 
  var rawUrl = fallbackUrl;

  if (typeof CONFIG !== "undefined") {
    if (typeof CONFIG.APP_URL === "string" && CONFIG.APP_URL) {
      rawUrl = CONFIG.APP_URL;
    } else if (typeof CONFIG.API_URL === "string" && CONFIG.API_URL) {
      try {
        var derived = new URL(CONFIG.API_URL);
        if (derived.pathname.indexOf("/api") === 0) {
          derived.pathname = derived.pathname.replace(/^\/api\/?/, "/");
        }
        if (
          (derived.hostname === "localhost" || derived.hostname === "127.0.0.1")
          && derived.port === "3001"
        ) {
          derived.port = "5173";
        }
        rawUrl = derived.toString();
      } catch (_) {
        rawUrl = fallbackUrl;
      }
    }
  }

  try {
    return new URL(rawUrl).origin;
  } catch (_) {
    return new URL(fallbackUrl).origin;
  }
}

function isVestigaWebAppTab(tabUrl) {
  if (!tabUrl || !/^https?:/i.test(tabUrl)) {
    return false;
  }

  try {
    return new URL(tabUrl).origin === getConfiguredWebAppOrigin();
  } catch (_) {
    return false;
  }
}

async function syncSessionFromTabs() {
  var tabs = await queryTabs({});

  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (!tab || !tab.id || !isVestigaWebAppTab(tab.url)) {
      continue;
    }

    try {
      var result = await sendTabMessage(tab.id, { type: "AUTH_SYNC_REQUEST" });
      if (result && result.success && result.data) {
        return result;
      }
    } catch (_) {
      // Ignore tabs without the content script or without a web app session.
    }
  }

  return { success: false, error: "No signed-in Vestiga web app tab found" };
}

async function getUnlockedVaultFromActiveTab(expectedUserId) {
  var tabs = await queryTabs({ active: true, currentWindow: true });
  var activeTab = tabs && tabs[0];
  if (!activeTab || !activeTab.id || !isVestigaWebAppTab(activeTab.url)) {
    return { success: false, error: "Active tab is not the Vestiga web app" };
  }

  try {
    var result = await sendTabMessage(activeTab.id, { type: "WEBAPP_VAULT_REQUEST" });
    if (
      result &&
      result.success &&
      result.data &&
      result.data.userId === expectedUserId &&
      Array.isArray(result.data.items)
    ) {
      return result;
    }
  } catch (_) {
    // Ignore tabs that do not expose the unlocked vault bridge.
  }

  return { success: false, error: "No unlocked Vestiga web app tab found" };
}

async function findVestigaWebAppTab() {
  var tabs = await queryTabs({});
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (!tab || !tab.id || !isVestigaWebAppTab(tab.url)) continue;
    return tab;
  }
  return null;
}

async function addVaultItemViaWebApp(item) {
  var tab = await findVestigaWebAppTab();
  if (!tab || !tab.id) {
    return { success: false, error: "Open Vestiga web app and unlock your vault, then try again." };
  }

  try {
    var res = await sendTabMessage(tab.id, { type: "WEBAPP_VAULT_ADD", payload: item });
    return res && typeof res.success === "boolean" ? res : { success: false, error: "Web app did not respond" };
  } catch (err) {
    return { success: false, error: err.message || "Failed to reach Vestiga web app tab" };
  }
}

var handleMessage = async function (request) {
  try {
    if (!request || !request.type || !request.action) {
      throw new Error("Invalid request format");
    }

    var type = request.type;
    var action = request.action;
    var payload = request.payload;

    // ─── AUTH ───
    if (type === "AUTH") {
      switch (action) {
        case "signIn": {
          var result = await self.authService.signIn(payload.email, payload.password);
          if (result.success) {
            self.alarmManager.startAutoLockTimer();
          }
          return result.success
            ? { success: true, data: result.user }
            : { success: false, error: result.error };
        }

        case "signOut": {
          await self.authService.signOut();
          return { success: true, data: null };
        }

        case "importSession": {
          var imported = await self.authService.importSession(payload && payload.session);
          if (imported.success) {
            self.alarmManager.startAutoLockTimer();
          }
          return imported.success
            ? { success: true, data: imported.user }
            : { success: false, error: imported.error };
        }

        case "getSession": {
          var session = await self.authService.getSession();
          if (session) {
            return { success: true, data: { user: session.user } };
          }
          return { success: false, error: "No active session" };
        }

        case "syncFromTabs":
          return await syncSessionFromTabs();

        default:
          throw new Error("Unknown AUTH action: " + action);
      }
    }

    // ─── MASTER_KEY ───
    if (type === "MASTER_KEY") {
      switch (action) {
        case "status": {
          // Check if master key is set in memory + if user has set up encryption
          var isSet = self.authService.isMasterKeySet();
          if (isSet) {
            return {
              success: true,
              data: { isSet: true, needsSetup: false, source: "extension" }
            };
          }

          // Check if user has encryption meta in Supabase
          var sesh = await self.authService.getSession();
          if (!sesh) {
            return { success: false, error: "Not authenticated" };
          }

          var bridgedVault = await getUnlockedVaultFromActiveTab(sesh.user.id);
          if (bridgedVault.success && bridgedVault.data) {
            return {
              success: true,
              data: {
                isSet: false,
                needsSetup: false,
                source: "webapp",
                items: bridgedVault.data.items,
                isLoading: Boolean(bridgedVault.data.isLoading)
              }
            };
          }

          var metaPath = "/rest/v1/user_encryption_meta"
            + "?user_id=eq." + sesh.user.id
            + "&select=salt,key_check";
          var metaResult = await self.supabaseRequest("GET", metaPath, null, sesh.access_token);

          var hasSetup = metaResult.data && metaResult.data.length > 0;
          return {
            success: true,
            data: {
              isSet: false,
              needsSetup: !hasSetup,
              source: hasSetup ? "locked" : "setup"
            }
          };
        }

        case "setup": {
          // First-time master password setup
          var setupSession = await self.authService.getSession();
          if (!setupSession) return { success: false, error: "Not authenticated" };

          var salt = self.cryptoService.generateSalt();
          var key = await self.cryptoService.deriveKey(payload.password, salt);
          var keyCheck = await self.cryptoService.generateKeyCheck(key);

          // Store salt + key_check in Supabase
          var insertResult = await self.supabaseRequest(
            "POST",
            "/rest/v1/user_encryption_meta",
            {
              user_id: setupSession.user.id,
              salt: salt,
              key_check: keyCheck,
            },
            setupSession.access_token
          );

          if (insertResult.error) {
            return { success: false, error: insertResult.error };
          }

          // Store key in memory
          self.authService.setMasterKey(key);
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: null };
        }

        case "unlock": {
          // Brute-force protection
          if (_lockoutTime && Date.now() < _lockoutTime) {
            var remain = Math.ceil((_lockoutTime - Date.now()) / 1000);
            return { success: false, error: "Too many failed attempts. Try again in " + remain + "s." };
          }

          // Unlock with existing master password
          var unlockSession = await self.authService.getSession();
          if (!unlockSession) return { success: false, error: "Not authenticated" };

          // Fetch salt + key_check
          var fetchPath = "/rest/v1/user_encryption_meta"
            + "?user_id=eq." + unlockSession.user.id
            + "&select=salt,key_check";
          var fetchResult = await self.supabaseRequest(
            "GET", fetchPath, null, unlockSession.access_token
          );

          if (!fetchResult.data || fetchResult.data.length === 0) {
            return { success: false, error: "No encryption setup found." };
          }

          var meta = fetchResult.data[0];
          var derivedKey = await self.cryptoService.deriveKey(payload.password, meta.salt);
          var isValid = await self.cryptoService.verifyKeyCheck(derivedKey, meta.key_check);

          if (!isValid) {
            _failedAttempts++;
            if (_failedAttempts >= 3) {
              _lockoutTime = Date.now() + 60000;
              return { success: false, error: "Too many failed attempts. Locked for 60s." };
            }
            return { success: false, error: "Incorrect master password. " + (3 - _failedAttempts) + " attempts left." };
          }

          _failedAttempts = 0;
          _lockoutTime = 0;
          self.authService.setMasterKey(derivedKey);
          self.alarmManager.startSyncTimer();
          self.syncManager.syncVault(); // Initial sync
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: null };
        }

        case "lock": {
          self.authService.clearMasterKey();
          return { success: true, data: null };
        }

        default:
          throw new Error("Unknown MASTER_KEY action: " + action);
      }
    }

    // ─── VAULT ───
    if (type === "VAULT") {
      switch (action) {
        case "getAll": {
          var vaultSession = await self.authService.getSession();
          if (!vaultSession) {
            return { success: false, error: "Not authenticated. Please sign in." };
          }

          if (!self.authService.isMasterKeySet()) {
            return { success: false, error: "Vault is locked. Open the extension and unlock with your master password." };
          }

          var items = await self.syncManager.getVault();
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: items };
        }

        case "add": {
          var vaultSessionAdd = await self.authService.getSession();
          if (!vaultSessionAdd) {
            var syncedSession = await syncSessionFromTabs();
            if (syncedSession && syncedSession.success) {
              vaultSessionAdd = await self.authService.getSession();
            }
          }

          // If the extension vault is unlocked, save directly.
          if (vaultSessionAdd && self.authService.isMasterKeySet()) {
            var added = await self.vaultService.add(payload);
            await self.syncManager.syncVault(); // Update cache
            self.alarmManager.startAutoLockTimer();
            return { success: true, data: added };
          }

          // If the extension is authenticated but locked, queue this save.
          // The content prompt will ask for the master password and flush it.
          if (vaultSessionAdd) {
            var queued = await storePendingVaultAdd(payload);
            if (!queued.success) {
              return queued;
            }

            return {
              success: false,
              pending: true,
              error: "Enter your Vestiga master password to finish saving."
            };
          }

          // As a fallback, forward the save to an unlocked Vestiga web app tab (if available).
          var forwarded = await addVaultItemViaWebApp(payload);
          return forwarded;
        }

        case "pendingAddStatus": {
          var pendingStatus = await getPendingVaultAdd();
          return { success: true, data: { hasPendingAdd: Boolean(pendingStatus) } };
        }

        case "flushPendingAdd": {
          var pending = await getPendingVaultAdd();
          if (!pending) {
            return { success: true, data: null };
          }

          var flushSession = await self.authService.getSession();
          if (!flushSession) {
            return { success: false, error: "Not authenticated. Please sign in." };
          }

          if (!self.authService.isMasterKeySet()) {
            return { success: false, error: "Vault is locked. Unlock first." };
          }

          var pendingAdded = await self.vaultService.add(pending.item);
          await storageSessionRemove(PENDING_VAULT_ADD_KEY);
          await self.syncManager.syncVault();
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: pendingAdded };
        }

        case "update": {
          var vaultSessionUpdate = await self.authService.getSession();
          if (!vaultSessionUpdate) {
            return { success: false, error: "Not authenticated. Please sign in." };
          }

          if (!self.authService.isMasterKeySet()) {
            return { success: false, error: "Vault is locked. Open the extension and unlock with your master password." };
          }

          var updated = await self.vaultService.update(payload.id, payload.data);
          await self.syncManager.syncVault(); // Update cache
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: updated };
        }

        case "delete": {
          var vaultSessionDelete = await self.authService.getSession();
          if (!vaultSessionDelete) {
            return { success: false, error: "Not authenticated. Please sign in." };
          }

          if (!self.authService.isMasterKeySet()) {
            return { success: false, error: "Vault is locked. Open the extension and unlock with your master password." };
          }

          await self.vaultService.remove(payload.id);
          await self.syncManager.syncVault(); // Update cache
          self.alarmManager.startAutoLockTimer();
          return { success: true, data: null };
        }

        default:
          throw new Error("Unknown VAULT action: " + action);
      }
    }

    // ─── AUTOFILL ───
    if (type === "AUTOFILL") {
      if (action === "fill") {
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          return { success: false, error: "No active tab found" };
        }

        await chrome.tabs.sendMessage(tabs[0].id, {
          type: "AUTOFILL_CREDENTIALS",
          credentials: {
            username: payload.username || "",
            password: payload.password || ""
          }
        });

        return { success: true, data: null };
      }

      throw new Error("Unknown AUTOFILL action: " + action);
    }

    // NAV actions are utility helpers triggered from content scripts
    // (e.g., open the extension UI to unlock when saving from a website fails).
    if (type === "NAV") {
      switch (action) {
        case "openExtensionUnlock": {
          await openExtensionUnlockTab();
          return { success: true, data: null };
        }

        case "openWebApp": {
          var origin = getConfiguredWebAppOrigin();
          await chrome.tabs.create({ url: origin + "/", active: true });
          return { success: true, data: null };
        }

        default:
          throw new Error("Unknown NAV action: " + action);
      }
    }

    throw new Error("Unknown message type: " + type);
  } catch (error) {
    console.error("[messageHandler] Error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

if (typeof self !== "undefined") {
  self.handleMessage = handleMessage;
}
