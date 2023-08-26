import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/cloudflare";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
} from "@remix-run/react";

import {
  BrowserProfilingIntegration,
  BrowserTracing,
  Replay,
  init as initSentry,
  remixRouterInstrumentation,
  withProfiler,
  withSentry,
} from "@sentry/remix";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Authenticator } from "remix-auth";
import { Document } from "~/components/Document";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Layout } from "~/components/Layout";
import tailwindStylesheet from "~/styles/tailwind.css";

import { ExtraErrorData } from "toucan-js";
import { getThemeSession } from "./utils/prefs.server";

export const meta = (({
  data,
}: {
  data?: { sentryHeaders?: { "sentry-trace"?: string; baggage?: string } };
}) => [
  {
    "sentry-trace": data?.sentryHeaders?.["sentry-trace"],
  },
  {
    baggage: data?.sentryHeaders?.baggage,
  },
]) satisfies V2_MetaFunction;

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheet },
  { rel: "preconnect", href: "https://rsms.me" },
  {
    rel: "stylesheet",
    href: "https://rsms.me/inter/inter.css",
  },
];

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Accept-CH": "Sec-CH-Prefers-Color-Scheme",
    "Document-Policy": "js-profiling",
    ...loaderHeaders,
  };
};

export const loader = async ({ context, request }: LoaderArgs) => {
  const themeSession = await getThemeSession(request);
  return {
    user: await (context.authenticator as Authenticator).isAuthenticated(
      request,
    ),
    theme: themeSession.getTheme(),
    sentrySettings: {
      enabled: context.SENTRY_DSN !== undefined,
      dsn: context.SENTRY_DSN,
      environment: context.CF_PAGES
        ? context.CF_PAGES_BRANCH === "main"
          ? "production"
          : "staging"
        : "unknown",
      release: context.CF_PAGES ? context.CF_PAGES_COMMIT_SHA : "unknown",
    },
  };
};

function App() {
  const { user, sentrySettings } = useLoaderData();
  useEffect(() => {
    if (!localStorage.getItem("seenLoggedinToast") && user) {
      toast.success("Welcome back!");
      localStorage.setItem("seenLoggedinToast", "true");
    }
    if (localStorage.getItem("seenLoggedinToast") && !user) {
      toast.success("You have been logged out");
      localStorage.removeItem("seenLoggedinToast");
    }
  }, [user]);
  // to prevent shenanigans with strict mode and useEffect running twice in dev
  const sentryInitialized = useRef(false);
  useEffect(() => {
    if (sentrySettings.enabled && !sentryInitialized.current) {
      initSentry({
        debug: process.env.NODE_ENV !== "production",
        dsn: sentrySettings.dsn,
        environment: sentrySettings.environment,
        release: sentrySettings.release,
        integrations: [
          new BrowserTracing({
            routingInstrumentation: remixRouterInstrumentation(
              useEffect,
              useLocation,
              useMatches,
            ),
            tracePropagationTargets: [
              new RegExp(
                `^https?://${new URL(window.location.href).host}`,
                "u",
              ),
            ],
          }),
          new ExtraErrorData(),
          new Replay(),
          new BrowserProfilingIntegration(),
        ],
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      });
      sentryInitialized.current = true;
    }
  }, [sentrySettings]);
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

export { ErrorBoundary };
export default withSentry(withProfiler(App), {
  wrapWithErrorBoundary: false,
});
