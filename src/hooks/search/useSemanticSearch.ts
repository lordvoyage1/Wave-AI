/* ═══════════════════════════════════════════════════════════════
   Wave AI — useSemanticSearch Hook
   React hook for semantic search over knowledge base and docs.
═══════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from "react";
import { hybridSearch, getAutocompleteSuggestions, suggestRelatedQueries, SearchResult } from "@/lib/search/semanticSearch";
import { indexDocument, ragStats, listDocuments } from "@/lib/rag/retriever";
import { ensureKnowledgeIndexed } from "@/lib/knowledge/waveKnowledge";

export function useSemanticSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);
  const [indexedDocCount, setIndexedDocCount] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    ensureKnowledgeIndexed().then(() => {
      const stats = ragStats();
      setIndexedDocCount(stats.indexedDocuments);
    });
  }, []);

  const search = useCallback(async (query: string, topK = 5) => {
    if (!query.trim()) { setResults([]); return []; }
    setIsSearching(true);
    try {
      const hits = await hybridSearch(query, { topK });
      setResults(hits);
      setRelatedQueries(suggestRelatedQueries(query));
      return hits;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getCompletions = useCallback((partial: string) => {
    const completions = getAutocompleteSuggestions(partial);
    setSuggestions(completions);
    return completions;
  }, []);

  const indexDoc = useCallback(async (doc: Parameters<typeof indexDocument>[0]) => {
    setIsIndexing(true);
    try {
      const count = await indexDocument(doc);
      setIndexedDocCount(ragStats().indexedDocuments);
      return count;
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setRelatedQueries([]);
  }, []);

  return {
    results,
    isSearching,
    suggestions,
    relatedQueries,
    indexedDocCount,
    isIndexing,
    search,
    getCompletions,
    indexDoc,
    clearResults,
    listDocuments,
    ragStats,
  };
}
