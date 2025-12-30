import {
  ActionIcon,
  Box,
  Drawer,
  Group,
  rem,
  ScrollArea,
  TableOfContents,
  Text,
  VisuallyHidden,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconList } from "@tabler/icons-react";
import styles from "./TableOfContents.module.css";

const TOC_SELECTOR = "#mdx :is(h1, h2, h3, h4, h5, h6)";

export function TableOfContentsDesktop() {
  return (
    <Box component="nav" pos="sticky" top="var(--mantine-spacing-md)">
      <Group gap="sm" mb="md">
        <IconList
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
          aria-hidden="true"
        />
        <Text fw={500} size="sm">
          Table of contents
        </Text>
      </Group>
      <ScrollArea.Autosize mah="calc(100vh - 120px)" type="never">
        <TableOfContents
          variant="light"
          color="blue"
          radius="sm"
          scrollSpyOptions={{ selector: TOC_SELECTOR }}
          getControlProps={({ data }) => ({
            onClick: () =>
              data.getNode().scrollIntoView({ behavior: "smooth" }),
            children: data.value,
          })}
        />
      </ScrollArea.Autosize>
    </Box>
  );
}

export function TableOfContentsMobile() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Drawer
        opened={opened}
        onClose={close}
        padding="md"
        size="md"
        title="Table of contents"
        position="bottom"
      >
        <TableOfContents
          variant="light"
          color="blue"
          radius="sm"
          scrollSpyOptions={{ selector: TOC_SELECTOR }}
          getControlProps={({ data }) => ({
            onClick: () => {
              close();
              data.getNode().scrollIntoView({ behavior: "smooth" });
            },
            children: data.value,
          })}
        />
      </Drawer>

      <ActionIcon
        variant="default"
        size="xl"
        radius="xl"
        onClick={open}
        hiddenFrom="xl"
        pos="fixed"
        bottom={15}
        left={15}
        className={styles.fabButton}
      >
        <VisuallyHidden>Open table of contents</VisuallyHidden>
        <IconList
          style={{ width: rem(20), height: rem(20) }}
          stroke={1.5}
          aria-hidden="true"
        />
      </ActionIcon>
    </>
  );
}
