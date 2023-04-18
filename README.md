# Frugal

High performance GiveawayBot clone using Cloudflare Workers

## Why?

While original GiveawayBot is very popular, it's very slow and has a lot of downtime. This is because it is (supposedly) hosted on a single server, and it is not optimized for speed. This project aims to fix that by using Cloudflare Workers. Cloudflare Workers are serverless functions that run on a global network of data centers. This means that the bot can be hosted on a global network of servers, and it can scale to meet demand.

#### Dougley, you're wasting your time

I know, but I'm bored.

## How to use

First off, Frugal depends on [Cloudflare Workers](https://workers.cloudflare.com/). You will need to create a Cloudflare account and install the [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update).

Frugal requires access to the paid features of Cloudflare Workers, namely Durable Objects. You will need to upgrade your account to a paid plan to use these features.

For more detailed instructions on how to deploy each part, see the READMEs in their respective `/apps` directories.

## Acknowledgements

- [GiveawayBot](https://github.com/Jagrosh/GiveawayBot)

## License

Frugal is licensed under the MIT license. However, while the source code is licensed under the MIT license, you may not use the source code to compete with an official instance of the bot. You are free to host this bot for your own personal use, but you may not verify your copy of the bot through the Discord Bot Verification Program or submit your copy of the bot to a bot listing service such as Discord's App Directory. See [LICENSE.md](LICENSE.md) for more information.
