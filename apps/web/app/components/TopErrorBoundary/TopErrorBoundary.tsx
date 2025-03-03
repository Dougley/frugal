import { Anchor, Box, Flex, Text } from "@mantine/core";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import {
  IconAlertTriangle,
  IconCoins,
  IconExclamationMark,
  IconFileUnknown,
  IconLockX,
} from "@tabler/icons-react";
import styles from "./TopErrorBoundary.module.css";

export function TopErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    let message;
    switch (error.status) {
      // 4xx errors only
      case 403: // Forbidden
        message = "The Maze Master doesn't want you here. Seek another path.";
        break;
      case 404: // Not Found
        message = "This page doesn't exist. Did you get lost?";
        break;
      case 401: // Unauthorized
        message = "You're not authorized to view this page, are you logged in?";
        break;
      case 402: // Payment Required
        message = (
          <Flex direction="column" align="center" justify="center">
            <Text>This page needs a premium subscription.</Text>
            <Anchor
              href="/premium"
              renderRoot={(props) => <Link to="/premium" {...props} />}
            >
              Get one now!
            </Anchor>
            <Text size="xs" c="dimmed">
              Already have one? Make sure you're logged in.
            </Text>
          </Flex>
        );
        break;
      default: // Other 4xx
        message = "Something went wrong.";
        break;
    }
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        className={styles.container}
      >
        <Box className={styles.inner}>
          <Flex direction="column" align="center" justify="center">
            {{
              403: <IconAlertTriangle size={75} />, // Forbidden
              404: <IconFileUnknown size={75} />, // Not Found
              401: <IconLockX size={75} />, // Unauthorized
              402: <IconCoins size={75} />, // Payment Required
            }[error.status] ?? <IconExclamationMark size={75} />}
          </Flex>
          <Flex direction="column" align="center" justify="center">
            <Text className={styles.status}>{error.status}</Text>
            <Text size="md" fw={600} mt={3}>
              {error.statusText}
            </Text>
            <Text py={6}>{message}</Text>
          </Flex>
        </Box>
      </Flex>
    );
  }
}
