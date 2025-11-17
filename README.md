# dipdca

下落シグナル付きドルコスト平均アプリ (REIT / GOLD / BTC).

- backend: FastAPI + yfinance
- frontend: HTML + CSS + JS (Chart.js)

## ローカル起動

1. FastAPI バックエンド
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app:app --reload
   ```
2. `frontend/index.html` をブラウザで開く。バックエンドは `http://localhost:8000` で動作させる。
