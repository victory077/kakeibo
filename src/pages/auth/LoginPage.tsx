import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Paper, Title, TextInput, PasswordInput,
    Button, Text, Stack, Anchor,
} from '@mantine/core';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'ログインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} py={80}>
            <Title ta="center" order={1} mb="md">
                📒 Kakeibo
            </Title>
            <Text c="dimmed" size="sm" ta="center" mb={30}>
                家計簿にログイン
            </Text>

            <Paper withBorder shadow="md" p={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <TextInput
                            label="メールアドレス"
                            placeholder="your@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                        <PasswordInput
                            label="パスワード"
                            placeholder="パスワード"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                        />
                        {error && (
                            <Text c="red" size="sm">{error}</Text>
                        )}
                        <Button type="submit" fullWidth loading={loading}>
                            ログイン
                        </Button>
                    </Stack>
                </form>
                <Text c="dimmed" size="sm" ta="center" mt="md">
                    アカウントがない方は{' '}
                    <Anchor component={Link} to="/register" size="sm">
                        新規登録
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
}
