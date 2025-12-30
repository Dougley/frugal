import { Card, Container, rem, SimpleGrid, Text, Title } from "@mantine/core";
import {
  IconBrandDiscord,
  IconBrandGithub,
  IconGauge,
  IconHeartDollar,
  IconLanguage,
  IconLock,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./LandingFeatures.module.css";

interface FeatureCardProps {
  icon: typeof IconGauge;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card shadow="md" radius="md" className={classes.card} padding="xl">
      <Icon
        style={{ width: rem(50), height: rem(50) }}
        stroke={2}
        aria-hidden="true"
      />
      <Text fz="lg" fw={500} className={classes.cardTitle} mt="md">
        {title}
      </Text>
      <Text fz="sm" c="dimmed" mt="sm">
        {description}
      </Text>
    </Card>
  );
}

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>{t("landing.features.title")}</Title>

      <Container size={560} p={0}>
        <Text size="sm" className={classes.description}>
          {t("landing.features.description")}
        </Text>
      </Container>

      <SimpleGrid
        mt={60}
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: "xl", md: 50 }}
        verticalSpacing={{ base: "xl", md: 50 }}
      >
        <FeatureCard
          icon={IconGauge}
          title={t("landing.features.effortless.title")}
          description={t("landing.features.effortless.description")}
        />
        <FeatureCard
          icon={IconBrandDiscord}
          title={t("landing.features.seamless.title")}
          description={t("landing.features.seamless.description")}
        />
        <FeatureCard
          icon={IconLock}
          title={t("landing.features.secure.title")}
          description={t("landing.features.secure.description")}
        />
        <FeatureCard
          icon={IconBrandGithub}
          title={t("landing.features.openSource.title")}
          description={t("landing.features.openSource.description")}
        />
        <FeatureCard
          icon={IconHeartDollar}
          title={t("landing.features.free.title")}
          description={t("landing.features.free.description")}
        />
        <FeatureCard
          icon={IconLanguage}
          title={t("landing.features.multilingual.title")}
          description={t("landing.features.multilingual.description")}
        />
      </SimpleGrid>
    </Container>
  );
}
