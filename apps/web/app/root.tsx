import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/cloudflare";
import { Outlet } from "@remix-run/react";

import { Document } from "~/components/Document";
import { Layout } from "~/components/Layout";
import tailwindStylesheet from "~/styles/tailwind.css";

import type { Authenticator } from "remix-auth";
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheet },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap",
  },
];

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Accept-CH": "Sec-CH-Prefers-Color-Scheme",
    ...loaderHeaders,
  };
};

export const loader = async ({ context, request }: LoaderArgs) => {
  return (context.authenticator as Authenticator).isAuthenticated(request);
};

export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

export { ErrorBoundary };
