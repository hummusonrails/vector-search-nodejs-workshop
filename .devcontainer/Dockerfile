# Use the base image
FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Set environment variables for non-interactive installations
ENV DEBIAN_FRONTEND=noninteractive
ENV USERNAME=codespace
ENV USER_UID=1000
ENV USER_GID=1000

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    zsh \
    build-essential \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Rust and necessary components
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y \
    && /root/.cargo/bin/rustup install nightly \
    && /root/.cargo/bin/rustup component add rustfmt \
    && /root/.cargo/bin/rustup component add rustfmt --toolchain nightly \
    && /root/.cargo/bin/rustup component add clippy \
    && /root/.cargo/bin/rustup component add clippy --toolchain nightly \
    && /root/.cargo/bin/rustup update stable \
    && /root/.cargo/bin/rustup default stable

# Add Cargo's bin directory to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Cargo packages
RUN cargo install cargo-expand cargo-edit

# Source Cargo environment
RUN echo 'source $HOME/.cargo/env' >> ~/.zshrc

# Clone and install couchbase-shell
RUN git clone https://github.com/couchbaselabs/couchbase-shell.git /home/${USERNAME}/couchbase-shell \
    && cd /home/${USERNAME}/couchbase-shell \
    && cargo install --path .

# Switch to non-root user
USER ${USERNAME}

# Set the working directory
WORKDIR /workspace
