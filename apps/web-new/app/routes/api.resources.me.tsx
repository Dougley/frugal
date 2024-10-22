import { type LoaderFunction } from "@remix-run/cloudflare";

export let loader: LoaderFunction = async ({ request, context, params }) => {
  return {
    loggedIn: await context.auth.isAuthenticated(request),
  };
};
