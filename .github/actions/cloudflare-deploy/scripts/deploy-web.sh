#!/bin/bash
set -e

# Web application deployment to Cloudflare Workers
CUSTOM_COMMAND="$1"
: "${CLOUDFLARE_ENV:?CLOUDFLARE_ENV must be set}"

echo "🌐 Deploying web application to Cloudflare Workers..."

if [ -n "$CUSTOM_COMMAND" ]; then
  echo "Using custom deployment command: $CUSTOM_COMMAND"
  eval "$CUSTOM_COMMAND"
else
  echo "Using standard web deployment"

  SECRETS_FILE=$(mktemp)
  trap 'rm -f "$SECRETS_FILE"' EXIT

  # Build secrets object — add new secrets by adding --arg and property pairs
  jq -n \
    --arg better_auth "$BETTER_AUTH_SECRET" \
    --arg discord_secret "$DISCORD_CLIENT_SECRET" \
    '{
      BETTER_AUTH_SECRET: $better_auth,
      DISCORD_CLIENT_SECRET: $discord_secret
    }' \
    > "$SECRETS_FILE"

  # Build deploy command with vars
  declare -a args=(
    "deploy"
    "--env" "$CLOUDFLARE_ENV"
    "--secrets-file" "$SECRETS_FILE"
  )

  # Add Worker variables (non-sensitive configuration)
  args+=(
    "--var" "SENTRY_DSN:$SENTRY_DSN"
    "--var" "DISCORD_CLIENT_ID:$DISCORD_CLIENT_ID"
    "--var" "RELEASE:$RELEASE"
    "--var" "BRANCH:$BRANCH"
    "--var" "BUILD_TIME:$BUILD_TIME"
    "--var" "REPOSITORY:$REPOSITORY"
    "--var" "ENVIRONMENT:$ENVIRONMENT"
  )

  pnpm wrangler "${args[@]}"
fi

echo "✅ Web application deployed successfully"
