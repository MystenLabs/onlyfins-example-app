import { SessionKey } from '@mysten/seal';
import type { ExportedSessionKey } from '@mysten/seal';

const SESSION_KEY_PREFIX = 'sessionKey';
const SESSION_KEY_VERSION = '1.0';

interface StoredSessionKey {
  version: string;
  data: ExportedSessionKey;
  storedAt: number;
}

function getSessionKeyStorageKey(address: string, packageId: string): string {
  return `${SESSION_KEY_PREFIX}_${address}_${packageId}`;
}

export function saveSessionKey(
  address: string,
  packageId: string,
  sessionKey: SessionKey
): void {
  try {
    const storageKey = getSessionKeyStorageKey(address, packageId);
    const exported = sessionKey.export();

    // Manual serialization - only copy serializable fields
    const serializable: any = {};
    for (const [key, value] of Object.entries(exported)) {
      try {
        // Test if this specific value is serializable
        JSON.stringify(value);
        serializable[key] = value;
      } catch {
        console.warn(`Skipping non-serializable field: ${key}`);
        // Skip non-serializable fields
        if (key === 'sessionKey' && typeof value === 'object' && value !== null) {
          // The sessionKey might be an object that needs special handling
          // Try to extract a string representation
          if ('toString' in value) {
            serializable[key] = (value as any).toString();
          }
        }
      }
    }

    const storedData: StoredSessionKey = {
      version: SESSION_KEY_VERSION,
      data: serializable as ExportedSessionKey,
      storedAt: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(storedData));
    console.log('Session key saved to cache');
  } catch (error) {
    console.error('Failed to save session key to storage:', error);
  }
}

export function loadSessionKey(
  address: string,
  packageId: string
): ExportedSessionKey | null {
  try {
    const storageKey = getSessionKeyStorageKey(address, packageId);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    const parsed: StoredSessionKey = JSON.parse(stored);

    // Check version compatibility
    if (parsed.version !== SESSION_KEY_VERSION) {
      console.warn('Session key version mismatch, clearing cache');
      localStorage.removeItem(storageKey);
      return null;
    }

    // Check if the session is expired based on creation time and TTL
    const creationTime = parsed.data.creationTimeMs;
    const ttlMs = parsed.data.ttlMin * 60 * 1000;
    const expirationTime = creationTime + ttlMs;

    if (Date.now() > expirationTime) {
      console.log('Session key expired, clearing cache');
      localStorage.removeItem(storageKey);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to load session key from storage:', error);
    return null;
  }
}

export function clearSessionKey(address: string, packageId: string): void {
  try {
    const storageKey = getSessionKeyStorageKey(address, packageId);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear session key from storage:', error);
  }
}

export function clearAllExpiredSessions(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SESSION_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed: StoredSessionKey = JSON.parse(value);
            const creationTime = parsed.data.creationTimeMs;
            const ttlMs = parsed.data.ttlMin * 60 * 1000;
            const expirationTime = creationTime + ttlMs;

            if (Date.now() > expirationTime) {
              keysToRemove.push(key);
            }
          } catch {
            // If we can't parse it, mark it for removal
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired session(s)`);
    }
  } catch (error) {
    console.error('Failed to clear expired sessions:', error);
  }
}

export function hasValidCachedSession(address: string, packageId: string): boolean {
  const sessionData = loadSessionKey(address, packageId);
  return sessionData !== null;
}
