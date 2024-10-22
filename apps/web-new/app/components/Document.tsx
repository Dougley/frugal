import { useRouteLoaderData } from "@remix-run/react";
import { Toaster } from "react-hot-toast";
import { DrawerProvider, useDrawer } from "./contexts/DrawerContext";
import { Theme, ThemeProvider } from "./contexts/ThemeContext";
import { DrawerMenu } from "./DrawerMenu";
import { FooterContent } from "./FooterContent";
import { GlobalLoading } from "./GlobalLoading";
import { Navbar } from "./Navbar";

export function Document({ children }: React.PropsWithChildren<{}>) {
  const data = useRouteLoaderData<{
    theme: Theme;
  }>("root");
  const theme = data?.theme;
  return (
    <ThemeProvider wantedTheme={theme ?? null}>
      <DrawerProvider>
        <div className="remix-app">
          <div className="remix-app-main">
            <Toaster
              toastOptions={{
                style: {
                  background: "oklch(var(--b1))",
                  color: "oklch(var(--bc))",
                },
              }}
            />
            <div className="drawer xl:drawer-open">
              <DrawerContent>{children}</DrawerContent>
            </div>
          </div>
        </div>
      </DrawerProvider>
    </ThemeProvider>
  );
}

const DrawerContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isDrawerOpen, toggleDrawer } = useDrawer();

  return (
    <>
      <input
        readOnly
        id="drawer-sidemenu"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onClick={toggleDrawer}
      />
      <div className="drawer-content">
        <div className="sticky top-0 z-[35] flex h-16 w-full justify-center bg-base-300 bg-opacity-90 text-base-content shadow-sm backdrop-blur xl:hidden">
          <Navbar />
        </div>
        <main className="remix-app-main-content container mx-auto p-4">
          <GlobalLoading />
          {children}
        </main>
        <div className="remix-app-main-footer">
          <FooterContent />
        </div>
      </div>
      <div className="drawer-side z-40 min-h-screen">
        <label htmlFor="drawer-sidemenu" className="drawer-overlay"></label>
        <DrawerMenu />
      </div>
    </>
  );
};
