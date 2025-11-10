import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAssistantFallback } from '@/lib/assistantFallbacks';

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL_NAME = process.env.GOOGLE_AI_MODEL || 'gemini-pro';

const client = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HistoryItem = {
  role?: string;
  content?: string;
};

type GeminiHistoryEntry = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

const toGeminiHistory = (history: HistoryItem[]): GeminiHistoryEntry[] =>
  history
    .map((entry) => {
      const text = entry?.content?.trim();
      if (!text) {
        return null;
      }

      const role = entry.role === 'ai' ? 'model' : 'user';
      return {
        role,
        parts: [{ text }]
      } as GeminiHistoryEntry;
    })
    .filter((entry): entry is GeminiHistoryEntry => entry !== null);

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!client) {
      return NextResponse.json({
        reply: getAssistantFallback(message),
        meta: { usedFallback: true, reason: 'missing-api-key' }
      });
    }

    const model = client.getGenerativeModel({ model: MODEL_NAME });
    const chat = model.startChat({
      history: Array.isArray(history) ? toGeminiHistory(history) : []
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text()?.trim();

    return NextResponse.json({
      reply: reply && reply.length ? reply : getAssistantFallback(message),
      meta: {
        provider: 'google',
        usedFallback: !reply
      }
    });
  } catch (error) {
    console.error('[assistant] Gemini error', error);
    return NextResponse.json({
      reply: getAssistantFallback(''),
      meta: { usedFallback: true, reason: 'provider-error' }
    });
  }
}

