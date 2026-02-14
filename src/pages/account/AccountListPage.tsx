import { useState } from 'react';
import {
    Container, Title, Table, Paper, Group, Button, Modal,
    TextInput, Select, NumberInput, Stack, Text, Badge, ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useAccounts, useCreateAccount, useDeleteAccount } from '../../hooks/useAccounts';
import { ACCOUNT_TYPE_LABELS } from '../../types';
import type { AccountType } from '../../types';

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

const TYPE_COLORS: Record<AccountType, string> = {
    asset: 'blue',
    liability: 'red',
    equity: 'grape',
    revenue: 'teal',
    expense: 'orange',
};

export default function AccountListPage() {
    const { data: accounts, isLoading } = useAccounts();
    const createAccount = useCreateAccount();
    const deleteAccount = useDeleteAccount();
    const [opened, { open, close }] = useDisclosure(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState<string>('expense');
    const [sortOrder, setSortOrder] = useState<number>(20);

    const handleCreate = async () => {
        await createAccount.mutateAsync({
            code,
            name,
            type: type as AccountType,
            sort_order: sortOrder,
        });
        setCode('');
        setName('');
        close();
    };

    return (
        <Container size="lg" py="md">
            <Group justify="space-between" mb="lg">
                <Title order={2}>勘定科目</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={open}>
                    科目追加
                </Button>
            </Group>

            <Paper withBorder radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>コード</Table.Th>
                            <Table.Th>科目名</Table.Th>
                            <Table.Th>区分</Table.Th>
                            <Table.Th w={60}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            <Table.Tr><Table.Td colSpan={4}><Text c="dimmed">読み込み中...</Text></Table.Td></Table.Tr>
                        ) : (
                            accounts?.map((a) => (
                                <Table.Tr key={a.id}>
                                    <Table.Td><Text ff="monospace">{a.code}</Text></Table.Td>
                                    <Table.Td>{a.name}</Table.Td>
                                    <Table.Td>
                                        <Badge color={TYPE_COLORS[a.type]} variant="light">
                                            {ACCOUNT_TYPE_LABELS[a.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={async () => {
                                                if (!confirm(`「${a.name}」を削除しますか？`)) return;
                                                try {
                                                    await deleteAccount.mutateAsync(a.id);
                                                    notifications.show({ message: `${a.name} を削除しました`, color: 'green' });
                                                } catch {
                                                    notifications.show({ title: '削除できません', message: 'この科目は仕訳で使用中のため削除できません', color: 'red' });
                                                }
                                            }}
                                        >
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            <Modal opened={opened} onClose={close} title="勘定科目を追加">
                <Stack>
                    <TextInput label="コード" placeholder="5009" value={code} onChange={(e) => setCode(e.currentTarget.value)} required />
                    <TextInput label="科目名" placeholder="雑費" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
                    <Select label="区分" data={TYPE_OPTIONS} value={type} onChange={(v) => setType(v ?? 'expense')} required />
                    <NumberInput label="並び順" value={sortOrder} onChange={(v) => setSortOrder(Number(v))} />
                    <Button onClick={handleCreate} loading={createAccount.isPending}>追加</Button>
                </Stack>
            </Modal>
        </Container>
    );
}
