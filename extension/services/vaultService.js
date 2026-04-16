/**
 * vaultService.js
 * E2EE CRUD operations for vault items via Supabase REST API.
 * ALL sensitive data is encrypted before storage and decrypted after fetch.
 *
 * The extension supports two schema shapes:
 * - Encrypted schema: id, user_id, type, encrypted_data, encryption_iv
 * - Legacy plaintext schema: id, user_id, title, username, password, type, favorite, tags, notes
 */

var vaultService = {
  async getAll() {
    var session = await self.authService.getSession();
    if (!session) throw new Error("Not authenticated");

    var masterKey = self.authService.getMasterKey();
    if (!masterKey) throw new Error("Vault is locked. Enter master password.");

    var path = "/rest/v1/vault_items"
      + "?user_id=eq." + session.user.id
      + "&order=created_at.desc"
      + "&select=*";

    var result = await self.supabaseRequest("GET", path, null, session.access_token);
    if (result.error) throw new Error(result.error);

    var items = [];
    var rows = result.data || [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      try {
        if (row.encrypted_data && row.encryption_iv) {
          var decrypted = await self.cryptoService.decrypt(
            row.encrypted_data,
            row.encryption_iv,
            masterKey
          );
          items.push(_reconstructItem(row, decrypted));
        } else if (row.title || row.username || row.password) {
          var legacyData = {
            title: row.title || "",
            favorite: row.favorite || false,
            tags: row.tags || [],
            notes: row.notes || "",
            username: row.username || "",
            password: row.password || "",
            url: row.url || "",
          };

          // Try to migrate legacy rows to encrypted form, but do not block if the
          // target schema is still the older plaintext layout.
          try {
            var enc = await self.cryptoService.encrypt(legacyData, masterKey);
            var updatePath = "/rest/v1/vault_items"
              + "?id=eq." + row.id
              + "&user_id=eq." + session.user.id;

            await self.supabaseRequest("PATCH", updatePath, {
              encrypted_data: enc.encrypted,
              encryption_iv: enc.iv,
            }, session.access_token);
          } catch (_) {}

          items.push(_reconstructItem(row, legacyData));
        }
      } catch (err) {
        console.error("[vaultService] Failed to decrypt item:", row.id, err);
      }
    }

    return items;
  },

  async getById(id) {
    var items = await this.getAll();
    return items.find(function (item) { return item.id === id; }) || null;
  },

  _normalizeType(type) {
    if (!type) return "password";
    if (type === "login") return "password";
    return type;
  },

  _generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    if (typeof self !== "undefined" && self.crypto && self.crypto.randomUUID) {
      return self.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  _isMissingEncryptedSchemaError(error) {
    if (!error) return false;
    var message = (error.message || error.error || String(error) || "").toLowerCase();
    return (
      error.code === "42P01" ||
      error.code === "42703" ||
      message.indexOf("encrypted_data") !== -1 ||
      message.indexOf("encryption_iv") !== -1 ||
      message.indexOf("user_encryption_meta") !== -1
    );
  },

  async add(item) {
    var session = await self.authService.getSession();
    if (!session) throw new Error("Not authenticated");

    var masterKey = self.authService.getMasterKey();
    if (!masterKey) throw new Error("Vault is locked.");

    var normalizedType = this._normalizeType(item.type);
    var itemId = item.id || this._generateId();

    var sensitiveData = _extractSensitiveData({
      ...item,
      id: itemId,
      type: normalizedType,
    });

    var enc = await self.cryptoService.encrypt(sensitiveData, masterKey);

    var encryptedPayload = {
      id: itemId,
      user_id: session.user.id,
      title: item.title || "Untitled",
      type: normalizedType,
      encrypted_data: enc.encrypted,
      encryption_iv: enc.iv,
    };

    var encryptedResult = await self.supabaseRequest(
      "POST",
      "/rest/v1/vault_items?select=id,created_at,updated_at",
      encryptedPayload,
      session.access_token
    );

    if (encryptedResult.error) {
      var legacyPayload = {
        id: itemId,
        user_id: session.user.id,
        title: item.title || "Untitled",
        username: item.username || "",
        password: item.password || "",
        type: normalizedType,
        favorite: !!item.favorite,
        tags: Array.isArray(item.tags) ? item.tags : [],
        notes: item.notes || item.url || "",
      };

      var legacyResult = await self.supabaseRequest(
        "POST",
        "/rest/v1/vault_items?select=id,created_at,updated_at",
        legacyPayload,
        session.access_token
      );

      if (legacyResult.error) throw new Error(legacyResult.error);

      var legacyInserted = Array.isArray(legacyResult.data) ? legacyResult.data[0] : legacyResult.data;
      return {
        id: legacyInserted ? legacyInserted.id : itemId,
        type: normalizedType,
        createdAt: legacyInserted ? legacyInserted.created_at : new Date().toISOString(),
        updatedAt: legacyInserted ? legacyInserted.updated_at : new Date().toISOString(),
        ...sensitiveData,
      };
    }

    var inserted = Array.isArray(encryptedResult.data) ? encryptedResult.data[0] : encryptedResult.data;
    return {
      id: inserted ? inserted.id : itemId,
      type: normalizedType,
      createdAt: inserted ? inserted.created_at : new Date().toISOString(),
      updatedAt: inserted ? inserted.updated_at : new Date().toISOString(),
      ...sensitiveData,
    };
  },

  async update(id, data) {
    var session = await self.authService.getSession();
    if (!session) throw new Error("Not authenticated");

    var masterKey = self.authService.getMasterKey();
    if (!masterKey) throw new Error("Vault is locked.");

    var normalizedType = this._normalizeType(data.type);
    var sensitiveData = _extractSensitiveData({
      ...data,
      id: id,
      type: normalizedType,
    });

    var enc = await self.cryptoService.encrypt(sensitiveData, masterKey);

    var path = "/rest/v1/vault_items"
      + "?id=eq." + id
      + "&user_id=eq." + session.user.id;

    var encryptedResult = await self.supabaseRequest("PATCH", path, {
      title: data.title || "Untitled",
      type: normalizedType,
      encrypted_data: enc.encrypted,
      encryption_iv: enc.iv,
      updated_at: new Date().toISOString(),
    }, session.access_token);

    if (encryptedResult.error) {
      var legacyResult = await self.supabaseRequest("PATCH", path, {
        title: data.title || "Untitled",
        username: data.username || "",
        password: data.password || "",
        type: normalizedType,
        favorite: !!data.favorite,
        tags: Array.isArray(data.tags) ? data.tags : [],
        notes: data.notes || data.url || "",
        updated_at: new Date().toISOString(),
      }, session.access_token);

      if (legacyResult.error) throw new Error(legacyResult.error);
      return { id: id, type: normalizedType, ...sensitiveData };
    }

    return { id: id, type: normalizedType, ...sensitiveData };
  },

  async remove(id) {
    var session = await self.authService.getSession();
    if (!session) throw new Error("Not authenticated");

    var path = "/rest/v1/vault_items"
      + "?id=eq." + id
      + "&user_id=eq." + session.user.id;

    var result = await self.supabaseRequest("DELETE", path, null, session.access_token);
    if (result.error) throw new Error(result.error);
  }
};

function _extractSensitiveData(item) {
  var plaintextMetadata = ["id", "user_id", "type", "createdAt", "updatedAt", "created_at", "updated_at", "version", "encrypted_data", "encryption_iv"];

  var sensitive = {};

  for (var key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key) && plaintextMetadata.indexOf(key) === -1) {
      sensitive[key] = item[key];
    }
  }

  return sensitive;
}

function _reconstructItem(row, decrypted) {
  return {
    id: row.id,
    type: row.type || "password",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...decrypted,
  };
}

if (typeof self !== "undefined") {
  self.vaultService = vaultService;
}
