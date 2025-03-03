import { AppLoadContext } from "react-router";

export async function getLoggedInUser(
  request: Request,
  context: AppLoadContext,
) {
  const { getSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  return session.get("user");
}
