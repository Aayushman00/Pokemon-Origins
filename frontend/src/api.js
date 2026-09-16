/**
 * Shared API client for the Express backend (includes battle BFF).
 */
import axios from "axios";
import { API_URL } from "./config";

function getAuthToken() {
  return localStorage.getItem("token");
}

export function getErrorMessage(err, fallback = "Request failed") {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (err?.message) return err.message;
  return fallback;
}

/** Authenticated client for the Express backend (REST + battle proxy). */
export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
