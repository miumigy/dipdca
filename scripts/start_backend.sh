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

if [[ -x "${VENV_PATH}/bin/uvicorn" ]]; then
  UVICORN_CMD="${VENV_PATH}/bin/uvicorn"
else
  UVICORN_CMD="$(command -v uvicorn)"
fi

PYTHON_CMD=""
if [[ -x "${VENV_PATH}/bin/python" ]]; then
  PYTHON_CMD="${VENV_PATH}/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD="$(command -v python)"
fi

if [[ -z "${PYTHON_CMD}" ]]; then
  echo "python が見つかりません。${VENV_PATH} を確認してください。" >>"${LOG_FILE}"
  exit 1
fi

if [[ -n "${UVICORN_CMD}" ]]; then
  RUN_CMD=("${UVICORN_CMD}" "app:app" "--reload" "--host" "0.0.0.0" "--port" "8000")
else
  RUN_CMD=("${PYTHON_CMD}" "-m" "uvicorn" "app:app" "--reload" "--host" "0.0.0.0" "--port" "8000")
fi

nohup "${RUN_CMD[@]}" >>"${LOG_FILE}" 2>&1 &
UVICORN_PID=$!
echo "${UVICORN_PID}" > "${PID_FILE}"
echo "Started uvicorn (PID ${UVICORN_PID}); tail ${LOG_FILE} for output."
