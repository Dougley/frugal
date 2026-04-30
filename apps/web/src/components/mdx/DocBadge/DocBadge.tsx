import { Badge } from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";

type BadgeVariant =
  | "new"
  | "beta"
  | "deprecated"
  | "experimental"
  | "stable"
  | "preview"
  | "updated"
  | "default";

interface DocBadgeProps
  extends Omit<ComponentPropsWithoutRef<"span">, "color"> {
  variant?: BadgeVariant;
  text?: string;
}

const variantConfig: Record<BadgeVariant, { color: string; label: string }> = {
  new: { color: "lime", label: "New" },
  beta: { color: "cyan", label: "Beta" },
  deprecated: { color: "red", label: "Deprecated" },
  experimental: { color: "orange", label: "Experimental" },
  stable: { color: "indigo", label: "Stable" },
  preview: { color: "violet", label: "Preview" },
  updated: { color: "cyan", label: "Updated" },
  default: { color: "gray", label: "" },
};

export function DocBadge({
  variant = "new",
  text,
  children,
  ...props
}: DocBadgeProps) {
  const config = variantConfig[variant];

  return (
    <Badge
      color={config.color}
      variant="light"
      size="sm"
      radius="sm"
      {...props}
    >
      {text || children || config.label}
    </Badge>
  );
}
