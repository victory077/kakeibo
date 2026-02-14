import { describe, it, expect } from 'vitest';
import { formatCurrency, validateBalanced, calculateBalance } from './accounting';

describe('accounting.ts', () => {
    describe('formatCurrency', () => {
        it('should format numbers clearly', () => {
            // Note: specific currency symbol might depend on environment ICU, checking for digits
            const formatted = formatCurrency(1000);
            expect(formatted).toContain('1,000');
        });
    });

    describe('validateBalanced', () => {
        it('should return true when debits equal credits', () => {
            const entries = [
                { account_id: '1', debit_amount: 100, credit_amount: 0 },
                { account_id: '2', debit_amount: 0, credit_amount: 100 },
            ];
            expect(validateBalanced(entries).isBalanced).toBe(true);
        });

        it('should return false when debits do not equal credits', () => {
            const entries = [
                { account_id: '1', debit_amount: 100, credit_amount: 0 },
                { account_id: '2', debit_amount: 0, credit_amount: 50 },
            ];
            expect(validateBalanced(entries).isBalanced).toBe(false);
        });

        it('should handle complex entries', () => {
            const entries = [
                { account_id: '1', debit_amount: 100, credit_amount: 0 },
                { account_id: '2', debit_amount: 200, credit_amount: 0 },
                { account_id: '3', debit_amount: 0, credit_amount: 300 },
            ];
            expect(validateBalanced(entries).isBalanced).toBe(true);
        });
    });

    describe('calculateBalance', () => {
        it('should calculate asset balance (debit normal)', () => {
            // Asset: Debit increases, Credit decreases
            expect(calculateBalance('asset', 1000, 200)).toBe(800);
        });

        it('should calculate liability balance (credit normal)', () => {
            // Liability: Credit increases, Debit decreases
            expect(calculateBalance('liability', 300, 1000)).toBe(700);
        });

        it('should calculate expense balance (debit normal)', () => {
            expect(calculateBalance('expense', 500, 0)).toBe(500);
        });

        it('should calculate revenue balance (credit normal)', () => {
            expect(calculateBalance('revenue', 0, 1000)).toBe(1000);
        });
    });
});
