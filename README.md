# PromptQuest — プロンプトクエスト 🎮

> **遊んで極める、プロンプトの技。**
> ゲーム形式で生成AIのプロンプトスキルを楽しく鍛える学習プラットフォームのプロトタイプです。

エンジニア向けに、クエスト（お題）へ挑戦しながらプロンプト作成スキルを段階的に伸ばせる Web アプリです。入力したプロンプトは **GitHub Models**（実際の LLM）が即座に採点し、良い点・改善点をフィードバックします。スコアに応じて XP が貯まり、レベルアップ・バッジ獲得・ランキングでモチベーションを維持できます。

---

## ✨ 主な機能

- **クエスト形式の学習**: 初級〜上級、要約・分析・コーディングなど実務に近いお題を用意。
- **LLM による即時プロンプト評価**（必須機能）: GitHub Models を使い、スコア（0〜100）・総評・良い点・改善点を返します。**モック実装ではなく、実際の LLM を呼び出します。**
- **ゲーミフィケーション**: XP・レベル・バッジ・挑戦履歴・ランキングを実装。
- **日本語 / 英語の2か国語対応**: 画面右上のワンクリックで切り替え。**日本語がデフォルト**。初回アクセス時は `Accept-Language` から自動判定します。
- **モダンで明るいレスポンシブ UI**: グラデーション、カード、プログレスバー、モバイル対応ナビゲーション。
- **認証不要**: プロトタイプのため、匿名の Cookie で進捗を管理します。

---

## 🛠 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| バックエンド | Node.js + Express |
| ビュー | EJS（サーバーサイドレンダリング） |
| フロントエンド | Vanilla JavaScript / CSS（フレームワーク非依存） |
| LLM | GitHub Models（OpenAI 互換 API） |
| 国際化 | 独自の軽量 i18n（`locales/*.json`） |
| テスト | Node.js 標準テストランナー（`node --test`） |

---

## 📁 プロジェクト構成

```
.
├── src/
│   ├── server.js          # Express アプリ本体（ルーティング / API）
│   ├── config.js          # 環境変数の読み込み・設定
│   ├── i18n.js            # 多言語対応（ja / en）ミドルウェア
│   ├── challenges.js      # クエストデータの読み込み・整形
│   ├── game.js            # XP・レベル・バッジ・ランキングのロジック
│   └── services/
│       └── llm.js         # GitHub Models を使ったプロンプト評価
├── locales/
│   ├── ja.json            # 日本語リソース（デフォルト）
│   └── en.json            # 英語リソース
├── data/
│   └── challenges.json    # クエスト（お題）データ（日英併記）
├── views/                 # EJS テンプレート
│   ├── partials/          # head / header / footer / quest-card
│   ├── home.ejs
│   ├── quests.ejs
│   ├── quest.ejs
│   ├── ranking.ejs
│   ├── mypage.ejs
│   └── error.ejs
├── public/
│   ├── css/style.css      # スタイル一式
│   ├── js/app.js          # クライアント JS（評価フロー・ナビ）
│   └── img/favicon.svg
├── test/                  # テスト（i18n / challenges / game / llm）
├── .env.example           # 環境変数のサンプル
├── .gitignore
└── package.json
```

---

## 🚀 セットアップと起動

### 1. 前提

- Node.js 18 以上（`fetch` を標準で利用します）

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、GitHub Models のトークンを設定します。

```bash
cp .env.example .env
```

`.env` を編集します。

```dotenv
# GitHub Models の Personal Access Token（models:read 権限が必要）
GITHUB_TOKEN=＜あなたのトークン＞

# 推論エンドポイント（OpenAI 互換）
GITHUB_MODELS_ENDPOINT=https://models.github.ai/inference/chat/completions

# 利用するモデル
GITHUB_MODELS_MODEL=openai/gpt-4o-mini

# サーバー設定
PORT=3000
DEFAULT_LOCALE=ja
```

> **GitHub Models のトークンの取得**
> [GitHub の Personal Access Tokens 設定](https://github.com/settings/personal-access-tokens) から、`models:read` 権限を持つトークンを発行してください。`.env` は `.gitignore` に含まれているため、コミットされません。

### 4. 起動

```bash
npm start
```

ブラウザで <http://localhost:3000> を開きます。開発時にファイル変更を監視したい場合は `npm run dev` を使用します。

---

## 🎯 使い方

1. **クエストを選ぶ**: 「クエスト」からお題を選択します。
2. **プロンプトを書く**: シナリオとゴールを読み、最適なプロンプトを入力します。
3. **AI が即採点**: 「プロンプトを評価する」を押すと、GitHub Models がスコアとフィードバックを返します。
4. **XP とバッジを獲得**: スコアに応じて XP が貯まり、レベルアップ・バッジ獲得・ランキング上位を目指します。

### バッジ一覧

| バッジ | 獲得条件 |
| --- | --- |
| はじめの一歩 | 最初のクエストをクリア |
| 高得点ハンター | 90点以上を獲得 |
| 熟練プロンプター | レベル5に到達 |
| 探求者 | 3つの異なるカテゴリーに挑戦 |

---

## 🔌 API

### `POST /api/evaluate`

プロンプトを評価します。

**リクエスト**

```json
{
  "questId": "log-summary",
  "prompt": "あなたはSREです。以下のエラーログを…"
}
```

クエリパラメータ `?lang=ja|en` でフィードバックの言語を指定できます。

**レスポンス（例）**

```json
{
  "score": 88,
  "feedback": "観点が明確で良いプロンプトです。",
  "strengths": ["出力フォーマットを指定している"],
  "improvements": ["対象読者を明示するとさらに良い"],
  "xpEarned": 88,
  "newBadges": [{ "id": "first_quest", "name": "はじめの一歩", "desc": "最初のクエストをクリアした" }],
  "profile": { "xp": 88, "level": 1, "xpIntoLevel": 88, "xpForNextLevel": 200 }
}
```

---

## 🧪 テスト

```bash
npm test
```

`test/` 配下に i18n・クエストデータ・ゲームロジック・LLM 応答パースのユニットテストがあります。LLM のテストは `fetch` をスタブして実行するため、ネットワーク接続やトークンは不要です。

---

## ⚠️ プロトタイプに関する注意

- ユーザー認証はありません。進捗は匿名の Cookie（`pid`）とサーバーのメモリ上に保持され、サーバー再起動でリセットされます。
- データベースは使用していません（要件定義では SQLite / MongoDB を想定）。永続化は今後の拡張対象です。
- プロンプト評価には有効な `GITHUB_TOKEN` が必要です。未設定の場合、評価 API はエラーを返します。

---

## 📜 ライセンス

MIT
