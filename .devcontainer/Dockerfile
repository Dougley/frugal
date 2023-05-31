FROM mcr.microsoft.com/devcontainers/base:jammy as base

# install sqlite3 and libc++1
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends sqlite3 libc++1

# install Act
RUN curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# install Stripe CLI
RUN curl -s https://api.github.com/repos/stripe/stripe-cli/releases/latest \
    | grep browser_download_url.*_linux_amd64.deb  \
    | cut -d : -f 2,3 \
    | tr -d \" \
    | wget -qi - \
    && dpkg -i stripe*_linux_amd64.deb \
    && rm stripe*_linux_amd64.deb