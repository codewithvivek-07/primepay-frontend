/**
 * Shared configuration for frontend
 * Update API_BASE_URL to point to your deployed backend
 */
const CONFIG = {
  // If frontend and backend are deployed together, leave as empty string (relative paths)
  // If deployed separately (e.g. Vercel frontend + Render backend), set full URL:
  // API_BASE_URL: 'https://primepay-backend.onrender.com'
  API_BASE_URL: '',

  POLL_INTERVAL_MS: 5000,
  MAX_POLL_ATTEMPTS: 120 // 10 minutes of polling at 5s interval
};
