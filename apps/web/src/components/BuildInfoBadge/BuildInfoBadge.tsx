import {
  Anchor,
  Badge,
  Code,
  Group,
  HoverCard,
  Stack,
  Text,
} from "@mantine/core";
import { IconExternalLink, IconGitCommit } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLocalizedDayjs } from "~/lib/dayjs";
import { type BuildInfo, getBuildUrls, hasBuildInfo } from "~/utils/build-info";
import classes from "./BuildInfoBadge.module.css";

interface BuildInfoBadgeProps {
  buildInfo: BuildInfo;
}

function BuildDetails({ buildInfo }: { buildInfo: BuildInfo }) {
  const { t } = useTranslation();
  const dayjs = useLocalizedDayjs();
  const urls = getBuildUrls(buildInfo);
  const buildTime = buildInfo.buildTime
    ? dayjs(buildInfo.buildTime).format("L LT")
    : null;

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {t("buildInfo.title")}
      </Text>

      {buildInfo.commitSha && (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {t("buildInfo.commit")}
          </Text>
          <Anchor href={urls.commit} target="_blank" size="xs">
            <Group gap={4}>
              <Code>{buildInfo.commitSha.slice(0, 7)}</Code>
              <IconExternalLink size={12} aria-hidden="true" />
            </Group>
          </Anchor>
        </Group>
      )}

      {buildInfo.deploymentId && (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {t("buildInfo.deployment")}
          </Text>
          <Code>{buildInfo.deploymentId.slice(0, 8)}</Code>
        </Group>
      )}

      {buildInfo.environment && (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {t("buildInfo.environment")}
          </Text>
          <Badge size="xs" variant="dot">
            {buildInfo.environment}
          </Badge>
        </Group>
      )}

      {buildTime && (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {t("buildInfo.built")}
          </Text>
          <Text size="xs">{buildTime}</Text>
        </Group>
      )}

      <Anchor href={urls.workflow} target="_blank" size="xs" mt="xs">
        <Group gap={4}>
          <Text size="xs">{t("buildInfo.viewWorkflow")}</Text>
          <IconExternalLink size={12} aria-hidden="true" />
        </Group>
      </Anchor>
    </Stack>
  );
}

export function BuildInfoBadge({ buildInfo }: BuildInfoBadgeProps) {
  // Don't render if we have no useful info
  if (!hasBuildInfo(buildInfo) && !buildInfo.environment) {
    return null;
  }

  const displayText =
    buildInfo.commitSha?.slice(0, 7) || buildInfo.environment || "dev";

  return (
    <HoverCard width={280} shadow="md" withArrow openDelay={200}>
      <HoverCard.Target>
        <Badge
          variant="default"
          leftSection={<IconGitCommit size={12} aria-hidden="true" />}
          className={`${classes.badge} ${classes.subtle}`}
          style={{ cursor: "pointer" }}
          size="sm"
        >
          {displayText}
        </Badge>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <BuildDetails buildInfo={buildInfo} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
