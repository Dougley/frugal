import * as Sentry from "@sentry/tanstackstart-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";

import type { SessionData } from "~/server/auth/session";

/**
 * Auth context value
 */
interface AuthContextValue {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  /**
   * Session data (null if not authenticated)
   */
  session: SessionData | null;
  /**
   * User data (null if not authenticated)
   */
  user: SessionData["user"] | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  session: SessionData | null;
}

/**
 * AuthProvider - wraps children with auth context
 *
 * Use this in your root layout to provide auth data to all components.
 * Session data comes from the route's beforeLoad hook.
 *
 * Also sets Sentry user context for error tracking when authenticated.
 *
 * @example
 * ```tsx
 * // In __root.tsx or a layout component
 * const { session } = Route.useRouteContext();
 * return (
 *   <AuthProvider session={session}>
 *     {children}
 *   </AuthProvider>
 * );
 * ```
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!session,
      session,
      user: session?.user ?? null,
    }),
    [session]
  );

  // Set Sentry user context when authenticated (client-side only)
  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
      });
    } else {
      // Clear user context on logout
      Sentry.setUser(null);
    }
  }, [session?.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - access auth state in any component
 *
 * Returns auth context with isAuthenticated flag and session/user data.
 * Throws if used outside AuthProvider.
 *
 * @example
 * ```tsx
 * function UserMenu() {
 *   const { isAuthenticated, user } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginButton />;
 *   }
 *
 *   return <span>Welcome, {user?.name}!</span>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * useRequireAuth - access auth state with type narrowing
 *
 * Returns auth context with user guaranteed to be non-null.
 * Throws if not authenticated (use with protected routes only).
 *
 * Note: This is a client-side check. Always use server-side auth checks
 * (beforeLoad) for actual protection.
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { user } = useRequireAuth();
 *   // user is guaranteed non-null here
 *   return <h1>Welcome, {user.name}!</h1>;
 * }
 * ```
 */
export function useRequireAuth(): AuthContextValue & {
  session: SessionData;
  user: SessionData["user"];
} {
  const auth = useAuth();
  if (!auth.isAuthenticated || !auth.session || !auth.user) {
    throw new Error(
      "useRequireAuth: User is not authenticated. Use this hook only in protected routes."
    );
  }
  return auth as AuthContextValue & {
    session: SessionData;
    user: SessionData["user"];
  };
}

/**
 * useOptionalAuth - access auth state that might not exist
 *
 * Convenience hook that returns user directly (or null).
 * Useful for components that work both authenticated and not.
 *
 * @example
 * ```tsx
 * function Navbar() {
 *   const user = useOptionalAuth();
 *   return user ? <UserAvatar user={user} /> : <LoginLink />;
 * }
 * ```
 */
export function useOptionalAuth(): SessionData["user"] | null {
  const auth = useAuth();
  return auth.user;
}
