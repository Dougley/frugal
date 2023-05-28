# Frugal

High performance [GiveawayBot](https://github.com/jagrosh/GiveawayBot) remake using Cloudflare Workers

## Why does this project exist?

The current version of GiveawayBot is hosted on a single dedicated server, and as a result suffers from periodic instability and failures to respond to commands or inputs. Frugal was made to amend this by using Cloudflare Workers (serverless functions that run on Cloudflare's network of datacenters) for better scalability and reliability, as well as to introduce several new quality-of-life changes.

### What's new, then?
 - View giveaway information at any time and manage premium plans from a new dashboard
 - Edit giveaways while they're running
 - Context menu commands for ending and editing giveaways
 - Premium option for adding images to giveaway embeds

### You are wasting your time
I know, but I'm bored.

## Running your own copy

First off, Frugal depends on [Cloudflare Workers](https://workers.cloudflare.com/). You will need to create a Cloudflare account and install the [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update).

Secondly, Frugal requires access to the paid features of Cloudflare Workers, namely Durable Objects. You will need to upgrade your account to a paid plan to use these features.

For more detailed instructions on how to deploy each part, see the READMEs in their respective `/apps` directories.

## License

Frugal is licensed under the MIT license. However, while the source code is licensed under the MIT license, you may not use the source code to compete with an official instance of the bot. You are free to host this bot for your own personal use, but you may not verify your copy of the bot through the Discord Bot Verification Program or submit your copy of the bot to a bot listing service such as Discord's App Directory. See [LICENSE.md](LICENSE.md) for more information.
