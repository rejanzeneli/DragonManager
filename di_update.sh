#!/usr/bin/env bash

rm .env
git reset --hard
git fetch
git pull
npm stop
rm -rf node_modules
npm install
npm prune
cp .env_digitalocean .env
npm start
