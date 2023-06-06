import { Toaster } from "react-hot-toast";
import { FooterContent } from "~/components/FooterContent";
import { DrawerMenu } from "./DrawerMenu";
import { Navbar } from "./Navbar";

export function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="remix-app">
      <div className="remix-app-main">
        <Toaster
          toastOptions={{
            style: {
              background: "hsl(var(--b1))",
              color: "hsl(var(--bc))",
            },
          }}
        />
        <div className="drawer xl:drawer-open">
          <input
            id="drawer-sidemenu"
            type="checkbox"
            className="drawer-toggle"
          />
          <div className="drawer-content">
            <div className="sticky top-0 z-20 flex h-16 w-full justify-center bg-base-300 bg-opacity-90 text-base-content shadow-sm backdrop-blur xl:hidden">
              <Navbar />
            </div>
            <main className="remix-app-main-content container mx-auto px-4">
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
        </div>
      </div>
    </div>
  );
}
