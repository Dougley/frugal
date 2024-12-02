import {
  ColorSchemeScript,
  createTheme,
  DEFAULT_THEME,
  MantineProvider,
  mergeMantineTheme,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import type { LinksFunction } from "react-router";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import Contexts from "~/components/contexts";
import { Skeleton } from "./components/Skeleton/Skeleton";
import { TopErrorBoundary } from "./components/TopErrorBoundary/TopErrorBoundary";
import styles from "./styles.css?url";
import { defaultMeta } from "./utils/meta";

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

const theme = mergeMantineTheme(
  DEFAULT_THEME,
  createTheme({
    fontFamily: "Inter " + DEFAULT_THEME.fontFamily,
  }),
);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications />
          <NavigationProgress />
          <ModalsProvider>
            <Contexts>
              <Skeleton>{children}</Skeleton>
            </Contexts>
          </ModalsProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const ErrorBoundary = TopErrorBoundary;

export default function App() {
  return <Outlet />;
}
