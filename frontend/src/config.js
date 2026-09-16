/**
 * Centralized API endpoint for the frontend.
 * Value comes from frontend/.env (see .env.example).
 * Battle traffic uses the backend BFF at API_URL/api/battle/*.
 */
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
