import { fetchAuthSession } from "aws-amplify/auth";

export interface AuthTokens {
  accessToken?: string;
  idToken?: string;
}

export const getAuthToken = async (): Promise<AuthTokens | null> => {
  try {
    const session = await fetchAuthSession();
    return {
      accessToken: session.tokens?.accessToken?.toString(),
      idToken: session.tokens?.idToken?.toString(),
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export const getIdToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};
