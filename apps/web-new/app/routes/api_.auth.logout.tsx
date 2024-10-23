import type { ActionFunction, LoaderFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export let loader: LoaderFunction = () => redirect("/login");

export const action: ActionFunction = ({ request, context, params }) => {
  return context.auth.logout(request, {
    redirectTo: "/",
  });
};
