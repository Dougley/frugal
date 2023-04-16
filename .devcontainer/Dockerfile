FROM mcr.microsoft.com/devcontainers/typescript-node:18 as base

# Install node.js v18.3
# We do this to prevent some weirdness with webcrypto and miniflare
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install 18.3 --default"

# Install cloudflared
RUN wget https://github.com/cloudflare/cloudflared/releases/download/2023.4.0/cloudflared-linux-amd64.deb \
    && dpkg -i cloudflared-linux-amd64.deb \
    && rm cloudflared-linux-amd64.deb

# install sqlite3
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends sqlite3

# Install PlanetScale CLI
RUN wget https://github.com/planetscale/cli/releases/download/v0.126.0/pscale_0.126.0_linux_amd64.tar.gz \
    && tar xvzf ./pscale_0.126.0_linux_amd64.tar.gz -C /usr/local/bin \
    && rm ./pscale_0.126.0_linux_amd64.tar.gz