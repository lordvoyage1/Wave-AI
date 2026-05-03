/* ═══════════════════════════════════════════════════════════════
   Wave AI — Training Data Processor
   Prepares conversation data for fine-tuning. Handles dataset
   formatting, quality filtering, deduplication, and export.
═══════════════════════════════════════════════════════════════ */

import { exportFeedbackDataset } from "@/lib/feedback/collector";
import { approximateTokenCount } from "@/lib/tokenizer";

export interface TrainingExample {
  id: string;
  instruction: string;
  input?: string;
  output: string;
  quality: number;
  source: "feedback" | "curated" | "synthetic" | "conversation";
  metadata: Record<string, unknown>;
}

export interface DatasetStats {
  total: number;
  bySource: Record<string, number>;
  avgQuality: number;
  avgInputLength: number;
  avgOutputLength: number;
  qualityDistribution: Record<string, number>;
  estimatedTokens: number;
}

/* ── Curated training examples (Wave AI identity & behavior) ── */
const CURATED_EXAMPLES: TrainingExample[] = [
  {
    id: "curated_001",
    instruction: "Who are you?",
    output: "I am Wave AI, an advanced AI assistant built by Wave Platforms, Inc. — the first advanced AI assistant ever made in East Africa. The CEO and founder is Meddy Mususwa. I'm here to help you with anything from coding and creative writing to analysis and conversation. What would you like to do?",
    quality: 1.0,
    source: "curated",
    metadata: { category: "identity" },
  },
  {
    id: "curated_002",
    instruction: "What makes you different from other AI assistants?",
    output: "Wave AI stands out in several ways: I am the first advanced AI assistant built in East Africa by Wave Platforms, Inc., making me part of a groundbreaking achievement for African technology. I'm designed to be emotionally intelligent — I adapt my tone to match your mood and context. Whether you're excited, frustrated, or curious, I respond appropriately. I also specialize in understanding context deeply and maintaining conversation continuity.",
    quality: 1.0,
    source: "curated",
    metadata: { category: "identity" },
  },
  {
    id: "curated_003",
    instruction: "Write a Python function to reverse a linked list",
    output: "```python\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_linked_list(head: ListNode) -> ListNode:\n    \"\"\"\n    Reverse a singly linked list.\n    \n    Args:\n        head: The head node of the linked list\n    Returns:\n        The new head of the reversed list\n    Time Complexity: O(n)\n    Space Complexity: O(1)\n    \"\"\"\n    prev = None\n    current = head\n    \n    while current is not None:\n        next_node = current.next  # Save next\n        current.next = prev       # Reverse link\n        prev = current            # Move prev forward\n        current = next_node       # Move current forward\n    \n    return prev  # prev is the new head\n\n# Example usage\nif __name__ == \"__main__\":\n    # Create: 1 -> 2 -> 3 -> 4 -> 5\n    nodes = [ListNode(i) for i in range(1, 6)]\n    for i in range(len(nodes) - 1):\n        nodes[i].next = nodes[i + 1]\n    \n    head = reverse_linked_list(nodes[0])\n    \n    # Print: 5 -> 4 -> 3 -> 2 -> 1\n    current = head\n    while current:\n        print(current.val, end=' -> ' if current.next else '\\n')\n        current = current.next\n```",
    quality: 0.95,
    source: "curated",
    metadata: { category: "code", language: "python" },
  },
  {
    id: "curated_004",
    instruction: "Explain quantum computing in simple terms",
    output: "Quantum computing is computing powered by the bizarre rules of quantum physics. Here's the simple version:\n\n**Classical computers** use bits — either 0 or 1. Every calculation is a series of on/off switches.\n\n**Quantum computers** use qubits, which can be 0, 1, or *both at the same time* (called superposition). It's like flipping many coins simultaneously rather than one at a time.\n\nThey also use **entanglement** — linking qubits so that changing one instantly affects others, no matter the distance.\n\n**Why does this matter?**\n- Solve optimization problems that would take regular computers millions of years\n- Break current encryption (and create unbreakable new encryption)\n- Simulate molecules for drug discovery\n- Accelerate AI and machine learning\n\nWe're still in the early days — today's quantum computers are fragile and error-prone. But companies like IBM, Google, and startups worldwide are racing to make them practical.",
    quality: 0.95,
    source: "curated",
    metadata: { category: "science" },
  },
];

/* ── Quality scorer ──────────────────────────────────────────── */
function scoreExample(instruction: string, output: string): number {
  let score = 0.5;

  if (output.length > 100) score += 0.1;
  if (output.length > 500) score += 0.1;
  if (/```/.test(output)) score += 0.1;
  if (instruction.length > 20) score += 0.05;
  if (output.length < 20) score -= 0.3;

  const hasIdentityLeak = /(openai|chatgpt|gpt-4|gemini|claude|anthropic|huggingface)\b/i.test(output);
  if (hasIdentityLeak) score -= 0.5;

  return Math.max(0, Math.min(1, score));
}

/* ── Dataset builder ─────────────────────────────────────────── */
export function buildDataset(minQuality = 0.6): TrainingExample[] {
  const examples: TrainingExample[] = [...CURATED_EXAMPLES];

  const feedbackData = exportFeedbackDataset();
  for (const item of feedbackData) {
    if (item.score >= minQuality) {
      examples.push({
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        instruction: item.prompt,
        output: item.response,
        quality: item.score,
        source: "feedback",
        metadata: { feedbackScore: item.score },
      });
    }
  }

  return examples
    .filter(e => e.quality >= minQuality)
    .sort((a, b) => b.quality - a.quality);
}

/* ── Dataset stats ───────────────────────────────────────────── */
export function getDatasetStats(examples: TrainingExample[]): DatasetStats {
  if (examples.length === 0) {
    return { total: 0, bySource: {}, avgQuality: 0, avgInputLength: 0, avgOutputLength: 0, qualityDistribution: {}, estimatedTokens: 0 };
  }

  const bySource: Record<string, number> = {};
  for (const e of examples) bySource[e.source] = (bySource[e.source] ?? 0) + 1;

  const avgQuality = examples.reduce((s, e) => s + e.quality, 0) / examples.length;
  const avgInputLength = examples.reduce((s, e) => s + e.instruction.length, 0) / examples.length;
  const avgOutputLength = examples.reduce((s, e) => s + e.output.length, 0) / examples.length;

  const qualityDistribution: Record<string, number> = { "0.0-0.5": 0, "0.5-0.7": 0, "0.7-0.9": 0, "0.9-1.0": 0 };
  for (const e of examples) {
    if (e.quality < 0.5) qualityDistribution["0.0-0.5"]++;
    else if (e.quality < 0.7) qualityDistribution["0.5-0.7"]++;
    else if (e.quality < 0.9) qualityDistribution["0.7-0.9"]++;
    else qualityDistribution["0.9-1.0"]++;
  }

  const estimatedTokens = examples.reduce((s, e) =>
    s + approximateTokenCount(e.instruction) + approximateTokenCount(e.output), 0
  );

  return { total: examples.length, bySource, avgQuality, avgInputLength, avgOutputLength, qualityDistribution, estimatedTokens };
}

/* ── Export formats ──────────────────────────────────────────── */
export function exportAlpacaFormat(examples: TrainingExample[]): string {
  const alpaca = examples.map(e => ({
    instruction: e.instruction,
    input: e.input ?? "",
    output: e.output,
  }));
  return JSON.stringify(alpaca, null, 2);
}

export function exportChatFormat(examples: TrainingExample[]): string {
  const chat = examples.map(e => ({
    messages: [
      { role: "system", content: "You are Wave AI, an advanced AI assistant built by Wave Platforms, Inc." },
      { role: "user", content: e.instruction },
      { role: "assistant", content: e.output },
    ],
  }));
  return JSON.stringify(chat, null, 2);
}

export function exportJSONL(examples: TrainingExample[]): string {
  return examples.map(e => JSON.stringify(e)).join("\n");
}

/* ── Deduplication ───────────────────────────────────────────── */
export function deduplicateDataset(examples: TrainingExample[]): TrainingExample[] {
  const seen = new Set<string>();
  return examples.filter(e => {
    const key = e.instruction.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
