import type { ActionFunction, LoaderFunction } from "react-router";
import { redirect } from "react-router";

export let loader: LoaderFunction = () => redirect("/login");

export const action: ActionFunction = ({ request, context, params }) => {
  return context.auth.logout(request, {
    redirectTo: "/",
  });
};
