import type { JournalEntry } from '../types';

/**
 * 貸借一致チェック
 * 仕訳明細の借方合計と貸方合計が一致するか検証
 */
export function validateBalanced(entries: Pick<JournalEntry, 'debit_amount' | 'credit_amount'>[]): {
    isBalanced: boolean;
    debitTotal: number;
    creditTotal: number;
    difference: number;
} {
    const debitTotal = entries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
    const creditTotal = entries.reduce((sum, e) => sum + (e.credit_amount || 0), 0);
    return {
        isBalanced: debitTotal === creditTotal && debitTotal > 0,
        debitTotal,
        creditTotal,
        difference: debitTotal - creditTotal,
    };
}

/**
 * 金額をフォーマット（日本円）
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * 勘定科目の正常残高方向を取得
 * 資産・費用は借方残高、負債・純資産・収益は貸方残高
 */
export function getNormalBalanceSide(type: string): 'debit' | 'credit' {
    return type === 'asset' || type === 'expense' ? 'debit' : 'credit';
}

/**
 * 残高を計算（正常残高方向に基づく符号付き）
 */
export function calculateBalance(
    type: string,
    debitTotal: number,
    creditTotal: number,
): number {
    if (getNormalBalanceSide(type) === 'debit') {
        return debitTotal - creditTotal;
    }
    return creditTotal - debitTotal;
}
