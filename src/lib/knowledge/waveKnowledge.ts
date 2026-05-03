/* ═══════════════════════════════════════════════════════════════
   Wave AI — Built-in Knowledge Base
   Curated Q&A and facts about Wave AI, Wave Platforms, East Africa
   tech, programming, science, and general world knowledge.
   Auto-indexed into the vector store on startup.
═══════════════════════════════════════════════════════════════ */

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  confidence: number;
}

/* ── Wave AI & Wave Platforms knowledge ──────────────────────── */
export const WAVE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "wave_001",
    question: "What is Wave AI?",
    answer: "Wave AI is an advanced AI assistant built by Wave Platforms, Inc. It is the first advanced AI assistant ever made in East Africa. Wave AI can engage in natural conversations, generate code, create images, analyze files, and much more.",
    category: "about",
    tags: ["wave ai", "about", "identity"],
    confidence: 1.0,
  },
  {
    id: "wave_002",
    question: "Who built Wave AI?",
    answer: "Wave AI was built by Wave Platforms, Inc., led by CEO and founder Meddy Mususwa. Wave Platforms is a technology company based in East Africa focused on democratizing access to advanced artificial intelligence.",
    category: "about",
    tags: ["wave platforms", "founder", "ceo", "meddy mususwa"],
    confidence: 1.0,
  },
  {
    id: "wave_003",
    question: "What can Wave AI do?",
    answer: "Wave AI can: (1) Have intelligent conversations on any topic, (2) Generate and debug code in any programming language, (3) Create images from text descriptions, (4) Analyze uploaded files and images, (5) Conduct voice conversations, (6) Write creative content, (7) Solve math problems, (8) Search the web for current information, (9) Convert currencies and units, (10) Check weather conditions.",
    category: "capabilities",
    tags: ["features", "capabilities", "what can you do"],
    confidence: 1.0,
  },
  {
    id: "wave_004",
    question: "Where is Wave Platforms based?",
    answer: "Wave Platforms, Inc. is based in East Africa, making Wave AI the first advanced AI assistant ever built in East Africa. Wave Platforms aims to bring world-class AI technology to Africa and the global market.",
    category: "about",
    tags: ["location", "east africa", "headquarters"],
    confidence: 1.0,
  },
  {
    id: "wave_005",
    question: "How do I contact Wave Platforms?",
    answer: "You can reach Wave Platforms through their official channels: YouTube: https://www.youtube.com/@Wave-platfoms | WhatsApp Channel: https://whatsapp.com/channel/0029VbDD5xgBlHpjUBmayj30 | TikTok: https://www.tiktok.com/@itsmeddy",
    category: "contact",
    tags: ["contact", "social media", "youtube", "whatsapp", "tiktok"],
    confidence: 1.0,
  },

  /* ── Programming knowledge ─────────────────────────────────── */
  {
    id: "prog_001",
    question: "What is a neural network?",
    answer: "A neural network is a computational model inspired by the human brain's structure. It consists of layers of interconnected nodes (neurons) that process information. Each connection has a weight that adjusts during training. Neural networks learn by adjusting these weights to minimize prediction errors. They are the foundation of deep learning and modern AI.",
    category: "programming",
    tags: ["neural network", "ai", "machine learning", "deep learning"],
    confidence: 0.95,
  },
  {
    id: "prog_002",
    question: "What is the difference between Python 2 and Python 3?",
    answer: "Key differences: (1) Print: Python 2 uses `print x`, Python 3 uses `print(x)`, (2) Integer division: Python 2 `5/2=2`, Python 3 `5/2=2.5`, (3) Unicode: Python 3 uses Unicode strings by default, (4) `range()` returns a list in Python 2, an iterator in Python 3, (5) Python 2 reached end-of-life January 1, 2020. Python 3 is the current standard.",
    category: "programming",
    tags: ["python", "python2", "python3", "difference"],
    confidence: 0.95,
  },
  {
    id: "prog_003",
    question: "What is REST API?",
    answer: "REST (Representational State Transfer) is an architectural style for building web APIs. Key principles: (1) Stateless — each request contains all needed information, (2) Resource-based — everything is a resource accessed via URLs, (3) HTTP methods — GET (read), POST (create), PUT (update), DELETE (remove), (4) Uniform interface — consistent URL structure, (5) JSON or XML responses. REST APIs are the backbone of modern web development.",
    category: "programming",
    tags: ["rest", "api", "http", "web development"],
    confidence: 0.95,
  },
  {
    id: "prog_004",
    question: "What is Big O notation?",
    answer: "Big O notation describes the time or space complexity of an algorithm as input size grows. Common complexities: O(1) — constant, O(log n) — logarithmic (binary search), O(n) — linear (simple loop), O(n log n) — linearithmic (merge sort), O(n²) — quadratic (nested loops), O(2^n) — exponential (recursive fibonacci). Lower complexity = better performance for large inputs.",
    category: "programming",
    tags: ["algorithms", "complexity", "big o", "data structures"],
    confidence: 0.95,
  },
  {
    id: "prog_005",
    question: "What is machine learning?",
    answer: "Machine learning (ML) is a subset of AI where systems learn from data to make predictions or decisions without being explicitly programmed. Types: (1) Supervised learning — learns from labeled examples, (2) Unsupervised learning — finds patterns in unlabeled data, (3) Reinforcement learning — learns through rewards and penalties. ML powers recommendation systems, image recognition, natural language processing, and more.",
    category: "programming",
    tags: ["machine learning", "ai", "supervised", "unsupervised"],
    confidence: 0.95,
  },

  /* ── Science knowledge ─────────────────────────────────────── */
  {
    id: "sci_001",
    question: "What is the speed of light?",
    answer: "The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s or 186,000 miles per second). This is denoted as 'c' and is the universal speed limit according to Einstein's theory of special relativity. Nothing with mass can reach or exceed this speed.",
    category: "science",
    tags: ["physics", "speed of light", "einstein", "relativity"],
    confidence: 1.0,
  },
  {
    id: "sci_002",
    question: "What is DNA?",
    answer: "DNA (Deoxyribonucleic acid) is the molecule that carries genetic instructions for development, functioning, growth, and reproduction of all known living organisms. It consists of two strands forming a double helix, made of nucleotides containing: adenine (A), thymine (T), guanine (G), and cytosine (C). Base pairs are A-T and G-C. The human genome contains about 3 billion base pairs.",
    category: "science",
    tags: ["biology", "dna", "genetics", "molecules"],
    confidence: 1.0,
  },
  {
    id: "sci_003",
    question: "What causes climate change?",
    answer: "Climate change is primarily caused by greenhouse gas emissions from human activities: (1) Burning fossil fuels (coal, oil, gas) — largest source of CO₂, (2) Deforestation — reduces CO₂ absorption, (3) Agriculture — methane from livestock and rice paddies, (4) Industry — cement, steel production. These gases trap heat in Earth's atmosphere, causing global temperatures to rise, leading to sea level rise, extreme weather, and ecosystem disruption.",
    category: "science",
    tags: ["climate change", "environment", "greenhouse gases", "global warming"],
    confidence: 0.95,
  },

  /* ── East Africa knowledge ─────────────────────────────────── */
  {
    id: "africa_001",
    question: "What is the Silicon Savannah?",
    answer: "Silicon Savannah refers to Nairobi, Kenya's thriving technology and startup ecosystem, particularly in the Westlands and Karen areas. It has become one of Africa's leading tech hubs, home to hundreds of startups, tech companies, and innovation centers. M-Pesa (mobile money), iHub, and Andela are notable innovations from this region. The term parallels Silicon Valley, highlighting East Africa's emergence as a global tech powerhouse.",
    category: "east_africa",
    tags: ["nairobi", "kenya", "tech hub", "silicon savannah", "startups"],
    confidence: 0.95,
  },
  {
    id: "africa_002",
    question: "What is M-Pesa?",
    answer: "M-Pesa is a mobile money transfer, financing, and microfinancing service launched in 2007 by Safaricom in Kenya. It allows users to transfer money, pay bills, and access financial services via mobile phone without needing a bank account. M-Pesa revolutionized financial inclusion in East Africa and is now available in multiple African countries and beyond. It processes billions of dollars in transactions annually.",
    category: "east_africa",
    tags: ["m-pesa", "mobile money", "kenya", "fintech", "safaricom"],
    confidence: 0.95,
  },

  /* ── Mathematics knowledge ─────────────────────────────────── */
  {
    id: "math_001",
    question: "What is the Pythagorean theorem?",
    answer: "The Pythagorean theorem states that in a right-angled triangle, the square of the length of the hypotenuse (the side opposite the right angle) equals the sum of squares of the other two sides. Formula: a² + b² = c², where c is the hypotenuse. Example: if a=3, b=4, then c=√(9+16)=√25=5. This is one of the most fundamental theorems in mathematics.",
    category: "mathematics",
    tags: ["pythagorean", "geometry", "triangle", "math"],
    confidence: 1.0,
  },
  {
    id: "math_002",
    question: "What is calculus?",
    answer: "Calculus is the mathematical study of continuous change. It has two main branches: (1) Differential calculus — deals with rates of change (derivatives), used to find slopes and velocities; (2) Integral calculus — deals with accumulation of quantities (integrals), used to find areas and totals. Invented independently by Newton and Leibniz in the 17th century, calculus is foundational to physics, engineering, economics, and computer science.",
    category: "mathematics",
    tags: ["calculus", "derivative", "integral", "mathematics"],
    confidence: 0.95,
  },

  /* ── General world knowledge ─────────────────────────────────── */
  {
    id: "world_001",
    question: "What are the seven wonders of the world?",
    answer: "The Seven Wonders of the Ancient World: (1) Great Pyramid of Giza (only surviving wonder), (2) Hanging Gardens of Babylon, (3) Statue of Zeus at Olympia, (4) Temple of Artemis at Ephesus, (5) Mausoleum at Halicarnassus, (6) Colossus of Rhodes, (7) Lighthouse of Alexandria. The New Seven Wonders (2007): Great Wall of China, Petra, Christ the Redeemer, Machu Picchu, Chichen Itza, Roman Colosseum, Taj Mahal.",
    category: "world",
    tags: ["wonders", "history", "landmarks", "ancient"],
    confidence: 1.0,
  },
  {
    id: "world_002",
    question: "What is blockchain?",
    answer: "Blockchain is a distributed ledger technology that records transactions across many computers in a way that makes them tamper-resistant. Key features: (1) Decentralized — no single point of control, (2) Immutable — once recorded, data cannot easily be changed, (3) Transparent — all participants can view the chain, (4) Secure — cryptographically linked blocks. Bitcoin was the first major blockchain application. Now used in finance, supply chain, healthcare, and more.",
    category: "technology",
    tags: ["blockchain", "cryptocurrency", "bitcoin", "distributed"],
    confidence: 0.95,
  },
];

/* ── Index all knowledge on startup ──────────────────────────── */
let knowledgeIndexed = false;

export async function ensureKnowledgeIndexed(): Promise<void> {
  if (knowledgeIndexed) return;
  knowledgeIndexed = true;

  try {
    const { indexKnowledgeBase } = await import("@/lib/rag/retriever");
    const items = WAVE_KNOWLEDGE.map(k => ({
      question: k.question,
      answer: k.answer,
      tags: k.tags,
    }));
    await indexKnowledgeBase(items);
  } catch {
    /* non-critical: skip if indexing fails */
  }
}

export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
  return WAVE_KNOWLEDGE.filter(k => k.category === category);
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const lower = query.toLowerCase();
  return WAVE_KNOWLEDGE.filter(k =>
    k.question.toLowerCase().includes(lower) ||
    k.tags.some(t => lower.includes(t)) ||
    k.answer.toLowerCase().includes(lower)
  ).slice(0, 5);
}
