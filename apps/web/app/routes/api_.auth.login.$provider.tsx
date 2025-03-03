import { redirect } from "react-router";
import { Route } from "./+types/api_.auth.login.$provider";

export let loader = () => redirect("/login");

export const action = async ({
  request,
  context,
  params,
}: Route.ActionArgs) => {
  const provider = params.provider;

  if (!provider) {
    console.error("No provider specified");
    return redirect("/");
  }

  return await context.auth.authenticate(provider, request);
};
