# Use the base image
FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

WORKDIR /home/

COPY . .

RUN bash ./setup.sh

ENV PATH="/root/.cargo/bin:$PATH"

# Clone and install couchbase-shell
RUN git clone https://github.com/couchbaselabs/couchbase-shell.git \
    && cargo install --path ./couchbase-shell
