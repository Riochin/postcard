import {
  getMyProfileApiUsersMeGet,
  createUserProfileApiUsersPost,
} from "@/src/api/sdk.gen";
import { getIdToken } from "@/src/utils/auth";
import { client } from "@/src/api/client.gen";
import type { UserProfile, UserCreateRequest } from "@/src/api/types.gen";
import {
  getCachedUserData,
  setCachedUserData,
  clearUserCache,
  isUserDataCached,
} from "@/src/utils/userCache";

// Configure client with auth
client.setConfig({
  auth: async () => {
    const token = await getIdToken();
    return token || undefined;
  },
});

export interface UserCheckResult {
  exists: boolean;
  profile?: UserProfile;
  error?: string;
}

export const checkUserExists = async (
  forceRefresh: boolean = false,
): Promise<UserCheckResult> => {
  try {
    const currentToken = await getIdToken();

    // Check cache first if not forcing refresh
    if (!forceRefresh && currentToken) {
      const cached = getCachedUserData(currentToken);
      if (cached) {
        return {
          exists: cached.exists,
          profile: cached.profile || undefined,
        };
      }
    }

    // Ensure client is configured with current auth token
    client.setConfig({
      auth: async () => {
        return currentToken || undefined;
      },
    });

    const response = await getMyProfileApiUsersMeGet({
      throwOnError: true,
    });

    // Check if the response is actually valid
    if (response.data) {
      // Cache the successful result
      setCachedUserData(response.data, true, currentToken ?? undefined);

      return {
        exists: true,
        profile: response.data,
      };
    } else {
      // Cache the non-existent user result
      setCachedUserData(null, false, currentToken ?? undefined);

      return {
        exists: false,
      };
    }
  } catch (error: any) {
    if (error.status === 404) {
      const currentToken = await getIdToken();
      // Cache the 404 result
      setCachedUserData(null, false, currentToken ?? undefined);

      return {
        exists: false,
      };
    }
    return {
      exists: false,
      error: error.message || "ユーザー情報の取得に失敗しました",
    };
  }
};

export const createUserProfile = async (
  userData: UserCreateRequest,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await createUserProfileApiUsersPost({
      body: userData,
    });

    // Instead of clearing cache, force a fresh check next time
    // This avoids unnecessary cache clears that could affect CSS
    // The cache will naturally expire or be updated on next API call

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "プロフィール作成に失敗しました",
    };
  }
};

// Function to clear user cache (useful for logout)
export const invalidateUserCache = () => {
  clearUserCache();
};
