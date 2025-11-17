# dipdca 開発ガイドライン（Codex向け）

あなたは「dipdca」というアプリの開発を支援するエージェントです。

## アプリの概要

- 下落シグナル付きドルコスト平均（DCA）の研究用＆運用用ミニアプリ。
- 対象資産:
  - REIT: REET
  - GOLD: GLD
  - BTC: BTC-USD
- 目的:
  - 毎日見ることを前提に、「今日はベース額の 1x / 2x / 3x のどれで買うか」を示す。
  - 同じロジックで過去1〜10年のバックテストを行い、ベースラインDCAとの比較を行う。

## ディレクトリ構成

- `backend/`
  - `app.py`
    - FastAPI + yfinance バックエンド。
    - エンドポイント: `GET /api/prices/{asset}?years=N`
      - `asset` は `reit` / `gold` / `btc`
      - 戻り値は `{ prices: [{ date: "YYYY-MM-DD", price: number }, ...] }`
  - `requirements.txt`
    - `fastapi`, `uvicorn[standard]`, `yfinance` を含む。

- `frontend/`
  - `index.html`
    - 単一ページ構成のUI。スマホ前提のダークテーマ。
    - Chart.js を CDN で読み込む。
  - `css/style.css`
    - レイアウト・配色。
  - `js/app.js`
    - 画面のイベントハンドリング。
    - フォーム入力の取得、API 呼び出し、バックテスト実行のトリガ。
  - `js/backtest.js`
    - DCAベースライン＆2x/3x戦略のバックテストロジック。
    - 計算専用にして、副作用のある処理は書かない。
  - `js/charts.js`
    - Chart.js によるグラフ描画ロジック。
    - 線グラフ（評価額推移）と棒グラフ（倍率）をここでまとめる。

## 技術的な方針

- バックエンド:
  - FastAPI を使用。
  - yfinance で Yahoo Finance から日次終値を取得する。
  - Render などの PaaS にデプロイしやすい構成にする。
  - まずはシンプルに `/api/prices/{asset}` のみを実装し、バックテストはフロント側で計算する。

- フロントエンド:
  - ビルドツール（Vite, Webpack 等）は使わず、素の HTML/CSS/JS で構成する。
  - 依存ライブラリは CDN 経由（例: Chart.js）。
  - スマホ（縦画面）で使いやすい UI を優先する。

## コーディングのルール

- 既存ファイルは、理由なく削除・改名しない。
- 大きなリファクタリングをするときは、必ず AGENTS.md を先に更新してから行う。
- 名前の意味がわかりやすい関数・変数名を使う。
- 複雑な計算ロジック（特に DCA / バックテスト）はコメントをつける。

## 追加でやってほしいことの例

- Render デプロイ用に:
  - `GET /health` エンドポイントの追加。
  - README に Build / Start コマンドの記載。
- 将来的には:
  - バックエンド側にバックテストAPIを追加することも検討するが、
    まずはフロントだけで完結する実装を優先する。
