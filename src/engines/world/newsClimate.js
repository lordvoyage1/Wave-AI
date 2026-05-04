/**
 * Wave AI — News & Climate Engine
 * Real-time news fetching, climate science, environmental data,
 * global events tracker, and geopolitical awareness.
 */

const NEWS_APIS = [
  { name: "GNews", url: "https://gnews.io/api/v4/top-headlines?lang=en&max=10&token=", requiresKey: true },
  { name: "NewsData", url: "https://newsdata.io/api/1/news?language=en&", requiresKey: true },
  { name: "RSS2JSON (BBC)", url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml", requiresKey: false },
  { name: "RSS2JSON (Reuters)", url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.reuters.com/reuters/topNews", requiresKey: false },
];

export async function fetchLatestNews(category = "world", count = 5) {
  try {
    // Use RSS2JSON (free, no key) for BBC news
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/${category}/rss.xml&count=${count}`);
    if (!response.ok) throw new Error("News fetch failed");
    const data = await response.json();
    return (data.items || []).slice(0, count).map(item => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
      url: item.link,
      publishedAt: item.pubDate,
      source: "BBC News",
      category,
    }));
  } catch {
    return getStaticNewsContext(category);
  }
}

export async function fetchAfricaNews(count = 5) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/africa/rss.xml&count=${count}`);
    const data = await response.json();
    return (data.items || []).slice(0, count).map(item => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
      url: item.link,
      publishedAt: item.pubDate,
      source: "BBC Africa",
    }));
  } catch {
    return getStaticNewsContext("africa");
  }
}

export async function fetchTechNews(count = 5) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TechCrunch&count=${count}`);
    const data = await response.json();
    return (data.items || []).slice(0, count).map(item => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
      url: item.link,
      publishedAt: item.pubDate,
      source: "TechCrunch",
    }));
  } catch {
    return getStaticNewsContext("technology");
  }
}

function getStaticNewsContext(category) {
  const contexts = {
    world: [
      { title: "Global AI governance discussions intensify at UN", description: "World leaders debate frameworks for artificial intelligence regulation", source: "Context" },
      { title: "Climate summit targets 1.5°C global temperature limit", description: "196 nations negotiate emission reduction pledges", source: "Context" },
    ],
    africa: [
      { title: "East Africa tech hub attracts $2B in investment", description: "Nairobi, Kigali, Lagos cement status as Africa's Silicon Savannah", source: "Context" },
      { title: "African Free Trade Area accelerates economic integration", description: "AfCFTA connects 54 countries in world's largest free trade zone", source: "Context" },
    ],
    technology: [
      { title: "Large language models reach new capability milestones", description: "Open-source AI models close gap with proprietary systems", source: "Context" },
      { title: "African developers build AI solutions for local contexts", description: "Wave AI among platforms addressing African language gaps", source: "Context" },
    ],
  };
  return contexts[category] || contexts.world;
}

export const CLIMATE_SCIENCE = {
  basics: {
    greenhouse: {
      effect: "Solar radiation passes through atmosphere, warms Earth, re-emitted infrared radiation trapped by greenhouse gases",
      gases: { CO2: "80% of GHG emissions, lasts 300-1000 years", CH4: "Methane 28x more potent than CO2, 12-year lifetime", N2O: "Agricultural, 265x potent", F_gases: "Industrial, up to 23,000x potent" },
      currentLevel: "CO2 at 422ppm (2024), highest in 3 million years",
    },
    temperature: {
      currentWarming: "1.2°C above pre-industrial levels (1850-1900)",
      targets: { paris: "1.5°C limit (best case), 2°C (fallback)", current: "On track for 2.7°C by 2100 without more action" },
    },
    tippingPoints: [
      "West Antarctic Ice Sheet collapse (sea level +3-5m)",
      "Amazon dieback (savannification of 40% of Amazon)",
      "Permafrost methane release (massive carbon bomb)",
      "Atlantic circulation slowdown (AMOC — European cooling)",
      "Arctic sea ice loss (accelerates warming)",
    ],
  },

  impacts: {
    regional: {
      Africa: [
        "Sub-Saharan Africa warming 1.5x faster than global average",
        "East Africa: increased droughts, flooding, food insecurity",
        "Lake Chad: shrunk by 90% since 1963",
        "250M Africans face water stress by 2050",
        "Coffee and cocoa crops threatened in Ethiopia, Ghana, Ivory Coast",
      ],
      global: [
        "Sea level rise 15-25cm since 1900, accelerating",
        "Ocean acidification killing coral reefs (50% dead since 1950)",
        "Extreme weather: hurricanes 40% more intense since 1970",
        "Arctic warming 4x faster than global average",
        "1M+ species threatened with extinction by 2100",
      ],
    },
  },

  solutions: {
    energy: ["Solar power (costs fell 89% since 2010)", "Wind energy", "Hydropower", "Nuclear (low-carbon)", "Green hydrogen", "Geothermal"],
    transport: ["Electric vehicles", "Public transit", "Cycling infrastructure", "Aviation fuel alternatives", "Shipping decarbonization"],
    agriculture: ["Regenerative farming", "Reduced food waste", "Plant-rich diets", "Precision agriculture", "Agroforestry"],
    carbon: ["Reforestation (1 trillion trees = 200Gt CO2)", "Soil carbon sequestration", "Direct air capture", "Blue carbon (mangroves, seagrass)"],
    policy: ["Carbon pricing", "Paris Agreement", "Clean energy subsidies", "Just transition funds for developing nations"],
  },

  africaClimate: {
    opportunities: [
      "Africa has 60% of world's solar potential but only 1% of solar capacity",
      "Great Green Wall: reforestation initiative across Sahel — 100M hectares by 2030",
      "Congo Basin: world's largest carbon sink after Amazon",
      "Africa's renewable energy potential: 10TW solar, 350GW wind",
    ],
    threats: [
      "Contributes only 3% of global CO2 but suffers 5x more climate losses",
      "Climate migration: 216M internal climate migrants by 2050 in Africa",
      "Lake Victoria: water level dropping, fisheries collapsing",
    ],
  },
};

export async function getWeatherData(city) {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await response.json();
    const current = data.current_condition?.[0];
    if (!current) throw new Error("No weather data");
    return {
      city,
      temp_c: current.temp_C,
      temp_f: current.temp_F,
      feels_like_c: current.FeelsLikeC,
      humidity: current.humidity,
      description: current.weatherDesc?.[0]?.value || "Clear",
      wind_kph: current.windspeedKmph,
      visibility_km: current.visibility,
      uvIndex: current.uvIndex,
    };
  } catch {
    return { city, error: "Could not fetch live weather", note: "Check wttr.in for current conditions" };
  }
}

export function getClimateActionTip() {
  const tips = [
    "🌱 Plant a tree — one tree absorbs 21kg of CO2 per year",
    "🥗 Eat plant-based one extra day/week — saves 1 tonne of CO2/year",
    "💡 Switch to LED bulbs — 75% less energy than incandescent",
    "🚿 Take 5-minute showers — saves 45 liters vs 10-minute shower",
    "🛒 Buy less, buy better — fast fashion is the 2nd most polluting industry",
    "🔌 Unplug devices when not in use — standby power is 10% of home electricity",
    "🌍 Support African reforestation — Congo Basin is global climate hero",
    "📱 Keep your phone 1 more year — manufacturing is 80% of smartphone emissions",
    "🏠 Insulate your home — heating/cooling is 40% of home energy use",
    "🗳️ Vote for climate-aware leaders — policy is the most impactful action",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
