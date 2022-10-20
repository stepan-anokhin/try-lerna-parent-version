#!/usr/bin/env bash

set -x

# Create branch-specific version
npx lerna version --no-changelog --conventional-commits --conventional-prerelease --no-push --preid "$(git rev-parse --abbrev-ref HEAD)-$(git rev-parse --short HEAD)" --yes

# Publish canary release
npx lerna publish from-git --dist-tag "$(git rev-parse --abbrev-ref HEAD)" --yes
