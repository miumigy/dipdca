from datetime import datetime, timedelta
from math import isfinite
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
CURRENCY_OPTIONS: Dict[str, str] = {"usd": "USD", "jpy": "JPY"}
FX_SYMBOLS: Dict[str, str] = {"jpy": "JPY=X"}
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


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


def download_close_series(symbol: str, start_date: datetime) -> Series:
    history = yf.download(
        symbol,
        start=start_date.strftime("%Y-%m-%d"),
        interval="1d",
        progress=False,
        auto_adjust=False,
    )
    if history.empty:
        raise HTTPException(status_code=502, detail=f"{symbol} の価格取得に失敗しました。")

    close_data = history["Close"]
    if isinstance(close_data, DataFrame):
        close_series = close_data.iloc[:, 0]
    else:
        close_series = close_data
    return close_series.sort_index()


def fetch_history(symbol: str, years: int, currency: str) -> List[Dict[str, float]]:
    """
    Fetch daily closing prices and optionally convert them to the requested currency.
    """
    start_date = datetime.utcnow() - timedelta(days=years * 365 + 7)
    close_series = download_close_series(symbol, start_date)
    converted_series = close_series

    if currency == "jpy":
        fx_symbol = FX_SYMBOLS["jpy"]
        fx_series = download_close_series(fx_symbol, start_date)
        aligned_fx = fx_series.reindex(converted_series.index, method="ffill")
        converted_series = converted_series * aligned_fx

    prices = []
    for idx, close_price in converted_series.items():
        if close_price is None or isna(close_price) or not isfinite(float(close_price)):
            continue
        prices.append({"date": idx.strftime("%Y-%m-%d"), "price": round(float(close_price), 4)})
    return prices


@api_router.get("/prices/{asset}")
async def get_prices(
    asset: str,
    years: int = Query(1, ge=1, le=MAX_YEARS, description="Number of years of history to fetch (1-10)."),
    currency: str = Query("usd", regex="^(usd|jpy)$", description="表示通貨。usd / jpy を指定してください。"),
):
    asset_key = asset.lower()
    symbol = ASSET_SYMBOLS.get(asset_key)
    if not symbol:
        raise HTTPException(status_code=400, detail="Unsupported asset.")
    currency_key = currency.lower()
    if currency_key not in CURRENCY_OPTIONS:
        raise HTTPException(status_code=400, detail="Unsupported currency.")

    prices = fetch_history(symbol, years, currency_key)
    return {
        "asset": asset_key,
        "symbol": symbol,
        "years": years,
        "currency": currency_key,
        "prices": prices,
    }


app.include_router(api_router)

if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
