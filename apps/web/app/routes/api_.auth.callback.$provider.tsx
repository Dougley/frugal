import { redirect } from "react-router";
import { getAndClearReturnUrl } from "~/utils/auth";
import type { Route } from "./+types/api_.auth.callback.$provider";

export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  const provider = params.provider;

  if (!provider) {
    console.error("[Auth] No provider specified in callback");
    return redirect("/");
  }

  console.log(`[Auth] Processing callback for provider: ${provider}`);

  try {
    console.log(`[Auth] Authenticating user with provider: ${provider}`);
    const user = await context.auth.authenticate(provider, request);
    console.log(`[Auth] Successfully authenticated user: ${user.username}`);

    const { getSession, commitSession } = context.sessions;
    const session = await getSession(request.headers.get("cookie"));
    session.set("user", user);
    console.log(`[Auth] User session created`);

    // Get the return URL and redirect to it if it exists
    const returnUrl = await getAndClearReturnUrl(request, context);
    const redirectUrl = returnUrl || "/";
    console.log(`[Auth] Redirecting to: ${redirectUrl}`);

    return redirect(redirectUrl, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error("[Auth] Error during authentication callback:", error);
    console.log(JSON.stringify(error, null, 2));
    return redirect("/");
  }
};
