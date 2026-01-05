import { Box, Flex, Loader, VisuallyHidden } from "@mantine/core";
import styles from "./RouterPending.module.css";

/**
 * Loading component for the router's defaultPendingComponent.
 *
 * Uses Mantine's Loader which renders as a standalone SVG
 * and doesn't require MantineProvider context.
 */
export function RouterPending() {
  return (
    <Box className={styles.container} role="status" aria-live="polite">
      <Flex justify="center" align="center" h="100vh">
        <Loader size="lg" color="teal" />
        {/* Screen reader only text */}
        <VisuallyHidden>Loading...</VisuallyHidden>
      </Flex>
    </Box>
  );
}
