import datetime
import sys
from pathlib import Path

import pytest
import httpx
from pandas import Series, date_range

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend import app as app_module  # noqa: E402


def make_series(values):
    dates = date_range("2024-01-01", periods=len(values), freq="D")
    return Series(values, index=dates)


@pytest.mark.asyncio
async def test_get_prices_usd(monkeypatch):
    sample = make_series([100.0, 101.0, 102.5])

    def fake_download_close(symbol, start_date):
        assert isinstance(start_date, datetime.datetime)
        return sample

    monkeypatch.setattr(app_module, "download_close_series", fake_download_close)

    transport = httpx.ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/prices/reit?years=1&currency=usd")

    assert response.status_code == 200
    data = response.json()
    assert data["asset"] == "reit"
    assert data["currency"] == "usd"
    prices = data["prices"]
    assert len(prices) == 3
    assert prices[-1]["price"] == 102.5


@pytest.mark.asyncio
async def test_get_prices_jpy_with_fx(monkeypatch):
    asset_series = make_series([1.0, 2.0])
    fx_series = make_series([100.0, 110.0])

    def fake_download_close(symbol, start_date):
        if symbol == app_module.FX_SYMBOLS["jpy"]:
            return fx_series
        return asset_series

    monkeypatch.setattr(app_module, "download_close_series", fake_download_close)

    transport = httpx.ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/prices/gold?years=2&currency=jpy")

    assert response.status_code == 200
    data = response.json()
    prices = data["prices"]
    assert len(prices) == 2
    assert prices[0]["price"] == 100.0
    assert prices[-1]["price"] == 220.0


@pytest.mark.asyncio
async def test_get_prices_invalid_asset(monkeypatch):
    transport = httpx.ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/prices/invalid?years=1&currency=usd")

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported asset."
