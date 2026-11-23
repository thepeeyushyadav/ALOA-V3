/**
 * ALOA V3 — Centralized API & WebSocket Configuration
 * Automatically switches between local development (http://localhost:8000)
 * and production deployment (https://api.aloav3.com).
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getApiUrl = (endpoint: string): string => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const getWsUrl = (endpoint: string): string => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const wsBase = base.startsWith("https://")
    ? base.replace("https://", "wss://")
    : base.replace("http://", "ws://");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${wsBase}${path}`;
};
