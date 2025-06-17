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
        Attestations Available
      </Text>
      <Stack gap="xs">
        <AttestationRow
          label="Build Provenance"
          attestationId={buildInfo.attestationId}
        />
        <AttestationRow
          label="Dependencies (SBOM)"
          attestationId={buildInfo.sbomAttestationId}
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
          title="Meets SLSA Level 3 security standards"
          color="green"
          variant="light"
        >
          <Text size="sm" mb="md">
            This application was built using automated, cryptographically signed
            processes that guarantee the code hasn't been tampered with. Every
            build is verified and publicly auditable, protecting against malware
            and ensuring you're getting authentic, unmodified software.
          </Text>
          <Text size="xs" c="dimmed">
            Learn more at{" "}
            <Anchor href="https://slsa.dev/spec" target="_blank">
              slsa.dev/spec
            </Anchor>
          </Text>
        </Alert>

        <BuildDetailsSection buildInfo={buildInfo} />
        <AttestationsSection buildInfo={buildInfo} />

        <Group justify="space-between">
          <Group gap="sm">
            <Anchor
              href={urls.workflow}
              target="_blank"
              size="sm"
              rel="noopener noreferrer"
            >
              <Group gap={4}>
                <IconExternalLink size={14} />
                <Text size="sm">Workflows</Text>
              </Group>
            </Anchor>
            <Anchor
              href={urls.repository}
              target="_blank"
              size="sm"
              rel="noopener noreferrer"
            >
              <Group gap={4}>
                <IconExternalLink size={14} />
                <Text size="sm">Source</Text>
              </Group>
            </Anchor>
          </Group>
          <Button
            variant="light"
            onClick={handleVerifyAttestation}
            loading={verifying}
            leftSection={<IconInfoCircle size={16} />}
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

  if (!buildInfo.release) {
    return null;
  }

  return (
    <>
      <Group justify="center" gap="xs">
        <Text size="sm" c="dimmed">
          {buildInfo.release.slice(0, 8)}
        </Text>
        <Tooltip
          label="Verifiable build, click to learn more"
          position="top"
          withArrow
        >
          <Badge
            variant="default"
            leftSection={<IconShieldCheck size={12} />}
            className={`${classes.badge} ${classes.subtle}`}
            onClick={open}
            style={{ cursor: "pointer" }}
            size="sm"
          >
            Signed
          </Badge>
        </Tooltip>
      </Group>

      <BuildVerificationModal
        opened={opened}
        onClose={close}
        buildInfo={buildInfo}
      />
    </>
  );
}
