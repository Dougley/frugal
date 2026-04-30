# Frugal - AI Coding Instructions

## Project Overview

Frugal is a high-performance Discord GiveawayBot remake built on Cloudflare Workers. It's a pnpm monorepo with TypeScript, using Biome for linting/formatting and Turbo for build orchestration.

## Critical Guidelines

⚠️ **Sentry Instrumentation**: ALL new code must be Sentry-instrumented. This includes workers, durable objects, async functions, and error boundaries. No exceptions.

⚠️ **Durable Object Business Logic**: The `GiveawayStateV3` Durable Object (`packages/giveaway-state-v3/`) contains intricate business logic and is difficult to debug in production. Changes here require extreme care:

- Test thoroughly in local dev environment with `.mf/` persistence
- Validate alarm scheduling and state transitions
- Consider edge cases (concurrent joins/leaves, early endings, rerolls)
- Review TRPC router procedures for side effects

⚠️ **Internationalization (i18n) Required**: ALL user-facing commands and messages MUST be internationalized. Use `context.i18n.translate()` for all strings shown to users. Debug/test commands (like `/debug`, `/savetest`) are exempt from this requirement.

## Architecture & Key Concepts

### Monorepo Structure

- **`apps/`** - Deployable applications (discord bot, web dashboard, webhooks)
- **`packages/`** - Shared libraries (`d1-drizzle`, `giveaway-state-v3`, `i18n`, `utils`)
- **Workspace dependencies** - Internal packages use `workspace:^` in package.json
- **Catalog pattern** - Common dependencies (wrangler, @cloudflare/workers-types, drizzle-orm, discord-api-types) are centralized in `pnpm-workspace.yaml` to ensure version consistency

### File Structure Conventions

**Maintain strict file organization** to keep codebase navigable - **follow established conventions and best practices**

**Key Principles:**

- One command/component/route per file, named after its function
- Group related files in folders (e.g., `Header/` contains Header.tsx)
- Keep tests in `__tests__/` directories or `*.test.ts` files
- Scripts go in `scripts/` at app root
- Shared utilities in `utils/` directories
- Never mix workers and durables database code in the same file

### Cloudflare Workers Ecosystem

**Durable Objects with TRPC**

- `GiveawayStateV3` manages persistent giveaway state using Durable Objects with SQLite storage
- Uses TRPC for type-safe communication between workers and durable objects
- Pattern: `createProxy(stateRouter, handleAlarm)` creates TRPC-enabled Durable Object proxy
- Router in `packages/giveaway-state-v3/src/router.ts` defines all state operations
- Alarms handle scheduled giveaway endings via `handleAlarm()` function

**Database Architecture**

- **D1 (global)**: Stores giveaway metadata, uses `drizzleD1()` from `@dougley/frugal-drizzle/workers`
- **Durable Object SQLite (per-giveaway)**: Stores participant entries, uses `drizzleDurable()` from `@dougley/frugal-drizzle/durables`
- CRITICAL: Different imports for different contexts - never mix workers/durables exports
- Schema migrations run automatically in Durable Objects via `migrate()` from durables package

**Environment Bindings**

- Each app has auto-generated `worker-configuration.d.ts` - DO NOT EDIT manually
- Regenerate with `wrangler types` or let wrangler do it automatically
- Check these files for available KV namespaces, D1 databases, Durable Object bindings, R2 buckets

### Discord Bot Patterns (`apps/discord/`)

**BaseCommand System**

- All commands extend `BaseCommand` (from `src/classes/BaseCommand.ts`)
- Provides automatic i18n support via `context.i18n.translate(key, { language: ctx.locale })`
- Built-in premium subscription checking with `requiresPremium: true` option
- Subscription context automatically injected into command execution

**Premium Subscription Model**

- Binary system: user/guild either has premium or doesn't (no tiers)
- Check hierarchy: User subscription checked first, then guild subscription
- Guild subscriptions are more common than individual user subscriptions
- Implementation in `apps/discord/src/utils/subscription.ts`
- Premium features gated via `requiresPremium: true` in command options
- Access checked via `checkPremiumAccess(userId, guildId, drizzle)` returning `{ hasPremium: boolean }`

**Async Context Pattern**

- Use `runWithContext()` to provide request-scoped dependencies (i18n, drizzle, env, state)
- Access via `getContext()` - throws if not in context (use `tryGetContext()` for optional)
- Example in `apps/discord/src/index.ts` - wraps all Discord interactions
- Context available throughout command execution without explicit passing

**Command Registration**

> This section is here for reference, under normal development you won't need to modify this.

- Commands register via `scripts/register-commands.mjs` with slash-up
- Set `FRUGAL_REGISTRATION_MODE=true` during registration to enable special behavior
- i18n instance injected as `global.__FRUGAL_REGISTRATION_I18N__` during registration
- Use `pnpm --filter discord register:dev` (local) or `register` (staging/prod)

**Component & Modal Handlers**

- Register with regex patterns: `creator.addRegexComponentHandler(pattern, handler)`
- Or static IDs: `creator.registerGlobalComponent(custom_id, handler)`
- Pattern defined alongside command in handlers object
- Examples in `apps/discord/src/commands/components/` and `apps/discord/src/commands/index.ts`

### Internationalization (`packages/i18n/`)

**Implementation Details**

- ICU MessageFormat via `intl-messageformat` for plurals/selections/interpolation
- Example: `"{count, plural, =0 {no items} one {# item} other {# items}}"`
- Stored in Cloudflare KV with LRU cache (configurable size/TTL)
- Source files in `apps/discord/i18n/` as TypeScript objects
- Sync to KV with `pnpm --filter discord i18n:sync:dev` (runs `scripts/kv-i18n-sync.mjs`)

**Translation Requirements**

- **REQUIRED**: All user-facing commands (`/start`, `/stop`, `/edit`, `/list`, etc.)
- **REQUIRED**: All user-visible messages (embeds, responses, errors)
- **REQUIRED**: Command names, descriptions, and option descriptions
- **EXEMPT**: Debug commands (`/debug`, `/savetest`) and internal logging

**Translation Pattern**

```typescript
// In commands - use context.i18n
const { i18n } = getContext();

// Simple translation
const message = await i18n.translate("commands.start.success", {
  language: ctx.locale || "en-US",
});

// With parameters
const error = await i18n.translate("errors.invalid_duration", {
  params: { max: "30 days" },
  language: ctx.locale,
});

// In embeds
await ctx.send({
  embeds: [
    {
      title: await i18n.translate("giveaway.title", { language: ctx.locale }),
      description: await i18n.translate("giveaway.description", {
        params: { prize, winners },
        language: ctx.locale,
      }),
    },
  ],
});
```

**Adding New Translations**

1. Add keys to `apps/discord/i18n/en-US.ts` (default language)
2. Add translations to other language files (e.g., `nl.ts`)
3. Sync to KV: `pnpm --filter discord i18n:sync:dev`
4. Verify in Discord with language-specific client

### Web App (`apps/web/`)

**TanStack Start (React SSR Framework) on Cloudflare Pages**

- File-based routing with automatic route tree generation (`routeTree.gen.ts`)
- SSR enabled, builds with Vite and TanStack Start plugin
- Custom server in `src/server.ts` wraps TanStack Start with Sentry
- API routes pattern: files in `src/routes/api/` create API endpoints
- Request context via `buildRequestContext()` provides Cloudflare env/cf properties to routes
- Router created in `src/router.tsx` with TRPC and QueryClient integration

**TRPC Integration**

- Full-stack type safety between client and server
- Router defined in `src/server/trpc/router.ts`
- Procedures use middleware for auth, timing, and Sentry integration
- Context includes env, session, and request headers
- Client uses `createServerFn` for SSR-compatible data fetching
- SuperJSON transformer for complex types (Dates, Maps, BigInt)

**Styling & UI**

- Mantine UI components with theme configuration in `src/routes/__root.tsx`
- PostCSS for CSS processing (no Tailwind)
- Color scheme handling with `ColorSchemeScript` and auto dark mode
- Navigation progress bar via `@mantine/nprogress`

## Development Workflows

### Essential Commands

```bash
# Install dependencies (monorepo-aware)
pnpm install

# Development servers (with local persistence in .mf/)
pnpm --filter discord dev          # Discord bot
pnpm --filter web dev              # React Router dev server
pnpm --filter webhooks dev         # Webhook handlers

# Code quality (Biome)
pnpm check                         # Format, lint, typecheck all
pnpm format                        # Format only
pnpm lint:fix                      # Auto-fix linting issues

# Database operations (Discord app has D1)
pnpm --filter discord db:migrate:dev   # Apply D1 migrations locally
pnpm --filter discord db:migrate       # Apply D1 migrations to remote

# Discord-specific workflows
pnpm --filter discord register:dev     # Register slash commands (local)
pnpm --filter discord i18n:sync:dev    # Sync translations to KV (local)

# Type generation (when wrangler.jsonc changes)
cd apps/discord && pnpm wrangler types
```

### Build System

**Turbo Configuration**

- Task dependencies in `turbo.json`: `build` depends on `^build` (dependency builds)
- Outputs cached: `dist/**`, `build/**`, `.next/**`
- Environment variables passed to build: `CLOUDFLARE_ENV`, `SENTRY_*`, `CF_VERSION_METADATA`
- Run tasks with `turbo run build` or via pnpm workspace filters

**TypeScript Compilation**

- Packages build to `dist/` with plain `tsc`
- Apps may use specialized bundlers (React Router for web, Wrangler for workers)
- Shared tsconfig in `packages/tsconfig/` with base.json and workers.json

### Testing & CI

**Vitest Setup**

- Test files: `*.{test,spec}.{ts,tsx}` or in `__tests__/` directories
- Run with `pnpm test` (uses Turbo)
- Coverage available but optional
- Example in `packages/i18n/src/__tests__/`

**CI/CD Pipeline**

- Path-based triggers: only deploys changed apps (e.g., `apps/discord/**`)
- Staging: auto-deploys on push to `main` branch
- Production: manual workflow_dispatch with options
- D1 migrations run before worker deployment in separate job
- Sentry releases created after successful deployment

**Pre-commit Hooks (Lefthook)**

- Runs `biome check --write` on staged files with `stage_fixed: true` (auto-fixes and stages)
- Pre-push runs checks without fixes
- Configured in `lefthook.yml`

### Biome Configuration

**Key Rules**

- `noDoubleEquals: error` - must use `===`/`!==`
- `useHookAtTopLevel: error` - React hooks at component top level
- Disabled: `noForEach`, `useExhaustiveDependencies`, `noNegationElse`
- Accessibility rules enabled for web app files only
- Test files allow `==` for simpler assertions

**Formatting**

- 2 space indentation, 80 character line width
- Double quotes for JS/TS, semicolons always
- Arrow functions always use parentheses
- Organize imports automatically on save

## Code Patterns

### Sentry Integration (Required Everywhere)

**Worker Entry Points**

```typescript
// apps/discord/src/index.ts - ALWAYS wrap with Sentry
export const GiveawayStateV3 = Sentry.instrumentDurableObjectWithSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    release: env.CF_VERSION_METADATA.id,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
  }),
  createProxy(stateRouter, handleAlarm)
);

export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    release: env.CF_VERSION_METADATA.id,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    enableLogs: true,
  }),
  { fetch, scheduled /* other handlers */ } satisfies ExportedHandler<Env>
);
```

**React Router (Web App)**

```typescript
// apps/web/workers/server.ts - Sentry wraps entire app
import { withSentry } from "@sentry/cloudflare";

export default withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  }),
  { fetch } satisfies ExportedHandler<Env>
);
```

**Error Boundaries**

```tsx
// apps/web/app/components/TopErrorBoundary/TopErrorBoundary.tsx
// Web app uses ErrorBoundary components for React errors
import * as Sentry from "@sentry/react";

export function TopErrorBoundary() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorUI />}>...</Sentry.ErrorBoundary>
  );
}
```

### Command Structure

```typescript
// Extend BaseCommand for auto-i18n and premium checks
// File: apps/discord/src/commands/slash/mycommand.ts
export default class MyCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "mycommand",
      description: "My command description",
      requiresPremium: false, // Set to true to require premium
      options: [
        /* slash command options */
      ],
    });
  }

  async run(ctx: CommandContext) {
    const { i18n, drizzle } = getContext(); // Access request-scoped context

    // Premium check happens automatically in BaseCommand if requiresPremium: true
    // ctx.subscription will contain { hasPremium: boolean } if checked

    const message = await i18n.translate("key", { language: ctx.locale });

    // IMPORTANT: Wrap command logic in try-catch for Sentry
    try {
      // ... command logic
      await ctx.send(message);
    } catch (error) {
      // Errors are auto-captured by Sentry worker wrapper
      console.error("Command failed:", error);
      await ctx.send("An error occurred. Please try again.", {
        ephemeral: true,
      });
      throw error; // Re-throw for Sentry
    }
  }
}
```

**Premium Check Details:**

- BaseCommand automatically checks subscription when `requiresPremium: true`
- Check order: User subscription first, then guild subscription (if in guild)
- Returns appropriate error message based on context (DM vs guild)
- Subscription status available in `ctx.subscription` after check

### TRPC Durable Object Communication

⚠️ **CRITICAL: Giveaway State Logic** - The Durable Object handles complex state management:

- Entry management (join/leave with deduplication and rate limiting)
- Winner selection (random, role requirements, entry validation)
- Alarm scheduling (automatic giveaway ending at exact time)
- State transitions (active → ended → archived)

**When modifying `packages/giveaway-state-v3/src/router.ts`:**

1. Test locally with `.mf/` persistence to validate state changes
2. Consider concurrent operations (multiple users joining simultaneously)
3. Validate alarm behavior (reschedule on edit, cancel on early end)
4. Check for race conditions in entry mutations
5. Ensure database transactions are atomic
6. Add comprehensive error handling with Sentry context

```typescript
// From a worker, call Durable Object via TRPC client
// Prefer using random stable IDs for giveawayId, but you can also use the name-based approach
const id = env.GIVEAWAY_STATE.idFromName(giveawayId);
const stub = getContext().state.getInstance(env.GIVEAWAY_STATE, id);
// Type-safe calls with error handling
try {
  const entries = await client.entries.getAll.query();
  const result = await client.giveaway.end.mutate({ winners: 3 });
} catch (error) {
  // TRPC errors are automatically captured by Sentry in DO context
  console.error("Failed to end giveaway:", error);
  throw error;
}
```

**Debugging Durable Objects:**

- Use `wrangler dev --persist-to=.mf/` for local state persistence
- Check `.mf/v3/` directory for SQLite databases (one per DO instance)
- Add logging to router procedures - logs appear in wrangler dev console
- Use `wrangler tail` to stream production logs
- Sentry captures all errors with full context including DO state

### Package Conditional Exports

```typescript
// In package.json - separate contexts for workers vs durables
"exports": {
  "./workers": "./src/workers/index.ts",   // Use with D1Database
  "./durables": "./src/durables/index.ts"  // Use with DurableObjectStorage
}

// Import pattern
import { drizzleD1, Schema } from "@dougley/frugal-drizzle/workers";
import { drizzleDurable, Schema as DurableSchema } from "@dougley/frugal-drizzle/durables";
```

### TanStack Start Route Context

```typescript
// In route's loader/beforeLoad - access request context
import { getRequestContext } from "~/server/request-context";

export const Route = createRoute({
  async loader() {
    const { env, cf } = getRequestContext();
    const db = drizzleD1(env.D1);
    // ... use Cloudflare resources
  },
});

// In TRPC procedures - context is auto-injected
export const myRouter = {
  getData: publicProcedure.query(async ({ ctx }) => {
    // ctx.env, ctx.headers available here
    const db = drizzleD1(ctx.env.D1);
    return db.query.users.findMany();
  }),
};
```

## Deployment

**Environments**

- `development` - Local wrangler dev with persistence in `.mf/`
- `staging` - Auto-deploys from `main` branch, uses staging wrangler environment
- `production` - Manual workflow dispatch, requires command deployment confirmation

**Multi-app Strategy**

- Each app deploys independently based on path filters in GitHub Actions
- D1 migrations always run before worker deployment
- Web app deploys to Cloudflare Pages
- Discord/webhooks deploy as Cloudflare Workers

### Authentication (`apps/web/`)

**Stateless Auth with Better Auth**

- Better Auth library with Discord OAuth2 provider
- **Stateless mode**: Session stored in encrypted JWE cookie (no database)
- Cloudflare KV used for secondary storage (session caching, rate limiting)
- OAuth scopes: `identify`, `email`, `guilds` (for fetching user's Discord servers)
- Cookies automatically chunked if > 4KB due to encrypted session data
- Configuration in `src/server/auth/index.ts`

**Two-Layer Auth Access Pattern**

The web app provides auth access at multiple levels:

1. **Server-Side (beforeLoad/TRPC)** - Use `getSessionFn()` or TRPC protected procedures
2. **Client-Side (Components)** - Use `AuthContext` hooks

**Server-Side Auth**

```typescript
import { getSessionFn } from "~/server/auth/session";

// In route's beforeLoad (runs during SSR)
export const Route = createRoute({
  async beforeLoad() {
    const session = await getSessionFn();
    // session is SessionData | null
    if (!session) {
      throw redirect({ to: "/auth/login" });
    }
    return { session };
  },
});

// In TRPC protected procedure
import { protectedProcedure } from "~/server/trpc/instance";

export const myRouter = {
  getData: protectedProcedure.query(async ({ ctx }) => {
    // ctx.session is guaranteed non-null
    return fetchUserData(ctx.session.user.id);
  }),
};
```

**Auth Hooks (Client-Side)**

```typescript
import { useAuth } from "~/components/AuthContext";

// Get auth state with isAuthenticated flag
function MyComponent() {
  const { isAuthenticated, user, session } = useAuth();
  if (!isAuthenticated) return <NotLoggedIn />;
  return <div>Welcome {user?.name}!</div>;
}

// Access route context (includes session from beforeLoad)
function ProtectedComponent() {
  const { session } = Route.useRouteContext();
  // Type narrowing in beforeLoad ensures session is non-null here
  return <UserProfile user={session.user} />;
}
```

**Important Auth Concepts**

- **Root beforeLoad pattern**: Session fetched once in `__root.tsx` beforeLoad using `getSessionFn()`
- **AuthProvider distribution**: Session passed to AuthProvider in root component
- **createServerFn**: Used for session fetching to ensure proper cookie handling during SSR
- **Protected procedures**: TRPC middleware validates session and populates `ctx.session`
- **Sentry integration**: User context automatically set in Sentry when authenticated
- **Type safety**: Protected procedures guarantee non-null session via middleware

**Auth Flow**

1. User clicks login → Redirects to `/api/auth/sign-in/social/discord`
2. OAuth2 redirect to Discord → User authorizes
3. Callback to Better Auth → Creates encrypted session cookie
4. Redirect to return URL → Root beforeLoad fetches session
5. AuthProvider distributes session to all components via React Context

## Key Files to Reference

### Architecture

- `apps/discord/src/context.ts` - AsyncLocalStorage pattern for request-scoped dependencies
- `apps/discord/src/classes/BaseCommand.ts` - Command base class with i18n and premium support
- `packages/giveaway-state-v3/src/router.ts` - TRPC router defining all Durable Object operations
- `packages/giveaway-state-v3/src/trpc.ts` - TRPC/Durable Object integration layer
- `apps/web/src/components/AuthContext/AuthContext.tsx` - React Context for auth state distribution
- `apps/web/src/server/auth/index.ts` - Better Auth configuration (stateless mode)
- `apps/web/src/server/auth/session.ts` - Server-side session utilities (getSessionFn)
- `apps/web/src/server/trpc/instance.ts` - TRPC initialization with middleware
- `apps/web/src/server/request-context.ts` - Request context for Cloudflare bindings

### Configuration

- `turbo.json` - Build orchestration and caching
- `biome.json` - Linting and formatting rules
- `pnpm-workspace.yaml` - Monorepo structure and catalog dependencies
- `apps/*/wrangler.jsonc` - Worker configuration for each app
- `apps/web/vite.config.ts` - Vite + TanStack Start + Cloudflare configuration

### Examples

- `apps/discord/src/commands/slash/start.ts` - Full command with validation, i18n, premium checks
- `apps/web/src/server.ts` - TanStack Start + Cloudflare Pages integration with Sentry
- `apps/web/src/routes/__root.tsx` - Root route with beforeLoad, theme, and providers
- `apps/web/src/server/trpc/routers/auth.ts` - TRPC router for Discord API calls
- `packages/i18n/src/index.ts` - KV-backed i18n implementation with caching
