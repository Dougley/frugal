import { Toaster } from "react-hot-toast";
import { FooterContent } from "~/components/FooterContent";
import { HeaderContent } from "~/components/HeaderContent";

export function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="remix-app">
      <header className="remix-app-header">
        <HeaderContent />
      </header>
      <div className="remix-app-main container mx-auto px-4">
        <Toaster
          toastOptions={{
            style: {
              background: "hsl(var(--b1))",
              color: "hsl(var(--bc))",
            },
          }}
        />
        <main className="remix-app-main-content">{children}</main>
      </div>
      <footer className="remix-app-main-footer">
        <FooterContent />
      </footer>
    </div>
  );
}
