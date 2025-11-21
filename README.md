# dipdca

下落シグナル付きドルコスト平均（DCA）の研究・運用用ミニアプリ。毎日の買付を「1x / 2x / 3x」のどれにするかを示し、同じロジックで過去の成績をバックテストします。

- 対象: REIT (REET) / GOLD (GLD) / BTC (BTC-USD)
- 構成: FastAPI + yfinance（価格取得） / Pure HTML+CSS+JS + Chart.js（フロント）
- 表示通貨: USD / JPY 切り替え
- 言語: 英語 / 日本語 UI 切り替え

## 使い方（ローカル）

バックエンドを起動し、フロントをブラウザで開きます。FastAPI はフロントを静的配信するため、`uvicorn` を動かすだけでも閲覧・実行できます。

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

- ブラウザで `http://localhost:8000/` を開く（フロントが FastAPI から配信されます）。
- もしくは `frontend/index.html` を直接開いても動作します（この場合バックエンドは `http://localhost:8000` を参照）。

## 画面の流れ

1. 資産、表示通貨、ベース額、ルックバック日数（L）、2x/3x に切り替えるしきい値（th2/th3）、履歴年数（1〜10年）を入力。
2. 「Fetch data & analyze」を押すとバックエンドから終値を取得してバックテストを実行。
3. 「Today's suggestion」タブで本日の推奨倍率と投資額、直近高値からの下落率を表示。
4. 「Backtest」タブでベースラインDCA vs シグナル戦略の評価額推移と倍率履歴をグラフ＆表で確認。
5. ヘッダーの Language 切替で英日UI、Currency 切替で USD/JPY 表示を切替。

## バックテスト／シグナルの考え方

- ルックバック期間 L 日の終値の最高値を rolling high とし、そこからの下落率（drawdown）で倍率を決定。
  - drawdown ≥ th3 のとき 3x、drawdown ≥ th2 のとき 2x、それ以外は 1x
- ベースライン: 毎回 1x（一定額）で買付
- 戦略: 上記倍率 × ベース額で買付
- 指標: 最終評価額、累計投資額、損益・累計収益率、リターン倍率、年率換算、最大ドローダウンなどを計算。

## API

- `GET /health`
  - Render 等のヘルスチェック用。`{"status":"ok"}` を返却。
- `GET /api/prices/{asset}`
  - `asset`: `reit` | `gold` | `btc`
  - `years`: 1〜10（デフォルト 1）
  - `currency`: `usd` | `jpy`（デフォルト usd）
  - 戻り値: 以下のような JSON
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
  - 備考: Yahoo Finance の日次終値を yfinance で取得。JPY の場合は `JPY=X` を取得し同日のレートで掛け合わせています（欠損は前方補完）。

## デプロイのヒント（例: Render）

- Build コマンド: `cd backend && pip install -r requirements.txt`
- Start コマンド: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
- Health check: `GET /health`（ポートは Render の割り当てポート）

## ディレクトリ

- `backend/app.py`: FastAPI エンドポイントと静的配信。CORS は全許可。
- `backend/requirements.txt`: FastAPI / uvicorn / yfinance。
- `frontend/`: ビルドレスな HTML/CSS/JS。Chart.js は CDN。
  - `js/backtest.js`: 倍率判定とメトリクス計算のみ（副作用なし）。
  - `js/charts.js`: Chart.js による評価額推移（線）と倍率履歴（棒）グラフ。
  - `js/app.js`: フォーム入力、API 呼び出し、i18n、描画ハンドリング。

## 開発メモ

- 価格取得はネットワークアクセスが必要。PaaS での稼働を想定し、余計な依存は持たない。
- 最大取得年数は 10 年（`MAX_YEARS`）。`years` クエリの範囲は 1〜10 にバリデート。
- JPY 表示時は少数桁を落とし、USD は2桁でフォーマット。
- 今後 Render 配備などの PaaS 対応を進める場合は `/health` 追加や README のコマンド更新を検討。
