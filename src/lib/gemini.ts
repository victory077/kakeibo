import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

/**
 * Gemini APIクライアントを取得（遅延初期化）
 */
export function getGeminiClient(): GoogleGenerativeAI {
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Gemini APIキーが設定されていません (VITE_GEMINI_API_KEY)');
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

/**
 * 画像をBase64に変換するユーティリティ
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // data:image/jpeg;base64,... の部分を除去して純粋なBase64を返す
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * レシート画像を解析して構造化データを抽出
 */
export async function analyzeReceipt(imageFile: File): Promise<{
    store_name: string;
    date: string;
    items: { name: string; amount: number }[];
    total: number;
}> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const base64 = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const prompt = `このレシート画像を解析して、以下のJSON形式で情報を抽出してください。
金額は整数（円単位）で返してください。日付はYYYY-MM-DD形式で返してください。

{
  "store_name": "店舗名",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "品目名", "amount": 金額 }
  ],
  "total": 合計金額
}

JSONのみを返してください。説明文は不要です。`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType,
                data: base64,
            },
        },
    ]);

    const text = result.response.text();
    // コードブロックのマークダウン記法を除去
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
}

/**
 * クレカ明細スクリーンショットを解析
 */
export async function analyzeCardScreenshot(imageFile: File): Promise<{
    items: { date: string; description: string; amount: number }[];
}> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const base64 = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const prompt = `このクレジットカード利用明細のスクリーンショットを解析して、以下のJSON形式で各取引を抽出してください。
金額は整数（円単位）で返してください。日付はYYYY-MM-DD形式で返してください。

{
  "items": [
    { "date": "YYYY-MM-DD", "description": "店舗名・摘要", "amount": 金額 }
  ]
}

JSONのみを返してください。説明文は不要です。`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType,
                data: base64,
            },
        },
    ]);

    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
}

/**
 * 品目名から勘定科目を推定
 */
export async function suggestCategory(itemName: string, accountNames: string[]): Promise<string> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `以下の品目・店舗名に最も適切な費目を、選択肢の中から1つだけ返してください。

品目: "${itemName}"

選択肢:
${accountNames.map((name) => `- ${name}`).join('\n')}

費目名のみを返してください。説明文は不要です。`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}
