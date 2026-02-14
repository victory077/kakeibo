import { supabase } from './supabase';
import type { CategoryRule, Account } from '../types';
import { suggestCategory } from './gemini';

/**
 * キーワードルールに基づいて勘定科目IDを推定
 * マッチしない場合はGemini APIにフォールバック
 */
export async function categorize(
    description: string,
    rules: CategoryRule[],
    accounts: Account[],
): Promise<string | null> {
    // 1) キーワードルールでマッチ
    const lowerDesc = description.toLowerCase();
    for (const rule of rules) {
        if (lowerDesc.includes(rule.keyword.toLowerCase())) {
            return rule.account_id;
        }
    }

    // 2) Gemini APIで推定
    try {
        const expenseAccounts = accounts.filter((a) => a.type === 'expense');
        const suggestedName = await suggestCategory(
            description,
            expenseAccounts.map((a) => a.name),
        );
        const matched = expenseAccounts.find((a) => a.name === suggestedName);
        return matched?.id ?? expenseAccounts[0]?.id ?? null;
    } catch (error) {
        console.error('Gemini科目推定エラー:', error);
        // フォールバック: 「その他費用」
        const fallback = accounts.find((a) => a.code === '5099');
        return fallback?.id ?? null;
    }
}

/**
 * 新しいカテゴリルールを学習保存
 */
export async function learnCategoryRule(
    userId: string,
    keyword: string,
    accountId: string,
): Promise<void> {
    // 既存ルールの重複チェック
    const { data: existing } = await supabase
        .from('category_rules')
        .select('id')
        .eq('user_id', userId)
        .eq('keyword', keyword)
        .maybeSingle();

    if (existing) {
        // 既存ルールを更新
        await supabase
            .from('category_rules')
            .update({ account_id: accountId })
            .eq('id', existing.id);
    } else {
        // 新規ルールを追加
        await supabase
            .from('category_rules')
            .insert({ user_id: userId, keyword, account_id: accountId });
    }
}
