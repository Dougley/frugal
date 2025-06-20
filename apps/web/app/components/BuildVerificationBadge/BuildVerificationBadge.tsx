import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconInfoCircle,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useState } from "react";
import type { BuildInfo } from "~/utils/build-info";
import classes from "./BuildVerificationBadge.module.css";

interface BuildVerificationBadgeProps {
  buildInfo: BuildInfo;
}

interface AttestationRowProps {
  label: string;
  attestationId?: string;
}

interface BuildDetailsProps {
  buildInfo: BuildInfo;
}

interface BuildVerificationModalProps {
  opened: boolean;
  onClose: () => void;
  buildInfo: BuildInfo;
}

// Utility functions
const createRepositoryUrls = (repository?: string) => {
  const repoUrl = `https://github.com/${repository || "dougley/frugal"}`;
  return {
    repository: repoUrl,
    workflow: `${repoUrl}/actions`,
    attestation: (id: string) => `${repoUrl}/attestations/${id}`,
  };
};

const formatBuildTime = (buildTime?: string) => {
  if (!buildTime) return "Unknown";
  return new Date(buildTime).toLocaleString();
};

// Sub-components
function AttestationRow({ label, attestationId }: AttestationRowProps) {
  return (
    <Group justify="space-between">
      <Text size="sm">{label}</Text>
      {attestationId ? (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            ID: {attestationId.slice(-8)}
          </Text>
          <CopyButton value={attestationId}>
            {({ copied, copy }) => (
              <ActionIcon
                color={copied ? "teal" : "gray"}
                variant="subtle"
                onClick={copy}
                size="sm"
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
              </ActionIcon>
            )}
          </CopyButton>
        </Group>
      ) : (
        <Badge size="xs" color="green" variant="dot">
          Available
        </Badge>
      )}
    </Group>
  );
}

function BuildDetailsSection({ buildInfo }: BuildDetailsProps) {
  return (
    <div>
      <Text size="sm" fw={500} mb="sm">
        Build Details
      </Text>
      <Group gap="md">
        <div>
          <Text size="xs" c="dimmed">
            Release
          </Text>
          <Code>{buildInfo.release?.slice(0, 8)}</Code>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Environment
          </Text>
          <Badge size="xs" variant="dot">
            {buildInfo.environment || "production"}
          </Badge>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Build Time
          </Text>
          <Text size="xs" fw={500}>
            {formatBuildTime(buildInfo.buildTime)}
          </Text>
        </div>
      </Group>
    </div>
  );
}

function AttestationsSection({ buildInfo }: BuildDetailsProps) {
  return (
    <div>
      <Text size="sm" fw={500} mb="sm">
        Attestation Available
      </Text>
      <Stack gap="xs">
        <AttestationRow
          label="Build Provenance"
          attestationId={buildInfo.attestationId}
        />
      </Stack>
    </div>
  );
}

function BuildVerificationModal({
  opened,
  onClose,
  buildInfo,
}: BuildVerificationModalProps) {
  const [verifying, setVerifying] = useState(false);
  const urls = createRepositoryUrls(buildInfo.repository);

  const handleVerifyAttestation = () => {
    setVerifying(true);
    const attestationUrl = buildInfo.attestationId
      ? urls.attestation(buildInfo.attestationId)
      : undefined;

    if (attestationUrl) {
      window.open(attestationUrl, "_blank");
    }
    setTimeout(() => setVerifying(false), 1000);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Build Verification"
      size="md"
      centered
    >
      <Stack gap="lg">
        <Alert
          icon={<IconShieldCheck size={16} />}
          title="Meets SLSA Level 2 security standards"
          color="green"
          variant="light"
        >
          <Text size="sm" mb="md">
            This application was built using automated, cryptographically signed
            processes that establish verifiable build provenance. Every build is
            tracked and publicly auditable, providing strong supply chain
            security guarantees and ensuring you're getting authentic,
            unmodified software.
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Learn more at
            </Text>
            <Anchor href="https://slsa.dev/spec" target="_blank">
              <Group gap="xs">
                <Text size="xs">slsa.dev/spec</Text>{" "}
                <IconExternalLink size={12} />
              </Group>
            </Anchor>
          </Group>
        </Alert>

        <BuildDetailsSection buildInfo={buildInfo} />
        <AttestationsSection buildInfo={buildInfo} />

        <Group justify="space-between">
          <Button
            variant="light"
            onClick={handleVerifyAttestation}
            loading={verifying}
            leftSection={<IconInfoCircle size={16} />}
            rightSection={<IconExternalLink size={16} />}
            size="sm"
          >
            {buildInfo.attestationId ? "View on GitHub" : "Learn More"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Main component
export function BuildVerificationBadge({
  buildInfo,
}: BuildVerificationBadgeProps) {
  const [opened, { open, close }] = useDisclosure(false);

  // Always show the badge if we have environment info
  if (!buildInfo.environment) {
    return null;
  }

  const hasAttestations = buildInfo.attestationId;
  const buildIdentifier =
    buildInfo.release?.slice(0, 8) || buildInfo.environment;

  return (
    <>
      <Group justify="center" gap="xs">
        {hasAttestations ? (
          <Tooltip
            label="Verifiable build, click to learn more"
            position="top"
            withArrow
          >
            <Badge
              variant="default"
              rightSection={<IconShieldCheck size={12} />}
              className={`${classes.badge} ${classes.subtle}`}
              onClick={open}
              style={{ cursor: "pointer" }}
              size="sm"
            >
              {buildIdentifier}
            </Badge>
          </Tooltip>
        ) : (
          <Badge
            variant="default"
            className={`${classes.badge} ${classes.subtle}`}
            size="sm"
          >
            {buildIdentifier}
          </Badge>
        )}
      </Group>

      {hasAttestations && (
        <BuildVerificationModal
          opened={opened}
          onClose={close}
          buildInfo={buildInfo}
        />
      )}
    </>
  );
}
