import { ActionIcon, Anchor, Container, Flex, Text } from "@mantine/core";
import { IconBrandBluesky, IconBrandGithub } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BuildInfoBadge } from "../BuildInfoBadge/BuildInfoBadge";
import Logo from "../DougleyLogo/DougleyLogo";
import { FeedbackButton } from "../FeedbackButton/FeedbackButton";
import classes from "./Footer.module.css";

// Access router context for tRPC
const Route = createFileRoute("/")();

export function Footer() {
  const { t } = useTranslation();
  const { trpc } = Route.useRouteContext();

  // Use useQuery with infinite staleTime for static build info
  const { data: buildInfo } = useQuery({
    ...trpc.app.getBuildInfo.queryOptions(),
    staleTime: Number.POSITIVE_INFINITY,
  });

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
          {buildInfo && <BuildInfoBadge buildInfo={buildInfo} />}
          <FeedbackButton />
        </Flex>
        <Flex gap="md" align="center" justify="flex-end">
          <ActionIcon.Group>{socialItems}</ActionIcon.Group>
        </Flex>
      </Container>
    </div>
  );
}
