export type RequestContext = {
  env: Env;
  cf?: IncomingRequestCfProperties | null;
  nonce?: string; // Required by TanStack Start BaseContext
  // extend in the future if needed
};

// Register the context type with TanStack Start
declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: RequestContext;
    };
  }
}

export const buildRequestContext = async (
  request: Request,
  env: Env
): Promise<RequestContext> => {
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;

  return {
    env,
    cf: cf ?? null,
  };
};
