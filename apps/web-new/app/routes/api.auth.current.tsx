import type { LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = ({ request, context, params }) => {
  return context.auth.isAuthenticated(request);
};
