import { useMemo } from 'react';
import { Container, Title, Paper, Table, Text, Badge, Skeleton } from '@mantine/core';
import { useJournals } from '../../hooks/useJournals';
import { useAccounts } from '../../hooks/useAccounts';
import { formatCurrency, calculateBalance } from '../../lib/accounting';
import { ACCOUNT_TYPE_LABELS } from '../../types';
import type { AccountType } from '../../types';

const TYPE_COLORS: Record<AccountType, string> = {
    asset: 'blue',
    liability: 'red',
    equity: 'grape',
    revenue: 'teal',
    expense: 'orange',
};

export default function TrialBalancePage() {
    const { data: journals, isLoading: jL } = useJournals();
    const { data: accounts, isLoading: aL } = useAccounts();
    const isLoading = jL || aL;

    const balances = useMemo(() => {
        if (!journals || !accounts) return [];

        const totals: Record<string, { debit: number; credit: number }> = {};
        for (const a of accounts) {
            totals[a.id] = { debit: 0, credit: 0 };
        }
        for (const j of journals) {
            for (const e of j.journal_entries) {
                if (totals[e.account_id]) {
                    totals[e.account_id].debit += e.debit_amount;
                    totals[e.account_id].credit += e.credit_amount;
                }
            }
        }

        return accounts.map((a) => ({
            account: a,
            debit_total: totals[a.id]?.debit ?? 0,
            credit_total: totals[a.id]?.credit ?? 0,
            balance: calculateBalance(a.type, totals[a.id]?.debit ?? 0, totals[a.id]?.credit ?? 0),
        }));
    }, [journals, accounts]);

    const grandDebit = balances.reduce((s, b) => s + b.debit_total, 0);
    const grandCredit = balances.reduce((s, b) => s + b.credit_total, 0);

    return (
        <Container size="lg" py="md">
            <Title order={2} mb="lg">残高試算表</Title>

            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>コード</Table.Th>
                            <Table.Th>科目名</Table.Th>
                            <Table.Th>区分</Table.Th>
                            <Table.Th ta="right">借方合計</Table.Th>
                            <Table.Th ta="right">貸方合計</Table.Th>
                            <Table.Th ta="right">残高</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Table.Tr key={i}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <Table.Td key={j}><Skeleton height={20} /></Table.Td>
                                    ))}
                                </Table.Tr>
                            ))
                        ) : (
                            balances.map((b) => (
                                <Table.Tr key={b.account.id}>
                                    <Table.Td><Text ff="monospace" size="sm">{b.account.code}</Text></Table.Td>
                                    <Table.Td><Text size="sm">{b.account.name}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge size="sm" color={TYPE_COLORS[b.account.type]} variant="light">
                                            {ACCOUNT_TYPE_LABELS[b.account.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="right"><Text size="sm">{formatCurrency(b.debit_total)}</Text></Table.Td>
                                    <Table.Td ta="right"><Text size="sm">{formatCurrency(b.credit_total)}</Text></Table.Td>
                                    <Table.Td ta="right">
                                        <Text size="sm" fw={600} c={b.balance < 0 ? 'red' : undefined}>
                                            {formatCurrency(b.balance)}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                    <Table.Tfoot>
                        <Table.Tr>
                            <Table.Td colSpan={3}><Text fw={700}>合計</Text></Table.Td>
                            <Table.Td ta="right"><Text fw={700}>{formatCurrency(grandDebit)}</Text></Table.Td>
                            <Table.Td ta="right"><Text fw={700}>{formatCurrency(grandCredit)}</Text></Table.Td>
                            <Table.Td ta="right">
                                <Badge color={grandDebit === grandCredit ? 'green' : 'red'}>
                                    {grandDebit === grandCredit ? '一致 ✓' : '不一致'}
                                </Badge>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tfoot>
                </Table>
            </Paper>
        </Container>
    );
}
