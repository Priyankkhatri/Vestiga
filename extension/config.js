/**
 * Vestiga Extension Configuration
 *
 * ⚠️ WARNING: DO NOT COMMIT SENSITIVE KEYS TO GITHUB.
 * Replace placeholders with actual values locally.
 */

const CONFIG = {
  // Primary Vestiga web app URL used for popup links and active-tab sync.
  // For local development, change this to "http://localhost:5173".
  APP_URL: "https://vestiga.vercel.app",

  // Supabase URL: find this in your Supabase project settings (API section)
  SUPABASE_URL: "https://lvodmlfhbchogmkdgooy.supabase.co",

  // Supabase ANON key: find this in your Supabase project settings
  // ⚠️ NEVER use service_role keys in the extension.
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2RtbGZoYmNob2dta2Rnb295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTY4NzIsImV4cCI6MjA5MDgzMjg3Mn0.Wpsl8Tvg1r3AOTPFCMnl2gtGh8pf7YtCZnvwfsjbk4E",

  // Backend API URL for AI features and device sync
  API_URL: "http://localhost:3001/api"
};

// Export to global scope for non-module environments (like service worker)
if (typeof self !== 'undefined') {
  self.CONFIG = CONFIG;
}
