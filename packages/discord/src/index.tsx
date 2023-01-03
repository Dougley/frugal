import { createHandler } from "slshx";
import * as MessageContextCommands from "./commands/message";
import * as SlashCommands from "./commands/slash";
import { _delete } from "./commands/slash/delete";
import { showSettings } from "./commands/slash/settings.show";
import { Timer } from "./timers";
import { getToucan } from "./utils/sentry";

const handler = createHandler<Env>({
  // Replaced by esbuild when bundling, see scripts/build.js (do not edit)
  applicationId: SLSHX_APPLICATION_ID,
  applicationPublicKey: SLSHX_APPLICATION_PUBLIC_KEY,
  applicationSecret: SLSHX_APPLICATION_SECRET,
  testServerId: SLSHX_TEST_SERVER_ID,
  commands: {
    ...SlashCommands,
    delete: _delete, // 'delete' is a reserved keyword
    settings: {
      show: showSettings,
    },
  },
  messageCommands: {
    "Reroll this giveaway": MessageContextCommands.reroll,
    "Edit this giveaway": MessageContextCommands.edit,
  },
});

export default {
  fetch: async (request: Request, env: Env, context: ExecutionContext) => {
    switch (`${request.method} ${new URL(request.url).pathname}`) {
      case "POST /discord": {
        // since this is (hopefully) the first time we call toucan,
        // we instantiate it with the context and request, so that
        // we don't have to pass it around everywhere
        const toucan = getToucan(context, request, env);
        try {
          const tx = toucan.startTransaction({
            name: "Discord",
            op: "discord.entry",
          });
          const headers = Array.from(request.headers.entries()).reduce(
            (acc, [key, value]) => {
              acc[key] = value;
              return acc;
            },
            {} as { [key: string]: string }
          );
          toucan.configureScope(async (scope) => {
            scope.addAttachment({
              filename: "request.json",
              data: JSON.stringify({
                cf: request.cf,
                headers,
                body: await request.clone().text(),
                location: request.url,
              }),
            });
            scope.setSpan(tx);
          });
          const data = await handler(request, env, context);
          tx.status = "ok";
          tx.finish();
          return data;
        } catch (e) {
          const tx = toucan.getScope()?.getTransaction();
          if (tx) {
            tx.status = "internal_error";
            tx.finish();
          }
          toucan.captureException(e);
          console.error(e);
          return new Response("Internal Server Error", { status: 500 });
        }
      }
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
} as ExportedHandler<Env>;

// Durable Objects need to be exported separately
export { Timer };
