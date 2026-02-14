import { useMemo } from 'react';
import {
    Container, Title, SimpleGrid, Paper, Text, Group,
    Stack, RingProgress, Skeleton,
} from '@mantine/core';
import {
    IconArrowUpRight, IconArrowDownRight,
    IconWallet,
} from '@tabler/icons-react';
import { useJournals } from '../../hooks/useJournals';
import { useAccounts } from '../../hooks/useAccounts';
import { formatCurrency } from '../../lib/accounting';
import dayjs from 'dayjs';

export default function DashboardPage() {
    const { data: journals, isLoading: jLoading } = useJournals();
    const { data: accounts, isLoading: aLoading } = useAccounts();

    const isLoading = jLoading || aLoading;

    // 今月のデータを集計
    const stats = useMemo(() => {
        if (!journals || !accounts) return null;

        const thisMonth = dayjs().format('YYYY-MM');
        const monthJournals = journals.filter((j) => j.date.startsWith(thisMonth));

        // 収益・費用の勘定科目IDセット
        const revenueIds = new Set(accounts.filter((a) => a.type === 'revenue').map((a) => a.id));
        const expenseIds = new Set(accounts.filter((a) => a.type === 'expense').map((a) => a.id));

        let totalRevenue = 0;
        let totalExpense = 0;
        const categoryExpense: Record<string, number> = {};

        for (const j of monthJournals) {
            for (const e of j.journal_entries) {
                if (revenueIds.has(e.account_id)) {
                    totalRevenue += e.credit_amount;
                }
                if (expenseIds.has(e.account_id)) {
                    totalExpense += e.debit_amount;
                    const accName = accounts.find((a) => a.id === e.account_id)?.name ?? '不明';
                    categoryExpense[accName] = (categoryExpense[accName] ?? 0) + e.debit_amount;
                }
            }
        }

        // カテゴリ別を上位5つに絞る
        const topCategories = Object.entries(categoryExpense)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return { totalRevenue, totalExpense, balance: totalRevenue - totalExpense, topCategories, expenseDivisor: totalExpense || 1 };
         
    }, [journals, accounts]);

    const COLORS = ['#339af0', '#51cf66', '#fcc419', '#ff6b6b', '#cc5de8'];

    return (
        <Container size="lg" py="md">
            <Title order={2} mb="lg">ダッシュボード</Title>

            {/* サマリーカード */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
                <Paper withBorder p="md" radius="md">
                    {isLoading ? <Skeleton height={60} /> : (
                        <Group>
                            <IconArrowUpRight size={28} color="var(--mantine-color-teal-6)" />
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>今月の収入</Text>
                                <Text size="xl" fw={700}>{formatCurrency(stats?.totalRevenue ?? 0)}</Text>
                            </div>
                        </Group>
                    )}
                </Paper>
                <Paper withBorder p="md" radius="md">
                    {isLoading ? <Skeleton height={60} /> : (
                        <Group>
                            <IconArrowDownRight size={28} color="var(--mantine-color-red-6)" />
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>今月の支出</Text>
                                <Text size="xl" fw={700}>{formatCurrency(stats?.totalExpense ?? 0)}</Text>
                            </div>
                        </Group>
                    )}
                </Paper>
                <Paper withBorder p="md" radius="md">
                    {isLoading ? <Skeleton height={60} /> : (
                        <Group>
                            <IconWallet size={28} color="var(--mantine-color-blue-6)" />
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>収支差額</Text>
                                <Text
                                    size="xl"
                                    fw={700}
                                    c={(stats?.balance ?? 0) >= 0 ? 'teal' : 'red'}
                                >
                                    {formatCurrency(stats?.balance ?? 0)}
                                </Text>
                            </div>
                        </Group>
                    )}
                </Paper>
            </SimpleGrid>

            {/* カテゴリ別支出 */}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Paper withBorder p="md" radius="md">
                    <Text size="sm" fw={700} mb="md">カテゴリ別支出（今月）</Text>
                    {isLoading ? <Skeleton height={200} /> : (
                        <Group justify="center">
                            <RingProgress
                                size={180}
                                thickness={20}
                                sections={
                                    stats?.topCategories.map(([, amount], i) => ({
                                        value: (amount / (stats?.expenseDivisor ?? 1)) * 100,
                                        color: COLORS[i % COLORS.length],
                                    })) ?? []
                                }
                            />
                            <Stack gap="xs">
                                {stats?.topCategories.map(([name, amount], i) => (
                                    <Group key={name} gap="xs">
                                        <div style={{
                                            width: 12, height: 12, borderRadius: 2,
                                            backgroundColor: COLORS[i % COLORS.length],
                                        }} />
                                        <Text size="sm">{name}</Text>
                                        <Text size="sm" c="dimmed">{formatCurrency(amount)}</Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Group>
                    )}
                </Paper>

                <Paper withBorder p="md" radius="md">
                    <Text size="sm" fw={700} mb="md">最近の仕訳</Text>
                    {isLoading ? <Skeleton height={200} /> : (
                        <Stack gap="xs">
                            {journals?.slice(0, 8).map((j) => (
                                <Group key={j.id} justify="space-between">
                                    <div>
                                        <Text size="sm">{j.description}</Text>
                                        <Text size="xs" c="dimmed">{j.date}</Text>
                                    </div>
                                    <Text size="sm" fw={500}>
                                        {formatCurrency(
                                            j.journal_entries.reduce((s, e) => s + e.debit_amount, 0)
                                        )}
                                    </Text>
                                </Group>
                            ))}
                            {(!journals || journals.length === 0) && (
                                <Text size="sm" c="dimmed" ta="center">まだ仕訳がありません</Text>
                            )}
                        </Stack>
                    )}
                </Paper>
            </SimpleGrid>
        </Container>
    );
}
