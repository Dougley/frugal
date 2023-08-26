import { captureRemixErrorBoundaryError } from "@dougley/sentry-remix";
import type { V2_MetaFunction } from "@remix-run/node";
import { Link, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import {
  LuBan,
  LuCoins,
  LuFileQuestion,
  LuServerCrash,
  LuXCircle,
} from "react-icons/lu";
import { Document } from "~/components/Document";
import { Layout } from "~/components/Layout";
import { defaultMeta } from "~/utils/meta";

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
  return defaultMeta("Error", "Something went wrong.");
};

export function ErrorBoundary() {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    let message;
    switch (error.status) {
      // 4xx errors only
      case 403: // Forbidden
        message = "The Maze Master doesn't want you here. Seek another path.";
        break;
      case 404: // Not Found
        message = "What you're looking for isn't here, sorry.";
        break;
      case 401: // Unauthorized
        message = "You're not authorized to view this page, are you logged in?";
        break;
      case 402: // Payment Required
        message = (
          <div className="flex flex-col items-center justify-center">
            <span>This page needs a premium subscription.</span>
            <Link to="/premium" className="link">
              Get one now!
            </Link>
            <span className="mt-2 text-xs opacity-50">
              Already have one? Make sure you're logged in.
            </span>
          </div>
        );
        break;
      default: // Other 4xx
        message = "Something went wrong.";
        break;
    }
    return (
      <Template>
        <div className="hero min-h-screen justify-center">
          <div className="hero-content col-span-1 grid text-center">
            <div className="flex flex-col items-center justify-center">
              {{
                403: <LuBan size={64} />, // Forbidden
                404: <LuFileQuestion size={64} />, // Not Found
                401: <LuBan size={64} />, // Unauthorized
                402: <LuCoins size={64} />, // Payment Required
              }[error.status] ?? <LuBan size={64} />}
            </div>
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">{error.status}</h1>
              <h2 className="my-3 text-3xl font-semibold">
                {error.statusText}
              </h2>
              <span className="py-6">{message}</span>
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
    if (error.cause) console.error(error.cause);
    errorMessage =
      process.env.NODE_ENV === "development" ? error.stack! : error.message;
  }

  return (
    <Template>
      <div className="hero flex min-h-screen w-full flex-col justify-center overflow-x-auto">
        <div className="hero-content col-span-1 grid text-center">
          <div className="flex flex-col items-center justify-center">
            <LuServerCrash size={64} />
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Dang it!</h1>
            <h2 className="my-3 text-3xl font-semibold">Server error</h2>
            <p className="py-6">
              Something went wrong. Please try again later.
            </p>
          </div>
        </div>
        <div className="alert alert-error w-auto shadow-lg">
          <LuXCircle size={24} />
          <pre className="language-js">
            <code className="language-js">{errorMessage}</code>
          </pre>
        </div>
        <div className="col-span-1 my-4 grid text-center opacity-50">
          This error has been logged. (Hopefully.)
        </div>
      </div>
    </Template>
  );
}
