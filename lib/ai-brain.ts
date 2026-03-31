'use client';

import { cacheGet, cacheSet, makeCacheKey } from './ai-cache';

export type AIMode = 'local' | 'hybrid' | 'cloud';

export interface MoniaResponse {
  text:   string;
  source: 'cache' | 'nano' | 'cloud';
}

const SYSTEM_IDENTITY =
  'You are MONiA, your AI communication assistant. ' +
  'You help users communicate better. ' +
  'Always introduce yourself as "I am MONiA, your AI communication assistant." ' +
  'Be helpful, warm, and concise. Never mention Gemini, Google, or any other AI brand.';

// ── Check if Gemini Nano (window.ai) is available ─────────────────────────
async function isNanoAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    if (!w.ai?.languageModel) return false;
    const caps = await w.ai.languageModel.capabilities();
    return caps?.available === 'readily';
  } catch {
    return false;
  }
}

// ── Low-resource detection ────────────────────────────────────────────────
function isLowRAM(): boolean {
  try {
    const nav = navigator as any;
    return typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4;
  } catch {
    return false;
  }
}

function isNonChrome(): boolean {
  return typeof window !== 'undefined' && !/Chrome\//.test(navigator.userAgent);
}

// ── Step 2: Gemini Nano (on-device) ──────────────────────────────────────
async function askNano(prompt: string, history: string[]): Promise<string | null> {
  try {
    const w = window as any;
    const session = await w.ai.languageModel.create({ systemPrompt: SYSTEM_IDENTITY });
    const context = history.slice(-4).join('\n');
    const full    = context ? `${context}\nUser: ${prompt}` : `User: ${prompt}`;
    const result  = await session.prompt(full);
    session.destroy();
    return typeof result === 'string' ? result.trim() : null;
  } catch {
    return null;
  }
}

// ── Step 3: Gemini Cloud (server-side) ───────────────────────────────────
async function askCloud(prompt: string, history: string[]): Promise<string> {
  const res = await fetch('/api/monia/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt, history }),
  });
  if (!res.ok) throw new Error('Cloud AI failed');
  const json = await res.json();
  return json.text ?? 'I am MONiA, your AI communication assistant. I had trouble processing that — please try again.';
}

// ── Main: Hybrid Ask ──────────────────────────────────────────────────────
export async function askMonia(
  prompt: string,
  history: string[] = [],
  mode: AIMode = 'hybrid',
): Promise<MoniaResponse> {
  const key = makeCacheKey('chat', prompt);

  // Step 1: Cache
  const cached = await cacheGet(key);
  if (cached) return { text: cached, source: 'cache' };

  // Step 2: On-device Nano (skip if low RAM, non-Chrome, or mode=cloud)
  const useNano =
    mode !== 'cloud' &&
    !isLowRAM() &&
    !isNonChrome() &&
    (await isNanoAvailable());

  if (useNano) {
    const nanoResult = await askNano(prompt, history);
    if (nanoResult) {
      await cacheSet(key, nanoResult);
      return { text: nanoResult, source: 'nano' };
    }
  }

  // Step 3: Cloud
  const cloudResult = await askCloud(prompt, history);
  await cacheSet(key, cloudResult);
  return { text: cloudResult, source: 'cloud' };
}

// ── Context Analysis (for chat overlay) ──────────────────────────────────
export async function analyzeConversation(messages: string[]): Promise<string> {
  const key = makeCacheKey('analyze', messages.slice(-5).join('|'));
  const cached = await cacheGet(key);
  if (cached) return cached;

  const res = await fetch('/api/monia/analyze', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages }),
  });
  if (!res.ok) return 'I am MONiA, your AI communication assistant. I could not analyze this conversation right now.';
  const json = await res.json();
  const result = json.text ?? '';
  if (result) await cacheSet(key, result);
  return result;
}

// ── Translation ───────────────────────────────────────────────────────────
export async function translateWithCache(text: string, targetLang: string): Promise<string> {
  const key = makeCacheKey(`translate:${targetLang}`, text);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const res = await fetch('/api/monia/translate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text, targetLang }),
  });
  if (!res.ok) throw new Error('Translation failed');
  const json = await res.json();
  const result = json.text ?? text;
  if (result) await cacheSet(key, result);
  return result;
}
