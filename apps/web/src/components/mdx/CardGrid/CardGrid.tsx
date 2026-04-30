import { SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./CardGrid.module.css";

interface CardGridProps {
  children: ReactNode;
  cols?:
    | number
    | {
        base?: number;
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
      };
  spacing?: string | number;
}

export function CardGrid({
  children,
  cols = { base: 1, sm: 2, lg: 3 },
  spacing = "lg",
}: CardGridProps) {
  return (
    <SimpleGrid cols={cols} spacing={spacing} my="xl" className={styles.grid}>
      {children}
    </SimpleGrid>
  );
}
