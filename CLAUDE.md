# Kakeibo - 家計簿管理アプリ

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript |
| ビルド | Vite 7 |
| UI | Mantine v8 + Tabler Icons |
| データ | Supabase (PostgreSQL + Auth + Storage) |
| AI/OCR | Google Gemini API (gemini-1.5-flash) |
| 状態管理 | TanStack Query v5 |
| ルーティング | React Router v7 |
| 日付 | dayjs |
| バリデーション | Zod |

## プロジェクト構成

```
src/
├── main.tsx          # エントリポイント
├── App.tsx           # ルーティング + レイアウト (AppShell)
├── types/index.ts    # 全型定義
├── lib/
│   ├── supabase.ts   # Supabase クライアント
│   ├── gemini.ts     # Gemini API (レシートOCR, クレカ明細解析, 科目推定)
│   ├── accounting.ts # 貸借一致検証, 通貨フォーマット, 残高計算
│   └── categorizer.ts # キーワードルール + Gemini フォールバックによる自動仕分け
├── hooks/
│   ├── useAuth.tsx   # Supabase Auth コンテキスト + デフォルト勘定科目シード
│   ├── useJournals.ts # 仕訳CRUD (TanStack Query)
│   └── useAccounts.ts # 勘定科目CRUD (TanStack Query)
└── pages/
    ├── auth/          # ログイン / 新規登録
    ├── dashboard/     # 月次サマリー + カテゴリ別支出
    ├── journal/       # 仕訳一覧 / 手動入力
    ├── scan/          # 画像アップロード + OCRレビュー
    ├── account/       # 勘定科目管理
    └── trial-balance/ # 残高試算表
```

## アーキテクチャ

### 複式簿記モデル
- `journals` (仕訳ヘッダー) → 1:N → `journal_entries` (明細行)
- 各明細行: `account_id` + `debit_amount` + `credit_amount`
- 借方合計 = 貸方合計 の貸借一致が原則

### OCR フロー
1. 画像アップロード → `ScanPage`
2. Gemini API で構造化データ抽出 (`analyzeReceipt` / `analyzeCardScreenshot`)
3. `categorizer.ts` で各品目の勘定科目を自動推定
4. `ScanReviewPage` でユーザーが確認・修正
5. 一括登録 → ルール学習 (`learnCategoryRule`)

### 認証
- Supabase Auth (メール/パスワード)
- RLS でユーザーごとのデータ分離
- 新規ユーザー登録時にデフォルト勘定科目を自動作成

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm test         # テスト実行
npm run lint     # ESLint実行
npm run build    # ビルド（型チェック含む）
npm run preview  # ビルド済みアセットのプレビュー
```

## 環境変数 (.env)

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_INVITE_CODE=your-invite-code   # 新規登録時に必要な招待コード
```

## DB マイグレーション

`supabase/migrations/001_initial_schema.sql` を Supabase SQL Editor で実行。
テーブル: `accounts`, `journals`, `journal_entries`, `category_rules`
全テーブルに RLS ポリシー設定済み。

## 勘定科目コード命名規則

| 範囲 | 区分 | 例 |
|------|------|-----|
| `1xxx` | 資産 (asset) | `1001` 現金, `1002` 普通預金, `1003` 有価証券 |
| `2xxx` | 負債 (liability) | `2001` クレジットカード, `2002` ローン |
| `3xxx` | 純資産 (equity) | `3001` 元入金 |
| `4xxx` | 収益 (revenue) | `4001` 給与収入, `4009` その他収入 |
| `5xxx` | 費用 (expense) | `5001` 食費, `5099` その他費用 |

- 末尾 `99` / `09` = 「その他」用の汎用コード
- ユーザー追加科目は各区分の空きコードを使用

## コーディング規約

- 日本語コメント・ラベル
- コンポーネントは `export default function` 形式
- Mantine コンポーネントを使用（生HTMLは最小限）
- 金額は整数（円単位）で管理
- TanStack Query のキー: `['journals']`, `['accounts']`, `['balances']`
