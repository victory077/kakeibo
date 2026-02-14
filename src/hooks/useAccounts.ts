import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Account } from '../types';

/** 勘定科目一覧を取得 */
export function useAccounts() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['accounts', user?.id],
        queryFn: async (): Promise<Account[]> => {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user!.id)
                .order('sort_order');
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
}

/** 勘定科目を追加 */
export function useCreateAccount() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (account: Pick<Account, 'code' | 'name' | 'type' | 'sort_order'>) => {
            const { data, error } = await supabase
                .from('accounts')
                .insert({ ...account, user_id: user!.id })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
}

/** 勘定科目を削除（仕訳で使用中の場合はDB制約エラー） */
export function useDeleteAccount() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (accountId: string) => {
            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', accountId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
}
