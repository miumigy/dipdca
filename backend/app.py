from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import yfinance as yf
from pandas import DataFrame, Series, isna
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


ASSET_SYMBOLS: Dict[str, str] = {
    "reit": "REET",
    "gold": "GLD",
    "btc": "BTC-USD",
}
MAX_YEARS = 10
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="dipdca API")
api_router = APIRouter(prefix="/api", tags=["prices"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fetch_history(symbol: str, years: int) -> List[Dict[str, float]]:
    """
    Fetch daily closing prices for the requested number of years.

    yfinance accepts strings such as "1y", "2y", etc. and returns a pandas
    DataFrame indexed by date. We convert that into a serializable list of
    dictionaries.
    """
    # Add a small buffer to avoid missing the first day due to market holidays.
    start_date = datetime.utcnow() - timedelta(days=years * 365 + 7)
    history = yf.download(
        symbol,
        start=start_date.strftime("%Y-%m-%d"),
        interval="1d",
        progress=False,
        auto_adjust=False,
    )

    if history.empty:
        raise HTTPException(status_code=502, detail="Failed to fetch prices.")

    close_data = history["Close"]
    # yfinance sometimes returns a DataFrame for Close prices even with a single ticker,
    # so we normalize it to a Series.
    if isinstance(close_data, DataFrame):
        close_series: Series = close_data.iloc[:, 0]
    else:
        close_series = close_data

    prices = []
    for idx, close_price in close_series.items():
        if close_price is None or isna(close_price):
            continue
        prices.append({"date": idx.strftime("%Y-%m-%d"), "price": round(float(close_price), 4)})
    return prices


@api_router.get("/prices/{asset}")
async def get_prices(
    asset: str,
    years: int = Query(1, ge=1, le=MAX_YEARS, description="Number of years of history to fetch (1-10)."),
):
    asset_key = asset.lower()
    symbol = ASSET_SYMBOLS.get(asset_key)
    if not symbol:
        raise HTTPException(status_code=400, detail="Unsupported asset.")

    prices = fetch_history(symbol, years)
    return {"asset": asset_key, "symbol": symbol, "years": years, "prices": prices}


app.include_router(api_router)

if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
