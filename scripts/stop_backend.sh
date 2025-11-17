#!/usr/bin/env bash
set -euo pipefail

if pkill -f "uvicorn app:app" >/dev/null 2>&1; then
  echo "Stopped uvicorn process for app:app."
else
  echo "uvicorn (app:app) は動いていません。"
fi
