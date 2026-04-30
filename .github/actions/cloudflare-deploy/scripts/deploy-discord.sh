#!/bin/bash
set -e

# Discord Bot deployment to Cloudflare Workers
ENVIRONMENT="$1"
CUSTOM_COMMAND="$2"

echo "🚀 Deploying Discord bot to Cloudflare Workers..."

if [ -n "$CUSTOM_COMMAND" ]; then
  echo "Using custom deployment command: $CUSTOM_COMMAND"
  eval "$CUSTOM_COMMAND"
else
  echo "Using standard Discord deployment"

  SECRETS_FILE=$(mktemp)
  trap 'rm -f "$SECRETS_FILE"' EXIT

  # Build secrets object — add new secrets by adding --arg and property pairs
  jq -n \
    --arg token "$DISCORD_BOT_TOKEN" \
    '{
      DISCORD_BOT_TOKEN: $token
    }' \
    > "$SECRETS_FILE"

  # Build deploy command with vars
  declare -a args=(
    "deploy"
    "--env" "$ENVIRONMENT"
    "--secrets-file" "$SECRETS_FILE"
  )

  # Add Worker variables (non-sensitive configuration)
  args+=(
    "--var" "DISCORD_APP_ID:$DISCORD_APP_ID"
    "--var" "DISCORD_PUBLIC_KEY:$DISCORD_PUBLIC_KEY"
    "--var" "SUMMARY_URL:$SUMMARY_SITE"
    "--var" "ENVIRONMENT:$ENVIRONMENT"
    "--var" "RELEASE:$RELEASE"
    "--var" "BRANCH:$BRANCH"
    "--var" "SENTRY_DSN:$SENTRY_DSN"
  )

  pnpm wrangler "${args[@]}"
fi

echo "✅ Discord bot deployed successfully"
