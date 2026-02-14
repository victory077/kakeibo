-- ========================================
-- 家計簿アプリ Kakeibo - データベーススキーマ
-- Supabase で実行してください
-- ========================================

-- 勘定科目テーブル
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, code)
);

-- 仕訳テーブル（ヘッダー）
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'receipt_ocr', 'card_screenshot')),
  source_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 仕訳明細テーブル
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT NOT NULL,
  debit_amount INTEGER NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount INTEGER NOT NULL DEFAULT 0 CHECK (credit_amount >= 0)
);

-- 自動仕分けルールテーブル
CREATE TABLE IF NOT EXISTS category_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(user_id, keyword)
);

-- ========================================
-- RLS (Row Level Security) ポリシー
-- ========================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- accounts ポリシー
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- journals ポリシー
CREATE POLICY "Users can view own journals" ON journals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals" ON journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals" ON journals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals" ON journals
  FOR DELETE USING (auth.uid() = user_id);

-- journal_entries ポリシー (journalのuser_idで間接的に制御)
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM journals WHERE journals.id = journal_entries.journal_id AND journals.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM journals WHERE journals.id = journal_entries.journal_id AND journals.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM journals WHERE journals.id = journal_entries.journal_id AND journals.user_id = auth.uid())
  );

-- category_rules ポリシー
CREATE POLICY "Users can view own rules" ON category_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON category_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON category_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON category_rules
  FOR DELETE USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_journal_id ON journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_user_id ON category_rules(user_id);
