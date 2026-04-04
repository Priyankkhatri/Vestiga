/**
 * cryptoService.js
 * Handles encryption, decryption, and key derivation using Web Crypto API.
 */

var cryptoService = {
  ITERATIONS: 600000,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,

  generateRandomBytes(length) {
    return self.crypto.getRandomValues(new Uint8Array(length));
  },

  bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  base64ToBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  async deriveKey(masterPassword, saltBase64 = null) {
    const encoder = new TextEncoder();
    const passwordKey = await self.crypto.subtle.importKey(
      "raw",
      encoder.encode(masterPassword),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    let saltBuffer;
    if (saltBase64) {
      saltBuffer = this.base64ToBuffer(saltBase64);
    } else {
      saltBuffer = this.generateRandomBytes(this.SALT_LENGTH);
    }

    const key = await self.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: this.ITERATIONS,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    return {
      key,
      salt: saltBase64 || this.bufferToBase64(saltBuffer)
    };
  },

  async encrypt(data, key) {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const encodedData = encoder.encode(dataString);
    
    const iv = this.generateRandomBytes(this.IV_LENGTH);

    const ciphertext = await self.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return this.bufferToBase64(combined.buffer);
  },

  async decrypt(encryptedBase64, key) {
    try {
      const combinedBuffer = this.base64ToBuffer(encryptedBase64);
      const combined = new Uint8Array(combinedBuffer);

      const iv = combined.slice(0, this.IV_LENGTH);
      const ciphertext = combined.slice(this.IV_LENGTH);

      const decryptedBuffer = await self.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error("Decryption failed: Incorrect password or corrupted data");
    }
  }
};

if (typeof self !== 'undefined') {
  self.cryptoService = cryptoService;
}
