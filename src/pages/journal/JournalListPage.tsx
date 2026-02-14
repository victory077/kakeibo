import { Link } from 'react-router-dom';
import {
    Container, Title, Paper, Table, Group, Button, Text,
    Badge, ActionIcon, Skeleton,
} from '@mantine/core';
import { IconPlus, IconTrash, IconCamera } from '@tabler/icons-react';
import { useJournals, useDeleteJournal } from '../../hooks/useJournals';
import { formatCurrency } from '../../lib/accounting';

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    manual: { label: '手入力', color: 'gray' },
    receipt_ocr: { label: 'レシート', color: 'teal' },
    card_screenshot: { label: 'クレカ', color: 'violet' },
};

export default function JournalListPage() {
    const { data: journals, isLoading } = useJournals();
    const deleteJournal = useDeleteJournal();

    return (
        <Container size="lg" py="md">
            <Group justify="space-between" mb="lg">
                <Title order={2}>仕訳一覧</Title>
                <Group>
                    <Button
                        component={Link}
                        to="/scan"
                        variant="light"
                        leftSection={<IconCamera size={16} />}
                    >
                        スキャン
                    </Button>
                    <Button
                        component={Link}
                        to="/journals/new"
                        leftSection={<IconPlus size={16} />}
                    >
                        手動入力
                    </Button>
                </Group>
            </Group>

            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>日付</Table.Th>
                            <Table.Th>摘要</Table.Th>
                            <Table.Th>ソース</Table.Th>
                            <Table.Th ta="right">金額</Table.Th>
                            <Table.Th w={40} />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Table.Tr key={i}>
                                    <Table.Td><Skeleton height={20} /></Table.Td>
                                    <Table.Td><Skeleton height={20} /></Table.Td>
                                    <Table.Td><Skeleton height={20} /></Table.Td>
                                    <Table.Td><Skeleton height={20} /></Table.Td>
                                    <Table.Td />
                                </Table.Tr>
                            ))
                        ) : journals?.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Text c="dimmed" ta="center" py="lg">まだ仕訳がありません</Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            journals?.map((j) => {
                                const src = SOURCE_LABELS[j.source_type] ?? SOURCE_LABELS.manual;
                                const total = j.journal_entries.reduce((s, e) => s + e.debit_amount, 0);
                                return (
                                    <Table.Tr key={j.id}>
                                        <Table.Td><Text size="sm">{j.date}</Text></Table.Td>
                                        <Table.Td><Text size="sm">{j.description}</Text></Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" color={src.color} variant="light">{src.label}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" fw={500}>{formatCurrency(total)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <ActionIcon
                                                color="red"
                                                variant="subtle"
                                                size="sm"
                                                onClick={() => deleteJournal.mutate(j.id)}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
}
