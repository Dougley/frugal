export const onRequest: PagesFunction<
  WebEnv & {
    CF_PAGES: 1 | undefined;
    CF_PAGES_BRANCH: string | undefined;
    CF_PAGES_COMMIT_SHA: string | undefined;
    SENTRY_DSN: string | undefined;
  }
> = async (context) => {
  try {
    if (context.request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (!context.env.SENTRY_DSN) {
      return new Response("Sentry DSN not configured", { status: 500 });
    }
    const SENTRY_DSN = context.env.SENTRY_DSN;
    const parts = new URL(SENTRY_DSN);

    const SENTRY_HOST = parts.hostname;
    const SENTRY_PROJECT_IDS = parts.pathname.split("/");

    const envelopeBytes = await context.request.arrayBuffer();
    const envelope = new TextDecoder().decode(envelopeBytes);
    const piece = envelope.split("\n")[0];
    const header = JSON.parse(piece);
    const dsn = new URL(header["dsn"]);
    const project_id = dsn.pathname?.replace("/", "");

    if (dsn.hostname !== SENTRY_HOST) {
      throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
    }

    if (!project_id || !SENTRY_PROJECT_IDS.includes(project_id)) {
      throw new Error(`Invalid sentry project id: ${project_id}`);
    }

    const upstream = new URL(
      `https://${SENTRY_HOST}/api/${project_id}/envelope/`,
    );
    console.log(upstream);
    await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": header["header"],
      },
      body: envelopeBytes,
    });
    return new Response(
      JSON.stringify({
        status: 200,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
};
