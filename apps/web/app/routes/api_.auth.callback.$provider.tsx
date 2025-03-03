import { redirect } from "react-router";
import { Route } from "./+types/api_.auth.callback.$provider";

export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  const provider = params.provider;

  if (!provider) {
    console.error("No provider specified");
    return redirect("/");
  }

  try {
    const user = await context.auth.authenticate(provider, request);
    const { getSession, commitSession } = context.sessions;
    const session = await getSession(request.headers.get("cookie"));
    session.set("user", user);
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.log(JSON.stringify(error, null, 2));
    console.error("Error authenticating");
    return redirect("/");
  }
};
