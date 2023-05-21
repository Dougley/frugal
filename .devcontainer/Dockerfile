FROM mcr.microsoft.com/devcontainers/base:jammy as base

# Install cloudflared
RUN curl -s https://api.github.com/repos/cloudflare/cloudflared/releases/latest \
    | grep browser_download_url.*linux-amd64.deb \
    | cut -d : -f 2,3 \
    | tr -d \" \
    | wget -qi - \
    && dpkg -i cloudflared-linux-amd64.deb \
    && rm cloudflared-linux-amd64.deb

# install sqlite3 and libc++1
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends sqlite3 libc++1

# install Act
RUN curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash