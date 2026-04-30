import { createTheme, type MantineColorsTuple } from "@mantine/core";

type ColorShade = MantineColorsTuple;

const indigo: ColorShade = [
  "#eef2ff",
  "#e0e7ff",
  "#c7d2fe",
  "#a5b4fc",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
];

const pink: ColorShade = [
  "#fdf2f8",
  "#fce7f3",
  "#fbcfe8",
  "#f9a8d4",
  "#f472b6",
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
  "#831843",
];

const lime: ColorShade = [
  "#f7fee7",
  "#ecfccb",
  "#d9f99d",
  "#bef264",
  "#a3e635",
  "#84cc16",
  "#65a30d",
  "#4d7c0f",
  "#3f6212",
  "#365314",
];

const amber: ColorShade = [
  "#fffbeb",
  "#fef3c7",
  "#fde68a",
  "#fcd34d",
  "#fbbf24",
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
];

export const theme = createTheme({
  primaryColor: "indigo",
  primaryShade: { light: 5, dark: 4 },
  colors: {
    indigo,
    pink,
    lime,
    amber,
  },
  defaultRadius: "md",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: "800",
  },
  other: {
    brandGradient: { from: "indigo.4", to: "indigo.7" } as const,
    ctaGradient: { from: "indigo.5", to: "indigo.7" } as const,
    accentGradient: { from: "amber.4", to: "amber.6" } as const,
  },
});
