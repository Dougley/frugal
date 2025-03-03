import { Code } from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";

export function CodeBlock(props: ComponentPropsWithoutRef<"code">) {
  return <Code {...props} />;
}
