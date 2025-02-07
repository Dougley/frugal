import {
  ActionIcon,
  Box,
  Drawer,
  TableOfContents,
  Text,
  VisuallyHidden,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconList } from "@tabler/icons-react";
import classes from "./TableOfContents.module.css";

interface TableOfContentsProps {}

export function TableOfContentsNav({}: TableOfContentsProps) {
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
          classNames={classes}
          variant="light"
          color="blue"
          radius="sm"
          scrollSpyOptions={{
            selector: "#mdx :is(h1, h2, h3, h4, h5, h6)",
          }}
          getControlProps={({ data }) => ({
            onClick: () => {
              close();
              data.getNode().scrollIntoView();
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
        className={classes.mobileFob}
      >
        <VisuallyHidden>Open table of contents</VisuallyHidden>
        <IconList style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      </ActionIcon>

      <Box component="nav" className={classes.wrapper}>
        <div className={classes.header}>
          <IconList style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
          <Text className={classes.title}>Table of contents</Text>
        </div>
        <TableOfContents
          classNames={classes}
          variant="light"
          color="blue"
          radius="sm"
          scrollSpyOptions={{
            selector: "#mdx :is(h1, h2, h3, h4, h5, h6)",
          }}
          getControlProps={({ data }) => ({
            onClick: () => data.getNode().scrollIntoView(),
            children: data.value,
          })}
        />
      </Box>
    </>
  );
}
