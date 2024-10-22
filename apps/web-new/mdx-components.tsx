import {
  CalloutBody,
  CalloutRoot,
  CalloutTitle,
} from "./app/components/Callout";

export function useMDXComponents(components: any) {
  return {
    "callout-root": CalloutRoot,
    "callout-title": CalloutTitle,
    "callout-body": CalloutBody,
    ...components,
  };
}
