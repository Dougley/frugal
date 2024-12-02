import { ActionIcon, Anchor, Container, Group } from "@mantine/core";
import { IconBrandBluesky, IconBrandGithub } from "@tabler/icons-react";
import Logo from "../DougleyLogo/DougleyLogo";
import classes from "./Footer.module.css";

const links = [
  { link: "https://dougley.com/discord/terms", label: "Terms of Service" },
  { link: "https://dougley.com/discord/privacy", label: "Privacy Policy" },
];

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
  const items = links.map((link) => (
    <Anchor<"a">
      c="dimmed"
      key={link.label}
      href={link.link}
      aria-label={link.label}
      onClick={(event) => event.preventDefault()}
      size="sm"
      target="_blank"
    >
      {link.label}
    </Anchor>
  ));

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
        <Anchor<"a">
          c="dimmed"
          href="https://dougley.com"
          size="sm"
          aria-label="Dougley"
          target="_blank"
        >
          <Logo />
        </Anchor>
        <Group className={classes.links}>{items}</Group>
        <ActionIcon.Group>{socialItems}</ActionIcon.Group>
      </Container>
    </div>
  );
}
