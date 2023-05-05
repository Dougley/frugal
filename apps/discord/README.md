# Frugal Discord Interactions (`@dougley/frugal-discord`)

This package holds code for integrating with Discord.

`@dougley/frugal-discord` is based on [slash-create](https://slash-create.js.org), more specifically the [Cloudflare Workers template](https://github.com/Snazzah/slash-create-worker).

This project is heavily intertwined with features on Cloudflare Workers that are part of the paid plan. If you want to run this project yourself, you'll need to set up a Cloudflare account and pay for the Workers Bundled plan. Support for running using the free plan is not planned and unsupported.

## Development Setup

1. Run `pnpm install`
   - Install [pnpm](https://pnpm.io/) if you don't have it already
2. Create a Discord application and bot, if you haven't already
3. Create a `.env` file in the `discord` directory
   - Copy the contents of `.env.example` into it
   - Replace the placeholder values with your own
4. Run `pnpm dev`
   - This will start a local server on port 8787, you probably want to use a tunnel service like [ngrok](https://ngrok.com/) to expose it to the internet. Our devcontainer setup includes `cloudflared` for this purpose.
5. Set the "Interactions Endpoint URL" in your Discord application to the URL of your tunnel service
6. Run `pnpm sync:dev` to register your slash commands with Discord
   - Repeat this step whenever you add a new slash command or if you change an existing one

## Deployment

0. Follow the steps above to set up your development environment
1. Run `pnpm sync` to register your slash commands with Discord
   - This creates global slash commands, so you only need to do this once realistically. If you want to test changes to a slash command, you can use `pnpm sync:dev` instead.
2. Run `npx wrangler login` to log in to Cloudflare
3. Run `pnpm deploy` to deploy the worker to Cloudflare Workers
4. Set the "Interactions Endpoint URL" in your Discord application to the URL of your Cloudflare Worker
