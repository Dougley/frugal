import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import type { Authenticator } from "remix-auth";
import { defaultMeta } from "~/utils/meta";

export const meta: MetaFunction = () => {
  return defaultMeta();
};

export const loader: LoaderFunction = ({ request, context, params }) => {
  return (context.authenticator as Authenticator).authenticate(
    "discord",
    request,
    {
      successRedirect: "/",
      failureRedirect: "/login",
    },
  );
};
