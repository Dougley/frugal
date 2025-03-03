import { useDisclosure } from "@mantine/hooks";
import React, { createContext, useContext } from "react";

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
  const toggleDrawer = toggle;
  const closeDrawer = close;
  const openDrawer = open;

  return (
    <DrawerContext.Provider
      value={{ isDrawerOpen, toggleDrawer, closeDrawer, openDrawer }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
};
