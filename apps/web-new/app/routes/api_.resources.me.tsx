import { type LoaderFunction } from "react-router";

export let loader: LoaderFunction = async ({ request, context, params }) => {
  return Response.json({
    loggedIn: await context.auth.isAuthenticated(request),
  });
};
