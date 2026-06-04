import api from "@/lib/Api";
import { Loader } from "@googlemaps/js-api-loader";

let cachedKey: string | null = null;
let keyFetchPromise: Promise<string> | null = null;

export async function getGoogleMapsApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (keyFetchPromise) return keyFetchPromise;

  keyFetchPromise = (async () => {
    try {
      const res = await api.get<{ key: string }>("/config/maps-key");
      cachedKey = res.data.key;
      return cachedKey!;
    } catch (error) {
      console.error("Failed to load Google Maps API key:", error);
      throw error;
    } finally {
      keyFetchPromise = null;
    }
  })();

  return keyFetchPromise;
}

// Singleton loader — all components must share this one instance so the
// Loader class doesn't throw when re-instantiated with different options.
let sharedLoader: Loader | null = null;
let loaderReady: Promise<void> | null = null;

export async function getGoogleMapsLoader(): Promise<Loader> {
  const apiKey = await getGoogleMapsApiKey();

  if (!sharedLoader) {
    sharedLoader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "marker"],
    });
  }

  if (!loaderReady) {
    loaderReady = sharedLoader.load();
  }
  await loaderReady;

  return sharedLoader;
}

export function clearMapsKeyCache() {
  cachedKey = null;
  keyFetchPromise = null;
  sharedLoader = null;
  loaderReady = null;
}
