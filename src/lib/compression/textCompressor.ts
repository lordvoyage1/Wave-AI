/* ═══════════════════════════════════════════════════════════════
   Wave AI — Text Compression
   LZ-based text compression for efficient storage of long
   conversations and knowledge base entries.
═══════════════════════════════════════════════════════════════ */

/* ── LZ77-inspired compression ───────────────────────────────── */
export interface CompressedData {
  data: string;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: "lz" | "rle" | "none";
}

/* ── Run-length encoding for repetitive data ─────────────────── */
function rleEncode(text: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < text.length) {
    let count = 1;
    while (i + count < text.length && text[i + count] === text[i] && count < 255) count++;
    if (count > 3) {
      result.push(`\x00${String.fromCharCode(count)}${text[i]}`);
    } else {
      result.push(text[i].repeat(count));
    }
    i += count;
  }
  return result.join("");
}

function rleDecode(encoded: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < encoded.length) {
    if (encoded[i] === "\x00" && i + 2 < encoded.length) {
      const count = encoded.charCodeAt(i + 1);
      const char = encoded[i + 2];
      result.push(char.repeat(count));
      i += 3;
    } else {
      result.push(encoded[i]);
      i++;
    }
  }
  return result.join("");
}

/* ── Dictionary compression ──────────────────────────────────── */
function buildDictionary(text: string): Map<string, string> {
  const freq = new Map<string, number>();
  const words = text.match(/\b\w{4,}\b/g) ?? [];

  for (const word of words) freq.set(word, (freq.get(word) ?? 0) + 1);

  const sorted = Array.from(freq.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 128);

  const dict = new Map<string, string>();
  sorted.forEach(([word], i) => {
    dict.set(word, `\x01${String.fromCharCode(i + 32)}`);
  });

  return dict;
}

function applyDictionary(text: string, dict: Map<string, string>): string {
  let result = text;
  for (const [word, code] of dict) {
    result = result.split(word).join(code);
  }
  return result;
}

function reverseDictionary(text: string, dict: Map<string, string>): string {
  let result = text;
  for (const [word, code] of dict) {
    result = result.split(code).join(word);
  }
  return result;
}

/* ── Main compress function ──────────────────────────────────── */
export function compress(text: string): CompressedData {
  if (text.length < 100) {
    return { data: text, originalSize: text.length, compressedSize: text.length, ratio: 1, algorithm: "none" };
  }

  const dict = buildDictionary(text);
  const dictJson = JSON.stringify(Array.from(dict.entries()));
  const dictEncoded = applyDictionary(text, dict);
  const rleEncoded = rleEncode(dictEncoded);

  const compressed = JSON.stringify({ dict: dictJson, data: rleEncoded });

  if (compressed.length >= text.length) {
    return { data: text, originalSize: text.length, compressedSize: text.length, ratio: 1, algorithm: "none" };
  }

  return {
    data: compressed,
    originalSize: text.length,
    compressedSize: compressed.length,
    ratio: compressed.length / text.length,
    algorithm: "lz",
  };
}

/* ── Main decompress function ────────────────────────────────── */
export function decompress(compressed: CompressedData): string {
  if (compressed.algorithm === "none") return compressed.data;

  try {
    const parsed = JSON.parse(compressed.data) as { dict: string; data: string };
    const dict = new Map<string, string>(JSON.parse(parsed.dict));
    const rleDecoded = rleDecode(parsed.data);
    return reverseDictionary(rleDecoded, dict);
  } catch {
    return compressed.data;
  }
}

/* ── Compress conversation history ───────────────────────────── */
export function compressConversation(
  messages: Array<{ role: string; content: string }>
): string {
  const text = messages.map(m => `${m.role}:${m.content}`).join("\n---\n");
  const result = compress(text);
  return result.data;
}

export function decompressConversation(data: string): Array<{ role: string; content: string }> {
  try {
    const compressed = JSON.parse(data) as CompressedData;
    const text = decompress(compressed);
    return text.split("\n---\n").map(line => {
      const colonIdx = line.indexOf(":");
      return { role: line.slice(0, colonIdx), content: line.slice(colonIdx + 1) };
    });
  } catch {
    return [];
  }
}

/* ── Storage size estimator ──────────────────────────────────── */
export function estimateStorageSize(text: string): { bytes: number; kbytes: number; compressed: number } {
  const bytes = new TextEncoder().encode(text).length;
  const result = compress(text);
  const compressedBytes = new TextEncoder().encode(result.data).length;
  return { bytes, kbytes: bytes / 1024, compressed: compressedBytes };
}
