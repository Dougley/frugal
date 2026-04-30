import { AppShell, rem, useMantineColorScheme } from "@mantine/core";
import { useHeadroom, useHotkeys, useMediaQuery } from "@mantine/hooks";
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
  const isMobile = useMediaQuery("(max-width: 48em)") ?? false;

  return (
    <AppShell
      layout="alt"
      withBorder={false}
      header={{
        height: 60,
        collapsed: isMobile ? !pinned : true,
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
          pt={
            isMobile
              ? `calc(${rem(60)} + var(--mantine-spacing-md))`
              : undefined
          }
        >
          <div
            style={{
              minHeight: "85vh",
              width: "100%",
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
