#!/bin/bash
export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"
cd "$(dirname "$0")"

while true; do
  npm run dev
  echo "vite dev server exited (code $?), restarting in 1s..." >&2
  sleep 1
done
