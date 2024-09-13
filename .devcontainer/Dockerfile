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
    && /root/.cargo/bin/rustup component add clippy --toolchain nightly

# Add Cargo's bin directory to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Cargo packages
RUN cargo install cargo-expand cargo-edit

# Install Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" \
    && cp -R /root/.oh-my-zsh /home/${USERNAME}/ \
    && cp /root/.zshrc /home/${USERNAME}/ \
    && sed -i -e "s/\/root\/.oh-my-zsh/\/home\/${USERNAME}\/.oh-my-zsh/g" /home/${USERNAME}/.zshrc \
    && chown -R ${USER_UID}:${USER_GID} /home/${USERNAME}/.oh-my-zsh /home/${USERNAME}/.zshrc

# Source Cargo environment
RUN echo 'source $HOME/.cargo/env' >> /home/${USERNAME}/.zshrc

# Clone and install couchbase-shell
RUN git clone https://github.com/couchbaselabs/couchbase-shell.git /home/${USERNAME}/couchbase-shell \
    && cd /home/${USERNAME}/couchbase-shell \
    && cargo install --path .

# Change default shell to zsh for the user
RUN chsh -s /bin/zsh ${USERNAME}

# Ensure the user owns their home directory
RUN chown -R ${USER_UID}:${USER_GID} /home/${USERNAME}

# Switch to non-root user
USER ${USERNAME}

# Set the working directory
WORKDIR /workspace
