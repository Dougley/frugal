import { Tabs, Box } from "@mantine/core";
import {
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from "react";

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
    <Box
      my="xl"
      style={{
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
      }}
    >
      <Tabs defaultValue={activeTab} variant="pills">
        <Tabs.List
          style={{
            backgroundColor: "var(--mantine-color-default)",
            padding: "var(--mantine-spacing-xs)",
            margin: 0,
            borderBottom: "none",
          }}
        >
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
