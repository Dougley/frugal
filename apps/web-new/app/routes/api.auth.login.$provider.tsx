import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/cloudflare";

export let loader: LoaderFunction = () => redirect("/login");

export const action: ActionFunction = ({ request, context, params }) => {
  const provider = params.provider;

  if (!provider) {
    return redirect("/login");
  }

  try {
    return context.auth.authenticate(provider, request);
  } catch (error) {
    return redirect("/login");
  }
};
