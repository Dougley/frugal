import { Anchor, Breadcrumbs as MantineBreadcrumbs, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

interface BreadcrumbsProps {
  /** Current page path (e.g., "/wiki/components") */
  path: string;
  /** Optional custom breadcrumb labels for path segments */
  labels?: Record<string, string>;
}

export function Breadcrumbs({ path, labels = {} }: BreadcrumbsProps) {
  const { t } = useTranslation();
  // Split path into segments and filter empty strings
  const segments = path.split("/").filter(Boolean);

  // Don't show breadcrumbs for root or single-level pages
  if (segments.length <= 1) {
    return null;
  }

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;

    // Get label from custom labels or format the segment
    const label =
      labels[segment] ||
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    if (isLast) {
      return (
        <Text key={href} size="sm" c="dimmed">
          {label}
        </Text>
      );
    }

    return (
      <Anchor key={href} component={Link} to={href} size="sm">
        {label}
      </Anchor>
    );
  });

  // Add home breadcrumb at the start
  const homeItem = (
    <Anchor key="/" component={Link} to="/" size="sm">
      {t("nav.home")}
    </Anchor>
  );

  return (
    <MantineBreadcrumbs separator="/" mb="md">
      {[homeItem, ...items]}
    </MantineBreadcrumbs>
  );
}
