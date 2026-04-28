/// <reference types="vite/client" />

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "~/components/AuthContext";
import Contexts from "~/components/contexts";
import { DrawerProvider } from "~/components/contexts/DrawerContext";
import { RootErrorComponent } from "~/components/ErrorBoundary";
import { I18nProvider } from "~/components/I18nProvider";
import { Skeleton } from "~/components/Skeleton";
import type { SupportedLanguage } from "~/lib/i18n";
import { getSessionFn, type SessionData } from "~/server/auth/session";
import { getLanguageFn } from "~/server/i18n/language";
import type { AppRouter } from "~/server/trpc/router";
import appCss from "~/styles/app.css?url";
import { theme } from "~/theme";

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export interface RootContext {
  session: SessionData | null;
  language: SupportedLanguage;
}

const notFoundError = new Error("404 Not Found");

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async (): Promise<RootContext> => {
    const [session, language] = await Promise.all([
      getSessionFn(),
      getLanguageFn(),
    ]);
    return { session, language };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Site-wide OG defaults (can be overridden by child routes)
      { property: "og:site_name", content: "GiveawayBot" },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: `${import.meta.env.VITE_SITE_URL}/og-default.png`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@GiveawayBot" },
      {
        name: "twitter:image",
        content: `${import.meta.env.VITE_SITE_URL}/og-default.png`,
      },
      // Theme color for browser UI
      { name: "theme-color", content: "#2bd9af" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <RootErrorComponent error={props.error} reset={props.reset} />
      </RootDocument>
    );
  },
  notFoundComponent: NotFoundPage,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function NotFoundPage() {
  return <RootErrorComponent error={notFoundError} />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { language } = Route.useRouteContext();

  return (
    <html
      lang={language}
      data-mantine-color-scheme="dark"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <I18nProvider language={language}>
          <Providers>
            <Contexts>{children}</Contexts>
          </Providers>
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const { session } = Route.useRouteContext();
  const { t } = useTranslation();

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider
        labels={{ confirm: t("common.confirm"), cancel: t("common.cancel") }}
      >
        <Notifications position="top-right" limit={3} zIndex={2000} />
        <NavigationProgress size={2} color="indigo" />
        <AuthProvider session={session}>
          <DrawerProvider>
            <Skeleton>{children}</Skeleton>
          </DrawerProvider>
        </AuthProvider>
      </ModalsProvider>
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          { name: "React Query", render: <ReactQueryDevtoolsPanel /> },
        ]}
      />
    </MantineProvider>
  );
}
