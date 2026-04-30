import { Box, Tabs } from "@mantine/core";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./DocTabs.module.css";

interface DocTabsProps {
  children: ReactNode;
  defaultValue?: string;
}

interface TabItemProps {
  label: string;
  value?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function TabItem({ children }: TabItemProps) {
  // This is just a marker component, the actual rendering is done by DocTabs
  return <>{children}</>;
}

export function DocTabs({ children, defaultValue }: DocTabsProps) {
  const tabs = Children.toArray(children).filter(
    (child) =>
      isValidElement(child) &&
      ((child.type as { name?: string }).name === "TabItem" ||
        child.type === TabItem)
  ) as ReactElement<TabItemProps>[];

  if (tabs.length === 0) {
    return <Box my="xl">{children}</Box>;
  }

  const firstValue = tabs[0].props.value || tabs[0].props.label;
  const activeTab = defaultValue || firstValue;

  return (
    <Box my="xl" className={styles.container}>
      <Tabs defaultValue={activeTab} variant="pills">
        <Tabs.List className={styles.tabsList}>
          {tabs.map((tab) => {
            const tabValue = tab.props.value || tab.props.label;
            return (
              <Tabs.Tab
                key={tabValue}
                value={tabValue}
                leftSection={tab.props.icon}
              >
                {tab.props.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {tabs.map((tab) => {
          const tabValue = tab.props.value || tab.props.label;
          return (
            <Tabs.Panel key={tabValue} value={tabValue} p="md">
              {tab.props.children}
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Box>
  );
}
