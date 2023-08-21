import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script
          src="https://js.sentry-cdn.com/f5fc2b2f75ae49098a8eb128a363398f.min.js"
          crossOrigin="anonymous"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const local = localStorage.getItem('theme');
              if (local) {
                console.log('local', local);
                document.querySelector('html').setAttribute('data-theme', local);
              } else {
                const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.querySelector('html').setAttribute('data-theme', theme);
              }
            `,
          }}
        />
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
