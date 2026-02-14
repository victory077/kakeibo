import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container, Title, Paper, Group, Button, TextInput, NumberInput,
    Table, ActionIcon, Select, Text,
    Alert, Badge, Checkbox, Image,
} from '@mantine/core';
import { IconTrash, IconPlus, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useAccounts } from '../../hooks/useAccounts';
import { useBulkCreateJournals } from '../../hooks/useJournals';
import { useAuth } from '../../hooks/useAuth';
import { learnCategoryRule } from '../../lib/categorizer';
import { formatCurrency } from '../../lib/accounting';
import type { ScannedItem, SourceType } from '../../types';
import dayjs from 'dayjs';

interface LocationState {
    items: ScannedItem[];
    sourceType: SourceType;
    imageUrl: string | null;
}

export default function ScanReviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: accounts } = useAccounts();
    const bulkCreate = useBulkCreateJournals();

    const state = location.state as LocationState | null;
    const [items, setItems] = useState<ScannedItem[]>(state?.items ?? []);
    const [error, setError] = useState<string | null>(null);

    const accountOptions = accounts?.map((a) => ({
        value: a.id,
        label: `${a.code} ${a.name}`,
    })) ?? [];

    if (!state || items.length === 0) {
        return (
            <Container size="md" py="md">
                <Alert icon={<IconAlertCircle size={16} />} title="データなし" color="yellow">
                    スキャン結果がありません。スキャンページに戻って画像をアップロードしてください。
                </Alert>
                <Button mt="md" onClick={() => navigate('/scan')}>スキャンに戻る</Button>
            </Container>
        );
    }

    const updateItem = (id: string, field: keyof ScannedItem, value: unknown) => {
        setItems((prev) => prev.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const addItem = () => {
        const defaultDebitId = accounts?.find((a) => a.code === '5099')?.id ?? '';
        const defaultCreditId = state.sourceType === 'card_screenshot'
            ? accounts?.find((a) => a.code === '2001')?.id ?? ''
            : accounts?.find((a) => a.code === '1001')?.id ?? '';

        setItems((prev) => [...prev, {
            id: crypto.randomUUID(),
            date: dayjs().format('YYYY-MM-DD'),
            description: '',
            amount: 0,
            debit_account_id: defaultDebitId,
            credit_account_id: defaultCreditId,
            selected: true,
        }]);
    };

    const selectedItems = items.filter((item) => item.selected);
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;
        setError(null);

        try {
            const inputs = selectedItems.map((item) => ({
                date: item.date,
                description: item.description,
                source_type: state.sourceType,
                source_image_url: state.imageUrl,
                entries: [
                    { account_id: item.debit_account_id, debit_amount: item.amount, credit_amount: 0 },
                    { account_id: item.credit_account_id, debit_amount: 0, credit_amount: item.amount },
                ],
            }));

            await bulkCreate.mutateAsync(inputs);

            // 修正内容を学習保存
            if (user) {
                for (const item of selectedItems) {
                    if (item.description) {
                        // 摘要の主要キーワード（店舗名など）でルール学習
                        const keyword = item.description.split(' - ')[0]?.trim() || item.description;
                        await learnCategoryRule(user.id, keyword, item.debit_account_id);
                    }
                }
            }

            navigate('/journals');
        } catch (err) {
            console.error('一括登録エラー:', err);
            setError(err instanceof Error ? err.message : '仕訳の登録に失敗しました');
        }
    };

    return (
        <Container size="xl" py="md">
            <Group justify="space-between" mb="lg">
                <Title order={2}>スキャン結果レビュー</Title>
                <Badge size="lg" variant="light">
                    {selectedItems.length}件選択 / 合計 {formatCurrency(totalAmount)}
                </Badge>
            </Group>

            <Group align="flex-start" gap="md" wrap="nowrap">
                {/* メインテーブル */}
                <Paper withBorder radius="md" style={{ flex: 1, overflow: 'auto' }}>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={40}>✓</Table.Th>
                                <Table.Th w={130}>日付</Table.Th>
                                <Table.Th>摘要</Table.Th>
                                <Table.Th w={120}>金額</Table.Th>
                                <Table.Th w={200}>借方科目</Table.Th>
                                <Table.Th w={200}>貸方科目</Table.Th>
                                <Table.Th w={40} />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {items.map((item) => (
                                <Table.Tr
                                    key={item.id}
                                    style={{ opacity: item.selected ? 1 : 0.5 }}
                                >
                                    <Table.Td>
                                        <Checkbox
                                            checked={item.selected}
                                            onChange={(e) => updateItem(item.id, 'selected', e.currentTarget.checked)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <TextInput
                                            size="xs"
                                            value={item.date}
                                            onChange={(e) => updateItem(item.id, 'date', e.currentTarget.value)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <TextInput
                                            size="xs"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.currentTarget.value)}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <NumberInput
                                            size="xs"
                                            min={0}
                                            value={item.amount}
                                            onChange={(v) => updateItem(item.id, 'amount', Number(v))}
                                            hideControls
                                            thousandSeparator=","
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Select
                                            size="xs"
                                            data={accountOptions}
                                            value={item.debit_account_id}
                                            onChange={(v) => updateItem(item.id, 'debit_account_id', v ?? '')}
                                            searchable
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Select
                                            size="xs"
                                            data={accountOptions}
                                            value={item.credit_account_id}
                                            onChange={(v) => updateItem(item.id, 'credit_account_id', v ?? '')}
                                            searchable
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <Group p="sm" justify="space-between">
                        <Button
                            variant="subtle"
                            size="sm"
                            leftSection={<IconPlus size={14} />}
                            onClick={addItem}
                        >
                            行を追加
                        </Button>
                        <Group>
                            <Button variant="light" onClick={() => navigate('/scan')}>
                                やり直す
                            </Button>
                            <Button
                                leftSection={<IconCheck size={16} />}
                                onClick={handleSubmit}
                                loading={bulkCreate.isPending}
                                disabled={selectedItems.length === 0}
                            >
                                {selectedItems.length}件をまとめて登録
                            </Button>
                        </Group>
                    </Group>
                </Paper>

                {/* サイドパネル: 元画像プレビュー */}
                {state.imageUrl && (
                    <Paper withBorder radius="md" p="sm" w={300} style={{ flexShrink: 0 }}>
                        <Text size="sm" fw={600} mb="xs">元画像</Text>
                        <Image
                            src={state.imageUrl}
                            alt="スキャン元画像"
                            fit="contain"
                            radius="md"
                        />
                    </Paper>
                )}
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red" mt="md">
                    {error}
                </Alert>
            )}
        </Container>
    );
}
