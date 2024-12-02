import typography from "@tailwindcss/typography";
import tailwindPresetMantine from "tailwind-preset-mantine";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [tailwindPresetMantine()],
  plugins: [typography],
  corePlugins: {
    preflight: false,
  },
};
export default config;
