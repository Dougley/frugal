import { Link, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  LuBan,
  LuCoins,
  LuFileQuestion,
  LuServerOff,
  LuUserX,
  LuXCircle,
} from "react-icons/lu";

// const Template = ({
//   children,
// }: {
//   children: React.ReactNode;
// }): React.ReactElement => {
//   return (
//     <Document>
//       <Layout>{children}</Layout>
//     </Document>
//   );
// };

// export const meta: MetaFunction = () => {
//   return defaultMeta("Error", "Something went wrong.");
// };

export function ToplevelErrorBoundary() {
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
      <div className="hero min-h-screen justify-center">
        <div className="hero-content col-span-1 grid text-center">
          <div className="flex flex-col items-center justify-center">
            {{
              403: <LuBan size={64} />, // Forbidden
              404: <LuFileQuestion size={64} />, // Not Found
              401: <LuUserX size={64} />, // Unauthorized
              402: <LuCoins size={64} />, // Payment Required
            }[error.status] ?? <LuBan size={64} />}
          </div>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{error.status}</h1>
            <h2 className="my-3 text-3xl font-semibold">{error.statusText}</h2>
            <span className="py-6">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors!
  let errorMessage = "Unknown error";
  if (error instanceof Error) {
    if (error.cause) console.error(error.cause);
    errorMessage =
      process.env.NODE_ENV === "development"
        ? error.message + "\n\n" + error.stack!
        : error.message;
  }

  return (
    <div className="hero flex min-h-screen w-full flex-col justify-center overflow-x-auto">
      <div className="hero-content col-span-1 grid text-center">
        <div className="flex flex-col items-center justify-center">
          <LuServerOff size={64} />
        </div>
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">500</h1>
          <h2 className="my-3 text-3xl font-semibold">Internal Server Error</h2>
          <p className="py-6">Something went wrong. Please try again later.</p>
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
  );
}
