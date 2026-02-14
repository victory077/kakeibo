import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { JournalWithEntries, JournalEntry } from '../types';

/** 仕訳一覧を取得（明細付き） */
export function useJournals() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['journals', user?.id],
        queryFn: async (): Promise<JournalWithEntries[]> => {
            const { data, error } = await supabase
                .from('journals')
                .select(`
          *,
          journal_entries (
            *,
            account:accounts (*)
          )
        `)
                .eq('user_id', user!.id)
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
}

interface CreateJournalInput {
    date: string;
    description: string;
    source_type: string;
    source_image_url?: string | null;
    entries: Pick<JournalEntry, 'account_id' | 'debit_amount' | 'credit_amount'>[];
}

/** 仕訳を作成 */
export function useCreateJournal() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateJournalInput) => {
            // 1) 仕訳ヘッダーを作成
            const { data: journal, error: jErr } = await supabase
                .from('journals')
                .insert({
                    user_id: user!.id,
                    date: input.date,
                    description: input.description,
                    source_type: input.source_type,
                    source_image_url: input.source_image_url ?? null,
                })
                .select()
                .single();
            if (jErr) throw jErr;

            // 2) 明細行を作成
            const entries = input.entries.map((e) => ({
                journal_id: journal.id,
                account_id: e.account_id,
                debit_amount: e.debit_amount,
                credit_amount: e.credit_amount,
            }));
            const { error: eErr } = await supabase
                .from('journal_entries')
                .insert(entries);
            if (eErr) throw eErr;

            return journal;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journals'] });
            qc.invalidateQueries({ queryKey: ['balances'] });
        },
    });
}

/** 仕訳を一括作成（OCR結果から） */
export function useBulkCreateJournals() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (inputs: CreateJournalInput[]) => {
            const results = [];
            for (const input of inputs) {
                const { data: journal, error: jErr } = await supabase
                    .from('journals')
                    .insert({
                        user_id: user!.id,
                        date: input.date,
                        description: input.description,
                        source_type: input.source_type,
                        source_image_url: input.source_image_url ?? null,
                    })
                    .select()
                    .single();
                if (jErr) throw jErr;

                const entries = input.entries.map((e) => ({
                    journal_id: journal.id,
                    account_id: e.account_id,
                    debit_amount: e.debit_amount,
                    credit_amount: e.credit_amount,
                }));
                const { error: eErr } = await supabase
                    .from('journal_entries')
                    .insert(entries);
                if (eErr) throw eErr;
                results.push(journal);
            }
            return results;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journals'] });
            qc.invalidateQueries({ queryKey: ['balances'] });
        },
    });
}

/** 仕訳を削除 */
export function useDeleteJournal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (journalId: string) => {
            // 明細行を先に削除（外部キー制約）
            await supabase.from('journal_entries').delete().eq('journal_id', journalId);
            const { error } = await supabase.from('journals').delete().eq('id', journalId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['journals'] });
            qc.invalidateQueries({ queryKey: ['balances'] });
        },
    });
}
