import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { FaDiscord } from "react-icons/fa6";

type LoaderType = Awaited<ReturnType<typeof loader>>;

export const loader = async ({
  request,
  context,
  params,
}: LoaderFunctionArgs) => {
  return {
    loggedIn: await context.auth.isAuthenticated(request),
  };
};

export default function Login() {
  const current = useLoaderData<typeof loader>();
  return (
    <div className="hero min-h-screen justify-center">
      <div className="hero-content col-span-1 grid text-center">
        {current.loggedIn ? (
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome back!</h1>
            <p>You are currently logged in as {current.loggedIn.username}.</p>
            <div className="my-4">
              <Form method="post" action="/api/auth/logout">
                <button className="btn btn-error" type="submit">
                  Logout
                </button>
              </Form>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-5xl font-bold">Howdy, stranger! 👋</h1>
            <p>
              You need to login to access this page. Choose your preferred
              method below.
            </p>
            <div className="my-4">
              <Form method="post" action="/api/auth/login/discord">
                <button type="submit" className="btn btn-primary">
                  <FaDiscord />
                  Login with Discord
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
