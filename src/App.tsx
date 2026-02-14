import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { MantineProvider, AppShell, NavLink, Group, Text, Button, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    IconDashboard, IconReceipt, IconScale, IconCamera,
    IconList, IconLogout,
} from '@tabler/icons-react';

import { AuthProvider, useAuth } from './hooks/useAuth';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import JournalListPage from './pages/journal/JournalListPage';
import JournalCreatePage from './pages/journal/JournalCreatePage';
import AccountListPage from './pages/account/AccountListPage';
import TrialBalancePage from './pages/trial-balance/TrialBalancePage';
import ScanPage from './pages/scan/ScanPage';
import ScanReviewPage from './pages/scan/ScanReviewPage';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 60 * 2,
        },
    },
});

/** 認証ガード — 未認証ならログインへリダイレクト */
function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Group justify="center" align="center" h="100vh">
                <Text c="dimmed">読み込み中...</Text>
            </Group>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

/** ゲスト専用ガード — 認証済みならホームへリダイレクト */
function RequireGuest({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Group justify="center" align="center" h="100vh">
                <Text c="dimmed">読み込み中...</Text>
            </Group>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

/** 認証済みユーザー用レイアウト（サイドナビ付き） */
function AppLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [opened, { toggle, close }] = useDisclosure();

    const navItems = [
        { label: 'ダッシュボード', icon: IconDashboard, to: '/' },
        { label: '仕訳一覧', icon: IconReceipt, to: '/journals' },
        { label: 'スキャン', icon: IconCamera, to: '/scan' },
        { label: '勘定科目', icon: IconList, to: '/accounts' },
        { label: '残高試算表', icon: IconScale, to: '/trial-balance' },
    ];

    return (
        <AppShell
            header={{ height: 56 }}
            navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text size="lg" fw={700}>📒 Kakeibo</Text>
                    </Group>
                    <Group>
                        <Text size="xs" c="dimmed">{user?.email}</Text>
                        <Button
                            variant="subtle"
                            size="xs"
                            leftSection={<IconLogout size={14} />}
                            onClick={signOut}
                        >
                            ログアウト
                        </Button>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="xs">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        component={Link}
                        to={item.to}
                        label={item.label}
                        leftSection={<item.icon size={18} />}
                        active={location.pathname === item.to}
                        onClick={close}
                    />
                ))}
            </AppShell.Navbar>

            <AppShell.Main>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/journals" element={<JournalListPage />} />
                    <Route path="/journals/new" element={<JournalCreatePage />} />
                    <Route path="/accounts" element={<AccountListPage />} />
                    <Route path="/trial-balance" element={<TrialBalancePage />} />
                    <Route path="/scan" element={<ScanPage />} />
                    <Route path="/scan/review" element={<ScanReviewPage />} />
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}

export default function App() {
    return (
        <MantineProvider defaultColorScheme="auto">
            <Notifications position="top-right" />
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={
                                <RequireGuest><LoginPage /></RequireGuest>
                            } />
                            <Route path="/register" element={
                                <RequireGuest><RegisterPage /></RequireGuest>
                            } />
                            <Route path="/*" element={
                                <RequireAuth><AppLayout /></RequireAuth>
                            } />
                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </MantineProvider>
    );
}
