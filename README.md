# Frugal

High performance GiveawayBot clone using Cloudflare Workers

## Why?

While original GiveawayBot is very popular, it's very slow and has a lot of downtime. This is because it is (supposedly) hosted on a single server, and it is not optimized for speed. This project aims to fix that by using Cloudflare Workers. Cloudflare Workers are serverless functions that run on a global network of data centers. This means that the bot can be hosted on a global network of servers, and it can scale to meet demand.

#### Dougley, you're wasting your time

I know, but I'm bored.

## How to use

First off, Frugal depends on [Cloudflare Workers](https://workers.cloudflare.com/). You will need to create a Cloudflare account and install the [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update).

Frugal requires access to the paid features of Cloudflare Workers, namely Durable Objects. You will need to upgrade your account to a paid plan to use these features.

### Installation

1. Clone this repository
2. Run `pnpm install`
   - If you don't have pnpm installed, run `npm install -g pnpm` first
3. Run `wrangler login` if you haven't already
4. Change the values in `packages/discord/wrangler.toml` to your own
   - You only need to change the `id` field under `kv_namespaces`, you can create a new namespace by running `wrangler kv:namespace create "frugal"`. Do not change the `binding` field.
5. Create a `env.jsonc` file using the template in `packages/discord/env.example.jsonc`
6. Run `lerna run deploy` to build the project and deploy it to Cloudflare Workers.
7. Run `lerna run deploy:commands` to deploy slash commands globally, it will take a few minutes for the commands to be available.
   - In development, commands are available immediately! Try to avoid deploying commands in production unless you need to.

### Usage

Frugal is not a traditional bot using the gateway, so you will need to set the Interactions Endpoint URL to the URL of your worker. For example, if your worker is `giveawaybot.dougley.workers.dev`, you would set the Interactions Endpoint URL to `https://giveawaybot.dougley.workers.dev`.

## Acknowledgements

- [GiveawayBot](https://github.com/Jagrosh/GiveawayBot)

## License

Frugal is licensed under the MIT license. However, while the source code is licensed under the MIT license, you may not use the source code to compete with an official instance of the bot. You are free to host this bot for your own personal use, but you may not verify your copy of the bot through the Discord Bot Verification Program or submit your copy of the bot to a bot listing service such as Discord's App Directory. See [LICENSE.md](LICENSE.md) for more information.
