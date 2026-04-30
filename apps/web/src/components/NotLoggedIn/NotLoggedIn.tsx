import {
  Box,
  Button,
  Card,
  Flex,
  LoadingOverlay,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconLogin, IconUserQuestion } from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { signIn } from "~/server/auth/client";

export function NotLoggedIn() {
  const { t } = useTranslation();
  const location = useLocation();
  const returnTo = location.href;

  const handleLogin = async () => {
    await signIn.social({
      provider: "discord",
      callbackURL: returnTo || "/",
    });
  };

  return (
    <Box pos="relative" h="100vh" w="100%">
      <LoadingOverlay
        visible={true}
        zIndex={1}
        overlayProps={{ radius: "sm", blur: 5, backgroundOpacity: 0 }}
        loaderProps={{
          children: (
            <Card shadow="sm" radius="md" withBorder>
              <Flex direction="column" align="center" justify="center">
                <IconUserQuestion size={64} aria-hidden="true" />
                <Text size="lg" fw={900}>
                  {t("auth.loggedOut")}
                </Text>
              </Flex>
              <Stack align="center" justify="center">
                <Text>{t("auth.mustBeLoggedIn")}</Text>
                <Button
                  leftSection={<IconLogin size={14} aria-hidden="true" />}
                  variant="outline"
                  onClick={handleLogin}
                >
                  {t("auth.login")}
                </Button>
              </Stack>
            </Card>
          ),
        }}
      />
      <Stack align="center" justify="center">
        <Skeleton height={50} animate={false} mt={12} width="70%" radius="xl" />
        {[
          "65a",
          "58b",
          "52c",
          "70d",
          "55e",
          "62f",
          "50g",
          "68h",
          "54i",
          "60j",
          "57k",
          "66l",
          "53m",
          "69n",
          "51o",
          "63p",
          "59q",
          "67r",
          "56s",
          "64t",
        ].map((key) => (
          <Skeleton
            key={key}
            height={8}
            mt={6}
            width={`${Number.parseInt(key, 10)}%`}
            radius="xl"
            animate={false}
          />
        ))}
      </Stack>
    </Box>
  );
}
