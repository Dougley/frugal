import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Giveaways index route - redirects to /giveaways/overview
 */
export const Route = createFileRoute("/giveaways/")({
  beforeLoad: () => {
    throw redirect({ to: "/giveaways/overview" });
  },
});
