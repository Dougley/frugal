import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import { useEffect } from "react";
import { default as toaster } from "react-hot-toast";
import { getToast } from "remix-toast";
import {
  PreventFlashOfInvertedColors,
  Theme,
  ThemeProvider,
} from "./components/contexts/ThemeContext";
import { Document } from "./components/Document";
import { ToplevelErrorBoundary } from "./components/ToplevelErrorBoundary";
import styles from "./tailwind.css?url";
import { defaultMeta } from "./utils/meta";
import { getThemeSession } from "./utils/prefs.server";

export const meta = () => {
  return defaultMeta();
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: styles },
];

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const themeSession = await getThemeSession(request);
  const { toast, headers } = await getToast(request);
  return data(
    {
      loggedIn: await context.auth.isAuthenticated(request),
      theme: themeSession.getTheme(),
      toast,
    },
    {
      headers,
    },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<{
    theme: Theme;
    toast: Awaited<ReturnType<typeof getToast>>;
  }>("root");
  const theme = data?.theme;
  const toast = data?.toast;
  useEffect(() => {
    if (toast) {
      switch (toast.toast?.type) {
        case "success":
          toaster.success(toast.toast.message);
          break;
        case "error":
          toaster.error(toast.toast.message);
          break;
        case "info":
          toaster(toast.toast.message);
          break;
        default:
          if (toast.toast?.message) {
            toaster(toast.toast.message);
          }
          break;
      }
    }
  }, [toast]);
  return (
    <ThemeProvider wantedTheme={theme ?? null}>
      <html className="scroll-smooth" lang="en" data-theme={theme}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="color-scheme"
            content={theme === Theme.DARK ? "dark light" : "light dark"}
          />
          <Meta />
          <PreventFlashOfInvertedColors render={!theme} />
          <Links />
        </head>
        <body>
          <Document>{children}</Document>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ThemeProvider>
  );
}

export const ErrorBoundary = ToplevelErrorBoundary;

export default function App() {
  return <Outlet />;
}
