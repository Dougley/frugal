import { IconFileUnknown } from "@tabler/icons-react";
import styles from "./RouterNotFound.module.css";

/**
 * Minimal 404 component for the router's defaultNotFoundComponent.
 *
 * This is rendered at the router level BEFORE providers are available,
 * so it cannot use i18n or context-dependent features.
 */
export function RouterNotFound() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          <IconFileUnknown size={48} />
        </div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" className={styles.link}>
          Go Home
        </a>
      </div>
    </main>
  );
}
