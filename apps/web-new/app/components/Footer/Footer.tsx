import { ActionIcon, Anchor, Container, Flex, Text } from "@mantine/core";
import { IconBrandBluesky, IconBrandGithub } from "@tabler/icons-react";
import Logo from "../DougleyLogo/DougleyLogo";
import { FeedbackButton } from "../FeedbackButton/FeedbackButton";
import classes from "./Footer.module.css";

const social = [
  {
    link: "https://bsky.app/profile/did:plc:pjo7hpzugbss3q4zh6aebkar",
    label: "Bluesky",
    icon: <IconBrandBluesky />,
  },
  {
    link: "https://github.com/Dougley/frugal",
    label: "Github",
    icon: <IconBrandGithub />,
  },
];

export function Footer() {
  const socialItems = social.map((link) => (
    <ActionIcon color="dimmed" radius="xl" size="xl" key={link.label}>
      <Anchor
        c="dimmed"
        href={link.link}
        size="sm"
        target="_blank"
        aria-label={link.label}
      >
        {link.icon}
      </Anchor>
    </ActionIcon>
  ));

  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <Anchor
          c="dimmed"
          href="https://dougley.com"
          size="sm"
          aria-label="Dougley"
          target="_blank"
        >
          <Logo />
        </Anchor>
        <Flex direction="column" gap="xs" align="center">
          <Text c="dimmed" size="sm">
            © {new Date().getFullYear()} Dougley
          </Text>
          <FeedbackButton />
        </Flex>
        <Flex gap="md" align="center" justify="flex-end">
          <ActionIcon.Group>{socialItems}</ActionIcon.Group>
        </Flex>
      </Container>
    </div>
  );
}
