import { type Hub } from "@sentry/types";
import { createContext } from "react";

export const SentrySSRContext = createContext<Hub | undefined>(undefined);