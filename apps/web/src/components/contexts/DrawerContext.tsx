import { useDisclosure } from "@mantine/hooks";
import type React from "react";
import { createContext, useContext, useMemo } from "react";

interface DrawerContextType {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  openDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDrawerOpen, { toggle, open, close }] = useDisclosure();

  const value = useMemo(
    () => ({
      isDrawerOpen,
      toggleDrawer: toggle,
      closeDrawer: close,
      openDrawer: open,
    }),
    [isDrawerOpen, toggle, open, close]
  );

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
};
