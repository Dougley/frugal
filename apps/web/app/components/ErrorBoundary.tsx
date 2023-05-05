import type { V2_MetaFunction } from "@remix-run/node";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { MdError } from "react-icons/md";
import { Document } from "~/components/Document";
import { Layout } from "~/components/Layout";

const Template = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  return (
    <Document>
      <Layout>{children}</Layout>
    </Document>
  );
};

export const meta: V2_MetaFunction = () => {
  return [{ title: "New Remix App" }];
};

export function ErrorBoundary() {
  const error = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    let message;
    switch (error.status) {
      // 4xx errors only
      case 403:
        message = "The Maze Master doesn't want you here. Seek another path.";
        break;
      case 404:
        message = "What you're looking for isn't here, sorry.";
        break;
      case 401:
        message = "You're not authorized to view this page, are you logged in?";
        break;
      default:
        message = "Something went wrong.";
        break;
    }
    return (
      <Template>
        <div className="hero min-h-screen justify-center">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">{error.status}</h1>
              <p className="py-6">{message}</p>
            </div>
          </div>
        </div>
      </Template>
    );
  }

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors!
  let errorMessage = "Unknown error";
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <Template>
      <div className="hero flex min-h-screen w-full flex-col justify-center overflow-x-auto">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Yikes</h1>
            <p className="py-6">Something went wrong on our side.</p>
          </div>
        </div>
        <div className="alert alert-error w-auto shadow-lg">
          <pre className="language-js">
            <MdError size={24} />
            <code className="language-js">{errorMessage}</code>
          </pre>
        </div>
      </div>
    </Template>
  );
}
