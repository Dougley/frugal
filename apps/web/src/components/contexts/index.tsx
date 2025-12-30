import { DrawerProvider } from "./DrawerContext";

export default function Contexts({ children }: { children: React.ReactNode }) {
  return <DrawerProvider>{children}</DrawerProvider>;
}
