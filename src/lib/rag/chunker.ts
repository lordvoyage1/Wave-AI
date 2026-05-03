/* ═══════════════════════════════════════════════════════════════
   Wave AI — Document Chunker
   Splits documents into overlapping chunks optimized for RAG.
   Supports text, markdown, code, and structured data.
═══════════════════════════════════════════════════════════════ */

import { approximateTokenCount } from "@/lib/tokenizer";
import WAVE_CONFIG from "@/lib/config";

export type ChunkStrategy = "fixed" | "sentence" | "paragraph" | "semantic" | "code";

export interface Chunk {
  id: string;
  text: string;
  tokens: number;
  index: number;
  total: number;
  startChar: number;
  endChar: number;
  strategy: ChunkStrategy;
  metadata: Record<string, unknown>;
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  strategy?: ChunkStrategy;
  metadata?: Record<string, unknown>;
}

/* ── Fixed-size chunking ──────────────────────────────────────── */
function fixedChunk(text: string, size: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + size).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
    i += size - overlap;
    if (i < 0) break;
  }

  return chunks;
}

/* ── Sentence-based chunking ─────────────────────────────────── */
function sentenceChunk(text: string, maxTokens: number, overlap: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentTokens = approximateTokenCount(sentence);
    if (currentTokens + sentTokens > maxTokens && current.length > 0) {
      chunks.push(current.join(" ").trim());
      const overlapSentences = current.slice(-Math.max(1, Math.floor(overlap / 20)));
      current = [...overlapSentences, sentence];
      currentTokens = overlapSentences.reduce((s, sent) => s + approximateTokenCount(sent), 0) + sentTokens;
    } else {
      current.push(sentence);
      currentTokens += sentTokens;
    }
  }

  if (current.length > 0) chunks.push(current.join(" ").trim());
  return chunks.filter(Boolean);
}

/* ── Paragraph-based chunking ────────────────────────────────── */
function paragraphChunk(text: string, maxTokens: number): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = approximateTokenCount(para);
    if (paraTokens > maxTokens) {
      if (current.length > 0) {
        chunks.push(current.join("\n\n").trim());
        current = [];
        currentTokens = 0;
      }
      const subChunks = sentenceChunk(para, maxTokens, 0);
      chunks.push(...subChunks);
    } else if (currentTokens + paraTokens > maxTokens) {
      chunks.push(current.join("\n\n").trim());
      current = [para];
      currentTokens = paraTokens;
    } else {
      current.push(para);
      currentTokens += paraTokens;
    }
  }

  if (current.length > 0) chunks.push(current.join("\n\n").trim());
  return chunks.filter(Boolean);
}

/* ── Code-aware chunking ─────────────────────────────────────── */
function codeChunk(text: string, maxTokens: number): string[] {
  const codeBlockPattern = /```[\s\S]*?```/g;
  const chunks: string[] = [];
  let lastIndex = 0;

  let match;
  while ((match = codeBlockPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      chunks.push(...paragraphChunk(before, maxTokens));
    }
    chunks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainder = text.slice(lastIndex);
    chunks.push(...paragraphChunk(remainder, maxTokens));
  }

  return chunks.filter(Boolean);
}

/* ── Main chunk function ─────────────────────────────────────── */
export function chunkDocument(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const {
    chunkSize = WAVE_CONFIG.rag.chunkSize,
    overlap = WAVE_CONFIG.rag.chunkOverlap,
    strategy = "paragraph",
    metadata = {},
  } = options;

  let rawChunks: string[];

  switch (strategy) {
    case "fixed":
      rawChunks = fixedChunk(text, Math.floor(chunkSize / 5), Math.floor(overlap / 5));
      break;
    case "sentence":
      rawChunks = sentenceChunk(text, chunkSize, overlap);
      break;
    case "paragraph":
      rawChunks = paragraphChunk(text, chunkSize);
      break;
    case "code":
      rawChunks = codeChunk(text, chunkSize);
      break;
    case "semantic":
      rawChunks = paragraphChunk(text, chunkSize);
      break;
    default:
      rawChunks = paragraphChunk(text, chunkSize);
  }

  let charOffset = 0;
  return rawChunks.map((chunk, index) => {
    const start = text.indexOf(chunk, charOffset);
    const end = start + chunk.length;
    charOffset = Math.max(0, end - overlap * 4);

    return {
      id: `chunk_${Date.now()}_${index}`,
      text: chunk,
      tokens: approximateTokenCount(chunk),
      index,
      total: rawChunks.length,
      startChar: start >= 0 ? start : 0,
      endChar: end >= 0 ? end : chunk.length,
      strategy,
      metadata,
    };
  });
}

/* ── Markdown-aware chunker ──────────────────────────────────── */
export function chunkMarkdown(text: string, maxTokens = 512): Chunk[] {
  const sections = text.split(/(?=^#{1,3} )/m).filter(Boolean);
  const chunks: Chunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkDocument(section, {
      chunkSize: maxTokens,
      strategy: "code",
      metadata: { type: "markdown" },
    });
    for (const chunk of sectionChunks) {
      chunks.push({ ...chunk, index: globalIndex++, total: 0 });
    }
  }

  return chunks.map(c => ({ ...c, total: chunks.length }));
}
