import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Title, Paper, Group, Button, TextInput, Select,
    NumberInput, Stack, Table, Text, ActionIcon, Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useCreateJournal } from '../../hooks/useJournals';
import { validateBalanced, formatCurrency } from '../../lib/accounting';
import dayjs from 'dayjs';

interface EntryRow {
    key: string;
    account_id: string;
    debit_amount: number;
    credit_amount: number;
}

export default function JournalCreatePage() {
    const navigate = useNavigate();
    const { data: accounts } = useAccounts();
    const createJournal = useCreateJournal();
    const [date, setDate] = useState<Date | null>(new Date());
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState<EntryRow[]>([
        { key: crypto.randomUUID(), account_id: '', debit_amount: 0, credit_amount: 0 },
        { key: crypto.randomUUID(), account_id: '', debit_amount: 0, credit_amount: 0 },
    ]);

    const accountOptions = accounts?.map((a) => ({
        value: a.id,
        label: `${a.code} ${a.name}`,
    })) ?? [];

    const validation = validateBalanced(entries);

    const updateEntry = (key: string, field: keyof EntryRow, value: string | number) => {
        setEntries((prev) =>
            prev.map((e) => (e.key === key ? { ...e, [field]: value } : e))
        );
    };

    const addRow = () => {
        setEntries((prev) => [
            ...prev,
            { key: crypto.randomUUID(), account_id: '', debit_amount: 0, credit_amount: 0 },
        ]);
    };

    const removeRow = (key: string) => {
        setEntries((prev) => prev.filter((e) => e.key !== key));
    };

    const handleSubmit = async () => {
        if (!date || !description || !validation.isBalanced) return;
        await createJournal.mutateAsync({
            date: dayjs(date).format('YYYY-MM-DD'),
            description,
            source_type: 'manual',
            entries: entries.map((e) => ({
                account_id: e.account_id,
                debit_amount: e.debit_amount,
                credit_amount: e.credit_amount,
            })),
        });
        navigate('/journals');
    };

    return (
        <Container size="lg" py="md">
            <Title order={2} mb="lg">仕訳入力</Title>

            <Paper withBorder p="md" radius="md">
                <Stack>
                    <Group grow>
                        <DatePickerInput
                            label="日付"
                            value={date}
                            onChange={(v) => setDate(v ? new Date(v) : null)}
                            valueFormat="YYYY/MM/DD"
                            required
                        />
                        <TextInput
                            label="摘要"
                            placeholder="例: スーパー買い物"
                            value={description}
                            onChange={(e) => setDescription(e.currentTarget.value)}
                            required
                        />
                    </Group>

                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>勘定科目</Table.Th>
                                <Table.Th w={150}>借方 (Debit)</Table.Th>
                                <Table.Th w={150}>貸方 (Credit)</Table.Th>
                                <Table.Th w={40} />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {entries.map((entry) => (
                                <Table.Tr key={entry.key}>
                                    <Table.Td>
                                        <Select
                                            placeholder="科目を選択"
                                            data={accountOptions}
                                            value={entry.account_id}
                                            onChange={(v) => updateEntry(entry.key, 'account_id', v ?? '')}
                                            searchable
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <NumberInput
                                            min={0}
                                            value={entry.debit_amount}
                                            onChange={(v) => updateEntry(entry.key, 'debit_amount', Number(v))}
                                            hideControls
                                            thousandSeparator=","
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <NumberInput
                                            min={0}
                                            value={entry.credit_amount}
                                            onChange={(v) => updateEntry(entry.key, 'credit_amount', Number(v))}
                                            hideControls
                                            thousandSeparator=","
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        {entries.length > 2 && (
                                            <ActionIcon color="red" variant="subtle" onClick={() => removeRow(entry.key)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Button variant="subtle" leftSection={<IconPlus size={14} />} onClick={addRow} size="sm">
                        行を追加
                    </Button>

                    <Group justify="space-between">
                        <Group>
                            <Text size="sm">借方合計: <strong>{formatCurrency(validation.debitTotal)}</strong></Text>
                            <Text size="sm">貸方合計: <strong>{formatCurrency(validation.creditTotal)}</strong></Text>
                            {validation.isBalanced ? (
                                <Badge color="green">貸借一致 ✓</Badge>
                            ) : (
                                <Badge color="red">差額: {formatCurrency(Math.abs(validation.difference))}</Badge>
                            )}
                        </Group>
                        <Button
                            onClick={handleSubmit}
                            loading={createJournal.isPending}
                            disabled={!validation.isBalanced || !description || !date}
                        >
                            仕訳を登録
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}
