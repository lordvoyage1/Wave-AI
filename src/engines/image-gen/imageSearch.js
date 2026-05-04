/**
 * Wave AI — Image Search Engine
 * Fetches real images from the internet for conversation mixing.
 * Uses Unsplash, Pexels RSS, DuckDuckGo images, and Wikimedia.
 */

export const IMAGE_SOURCES = {
  unsplash: {
    name: "Unsplash",
    random: (query) => `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`,
    featured: (query) => `https://source.unsplash.com/featured/800x600/?${encodeURIComponent(query)}`,
  },
  wikimedia: {
    name: "Wikimedia Commons",
    search: async (query) => {
      const url = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(query.replace(/ /g, "_"))}`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.items || []).filter(i => i.type === "image").slice(0, 5).map(i => ({ url: i.srcset?.[0]?.src || i.src, title: i.title }));
    },
  },
  pixabay: {
    name: "Pixabay",
    search: async (query) => {
      const res = await fetch(`https://pixabay.com/api/?q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.hits || []).map(h => ({ url: h.webformatURL, thumbnail: h.previewURL, tags: h.tags }));
    },
  },
};

export async function searchImages(query, source = "unsplash", count = 4) {
  const results = [];
  try {
    if (source === "unsplash" || source === "all") {
      for (let i = 0; i < count; i++) {
        results.push({
          url: `https://source.unsplash.com/800x${400 + i * 100}/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
          source: "Unsplash",
          query,
        });
      }
    }
    if (source === "wikimedia" || source === "all") {
      try {
        const wikiResults = await IMAGE_SOURCES.wikimedia.search(query);
        results.push(...wikiResults.map(r => ({ ...r, source: "Wikimedia" })));
      } catch {}
    }
  } catch (err) {
    console.warn("Image search error:", err);
  }
  return results.slice(0, count);
}

export async function fetchContextualImages(messageText, count = 2) {
  const keywords = extractVisualKeywords(messageText);
  if (keywords.length === 0) return [];
  const query = keywords.slice(0, 3).join(" ");
  return searchImages(query, "unsplash", count);
}

export function extractVisualKeywords(text) {
  const visualNouns = text.match(/\b([A-Z][a-z]+|[a-z]{4,})\b/g) || [];
  const stopWords = new Set(["this", "that", "with", "have", "from", "they", "will", "been", "into", "more", "also", "some", "what", "when", "where", "there", "their", "about", "which"]);
  const filtered = visualNouns.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 3);
  const scored = filtered.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(scored).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
}

export function shouldShowImage(messageText) {
  const triggers = /show|image|picture|photo|look|see|visual|what does|what is|where is|map|diagram|chart|example of|illustrate/i;
  return triggers.test(messageText);
}

export async function getTopicImage(topic) {
  const topicImages = {
    africa: "https://source.unsplash.com/800x500/?africa,landscape&sig=1",
    kenya: "https://source.unsplash.com/800x500/?kenya,safari&sig=2",
    technology: "https://source.unsplash.com/800x500/?technology,ai&sig=3",
    science: "https://source.unsplash.com/800x500/?science,laboratory&sig=4",
    food: "https://source.unsplash.com/800x500/?food,delicious&sig=5",
    nature: "https://source.unsplash.com/800x500/?nature,forest&sig=6",
    city: "https://source.unsplash.com/800x500/?city,skyline&sig=7",
    ocean: "https://source.unsplash.com/800x500/?ocean,waves&sig=8",
    space: "https://source.unsplash.com/800x500/?space,galaxy&sig=9",
    music: "https://source.unsplash.com/800x500/?music,concert&sig=10",
  };
  const key = Object.keys(topicImages).find(k => topic.toLowerCase().includes(k));
  return key ? topicImages[key] : `https://source.unsplash.com/800x500/?${encodeURIComponent(topic)}&sig=${Date.now()}`;
}

export async function fetchMultipleImages(queries) {
  return Promise.all(queries.map(q => searchImages(q, "unsplash", 1).then(r => r[0]).catch(() => null)));
}

export function buildImageGrid(images, columns = 2) {
  const rows = [];
  for (let i = 0; i < images.length; i += columns) {
    rows.push(images.slice(i, i + columns));
  }
  return rows;
}

export function getUnsplashUrl(query, width = 800, height = 500, seed = null) {
  const sig = seed || Date.now();
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}&sig=${sig}`;
}
