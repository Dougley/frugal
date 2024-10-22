import {
  CommandManager,
  DiscordApplication,
  InteractionHandlerError,
  InteractionHandlerNotFound,
  InteractionHandlerTimedOut,
  UnauthorizedInteraction,
  UnknownApplicationCommandType,
  UnknownComponentType,
  UnknownInteractionType
} from '@discord-interactions/core';

import * as Sentry from '@sentry/cloudflare';
import * as Commands from './commands';

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    // Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
    tracesSampleRate: 1.0
  }),
  {
    async fetch(req: Request, env, ctx) {
      if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

      Sentry.instrumentD1WithSentry(env.D1);

      const app = new DiscordApplication({
        clientId: env.DISCORD_APP_ID,
        token: env.DISCORD_BOT_TOKEN,
        publicKey: env.DISCORD_PUBLIC_KEY,

        //syncMode: SyncMode.Disabled,

        cache: {
          get: async (key: string) => env.KV.get(key, 'text'),
          set: async (key: string, ttl: number, value: string) => {
            await env.KV.put(key, value, { expirationTtl: ttl });
          }
        }
      });

      const commandsToRegister = Object.values(Commands).map((Command) => new Command());

      if (env.DEVELOPMENT_GUILD) {
        console.log('Registering commands in development guild');
        const guild = new CommandManager(app, env.DEVELOPMENT_GUILD);
        await guild.register(...commandsToRegister);
      } else {
        await app.commands.register(...commandsToRegister);
      }

      const signature = req.headers.get('x-signature-ed25519');
      const timestamp = req.headers.get('x-signature-timestamp');

      const body = await req.text();

      if (typeof body !== 'string' || typeof signature !== 'string' || typeof timestamp !== 'string') {
        return new Response('Invalid request', { status: 400 });
      }

      try {
        const [getResponse, handling] = await app.handleInteraction(body, signature, timestamp);

        ctx.waitUntil(handling);
        const response = await getResponse;

        if (response instanceof FormData) {
          return new Response(response);
        }

        return new Response(JSON.stringify(response), {
          headers: {
            'content-type': 'application/json;charset=UTF-8'
          }
        });
      } catch (err) {
        if (err instanceof UnauthorizedInteraction) {
          console.error('Unauthorized Interaction');
          return new Response('Invalid request', { status: 401 });
        }

        if (err instanceof InteractionHandlerNotFound) {
          console.error('Interaction Handler Not Found');
          console.dir(err.interaction);

          new Response('Invalid request', { status: 404 });
        }

        if (err instanceof InteractionHandlerTimedOut) {
          console.error('Interaction Handler Timed Out');

          new Response('Timed Out', { status: 408 });
        }

        if (
          err instanceof UnknownInteractionType ||
          err instanceof UnknownApplicationCommandType ||
          err instanceof UnknownComponentType
        ) {
          console.error('Unknown Interaction - Library may be out of date.');
          console.dir(err.interaction);

          new Response('Server Error', { status: 500 });
        }

        if (err instanceof InteractionHandlerError) {
          console.error('Interaction Handler Error');
          console.error(err.cause);

          new Response('Server Error', { status: 500 });
        }

        console.error(err);
      }

      return new Response('Unknown Error', { status: 500 });
    }
  } satisfies ExportedHandler<Env>
);

// durable objects
