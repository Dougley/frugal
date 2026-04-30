import { SimpleGrid } from "@mantine/core";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface DocGridProps extends ComponentPropsWithoutRef<"div"> {
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

export function DocGrid({
  children,
  cols = 2,
  spacing = "md",
  ...props
}: DocGridProps) {
  return (
    <SimpleGrid cols={cols} spacing={spacing} my="xl" {...props}>
      {children}
    </SimpleGrid>
  );
}
