#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="${REPO_ROOT}/.backend.pid"

if [[ -f "${PID_FILE}" ]]; then
  UVICORN_PID="$(<"${PID_FILE}")"
  if kill "${UVICORN_PID}" >/dev/null 2>&1; then
    if child_pids="$(pgrep -P "${UVICORN_PID}" || true)"; then
      for child in ${child_pids}; do
        kill "${child}" >/dev/null 2>&1 || true
      done
    fi
    rm -f "${PID_FILE}"
    pkill -f "uvicorn app:app" >/dev/null 2>&1 || true
    echo "Stopped uvicorn process (PID ${UVICORN_PID})."
    exit 0
  fi
  echo "uvicorn (PID ${UVICORN_PID}) を停止できませんでした; 既に終了しているか確認してください。"
fi

if pkill -f "uvicorn app:app" >/dev/null 2>&1; then
  echo "Stopped uvicorn process for app:app."
else
  echo "uvicorn (app:app) は動いていません。"
fi
