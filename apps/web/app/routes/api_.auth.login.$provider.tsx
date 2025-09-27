import { redirect } from "react-router";
import type { Route } from "./+types/api_.auth.login.$provider";

export const loader = () => redirect("/login");

export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  const provider = params.provider;

  if (!provider) {
    console.error("[Auth] No provider specified");
    return redirect("/");
  }

  console.log(`[Auth] Starting login flow for provider: ${provider}`);

  // Get the return URL from the request URL
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get("returnTo");

  console.log(`[Auth] Return URL from request: ${returnUrl ?? "none"}`);

  if (returnUrl) {
    // Store the return URL in the session before authentication
    const { getSession, commitSession } = context.sessions;
    const session = await getSession(request.headers.get("cookie"));
    session.set("return_url", returnUrl);

    // Commit the session before authentication
    const headers = new Headers();
    headers.append("Set-Cookie", await commitSession(session));

    // Now proceed with authentication
    try {
      await context.auth.authenticate(provider, request);
    } catch (error) {
      if (error instanceof Response) {
        // Merge the session cookie with the authentication response
        // biome-ignore lint/style/noNonNullAssertion: we know this is set, look above
        error.headers.append("Set-Cookie", headers.get("Set-Cookie")!);
        return error;
      }
      throw error;
    }
  }

  console.log(
    `[Auth] Proceeding with authentication for provider: ${provider}`
  );
  return await context.auth.authenticate(provider, request);
};
