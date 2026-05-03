/* ═══════════════════════════════════════════════════════════════
   Wave AI — useMemory Hook
   React hook for managing conversation and long-term memory.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from "react";
import { longTermMemory, MemoryType } from "@/lib/memory/longTerm";
import { ShortTermMemory } from "@/lib/memory/shortTerm";

export interface MemoryStats {
  longTermTotal: number;
  byType: Record<string, number>;
  avgImportance: number;
  totalAccesses: number;
}

const sessionMemories = new Map<string, ShortTermMemory>();

function getSession(sessionId: string): ShortTermMemory {
  if (!sessionMemories.has(sessionId)) {
    sessionMemories.set(sessionId, new ShortTermMemory(sessionId));
  }
  return sessionMemories.get(sessionId)!;
}

export function useMemory(sessionId = "default", userId?: string) {
  const [stats, setStats] = useState<MemoryStats>({ longTermTotal: 0, byType: {}, avgImportance: 0, totalAccesses: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ content: string; summary: string; type: string; relevance: number }>>([]);

  useEffect(() => {
    const ltmStats = longTermMemory.stats();
    setStats({
      longTermTotal: ltmStats.total,
      byType: ltmStats.byType,
      avgImportance: ltmStats.avgImportance,
      totalAccesses: ltmStats.totalAccesses,
    });
  }, []);

  const storeMemory = useCallback(async (
    content: string,
    summary: string,
    type: MemoryType = "episodic",
    importance = 0.5
  ) => {
    const entry = await longTermMemory.store(content, summary, type, { userId, sessionId, importance });
    const ltmStats = longTermMemory.stats();
    setStats({ longTermTotal: ltmStats.total, byType: ltmStats.byType, avgImportance: ltmStats.avgImportance, totalAccesses: ltmStats.totalAccesses });
    return entry;
  }, [userId, sessionId]);

  const searchMemory = useCallback(async (query: string, limit = 5) => {
    setIsSearching(true);
    try {
      const results = await longTermMemory.search(query, limit, { userId });
      const formatted = results.map(r => ({
        content: r.entry.content,
        summary: r.entry.summary,
        type: r.entry.type,
        relevance: r.relevance,
      }));
      setSearchResults(formatted);
      return formatted;
    } finally {
      setIsSearching(false);
    }
  }, [userId]);

  const addToSession = useCallback((role: "user" | "assistant" | "system", content: string) => {
    const memory = getSession(sessionId);
    return memory.add(role, content);
  }, [sessionId]);

  const getSessionContext = useCallback((maxTokens = 2048) => {
    return getSession(sessionId).getContext(maxTokens);
  }, [sessionId]);

  const clearSession = useCallback(() => {
    const memory = getSession(sessionId);
    memory.clear();
    sessionMemories.delete(sessionId);
  }, [sessionId]);

  const clearLongTerm = useCallback(() => {
    longTermMemory.clear(userId);
    setStats({ longTermTotal: 0, byType: {}, avgImportance: 0, totalAccesses: 0 });
  }, [userId]);

  const sessionStats = getSession(sessionId).getStats();

  return {
    stats,
    sessionStats,
    isSearching,
    searchResults,
    storeMemory,
    searchMemory,
    addToSession,
    getSessionContext,
    clearSession,
    clearLongTerm,
    allLongTermMemories: longTermMemory.getAll(),
  };
}
