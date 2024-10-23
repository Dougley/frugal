import { redirect, type LoaderFunction } from "@remix-run/cloudflare";

export const loader: LoaderFunction = ({ request, context, params }) => {
  const provider = params.provider;

  if (!provider) {
    return redirect("/login");
  }

  try {
    return context.auth.authenticate(provider, request, {
      successRedirect: "/",
      failureRedirect: "/login",
    });
  } catch (error) {
    return redirect("/login");
  }
};
