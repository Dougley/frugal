# Stripe Webhooks (`@dougley/frugal-stripe`)

This package holds code for accepting webhooks from Stripe.

Put simply, this app is responsible for handling webhooks from Stripe and updating the database accordingly.

We listen to the following events from Stripe:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`

## Development Setup

1. Run `pnpm install`
   - Install [pnpm](https://pnpm.io/) if you don't have it already
2. Create a Stripe account, if you haven't already
3. Create a `.env` file in the `stripe-webhook` directory
   - Copy the contents of `.env.example` into it
   - Replace the placeholder values with your own
4. Run `pnpm dev` to start the development server
5. Using the `stripe` CLI, run `stripe listen --forward-to http://localhost:8787`
   - If the CLI is not installed, see [here](https://stripe.com/docs/stripe-cli#install), it's pre-installed on our devcontainer configuration.

## Deployment

1. Run `npx wrangler login` to log in to Cloudflare
2. Run `pnpm deploy` to deploy the worker to Cloudflare Workers
