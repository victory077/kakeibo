// ========================================
// 型定義 - 家計簿アプリ Kakeibo
// ========================================

/** 勘定科目の区分 */
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

/** 仕訳のソース */
export type SourceType = 'manual' | 'receipt_ocr' | 'card_screenshot';

/** 勘定科目 */
export interface Account {
    id: string;
    user_id: string;
    code: string;
    name: string;
    type: AccountType;
    sort_order: number;
    created_at: string;
}

/** 仕訳（ヘッダー） */
export interface Journal {
    id: string;
    user_id: string;
    date: string;
    description: string;
    source_type: SourceType;
    source_image_url: string | null;
    created_at: string;
}

/** 仕訳明細行 */
export interface JournalEntry {
    id: string;
    journal_id: string;
    account_id: string;
    debit_amount: number;
    credit_amount: number;
    account?: Account;
}

/** 仕訳（明細行付き） */
export interface JournalWithEntries extends Journal {
    journal_entries: JournalEntry[];
}

/** 自動仕分けルール */
export interface CategoryRule {
    id: string;
    user_id: string;
    keyword: string;
    account_id: string;
}

// ========================================
// OCR・スキャン関連の型
// ========================================

/** OCR解析済みの1アイテム（レシートの1品目 or クレカの1取引） */
export interface ScannedItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    debit_account_id: string;
    credit_account_id: string;
    selected: boolean;
}

/** スキャン結果全体（レビュー画面で使用） */
export interface ScanResult {
    source_type: SourceType;
    source_image_url: string | null;
    store_name: string;
    items: ScannedItem[];
}

// ========================================
// 残高・試算表
// ========================================

/** 勘定科目ごとの残高 */
export interface AccountBalance {
    account: Account;
    debit_total: number;
    credit_total: number;
    balance: number;
}

/** デフォルト勘定科目の定義 */
export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'user_id' | 'created_at'>[] = [
    // === 資産 ===
    { code: '1001', name: '現金', type: 'asset', sort_order: 1 },
    { code: '1002', name: '普通預金', type: 'asset', sort_order: 2 },
    { code: '1003', name: '有価証券', type: 'asset', sort_order: 3 },
    { code: '1004', name: '電子マネー', type: 'asset', sort_order: 4 },
    // === 負債 ===
    { code: '2001', name: 'クレジットカード', type: 'liability', sort_order: 10 },
    { code: '2002', name: 'ローン', type: 'liability', sort_order: 11 },
    // === 純資産 ===
    { code: '3001', name: '元入金', type: 'equity', sort_order: 20 },
    // === 収益 ===
    { code: '4001', name: '給与収入', type: 'revenue', sort_order: 30 },
    { code: '4002', name: '副業収入', type: 'revenue', sort_order: 31 },
    { code: '4003', name: '利息・配当', type: 'revenue', sort_order: 32 },
    { code: '4009', name: 'その他収入', type: 'revenue', sort_order: 39 },
    // === 費用 ===
    { code: '5001', name: '食費', type: 'expense', sort_order: 50 },
    { code: '5002', name: '日用品費', type: 'expense', sort_order: 51 },
    { code: '5003', name: '交通費', type: 'expense', sort_order: 52 },
    { code: '5004', name: '通信費', type: 'expense', sort_order: 53 },
    { code: '5005', name: '水道光熱費', type: 'expense', sort_order: 54 },
    { code: '5006', name: '娯楽費', type: 'expense', sort_order: 55 },
    { code: '5007', name: '医療費', type: 'expense', sort_order: 56 },
    { code: '5008', name: '被服費', type: 'expense', sort_order: 57 },
    { code: '5009', name: '交際費', type: 'expense', sort_order: 58 },
    { code: '5010', name: '教育費', type: 'expense', sort_order: 59 },
    { code: '5011', name: '保険料', type: 'expense', sort_order: 60 },
    { code: '5012', name: '住居費', type: 'expense', sort_order: 61 },
    { code: '5013', name: '税金', type: 'expense', sort_order: 62 },
    { code: '5099', name: 'その他費用', type: 'expense', sort_order: 99 },
];

/** 勘定科目区分の日本語ラベル */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    asset: '資産',
    liability: '負債',
    equity: '純資産',
    revenue: '収益',
    expense: '費用',
};
