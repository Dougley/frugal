import type { Route } from "./+types/api_.auth.current";

export const loader = async ({
  request,
  context,
  params,
}: Route.LoaderArgs) => {
  const { getSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  const user = session.get("user");
  return Response.json({
    user,
  });
};
