import type { AppLoadContext } from "react-router";
import type { DiscordUser } from "~/types/DiscordUser";

// Cookie name for storing the return URL
const RETURN_URL_COOKIE = "return_url";

/**
 * Validates if a URL is safe to redirect to
 */
function isValidReturnUrl(url: string): boolean {
  // Only allow absolute paths (starting with /) and prevent protocol-relative URLs
  const isValid = url.startsWith("/") && !url.startsWith("//");
  console.log(`[Auth] Validating return URL: ${url} - Valid: ${isValid}`);
  return isValid;
}

/**
 * Stores the return URL in a cookie if it's valid
 */
export async function setReturnUrl(
  request: Request,
  context: AppLoadContext,
  returnUrl: string
): Promise<void> {
  if (!isValidReturnUrl(returnUrl)) {
    return;
  }

  const { getSession, commitSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  session.set(RETURN_URL_COOKIE, returnUrl);
  await commitSession(session);
  console.log(`[Auth] Successfully stored return URL in session`);
}

/**
 * Gets and clears the return URL from the cookie
 */
export async function getAndClearReturnUrl(
  request: Request,
  context: AppLoadContext
): Promise<string | null> {
  const { getSession, commitSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  const returnUrl = session.get(RETURN_URL_COOKIE);

  console.log(
    `[Auth] Retrieved return URL from session: ${returnUrl ?? "none"}`
  );

  if (returnUrl) {
    // Validate the URL again when retrieving it
    if (!isValidReturnUrl(returnUrl)) {
      console.log(`[Auth] Retrieved URL failed validation: ${returnUrl}`);
      session.unset(RETURN_URL_COOKIE);
      await commitSession(session);
      return null;
    }

    session.unset(RETURN_URL_COOKIE);
    await commitSession(session);
    console.log(`[Auth] Cleared return URL from session`);
  }

  return returnUrl ?? null;
}

export async function getLoggedInUser(
  request: Request,
  context: AppLoadContext
): Promise<DiscordUser | null> {
  const { getSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  const user = session.get("user") ?? null;
  console.log(
    `[Auth] Retrieved logged in user: ${user ? user.username : "none"}`
  );
  return user;
}
