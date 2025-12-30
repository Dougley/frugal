import { ActionIcon, Anchor, Container, Flex, Text } from "@mantine/core";
import { IconBrandBluesky, IconBrandGithub } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { BuildInfoBadge } from "../BuildInfoBadge/BuildInfoBadge";
import Logo from "../DougleyLogo/DougleyLogo";
import { FeedbackButton } from "../FeedbackButton/FeedbackButton";
import classes from "./Footer.module.css";

export function Footer() {
  const { t } = useTranslation();

  // Build info from Vite environment variables (static at build time)
  const buildInfo = {
    commitSha: import.meta.env.VITE_RELEASE,
    environment: import.meta.env.VITE_ENVIRONMENT,
  };

  const social = [
    {
      link: "https://bsky.app/profile/did:plc:pjo7hpzugbss3q4zh6aebkar",
      label: t("footer.bluesky"),
      icon: <IconBrandBluesky aria-hidden="true" />,
    },
    {
      link: "https://github.com/Dougley/frugal",
      label: t("footer.github"),
      icon: <IconBrandGithub aria-hidden="true" />,
    },
  ];

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
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </Text>
          {buildInfo.commitSha && <BuildInfoBadge buildInfo={buildInfo} />}
          <FeedbackButton />
        </Flex>
        <Flex gap="md" align="center" justify="flex-end">
          <ActionIcon.Group>{socialItems}</ActionIcon.Group>
        </Flex>
      </Container>
    </div>
  );
}
