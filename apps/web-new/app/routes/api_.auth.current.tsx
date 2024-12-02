import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = ({ request, context, params }) => {
  return context.auth.isAuthenticated(request);
};
