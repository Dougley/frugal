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
import { Form, useLocation } from "react-router";

export function NotLoggedIn() {
  const location = useLocation();
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
                <IconUserQuestion size={64} />
                <Text size="lg" fw={900}>
                  You&apos;re logged out.
                </Text>
              </Flex>
              <Stack align="center" justify="center">
                <Text>You must be logged in to do this.</Text>
                <Form
                  action={`/api/auth/login/discord?returnTo=${encodeURIComponent(
                    location.pathname + location.search
                  )}`}
                  method="post"
                >
                  <Button
                    type="submit"
                    leftSection={<IconLogin size={14} />}
                    variant="outline"
                  >
                    Login
                  </Button>
                </Form>
              </Stack>
            </Card>
          ),
        }}
      />
      <Stack align="center" justify="center">
        <Skeleton height={50} animate={false} mt={12} width="70%" radius="xl" />
        {[...Array(20)].map((_, _i) => {
          // vary the width of the skeleton
          // so it appears as if the page is loading
          // and not just a static page.
          // width should not be more than 70%
          // and should not be less than 50%
          const width = Math.random() * 20 + 50;
          return (
            <Skeleton
              key={crypto.randomUUID()}
              height={8}
              mt={6}
              width={`${width}%`}
              radius="xl"
              animate={false}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
