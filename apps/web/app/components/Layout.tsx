import { FooterContent } from "~/components/FooterContent";
import { HeaderContent } from "~/components/HeaderContent";

export function Layout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="remix-app">
      <header className="remix-app-header">
        <HeaderContent />
      </header>
      <div className="remix-app-main container mx-auto">
        <main className="remix-app-main-content">{children}</main>
      </div>
      <footer className="remix-app-main-footer">
        <FooterContent />
      </footer>
    </div>
  );
}
