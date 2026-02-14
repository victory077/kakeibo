import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categorize } from './categorizer';
import * as gemini from './gemini';
import type { Account, CategoryRule } from '../types';

// Mock dependencies
vi.mock('./supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

vi.mock('./gemini', () => ({
    suggestCategory: vi.fn(),
}));

describe('categorizer.ts', () => {
    const mockAccounts: Account[] = [
        { id: '1', code: '5001', name: '食費', type: 'expense', sort_order: 1, user_id: 'user1', created_at: '2023-01-01' },
        { id: '2', code: '5099', name: 'その他費用', type: 'expense', sort_order: 2, user_id: 'user1', created_at: '2023-01-01' },
    ];

    const mockRules: CategoryRule[] = [
        { id: '1', keyword: 'スーパー', account_id: '1', user_id: 'user1' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('categorize', () => {
        it('should return account_id if keyword matches a rule', async () => {
            const result = await categorize('スーパーで買い物', mockRules, mockAccounts);
            expect(result).toBe('1'); // 食費
        });

        it('should call Gemini API if no rule matches', async () => {
            // Mock Gemini response
            vi.spyOn(gemini, 'suggestCategory').mockResolvedValue('食費');

            const result = await categorize('知らない店', mockRules, mockAccounts);

            expect(gemini.suggestCategory).toHaveBeenCalled();
            expect(result).toBe('1'); // 食費
        });

        it('should return default account if Gemini fails or returns unknown category', async () => {
            vi.spyOn(gemini, 'suggestCategory').mockResolvedValue('謎のカテゴリ');

            const result = await categorize('謎の店', mockRules, mockAccounts);

            // Should fallback to first expense account (食費 id:1) or null if generic fallback logic used
            // In categorizer.ts: return matched?.id ?? expenseAccounts[0]?.id ?? null;
            expect(result).toBe('1');
        });

        it('should return fallback 5099 if Gemini throws error', async () => {
            vi.spyOn(gemini, 'suggestCategory').mockRejectedValue(new Error('API Error'));

            const result = await categorize('エラー', mockRules, mockAccounts);

            // In categorizer.ts catch block: finds code '5099'
            expect(result).toBe('2'); // その他費用 id:2
        });
    });
});
