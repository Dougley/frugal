import { DrawerProvider } from "./DrawerContext";

export default function Index({ children }: { children: React.ReactNode }) {
  return <DrawerProvider>{children}</DrawerProvider>;
}
