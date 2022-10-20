#!/usr/bin/env bash

git checkout master
git branch -D fix-1
git branch -D fix-2
git branch -D staging
git push origin --delete staging
git checkout -b staging
git push origin staging
git checkout master