import { Box, Tabs } from "@mantine/core";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { DocIcon } from "../DocIcon/DocIcon";
import styles from "./CodeTabs.module.css";

interface CodeTabsProps {
  children: ReactNode;
  defaultValue?: string;
}

interface CodeTabProps {
  label: string;
  value?: string;
  language?: string;
  children: ReactNode;
}

export function CodeTab({ children }: CodeTabProps) {
  // This is just a marker component, the actual rendering is done by CodeTabs
  return <>{children}</>;
}

export function CodeTabs({ children, defaultValue }: CodeTabsProps) {
  const tabs = Children.toArray(children).filter(
    (child) =>
      isValidElement(child) &&
      ((child.type as { name?: string }).name === "CodeTab" ||
        child.type === CodeTab)
  ) as ReactElement<CodeTabProps>[];

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
              // for the leftSection, see if we can infer a language icon from the language prop
              <Tabs.Tab
                key={tabValue}
                value={tabValue}
                ff="monospace"
                fz="sm"
                leftSection={
                  tab.props.language ? (
                    <DocIcon name={`brand-${tab.props.language}`} />
                  ) : null
                }
              >
                {tab.props.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {tabs.map((tab) => {
          const tabValue = tab.props.value || tab.props.label;
          return (
            <Tabs.Panel
              key={tabValue}
              value={tabValue}
              className={styles.tabPanel}
            >
              <Box className={styles.tabPanelContent}>{tab.props.children}</Box>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Box>
  );
}
