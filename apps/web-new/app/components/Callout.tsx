import { type ClassValue, clsx } from "clsx";
import type { FC, ReactNode } from "react";
import {
  LuCheck as CheckIcon,
  LuChevronRight as ChevronRightIcon,
  LuPin as DrawingPinIcon,
  LuAlertTriangle as ExclamationTriangleIcon,
  LuPencil as Pencil1Icon,
  LuHelpCircle as QuestionMarkIcon,
  LuRocket as RocketIcon,
} from "react-icons/lu";
import { twMerge } from "tailwind-merge";

const tw = (strings: TemplateStringsArray, ...args: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (args.at(i) ?? ""), "");

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

type Callout = {
  label: string;
  icon: ReactNode;
  className: {
    root: string;
    title: string;
  };
};

export const callouts = {
  note: {
    label: "Note",
    icon: <Pencil1Icon className="size-5 shrink-0" />,
    className: {
      root: tw`border-base-content/50`,
      title: tw``,
    },
  },
  abstract: {
    label: "Abstract",
    icon: <RocketIcon className="size-5 shrink-0" />,
    className: {
      root: tw`bg-secondary/10 border-secondary/20`,
      title: tw`text-secondary`,
    },
  },
  important: {
    label: "Important",
    icon: <DrawingPinIcon className="size-5 shrink-0" />,
    className: {
      root: tw`bg-primary/10 border-primary/20`,
      title: tw`text-primary`,
    },
  },
  success: {
    label: "Success",
    icon: <CheckIcon className="size-5 shrink-0" />,
    className: {
      root: tw`bg-success/10 border-success/20`,
      title: tw`text-success`,
    },
  },
  question: {
    label: "Question",
    icon: <QuestionMarkIcon className="size-5 shrink-0" />,
    className: {
      root: tw`bg-warning/10 border-warning/20`,
      title: tw`text-warning`,
    },
  },
  caution: {
    label: "Caution",
    icon: <ExclamationTriangleIcon className="size-5 shrink-0" />,
    className: {
      root: tw`bg-error/10 border-error/20`,
      title: tw`text-error`,
    },
  },
} as const satisfies Record<string, Callout>;

const getCallout = (type: keyof typeof callouts) =>
  callouts[type] ?? callouts.note;

export type CalloutProps = {
  type: keyof typeof callouts;
  isFoldable: boolean;
  defaultFolded?: boolean;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const Callout: FC<CalloutProps> = ({
  type,
  isFoldable,
  defaultFolded,
  title,
  children,
  className,
}) => {
  const callout = getCallout(type);
  const isFoldableString = isFoldable.toString() as "true" | "false";
  const defaultFoldedString = defaultFolded?.toString() as
    | "true"
    | "false"
    | undefined;

  return (
    <CalloutRoot
      className={cn(className, callout.className.root)}
      type={type}
      isFoldable={isFoldableString}
      defaultFolded={defaultFoldedString}
    >
      <CalloutTitle
        className={callout.className.title}
        type={type}
        isFoldable={isFoldableString}
      >
        {title}
      </CalloutTitle>
      <CalloutBody>{children}</CalloutBody>
    </CalloutRoot>
  );
};

type DetailsProps = {
  isFoldable: boolean;
  defaultFolded?: boolean;
  children: ReactNode;
  className?: string;
};

const Details: FC<DetailsProps> = ({
  isFoldable,
  defaultFolded,
  children,
  ...props
}) => {
  return isFoldable ? (
    <details open={!defaultFolded} {...props}>
      {children}
    </details>
  ) : (
    <div {...props}>{children}</div>
  );
};

type SummaryProps = {
  isFoldable: boolean;
  children: ReactNode;
  className?: string;
};

const Summary: FC<SummaryProps> = ({ isFoldable, children, ...props }) => {
  return isFoldable ? (
    <summary {...props}>{children}</summary>
  ) : (
    <div {...props}>{children}</div>
  );
};

export type CalloutRootProps = {
  type: keyof typeof callouts;
  isFoldable: "true" | "false";
  defaultFolded?: "true" | "false";
  className?: string;
  children: ReactNode;
};

export const CalloutRoot: FC<CalloutRootProps> = ({
  children,
  className,
  type,
  isFoldable: isFoldableString,
  defaultFolded: defaultFoldedString,
}) => {
  const callout = getCallout(type);
  const isFoldable = isFoldableString === "true";
  const defaultFolded = defaultFoldedString === "true";

  return (
    <Details
      isFoldable={isFoldable}
      defaultFolded={defaultFolded}
      className={cn(
        "group/root my-6 space-y-2 rounded-lg border bg-card p-4",
        callout.className.root,
        className,
      )}
    >
      {children}
    </Details>
  );
};

export type CalloutTitleProps = {
  type: keyof typeof callouts;
  className?: string;
  children?: ReactNode;
  isFoldable: "true" | "false";
};

export const CalloutTitle: FC<CalloutTitleProps> = ({
  type,
  isFoldable: isFoldableString,
  children,
}) => {
  const callout = getCallout(type);
  const isFoldable = isFoldableString === "true";

  return (
    <Summary
      isFoldable={isFoldable}
      className={cn(
        "flex flex-row items-center gap-2 font-bold",
        callout.className.title,
      )}
    >
      {callout.icon}
      <div>{children ?? callout.label}</div>
      {isFoldable && (
        <ChevronRightIcon className="size-5 shrink-0 transition-transform group-open/root:rotate-90" />
      )}
    </Summary>
  );
};

export type CalloutBodyProps = {
  className?: string;
  children: ReactNode;
};

export const CalloutBody: FC<CalloutBodyProps> = ({ children }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-base-content",
        "prose-headings:my-0 prose-p:my-0 prose-blockquote:my-0 prose-pre:my-0 prose-ol:my-0 prose-ul:my-0",
      )}
    >
      {children}
    </div>
  );
};
