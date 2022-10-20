#!/usr/bin/env bash


BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REGISTRY="http://0.0.0.0:4873"

for PACKAGE in $(npx lerna list | grep @); do 
  if (npm dist-tags "$PACKAGE" --registry "$REGISTRY" | grep -q "$BRANCH"); then 
    echo Removing Canary dist-tag "$PACKAGE@$BRANCH";
    npm dist-tag rm "$PACKAGE" "$BRANCH" --registry "$REGISTRY"
  fi; 
done
