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
        <Meta />
        <meta
          name="color-scheme"
          content={theme === Theme.DARK ? "dark light" : "light dark"}
        />
        <PreventFlashOfInvertedColors render={!theme} />
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
