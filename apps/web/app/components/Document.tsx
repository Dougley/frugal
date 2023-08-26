import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "@remix-run/react";
import {
  PreventFlashOfInvertedColors,
  Theme,
  ThemeProvider,
  useTheme,
} from "~/utils/themes";

function Template({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme();
  return (
    <html lang="en" className="scroll-smooth" data-theme={theme ?? "dark"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="color-scheme"
          content={theme === Theme.DARK ? "dark light" : "light dark"}
        />
        <PreventFlashOfInvertedColors render={!theme} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function Document({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root");
  const theme = data?.theme;
  return (
    <ThemeProvider wantedTheme={theme}>
      <Template>{children}</Template>
    </ThemeProvider>
  );
}
