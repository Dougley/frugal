import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for React
 *
 * Provides hooks and methods for authentication:
 * - useSession() - Access reactive session data
 * - signIn.social() - Initiate OAuth flow
 * - signOut() - End session
 * - getAccessToken() - Get OAuth provider access token for API calls
 */
export const authClient = createAuthClient({
  // Base URL is same domain, so not needed
});

// Re-export commonly used hooks and methods
export const { useSession, signIn, signOut } = authClient;
