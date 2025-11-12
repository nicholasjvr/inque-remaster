import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAssistantFallback } from '@/lib/assistantFallbacks';
import { getRelevantContext, getSystemPrompt } from '@/lib/appKnowledge';

const API_KEY = process.env.GOOGLE_AI_API_KEY;
// Use Gemini Flash for cost savings (~10x cheaper than Pro)
// Falls back to gemini-pro if Flash not available
const MODEL_NAME = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';

const client = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory cache (in production, use Redis or similar)
const responseCache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCacheKey(message: string, historyLength: number): string {
  // Simple cache key based on message and conversation length
  return `${message.toLowerCase().trim()}_${historyLength}`;
}

function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.reply;
  }
  responseCache.delete(key);
  return null;
}

function setCachedResponse(key: string, reply: string): void {
  // Limit cache size to prevent memory issues
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) {
      responseCache.delete(firstKey);
    }
  }
  responseCache.set(key, { reply, timestamp: Date.now() });
}

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
  let requestBody: { message: string; history?: HistoryItem[]; userName?: string | null } = { message: '' };
  
  try {
    requestBody = await request.json();
    const { message, history = [], userName } = requestBody;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Check cache first (only for simple queries without much history)
    if (history.length <= 2) {
      const cacheKey = getCacheKey(message, history.length);
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return NextResponse.json({
          reply: cached,
          meta: { provider: 'google', cached: true }
        });
      }
    }

    if (!client) {
      return NextResponse.json({
        reply: getAssistantFallback(message, userName),
        meta: { usedFallback: true, reason: 'missing-api-key' }
      });
    }

    // Get relevant app context for this query
    const appContext = getRelevantContext(message);
    const systemPrompt = getSystemPrompt(userName);
    
    // Build enhanced message with context
    const enhancedMessage = `${systemPrompt}\n\nApp Context:\n${appContext}\n\nUser Question: ${message}`;

    const model = client.getGenerativeModel({ 
      model: MODEL_NAME,
      // Add safety settings and generation config for cost control
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 500, // Limit response length to control costs
      }
    });

    const chat = model.startChat({
      history: Array.isArray(history) ? toGeminiHistory(history) : [],
      systemInstruction: systemPrompt
    });

    const result = await chat.sendMessage(enhancedMessage);
    const reply = result.response.text()?.trim();

    const finalReply = reply && reply.length ? reply : getAssistantFallback(message, userName);

    // Cache the response if it's a simple query
    if (history.length <= 2 && finalReply) {
      const cacheKey = getCacheKey(message, history.length);
      setCachedResponse(cacheKey, finalReply);
    }

    return NextResponse.json({
      reply: finalReply,
      meta: {
        provider: 'google',
        model: MODEL_NAME,
        usedFallback: !reply,
        cached: false
      }
    });
  } catch (error) {
    console.error('[assistant] Gemini error', error);
    
    // Use requestBody that was already parsed
    const { message = '', userName = null } = requestBody;
    
    return NextResponse.json({
      reply: getAssistantFallback(message, userName),
      meta: { usedFallback: true, reason: 'provider-error' }
    });
  }
}

