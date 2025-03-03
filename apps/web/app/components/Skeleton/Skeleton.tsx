import { AppShell, rem, useMantineColorScheme } from "@mantine/core";
import { useHeadroom, useHotkeys } from "@mantine/hooks";
import { useDrawer } from "../contexts/DrawerContext";
import { Footer } from "../Footer/Footer";
import { GlobalLoading } from "../GlobalLoading/GlobalLoading";
import { Header } from "../Header/Header";
import { Navbar } from "../Navbar/Navbar";
import styles from "./Skeleton.module.css";

export function Skeleton({ children }: { children: React.ReactNode }) {
  const { isDrawerOpen, toggleDrawer } = useDrawer();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  useHotkeys([
    ["mod+/", () => toggleDrawer()],
    ["mod+j", () => setColorScheme(colorScheme === "dark" ? "light" : "dark")],
  ]);

  const pinned = useHeadroom({ fixedAt: 120 });

  return (
    <AppShell
      layout="alt"
      withBorder
      header={{
        height: 60,
        collapsed: !pinned,
        offset: false,
      }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !isDrawerOpen },
      }}
      padding="md"
    >
      <GlobalLoading>
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        <AppShell.Navbar p="md" className={styles.navbar}>
          <Navbar />
        </AppShell.Navbar>
        <AppShell.Main
          className={styles.main}
          pt={`calc(${rem(60)} + var(--mantine-spacing-md))`}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
            }}
          >
            {children}
          </div>
          <Footer />
        </AppShell.Main>
      </GlobalLoading>
    </AppShell>
  );
}
