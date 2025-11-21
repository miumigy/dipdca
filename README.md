# Dip-signal DCA - Dollar-cost averaging with dip signals (REIT / GOLD / BTC)

A lightweight research/ops app for dip-signal dollar-cost averaging (DCA). It tells you whether today’s buy should be 1x / 2x / 3x of your base amount, and backtests the same logic against a baseline DCA.

- Assets: REIT (REET) / GOLD (GLD) / BTC (BTC-USD)
- Stack: FastAPI + yfinance for price fetch / pure HTML + CSS + JS + Chart.js for the frontend
- Display currency: Toggle USD / JPY
- Languages: Toggle English / Japanese UI

## Local usage

Start the backend and open the frontend in your browser. FastAPI can also serve the static frontend, so running `uvicorn` alone is enough.

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

- Open `http://localhost:8000/` in your browser (the frontend is served by FastAPI).
- You can also open `frontend/index.html` directly; in that case the backend is assumed to run at `http://localhost:8000`.

## Screen flow

1. Choose asset, display currency, base amount, lookback days (L), thresholds for switching to 2x/3x (th2/th3), and history range (1–10 years).
2. Click “Fetch data & analyze” to pull closes from the backend and run the backtest.
3. “Today’s suggestion” tab shows today’s suggested multiple, amount to invest, and drawdown from the recent high.
4. “Backtest” tab compares baseline DCA vs. signal strategy with value curves and multiplier history.
5. Use the header Language toggle for EN/JA, and Currency toggle for USD/JPY formatting.

## Backtest / signal logic

- Take the rolling high of closing prices over the last L days, and compute drawdown from it.
  - If drawdown ≥ th3 → 3x; if drawdown ≥ th2 → 2x; otherwise 1x.
- Baseline: always 1x (fixed amount).
- Strategy: base amount × multiplier above.
- Metrics: final value, total invested, profit and cumulative return, return multiple, annualized return, max drawdown, etc.

## API

- `GET /health`
  - For Render-style health checks. Returns `{"status":"ok"}`.
- `GET /api/prices/{asset}`
  - `asset`: `reit` | `gold` | `btc`
  - `years`: 1–10 (default 1)
  - `currency`: `usd` | `jpy` (default usd)
  - Response example:
    ```json
    {
      "asset": "reit",
      "symbol": "REET",
      "years": 3,
      "currency": "usd",
      "prices": [
        { "date": "2023-09-01", "price": 25.1234 },
        { "date": "2023-09-04", "price": 25.4321 }
      ]
    }
    ```
  - Notes: Daily closes are fetched from Yahoo Finance via yfinance. For JPY, `JPY=X` is fetched and multiplied on each date (missing FX values are forward-filled).

## Deployment tips (e.g., Render)

- Build command: `cd backend && pip install -r requirements.txt`
- Start command: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
- Health check: `GET /health` (use Render’s assigned port)

## Directory

- `backend/app.py`: FastAPI endpoints and static serving. CORS is fully open.
- `backend/requirements.txt`: FastAPI / uvicorn / yfinance.
- `frontend/`: Build-less HTML/CSS/JS. Chart.js via CDN.
  - `js/backtest.js`: Multiplier decision and metrics (pure functions).
  - `js/charts.js`: Chart.js for value curves (line) and multiplier history (bar).
  - `js/app.js`: Form handling, API calls, i18n, rendering control.

## Development notes

- Price fetch requires network access; keep dependencies minimal for PaaS-friendly deploys.
- Max lookback range is 10 years (`MAX_YEARS`); `years` query is validated to 1–10.
- JPY formatting drops fractional digits; USD keeps two decimals.
- For future PaaS work (e.g., Render), keep `/health` and README commands up to date.

## License

- MIT License. See `LICENSE` for full terms.
