import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Title, Paper, Stack, Text, Group,
    SegmentedControl, Progress, Alert, Image,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconAlertCircle } from '@tabler/icons-react';
import { analyzeReceipt, analyzeCardScreenshot } from '../../lib/gemini';
import { useAccounts } from '../../hooks/useAccounts';
import { categorize } from '../../lib/categorizer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { ScannedItem } from '../../types';

export default function ScanPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: accounts } = useAccounts();
    const [sourceType, setSourceType] = useState<'receipt_ocr' | 'card_screenshot'>('receipt_ocr');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleDrop = useCallback(async (files: File[]) => {
        if (files.length === 0 || !accounts || !user) return;

        setError(null);
        setProcessing(true);
        setProgress(10);

        // プレビュー表示
        const previewUrl = URL.createObjectURL(files[0]);
        setPreview(previewUrl);

        try {
            // カテゴリルール取得
            const { data: rules } = await supabase
                .from('category_rules')
                .select('*')
                .eq('user_id', user.id);
            setProgress(20);

            const scannedItems: ScannedItem[] = [];

            if (sourceType === 'receipt_ocr') {
                // レシートOCR → 店舗名で科目推定、合計金額で1件の仕訳
                setProgress(30);
                const result = await analyzeReceipt(files[0]);
                setProgress(70);

                const defaultCreditId = accounts.find((a) => a.code === '1001')?.id ?? '';
                // 店舗名から費用科目を自動推定
                const debitId = await categorize(result.store_name, rules ?? [], accounts);

                scannedItems.push({
                    id: crypto.randomUUID(),
                    date: result.date,
                    description: result.store_name,
                    amount: result.total,
                    debit_account_id: debitId ?? accounts.find((a) => a.code === '5001')?.id ?? '',
                    credit_account_id: defaultCreditId,
                    selected: true,
                });
            } else {
                // クレカ明細スクショ → 各取引ごとに1件
                setProgress(30);
                const result = await analyzeCardScreenshot(files[0]);
                setProgress(70);

                const creditId = accounts.find((a) => a.code === '2001')?.id ?? '';
                for (const item of result.items) {
                    const debitId = await categorize(item.description, rules ?? [], accounts);
                    scannedItems.push({
                        id: crypto.randomUUID(),
                        date: item.date,
                        description: item.description,
                        amount: item.amount,
                        debit_account_id: debitId ?? accounts.find((a) => a.code === '5099')?.id ?? '',
                        credit_account_id: creditId,
                        selected: true,
                    });
                }
            }

            setProgress(100);

            // レビュー画面へ遷移 (stateで渡す)
            navigate('/scan/review', {
                state: {
                    items: scannedItems,
                    sourceType,
                    imageUrl: previewUrl,
                },
            });
        } catch (err) {
            console.error('スキャンエラー:', err);
            setError(err instanceof Error ? err.message : '画像の解析に失敗しました');
        } finally {
            setProcessing(false);
        }
    }, [accounts, user, sourceType, navigate]);

    return (
        <Container size="md" py="md">
            <Title order={2} mb="lg">スキャン・取込</Title>

            <Stack>
                <Paper withBorder p="md" radius="md">
                    <Text size="sm" fw={600} mb="sm">取込タイプ</Text>
                    <SegmentedControl
                        fullWidth
                        value={sourceType}
                        onChange={(v) => setSourceType(v as 'receipt_ocr' | 'card_screenshot')}
                        data={[
                            { label: '📄 レシート', value: 'receipt_ocr' },
                            { label: '💳 クレカ明細スクショ', value: 'card_screenshot' },
                        ]}
                    />
                </Paper>

                <Dropzone
                    onDrop={handleDrop}
                    accept={IMAGE_MIME_TYPE}
                    maxSize={10 * 1024 ** 2}
                    loading={processing}
                    disabled={processing}
                >
                    <Group justify="center" gap="xl" mih={200} style={{ pointerEvents: 'none' }}>
                        <Dropzone.Accept>
                            <IconUpload size={52} stroke={1.5} color="var(--mantine-color-blue-6)" />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX size={52} stroke={1.5} color="var(--mantine-color-red-6)" />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconPhoto size={52} stroke={1.5} color="var(--mantine-color-dimmed)" />
                        </Dropzone.Idle>
                        <div>
                            <Text size="xl" inline>
                                画像をドラッグ＆ドロップ
                            </Text>
                            <Text size="sm" c="dimmed" inline mt={7}>
                                またはクリックしてファイルを選択（10MB以下）
                            </Text>
                        </div>
                    </Group>
                </Dropzone>

                {processing && (
                    <Paper withBorder p="md" radius="md">
                        <Text size="sm" mb="xs">解析中...</Text>
                        <Progress value={progress} animated />
                    </Paper>
                )}

                {preview && !processing && (
                    <Paper withBorder p="md" radius="md">
                        <Image src={preview} alt="アップロード画像" mah={300} fit="contain" />
                    </Paper>
                )}

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
                        {error}
                    </Alert>
                )}
            </Stack>
        </Container>
    );
}
