import { Card } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import type { ReactNode } from "react";
import styles from "./HoverCard.module.css";

export interface HoverCardProps {
  /** Card content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
  /** Custom styles to merge with hover card styles */
  style?: React.CSSProperties;
  /** Card padding */
  padding?: string | number;
  /** Whether to show border */
  withBorder?: boolean;
  /** Card shadow */
  shadow?: string;
  /** Card radius */
  radius?: string | number;
  /** Any other props */
  [key: string]: any;
}

export function HoverCard({
  children,
  className,
  style,
  padding,
  withBorder = true,
  shadow = "sm",
  radius = "md",
  ...others
}: HoverCardProps) {
  const { hovered, ref } = useHover();

  return (
    <Card
      ref={ref}
      shadow={shadow}
      radius={radius}
      withBorder={withBorder}
      padding={padding}
      className={`${styles.card} ${className || ""}`}
      data-hovered={hovered}
      style={style}
      {...others}
    >
      {children}
    </Card>
  );
}

export { styles as hoverCardStyles };
