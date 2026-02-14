import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEFAULT_ACCOUNTS } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * デフォルト勘定科目を作成/補完
 * 新規ユーザーの場合は全件作成、既存ユーザーの場合は不足分のみ追加
 */
async function seedDefaultAccounts(userId: string) {
    const { data: existing } = await supabase
        .from('accounts')
        .select('code')
        .eq('user_id', userId);

    const existingCodes = new Set((existing ?? []).map((a: { code: string }) => a.code));
    const missing = DEFAULT_ACCOUNTS.filter((a) => !existingCodes.has(a.code));

    if (missing.length === 0) return;

    const rows = missing.map((a) => ({ ...a, user_id: userId }));
    await supabase.from('accounts').insert(rows);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 現在のセッションを取得 & 不足デフォルト科目を補完
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                await seedDefaultAccounts(session.user.id);
            }
            setLoading(false);
        });

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
            await seedDefaultAccounts(data.user.id);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
