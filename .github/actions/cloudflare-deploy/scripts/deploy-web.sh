#!/bin/bash
set -e

# Web application deployment to Cloudflare Pages
CUSTOM_COMMAND="$1"

echo "🌐 Deploying web application to Cloudflare Pages..."

if [ -n "$CUSTOM_COMMAND" ]; then
  echo "Using custom deployment command: $CUSTOM_COMMAND"
  eval "$CUSTOM_COMMAND"
else
  echo "Using standard web deployment"
  pnpm wrangler deploy \
    --var SENTRY_DSN:$SENTRY_DSN \
    --var SESSION_SECRET:$SESSION_SECRET \
    --var DISCORD_CLIENT_ID:$DISCORD_CLIENT_ID \
    --var DISCORD_PUBLIC_KEY:$DISCORD_PUBLIC_KEY \
    --var DISCORD_CLIENT_SECRET:$DISCORD_CLIENT_SECRET \
    --var DISCORD_CALLBACK_URL:$DISCORD_CALLBACK_URL \
    --var RELEASE:$RELEASE \
    --var BRANCH:$BRANCH \
    --var ATTESTATION_ID:$ATTESTATION_ID \
    --var BUILD_TIME:$BUILD_TIME \
    --var REPOSITORY:$REPOSITORY \
    --var ENVIRONMENT:$ENVIRONMENT
fi

echo "✅ Web application deployed successfully" 