#!/bin/bash
set -e

# Webhooks worker deployment to Cloudflare Workers
ENVIRONMENT="$1"
CUSTOM_COMMAND="$2"

echo "🪝 Deploying Webhooks worker to Cloudflare Workers..."

if [ -n "$CUSTOM_COMMAND" ]; then
  echo "Using custom deployment command: $CUSTOM_COMMAND"
  eval "$CUSTOM_COMMAND"
else
  echo "Using standard webhooks deployment"

  # Build deploy command with vars
  declare -a args=(
    "deploy"
    "--env" "$ENVIRONMENT"
  )

  args+=(
    "--var" "DISCORD_PUBLIC_KEY:$DISCORD_PUBLIC_KEY"
    "--var" "ENVIRONMENT:$ENVIRONMENT"
    "--var" "RELEASE:$RELEASE"
    "--var" "BRANCH:$BRANCH"
    "--var" "SENTRY_DSN:$SENTRY_DSN"
  )

  pnpm wrangler "${args[@]}"
fi

echo "✅ Webhooks worker deployed successfully"
