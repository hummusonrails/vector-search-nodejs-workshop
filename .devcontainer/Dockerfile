FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Install Rust via rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Set the PATH to include Cargo's bin directory
ENV PATH="$HOME/.cargo/bin:$PATH"

# Copy the application code
COPY . .

# Clone and install couchbase-shell
RUN git clone https://github.com/couchbaselabs/couchbase-shell.git \
    && cargo install --path ./couchbase-shell

