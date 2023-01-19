import * as React from 'react';
import type { LoaderFunction, SessionStorage } from '@remix-run/cloudflare';
import { type LinksFunction } from '@remix-run/cloudflare';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useLocation,
} from '@remix-run/react';
import { MdError } from 'react-icons/md';

import appStyleUrl from '~/styles/app.css';
import HeaderContent from './components/HeaderContent';
import FooterContent from './components/FooterContent';

import { withSentry } from '@sentry/remix';
import Navbar from './components/Navbar';

/**
 * The `links` export is a function that returns an array of objects that map to
 * the attributes for an HTML `<link>` element. These will load `<link>` tags on
 * every route in the app, but individual routes can include their own links
 * that are automatically unloaded when a user navigates away from the route.
 *
 * https://remix.run/api/app#links
 */
export let links: LinksFunction = () => {
  return [
    {
      rel: 'preconnect',
      href: '//fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    { rel: 'stylesheet', href: appStyleUrl },
    {
      rel: 'stylesheet',
      href: '//fonts.googleapis.com/css?family=Work+Sans:300,400,600,700&amp;lang=en',
    },
  ];
};

type LoaderData = {
  hasSession: boolean;
  session: ReturnType<SessionStorage['getSession']>;
  GLOBALS: string;
};
export const loader: LoaderFunction = async ({ context, request }) => {
  const session = await (context.sessionStorage as SessionStorage).getSession(
    request.headers.get('Cookie')
  );
  return {
    GLOBALS: JSON.stringify({
      SENTRY_DSN: context.SENTRY_DSN,
    }),
    hasSession: session.has('user'),
    session,
  };
};

/**
 * The root module's default export is a component that renders the current
 * route via the `<Outlet />` component. Think of this as the global layout
 * component for your app.
 */
export default function App() {
  const app = () => (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
  return withSentry(app)();
}

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <RouteChangeAnnouncement />
        <ScrollRestoration />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
        <Scripts />
      </body>
    </html>
  );
}

function Layout({ children }: React.PropsWithChildren<{}>) {
  const data = useLoaderData() as LoaderData;

  return (
    <div className="remix-app">
      <header className="remix-app__header">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.GLOBALS = ${data ? data.GLOBALS : '{}'};`,
          }}
        />

        <HeaderContent />
      </header>
      <div className="remix-app__main">
        <Navbar />
        <div className="container mx-auto remix-app__main-content">
          {children}
        </div>
      </div>
      <footer className="remix-app__footer">
        <FooterContent />
      </footer>
    </div>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  let message;
  switch (caught.status) {
    case 401:
      message =
        'Oops! Looks like you tried to visit a page that you do not have access to.';
      break;
    case 404:
      message = "Oops! Looks like the page you're looking for doesn't exist.";
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <div className="overflow-x-auto hero w-full min-h-screen flex flex-col justify-center">
          <main>
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">{`${caught.status} ${caught.statusText}`}</h1>
                <p className="py-6">{message}</p>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <Document title="Error!">
      <Layout>
        <div className="overflow-x-auto hero w-full min-h-screen flex flex-col justify-center">
          <main>
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Yikes</h1>
                <p className="py-6">Something went wrong on our side.</p>
              </div>
            </div>
            <div className="alert alert-error shadow-lg">
              <pre className="language-js">
                <MdError size={24} />
                <code className="language-js">{error.message}</code>
              </pre>
            </div>
          </main>
        </div>
      </Layout>
    </Document>
  );
}

/**
 * Provides an alert for screen reader users when the route changes.
 */
// eslint-disable-next-line react/display-name
const RouteChangeAnnouncement = React.memo(() => {
  let [hydrated, setHydrated] = React.useState(false);
  let [innerHtml, setInnerHtml] = React.useState('');
  let location = useLocation();

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  let firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    // Skip the first render because we don't want an announcement on the
    // initial page load.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    let pageTitle = location.pathname === '/' ? 'Home page' : document.title;
    setInnerHtml(`Navigated to ${pageTitle}`);
  }, [location.pathname]);

  // Render nothing on the server. The live region provides no value unless
  // scripts are loaded and the browser takes over normal routing.
  if (!hydrated) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-atomic
      id="route-change-region"
      style={{
        border: '0',
        clipPath: 'inset(100%)',
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: '0',
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
      }}
    >
      {innerHtml}
    </div>
  );
});
