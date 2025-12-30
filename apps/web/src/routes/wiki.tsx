import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WikiNotFound } from "~/components/WikiNotFound";

export const Route = createFileRoute("/wiki")({
  component: WikiLayout,
  errorComponent: WikiErrorComponent,
  notFoundComponent: WikiNotFound,
});

function WikiLayout() {
  return <Outlet />;
}

function WikiErrorComponent({ error }: { error: Error }) {
  // Check if this is an MDX content not found error
  const isMdxNotFound = error.message.includes("MDX content not found");

  if (isMdxNotFound) {
    return <WikiNotFound />;
  }

  // Re-throw other errors to be handled by the root error boundary
  throw error;
}
