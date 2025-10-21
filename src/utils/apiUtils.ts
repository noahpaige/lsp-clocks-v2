/**
 * API Utility Functions
 *
 * Utilities for constructing API URLs and WebSocket connections.
 */

import { API_CONFIG } from "@/config/constants";

/**
 * Generate a full API URL for a given endpoint
 * @param endpoint - The API endpoint path (e.g., "/api/items")
 * @returns The full URL (e.g., "http://localhost:3000/api/items")
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

/**
 * Get the WebSocket URL for real-time connections
 * @returns The WebSocket URL
 */
export function getWebSocketUrl(): string {
  return API_CONFIG.WS_URL;
}
