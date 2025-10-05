import type { Icon } from "@tabler/icons-react";
import { type ComponentPropsWithoutRef, lazy, Suspense } from "react";

interface DocIconProps extends ComponentPropsWithoutRef<"span"> {
  name: string;
  size?: number;
  color?: string;
}

// Cache for dynamically imported icon components
const iconCache = new Map<string, React.LazyExoticComponent<Icon>>();

function getIconComponent(
  iconName: string
): React.LazyExoticComponent<Icon> | null {
  // Check cache first
  const cached = iconCache.get(iconName);
  if (cached) {
    return cached;
  }

  try {
    // Create lazy component with dynamic import
    // Vite will code-split each icon into its own chunk
    const LazyIcon = lazy(() =>
      import("@tabler/icons-react").then((module) => {
        const IconComponent = module[iconName as keyof typeof module] as Icon;
        if (!IconComponent) {
          throw new Error(`Icon "${iconName}" not found`);
        }
        return { default: IconComponent };
      })
    );

    iconCache.set(iconName, LazyIcon);
    return LazyIcon;
  } catch {
    return null;
  }
}

export function DocIcon({ name, size = 20, color, ...props }: DocIconProps) {
  // Convert icon name to PascalCase with Icon prefix
  // e.g., "rocket" -> "IconRocket", "arrow-right" -> "IconArrowRight"
  const iconName = `Icon${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;

  const IconComponent = getIconComponent(iconName);

  if (!IconComponent) {
    console.warn(`Icon "${name}" (${iconName}) not found in Tabler Icons`);
    return (
      <span
        {...props}
        style={{ display: "inline-flex", alignItems: "center", ...props.style }}
      >
        [{name}]
      </span>
    );
  }

  return (
    <span
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        ...props.style,
      }}
    >
      <Suspense
        fallback={
          <span
            style={{
              width: size,
              height: size,
              display: "inline-block",
            }}
          />
        }
      >
        <IconComponent size={size} color={color} />
      </Suspense>
    </span>
  );
}
