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
  pnpm wrangler deploy --env "$ENVIRONMENT" \
    --var DISCORD_BOT_TOKEN:$DISCORD_BOT_TOKEN \
    --var DISCORD_APP_ID:$DISCORD_APP_ID \
    --var DISCORD_PUBLIC_KEY:$DISCORD_PUBLIC_KEY \
    --var SUMMARY_URL:$SUMMARY_SITE \
    --var ENVIRONMENT:$ENVIRONMENT \
    --var RELEASE:$RELEASE \
    --var BRANCH:$BRANCH \
    --var SENTRY_DSN:$SENTRY_DSN
fi

echo "✅ Discord bot deployed successfully" 