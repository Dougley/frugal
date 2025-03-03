import { TRPCError } from "@trpc/server";
import SuperJSON from "superjson";

SuperJSON.registerClass(TRPCError);

export const transformer = SuperJSON;
