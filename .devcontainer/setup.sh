## Install rustup and common components
curl https://sh.rustup.rs -sSf | sh -s -- -y 
. "$HOME/.cargo/env"

rustup install nightly
rustup component add rustfmt
rustup component add rustfmt --toolchain nightly
rustup component add clippy 
rustup component add clippy --toolchain nightly

cargo install cargo-expand
cargo install cargo-edit