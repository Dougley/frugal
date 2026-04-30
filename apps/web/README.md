# Frugal Web Dashboard

The web dashboard for the Frugal Discord GiveawayBot, built with TanStack Start on Cloudflare Workers.

This project is based on the [stratus-stack](https://github.com/Dougley/stratus-stack)

## Development

### Prerequisites

- Node.js >= 20
- pnpm (workspace managed)
- Cloudflare account (for D1, KV, R2 access)

### Environment Setup

Copy the example environment file:

```bash
cp .dev.vars.example .dev.vars
```

Required environment variables:

| Variable                | Description                                                  |
| :---------------------- | :----------------------------------------------------------- |
| `BETTER_AUTH_SECRET`    | Random string for encryption (`openssl rand -base64 32`)     |
| `DISCORD_CLIENT_ID`     | Discord OAuth application client ID                          |
| `DISCORD_CLIENT_SECRET` | Discord OAuth application client secret                      |
| `SENTRY_DSN`            | Sentry DSN for error tracking                                |

### Discord OAuth Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Use the existing Frugal application or create a new one
3. Add redirect URL: `http://localhost:5173/api/auth/callback/discord`
4. Copy Client ID and Secret to `.dev.vars`

### Running Locally

```bash
# From monorepo root
pnpm install
pnpm --filter @dougley/frugal-web dev

# Or from this directory
pnpm dev
```

The app runs at `http://localhost:5173`.

## Code Quality

## Code Quality

Biome handles both linting and formatting:

```bash
pnpm check       # Check for issues
pnpm check:fix   # Auto-fix issues
pnpm lint        # Lint only
pnpm format      # Format only
```

## Database

This app shares the D1 database with the Discord bot via `@dougley/frugal-drizzle`. The schema is managed in `packages/d1-drizzle/`.

```bash
# Generate migrations (from packages/d1-drizzle)
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Browse data
pnpm db:studio
```

## Deployment

Deployment is handled via CI/CD. For manual deployment:

```bash
pnpm build
pnpm deploy
```

### Production Secrets

Set via Wrangler:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put DISCORD_CLIENT_ID  
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put SENTRY_DSN
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── routes/           # File-based routing (TanStack Router)
│   ├── api/          # API endpoints (Auth, tRPC)
│   └── __root.tsx    # Application root wrapper
├── server/           # Backend logic
│   ├── auth/         # Better Auth configuration
│   ├── db/           # Drizzle ORM database client
│   └── trpc/         # tRPC router and procedures
├── styles/           # Global CSS and theme
└── client.tsx        # Browser entry point
```

## Related

- [apps/discord](../discord/) - Discord bot
- [packages/d1-drizzle](../../packages/d1-drizzle/) - Shared database schema
- [AGENTS.md](../../AGENTS.md) - AI coding instructions
