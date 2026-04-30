#!/bin/bash
set -e

# Web application deployment to Cloudflare Workers
CUSTOM_COMMAND="$1"

echo "🌐 Deploying web application to Cloudflare Workers..."

if [ -n "$CUSTOM_COMMAND" ]; then
  echo "Using custom deployment command: $CUSTOM_COMMAND"
  eval "$CUSTOM_COMMAND"
else
  echo "Using standard web deployment"
  pnpm wrangler deploy \
    --var SENTRY_DSN:$SENTRY_DSN \
    --var BETTER_AUTH_SECRET:$BETTER_AUTH_SECRET \
    --var DISCORD_CLIENT_ID:$DISCORD_CLIENT_ID \
    --var DISCORD_CLIENT_SECRET:$DISCORD_CLIENT_SECRET \
    --var RELEASE:$RELEASE \
    --var BRANCH:$BRANCH \
    --var BUILD_TIME:$BUILD_TIME \
    --var REPOSITORY:$REPOSITORY \
    --var ENVIRONMENT:$ENVIRONMENT
fi

echo "✅ Web application deployed successfully" 