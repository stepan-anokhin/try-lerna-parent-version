#!/usr/bin/env bash

set -x

# Prepare a local folder to keep Verdaccio persistent state
V_PATH="$(pwd)/registry";
mkdir -p "$V_PATH/conf"
mkdir -p "$V_PATH/plugins"
mkdir -p "$V_PATH/storage"


# Download config:
CONFIG_FILE="$V_PATH/conf/config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    curl https://raw.githubusercontent.com/verdaccio/verdaccio/5.x/conf/docker.yaml -o "$CONFIG_FILE"
fi


# Fix permission issue. See the following comment:
# https://github.com/verdaccio/verdaccio/issues/1379#issuecomment-541573680
sudo chown 10001:65533 $V_PATH/*


# Run Verdaccio
sudo docker run -it --rm --name verdaccio \
  -p 4873:4873 \
  -v $V_PATH/conf:/verdaccio/conf \
  -v $V_PATH/storage:/verdaccio/storage \
  -v $V_PATH/plugins:/verdaccio/plugins \
  -d verdaccio/verdaccio
