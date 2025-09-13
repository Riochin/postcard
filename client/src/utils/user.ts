import {
  getMyProfileApiUsersMeGet,
  createUserProfileApiUsersPost,
} from "@/src/api/sdk.gen";
import { getIdToken } from "@/src/utils/auth";
import { client } from "@/src/api/client.gen";
import type { UserProfile, UserCreateRequest } from "@/src/api/types.gen";

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

export const checkUserExists = async (): Promise<UserCheckResult> => {
  try {
    // Ensure client is configured with current auth token
    client.setConfig({
      auth: async () => {
        const currentToken = await getIdToken();
        return currentToken || undefined;
      },
    });

    const response = await getMyProfileApiUsersMeGet({
      throwOnError: true,
    });

    // Check if the response is actually valid
    if (response.data) {
      return {
        exists: true,
        profile: response.data,
      };
    } else {
      return {
        exists: false,
      };
    }
  } catch (error: any) {
    if (error.status === 404) {
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
    await createUserProfileApiUsersPost({
      body: userData,
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "プロフィール作成に失敗しました",
    };
  }
};
