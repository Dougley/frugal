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
  const isLoggedin = useLoaderData();
  useEffect(() => {
    if (!localStorage.getItem("seenLoggedinToast") && isLoggedin) {
      toast.success("Welcome back!");
      localStorage.setItem("seenLoggedinToast", "true");
    }
    if (localStorage.getItem("seenLoggedinToast") && !isLoggedin) {
      toast.success("You have been logged out");
      localStorage.removeItem("seenLoggedinToast");
    }
  }, [isLoggedin]);
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

export { ErrorBoundary };
