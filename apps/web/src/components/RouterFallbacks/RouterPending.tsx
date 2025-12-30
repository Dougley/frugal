import { Loader, VisuallyHidden } from "@mantine/core";
import styles from "./RouterPending.module.css";

/**
 * Loading component for the router's defaultPendingComponent.
 *
 * Uses Mantine's Loader which renders as a standalone SVG
 * and doesn't require MantineProvider context.
 */
export function RouterPending() {
  return (
    <div className={styles.container}>
      <Loader size="lg" color="teal" />
      {/* Screen reader only text */}
      <VisuallyHidden>Loading...</VisuallyHidden>
    </div>
  );
}
