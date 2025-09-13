import type { UserProfile } from "@/src/api/types.gen";

interface CachedUserData {
  profile: UserProfile | null;
  exists: boolean;
  timestamp: number;
  tokenHash?: string;
}

const USER_CACHE_KEY = "postcard_user_cache";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days - longer duration to avoid frequent cache clears

// Simple hash function for token comparison
const hashToken = (token: string): string => {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const getCachedUserData = (
  currentToken?: string,
): CachedUserData | null => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;

    const data: CachedUserData = JSON.parse(cached);

    // Check if cache is expired - but don't auto-remove, let it be garbage collected naturally
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      return null;
    }

    // Check if token has changed (user logged out and back in with different account)
    if (
      currentToken &&
      data.tokenHash &&
      data.tokenHash !== hashToken(currentToken)
    ) {
      // Only clear cache if token actually changed, not just missing
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading user cache:", error);
    // Don't aggressively remove cache on parse errors
    return null;
  }
};

export const setCachedUserData = (
  profile: UserProfile | null,
  exists: boolean,
  currentToken?: string,
): void => {
  try {
    const data: CachedUserData = {
      profile,
      exists,
      timestamp: Date.now(),
      tokenHash: currentToken ? hashToken(currentToken) : undefined,
    };

    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting user cache:", error);
  }
};

export const clearUserCache = (): void => {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch (error) {
    console.error("Error clearing user cache:", error);
  }
};

export const isUserDataCached = (currentToken?: string): boolean => {
  const cached = getCachedUserData(currentToken);
  return cached !== null;
};
