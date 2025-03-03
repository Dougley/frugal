import { redirect } from "react-router";
import { Route } from "./+types/api_.auth.logout";

export let loader = () => redirect("/login");

export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  const { destroySession, getSession } = context.sessions;
  const session = await getSession(request.headers.get("cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};
