import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Paper, Title, TextInput, PasswordInput,
    Button, Text, Stack, Anchor,
} from '@mantine/core';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('パスワードが一致しません');
            return;
        }
        if (password.length < 6) {
            setError('パスワードは6文字以上にしてください');
            return;
        }
        const validCode = import.meta.env.VITE_INVITE_CODE;
        if (validCode && inviteCode.trim() !== validCode) {
            setError('招待コードが正しくありません');
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password);
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '登録に失敗しました');
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
                新規アカウント登録
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
                            placeholder="6文字以上"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                        />
                        <PasswordInput
                            label="パスワード（確認）"
                            placeholder="もう一度入力"
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.currentTarget.value)}
                        />
                        <TextInput
                            label="招待コード"
                            placeholder="招待コードを入力"
                            required
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.currentTarget.value)}
                        />
                        {error && (
                            <Text c="red" size="sm">{error}</Text>
                        )}
                        <Button type="submit" fullWidth loading={loading}>
                            登録
                        </Button>
                    </Stack>
                </form>
                <Text c="dimmed" size="sm" ta="center" mt="md">
                    既にアカウントをお持ちの方は{' '}
                    <Anchor component={Link} to="/login" size="sm">
                        ログイン
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
}
