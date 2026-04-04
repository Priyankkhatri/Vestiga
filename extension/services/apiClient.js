/**
 * apiClient.js
 * Mock API calls for future integration
 */

var apiClient = {
  async get(url) {
    console.log(`[apiClient] GET ${url}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: { mock: true, url, message: 'Simulated GET response' }
        });
      }, 500);
    });
  },

  async post(url, body) {
    console.log(`[apiClient] POST ${url}`, body);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 201,
          data: { mock: true, url, body, message: 'Simulated POST response' }
        });
      }, 500);
    });
  }
};

if (typeof self !== 'undefined') {
  self.apiClient = apiClient;
}
