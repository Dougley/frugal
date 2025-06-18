import { redirect } from "react-router";
import { setReturnUrl } from "~/utils/auth";
import type { Route } from "./+types/api_.auth.logout";

export const loader = () => redirect("/login");

export const action = async ({
  request,
  context,
  params: _params,
}: Route.ActionArgs) => {
  console.log("[Auth] Processing logout request");

  // Get the return URL from the request URL
  const url = new URL(request.url);
  const returnUrl = url.searchParams.get("returnTo");
  console.log(`[Auth] Return URL from request: ${returnUrl ?? "none"}`);

  const { destroySession, getSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));

  // Store the return URL in the session before destroying it
  if (returnUrl) {
    await setReturnUrl(request, context, returnUrl);
  }

  // Destroy the session and get the cookie
  const cookie = await destroySession(session);

  // Redirect to the return URL or home page
  const redirectUrl = returnUrl || "/";
  console.log(`[Auth] Redirecting to: ${redirectUrl}`);

  return redirect(redirectUrl, {
    headers: {
      "Set-Cookie": cookie,
    },
  });
};
