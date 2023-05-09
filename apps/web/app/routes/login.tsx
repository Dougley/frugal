import type { LoaderArgs } from "@remix-run/cloudflare";
import type { V2_MetaFunction } from "@remix-run/node";
import type { Authenticator } from "remix-auth";

import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export async function loader({ request, context, params }: LoaderArgs) {
  return (context.authenticator as Authenticator).authenticate(
    "discord",
    request,
    {
      successRedirect: "/",
      failureRedirect: "/login",
    }
  );
}
