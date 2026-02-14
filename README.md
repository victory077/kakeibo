# Kakeibo (家計簿アプリ)

React, Supabase, Gemini API を使用した、OCR機能付きのモダンな家計簿アプリケーションです。
レシートやクレジットカードの利用明細（スクリーンショット）をアップロードするだけで、日付・金額・店舗名を自動認識し、勘定科目を推定して仕訳データを作成します。

## 機能
- 🔐 **ユーザー認証**: Supabase Auth によるメールアドレス/パスワード認証
- 📷 **OCR入力**: Gemini API を使用した高精度なレシート/明細解析
- 🧠 **自動仕訳**: 店舗名や摘要から勘定科目を自動推定（学習機能付き）
- 📊 **ダッシュボード**: 今月の収支、カテゴリ別支出、最近の取引を表示
- 📝 **仕訳帳**: 複式簿記形式でのデータ管理（貸借一致の自動チェック）
- 🏢 **科目管理**: 資産・負債・純資産・収益・費用の5区分に対応

## 技術スタック
- **Frontend**: React (Vite), TypeScript, Mantine UI
- **Backend / DB**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **Testing**: Vitest, React Testing Library
- **Linting**: ESLint

## 開発環境のセットアップ

### 1. リポジトリのクローンと依存関係のインストール
```bash
git clone <repository-url>
cd kakeibo
npm install
```

### 2. 環境変数の設定
ルートディレクトリに `.env` ファイルを作成し、以下の値を設定してください。

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini API Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key

# Invitation Code (Optional for registration gate)
VITE_INVITE_CODE=kakeibo2026
```

---

### 3. Supabase のセットアップ

1. [Supabase](https://supabase.com/) で新規プロジェクトを作成します。
2. 左メニューの **SQL Editor** を開き、リポジトリ内の `supabase/migrations/001_initial_schema.sql` の内容をコピー＆ペーストして実行します。
   - これにより、必要なテーブル (`accounts`, `journals`, `journal_entries`, `category_rules`) と RLS ポリシーが作成されます。

---

### 4. Gemini API のセットアップ

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセスします。
2. **Create API key** をクリックしてキーを作成します。
3. 作成したキーを `.env` の `VITE_GEMINI_API_KEY` に設定します。
4. ※ `gemini-3-flash-preview` モデルを使用しています。

---

## コマンド一覧

- `npm run dev`: 開発サーバーを起動 (http://localhost:5173)
- `npm run build`: 本番用ビルド（TypeScriptチェック含む）
- `npm test`: ユニットテストの実行
- `npm run lint`: コードの静的解析 (ESLint)
