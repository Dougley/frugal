# Discord Monetization Webhooks

This Cloudflare Worker handles Discord App Subscription webhooks for processing both entitlement and subscription events.

## Features

- **Webhook Processing**: Handles Discord monetization webhook events
- **Signature Verification**: Validates Discord webhook signatures using Ed25519
- **Database Integration**: Stores entitlement and subscription data in shared D1 database
- **Event Types**: Supports:
  - **Entitlement Events**: `ENTITLEMENT_CREATE`, `ENTITLEMENT_UPDATE`, `ENTITLEMENT_DELETE`
  - **Subscription Events**: `SUBSCRIPTION_CREATE`, `SUBSCRIPTION_UPDATE`
- **Purchase Types**: Handles all Discord monetization models:
  - **Subscriptions**: Recurring payments with automatic renewal
  - **One-Time Purchases**: Single payment for permanent access
  - **Consumable Items**: Single-use items that can be consumed
  - **Test Mode**: Special handling for development/testing

## Setup

### 1. Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and configure:

```bash
cp .dev.vars.example .dev.vars
```

Required variables:
- `DISCORD_PUBLIC_KEY`: Your Discord application's public key for webhook verification

### 2. Discord Developer Portal Configuration

1. Go to your Discord Application settings
2. Navigate to "Monetization" (supports both "App Subscriptions" and "One-Time Purchases")
3. Set the webhook endpoint URL to: `https://webhooks.giveawaybot.party/discord/monetization`
4. Copy your application's public key to the `DISCORD_PUBLIC_KEY` environment variable

**Note**: The same webhook endpoint handles both subscription and one-time purchase events.

### 3. Database Migration

The webhook app uses the shared D1 database. Ensure migrations are run:

```bash
npm run db:migrate:dev  # For development
npm run db:migrate      # For production
```

### 4. Development

```bash
npm run dev
```

### 5. Deployment

```bash
npm run deploy  # Development environment
wrangler deploy --env production  # Production environment
```

## API Endpoints

### POST `/discord/monetization`
Handles Discord monetization webhook events (both entitlements and subscriptions).

**Headers:**
- `X-Signature-Ed25519`: Discord webhook signature
- `X-Signature-Timestamp`: Discord webhook timestamp

**Events Processed:**

*Entitlement Events (for all purchase types):*
- `ENTITLEMENT_CREATE`: New entitlement granted (subscription, one-time purchase, consumable)
- `ENTITLEMENT_UPDATE`: Entitlement changes (consumption, expiration, etc.)
- `ENTITLEMENT_DELETE`: Entitlement deleted/refunded

*Subscription Events (subscription-specific lifecycle):*
- `SUBSCRIPTION_CREATE`: New subscription created
- `SUBSCRIPTION_UPDATE`: Subscription lifecycle changes (renewals, cancellations, upgrades, etc.)
- `SUBSCRIPTION_DELETE`: Subscription permanently deleted

**Purchase Type Detection:**
- **Subscriptions**: `type` = 8, no initial `ends_at`
- **One-Time Durable**: `type` = 1, has `ends_at` or permanent
- **Consumables**: Has `consumed` field defined
- **Test Mode**: `type` = 4 (development/testing)

### GET `/health`
Health check endpoint returning service status.

## Database Schema

The webhook app interacts with these tables:
- `entitlements`: Discord entitlement data
- `subscriptions`: Discord subscription lifecycle data
- `premium_guilds`: Guild premium status cache
- `subscription_events`: Event audit trail

## Security

- Discord webhook signatures are verified using Ed25519
- Timestamps are validated to prevent replay attacks
- CORS headers are configured for secure cross-origin requests

## Monitoring

- Sentry integration for error tracking
- Cloudflare analytics for performance monitoring
- Console logging for webhook event processing