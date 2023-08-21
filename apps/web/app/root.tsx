import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
} from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";

import { Document } from "~/components/Document";
import { Layout } from "~/components/Layout";
import tailwindStylesheet from "~/styles/tailwind.css";

import { useEffect } from "react";
import toast from "react-hot-toast";
import type { Authenticator } from "remix-auth";
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheet },
  { rel: "preconnect", href: "https://rsms.me" },
  { rel: "preconnect", href: "https://js.sentry-cdn.com" },
  {
    rel: "stylesheet",
    href: "https://rsms.me/inter/inter.css",
  },
];

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    "Accept-CH": "Sec-CH-Prefers-Color-Scheme",
    ...loaderHeaders,
  };
};

export const loader = async ({ context, request }: LoaderArgs) => {
  return {
    user: await (context.authenticator as Authenticator).isAuthenticated(
      request,
    ),
  };
};

export default function App() {
  const { user } = useLoaderData();
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
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

export { ErrorBoundary };
