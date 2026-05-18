/**
 * Fetches the Google Maps API key securely from the backend.
 * The key is cached after the first fetch to avoid repeated API calls.
 */

import api from "@/lib/Api";

const API_URL = import.meta.env.VITE_API_URL as string;

let cachedKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

export async function getGoogleMapsApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  // Deduplicate concurrent calls
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await api.get<{ key: string }>("/config/maps-key");
      cachedKey = res.data.key;
      return cachedKey!;
    } catch (error) {
      console.error("Failed to load Google Maps API key:", error);
      throw error;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/** Clear cached key (e.g. on logout) */
export function clearMapsKeyCache() {
  cachedKey = null;
  fetchPromise = null;
}
