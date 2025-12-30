import { nprogress } from "@mantine/nprogress";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export function GlobalLoading({ children }: { children: React.ReactNode }) {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  useEffect(() => {
    if (isLoading) {
      nprogress.start();
    } else {
      nprogress.complete();
    }
  }, [isLoading]);

  return <>{children}</>;
}
