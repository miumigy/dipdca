#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="${REPO_ROOT}/.venv"
PID_FILE="${REPO_ROOT}/.backend.pid"
LOG_DIR="${REPO_ROOT}/logs"
LOG_FILE="${LOG_DIR}/backend.log"

if [[ -d "${VENV_PATH}" ]]; then
  # shellcheck source=/dev/null
  source "${VENV_PATH}/bin/activate"
fi

mkdir -p "${LOG_DIR}"
cd "${REPO_ROOT}/backend"

nohup uvicorn app:app --reload --host 0.0.0.0 --port 8000 >>"${LOG_FILE}" 2>&1 &
UVICORN_PID=$!
echo "${UVICORN_PID}" > "${PID_FILE}"
echo "Started uvicorn (PID ${UVICORN_PID}); tail ${LOG_FILE} for output."
