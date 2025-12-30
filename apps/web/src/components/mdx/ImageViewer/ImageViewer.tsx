import { Modal } from "@mantine/core";
import { type ReactNode, useState } from "react";
import styles from "./ImageViewer.module.css";

interface ImageViewerProps {
  opened: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

interface ClickableImageProps {
  src?: string;
  alt?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

// Shared keyboard handler
// For opening: Enter and Space (standard button behavior)
// For closing: Enter, Space, and Escape (user-friendly for dismissing)
function createKeyDownHandler(callback: () => void, allowEscape = false) {
  return (event: React.KeyboardEvent) => {
    const shouldTrigger =
      event.key === "Enter" ||
      event.key === " " ||
      (allowEscape && event.key === "Escape");

    if (shouldTrigger) {
      event.preventDefault();
      callback();
    }
  };
}

export function ImageViewer({ opened, onClose, src, alt }: ImageViewerProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="auto"
      padding={0}
      withCloseButton
      centered
      styles={{
        body: {
          padding: 0,
        },
        content: {
          backgroundColor: "transparent",
          boxShadow: "none",
        },
      }}
      overlayProps={{
        backgroundOpacity: 0.95,
        blur: 3,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        onKeyDown={createKeyDownHandler(onClose, true)}
        className={`${styles.button} ${styles.zoomOutButton}`}
        aria-label={
          alt ? `Close expanded view of ${alt}` : "Close expanded image"
        }
      >
        <img src={src} alt={alt ?? ""} className={styles.modalImage} />
      </button>
    </Modal>
  );
}

export function ClickableImage({
  src,
  alt,
  children,
  ...props
}: ClickableImageProps) {
  const [opened, setOpened] = useState(false);

  const handleOpen = () => setOpened(true);

  if (!src) {
    return <img alt={alt ?? ""} {...props} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onKeyDown={createKeyDownHandler(handleOpen)}
        className={`${styles.button} ${styles.zoomInButton}`}
        aria-label={alt ? `Expand image: ${alt}` : "Expand image"}
      >
        <img
          src={src}
          alt={alt ?? ""}
          {...props}
          className={styles.thumbnailImage}
          style={props.style as object}
        />
      </button>
      <ImageViewer
        opened={opened}
        onClose={() => setOpened(false)}
        src={src}
        alt={alt}
      />
    </>
  );
}
