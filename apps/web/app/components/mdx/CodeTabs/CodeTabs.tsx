import { Box, Tabs } from "@mantine/core";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { DocIcon } from "../DocIcon/DocIcon";

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
              style={{
                padding: 0,
                margin: "0",
              }}
            >
              <Box
                style={{
                  root: {
                    "& .mantine-CodeHighlight-root": {
                      border: "none !important",
                      borderRadius: "0 !important",
                      margin: "0 !important",
                    },
                    "& .mantine-CodeHighlight-code": {
                      borderRadius: "0 !important",
                    },
                    "& pre": {
                      margin: "0 !important",
                      borderRadius: "0 !important",
                    },
                  },
                }}
              >
                {tab.props.children}
              </Box>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Box>
  );
}
