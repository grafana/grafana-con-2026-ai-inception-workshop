FROM alpine:3.19

# Install development basics
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    ca-certificates \
    gawk \
    ripgrep \
    fd \
    jq \
    make \
    gcc \
    musl-dev \
    nodejs \
    npm

# Install Go 1.25
RUN wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz \
    && rm go1.25.0.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"

# Install mage
RUN go install github.com/magefile/mage@latest

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Create non-root user with proper shell
RUN adduser -D -s /bin/bash vscode
USER vscode
WORKDIR /workspaces