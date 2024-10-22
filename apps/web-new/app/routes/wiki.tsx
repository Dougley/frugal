import { MDXProvider } from "@mdx-js/react";
import { Outlet, useMatches } from "@remix-run/react";
import { CalloutBody, CalloutRoot, CalloutTitle } from "~/components/Callout";

export default function Component() {
  const matches = useMatches();
  return (
    <MDXProvider
      components={{
        "callout-root": CalloutRoot,
        "callout-title": CalloutTitle,
        "callout-body": CalloutBody,
      }}
    >
      <div className="flex">
        <div className="p-10 prose min-h-screen min-w-full">
          <Outlet />
        </div>
      </div>
      <div className="flex justify-start p-10 opacity-50">
        {JSON.stringify(matches[matches.length - 1])}
      </div>
    </MDXProvider>
  );
}
