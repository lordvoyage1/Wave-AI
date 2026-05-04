/**
 * Wave AI — Food & Culture Engine
 * Global cuisines, cultural practices, traditions, religions,
 * languages, social norms, festivals, and cultural intelligence.
 */

export const FOOD_KNOWLEDGE = {
  globalCuisines: {
    African: {
      eastAfrica: {
        Kenya: ["Ugali (maize porridge)", "Nyama Choma (grilled meat)", "Sukuma Wiki (kale stew)", "Mandazi (fried dough)", "Pilau rice", "Githeri (bean & corn stew)"],
        Tanzania: ["Zanzibar pizza", "Wali na Mchuzi (rice & curry)", "Ugali", "Maandazi", "Kachumbari salad"],
        Ethiopia: ["Injera (sourdough flatbread)", "Wat (spiced stew)", "Tibs (sautéed meat)", "Tej (honey wine)", "Kitfo (beef tartare)"],
        Uganda: ["Matoke (green banana stew)", "Rolex (egg-chapati wrap)", "Groundnut stew", "Malewa (bamboo shoots)"],
      },
      westAfrica: {
        Nigeria: ["Jollof rice", "Egusi soup", "Pepper soup", "Suya (spiced kebab)", "Pounded yam", "Banga soup"],
        Ghana: ["Fufu", "Waakye", "Kenkey", "Banku", "Groundnut soup", "Kontomire stew"],
        Senegal: ["Thiéboudienne (fish rice)", "Yassa (chicken/fish)", "Mafé (peanut stew)"],
      },
      southernAfrica: {
        SouthAfrica: ["Bobotie", "Braai (BBQ)", "Bunny Chow", "Biltong", "Potjiekos"],
        Zimbabwe: ["Sadza", "Muriwo ne nyama (greens & meat)", "Matemba (dried fish)"],
      },
    },
    Asian: {
      Japanese: {
        dishes: ["Sushi", "Ramen", "Tempura", "Miso soup", "Yakitori", "Sashimi", "Okonomiyaki", "Takoyaki"],
        culture: "Food is deeply ritualistic — presentation (盛り付け mori-tsuke) is as important as taste",
      },
      Indian: {
        dishes: ["Biryani", "Curry", "Dal", "Naan", "Samosa", "Tandoori", "Dosa", "Paneer dishes"],
        spices: ["Turmeric", "Cumin", "Coriander", "Cardamom", "Garam masala", "Saffron"],
        regional: "28 states, 28 distinct cuisines — North, South, East, West vary dramatically",
      },
      Chinese: {
        dishes: ["Dim Sum", "Peking Duck", "Kung Pao Chicken", "Hot Pot", "Dumplings (Jiaozi)", "Mapo Tofu"],
        styles: ["Cantonese (mild, fresh)", "Sichuan (spicy, numbing)", "Hunan (spicy, smoky)", "Shanghai (sweet, rich)"],
      },
    },
    European: {
      Italian: ["Pasta", "Pizza", "Risotto", "Tiramisu", "Gelato", "Prosciutto", "Bruschetta"],
      French: ["Croissant", "Baguette", "Coq au Vin", "Bouillabaisse", "Crème Brûlée", "Ratatouille", "Escargot"],
      Mediterranean: ["Hummus", "Falafel", "Shawarma", "Mezze", "Baklava", "Tabbouleh"],
    },
    Americas: {
      Mexican: ["Tacos", "Guacamole", "Enchiladas", "Mole", "Tamales", "Pozole", "Chiles en Nogada"],
      Brazilian: ["Feijoada (black bean stew)", "Churrasco (BBQ)", "Coxinha", "Açaí bowl", "Pão de queijo"],
      American: ["Burger", "BBQ", "Clam Chowder", "Mac & Cheese", "Apple Pie", "Lobster roll"],
    },
  },

  nutritionScience: {
    macronutrients: {
      carbohydrates: { calories: "4 cal/g", function: "Primary energy source", sources: ["Rice", "Bread", "Pasta", "Potatoes", "Fruits"] },
      proteins: { calories: "4 cal/g", function: "Building & repairing tissue", sources: ["Meat", "Fish", "Eggs", "Legumes", "Dairy"] },
      fats: { calories: "9 cal/g", function: "Energy storage, hormones, brain function", sources: ["Avocado", "Nuts", "Oils", "Fatty fish"] },
    },
    micronutrients: {
      vitamins: { A: "Vision, immunity", B12: "Nerve function", C: "Immune system, collagen", D: "Bone health", E: "Antioxidant", K: "Blood clotting" },
      minerals: { Iron: "Red blood cells", Calcium: "Bones", Zinc: "Immunity", Magnesium: "Muscle function", Potassium: "Heart function" },
    },
    superfoods: ["Moringa (Africa)", "Quinoa", "Blueberries", "Salmon", "Turmeric", "Kale", "Dark chocolate", "Green tea", "Garlic", "Eggs"],
  },
};

export const WORLD_CULTURES = {
  communication: {
    highContext: { description: "Meaning conveyed through context, relationships, non-verbal cues", cultures: ["Japan", "China", "Arab countries", "Many African cultures"] },
    lowContext: { description: "Meaning conveyed explicitly through words", cultures: ["USA", "Germany", "Scandinavia", "Australia"] },
    greetings: {
      Africa: { Kenya: "Habari! (Swahili)", Nigeria: "How are you doing? (English) / Ẹ káaro (Yoruba)", Ethiopia: "Selam! (Amharic)", Ghana: "Meda wo ase! (Twi)" },
      Asia: { Japan: "こんにちは Konnichiwa", China: "你好 Nǐ hǎo", India: "Namaste 🙏", Arabic: "مرحبا Marhaba" },
      Europe: { French: "Bonjour!", Spanish: "¡Hola!", Italian: "Ciao!", German: "Guten Tag!" },
    },
  },
  values: {
    ubuntu: "African philosophy: 'I am because we are' — emphasizing communal interdependence",
    wabi_sabi: "Japanese: finding beauty in imperfection and impermanence",
    hygge: "Danish: cozy, convivial contentment",
    lagom: "Swedish: 'just the right amount' — balance and moderation",
    ikigai: "Japanese: reason for being — intersection of passion, mission, vocation, profession",
  },
  festivals: [
    { name: "Diwali", origin: "Hindu/Indian", meaning: "Festival of Lights, triumph of light over darkness" },
    { name: "Eid al-Fitr", origin: "Islamic", meaning: "Breaking the fast after Ramadan, gratitude to Allah" },
    { name: "Christmas", origin: "Christian", meaning: "Birth of Jesus Christ, celebrated globally" },
    { name: "Hanukkah", origin: "Jewish", meaning: "Festival of Lights, miracle of oil lasting 8 days" },
    { name: "Chinese New Year", origin: "Chinese", meaning: "Lunar new year, family reunion, prosperity" },
    { name: "Carnival", origin: "Catholic/Brazilian", meaning: "Pre-Lent celebration, samba, costumes, street parties" },
    { name: "Kwanzaa", origin: "African-American", meaning: "7 principles of African heritage, December 26-Jan 1" },
    { name: "Navruz", origin: "Persian/Central Asian", meaning: "Persian New Year, spring equinox" },
    { name: "Maasai Enkiama", origin: "East African", meaning: "Maasai coming-of-age ceremony" },
  ],
};

export const WORLD_RELIGIONS = {
  major: {
    Christianity: {
      followers: "2.4 billion (largest)", origin: "1st century CE, Middle East", founder: "Jesus Christ",
      holyBook: "Bible (Old + New Testament)", branches: ["Catholic", "Protestant", "Orthodox", "Evangelical", "Baptist", "Anglican"],
      coreBeliefs: "Belief in one God, Jesus as Son of God and savior, resurrection, eternal life",
      practices: ["Prayer", "Church attendance", "Baptism", "Communion", "Confession (Catholic)"],
      inAfrica: "Christianity is the majority religion in sub-Saharan Africa — 600M+ followers",
    },
    Islam: {
      followers: "1.9 billion", origin: "7th century CE, Arabia", founder: "Prophet Muhammad (PBUH)",
      holyBook: "Quran", branches: ["Sunni (85-90%)", "Shia (10-15%)", "Sufi (mystical branch)"],
      fivePillars: ["Shahada (declaration of faith)", "Salah (5 daily prayers)", "Zakat (charity)", "Sawm (Ramadan fasting)", "Hajj (pilgrimage to Mecca)"],
      inAfrica: "Islam is strong in North Africa, East Africa (Swahili coast), West Africa — 500M+ in Africa",
    },
    Hinduism: {
      followers: "1.2 billion", origin: "c. 2300 BCE, Indian subcontinent", holyBooks: ["Vedas", "Upanishads", "Bhagavad Gita", "Mahabharata"],
      coreBeliefs: ["Brahman (universal consciousness)", "Dharma (cosmic order)", "Karma", "Reincarnation (Samsara)", "Moksha (liberation)"],
      deities: ["Brahma (creator)", "Vishnu (preserver)", "Shiva (destroyer)", "Lakshmi", "Saraswati", "Ganesha", "Krishna", "Rama"],
    },
    Buddhism: {
      followers: "500 million", founder: "Siddhartha Gautama (Buddha)", origin: "5th century BCE, Nepal/India",
      fourNobleTruths: ["Life is suffering (Dukkha)", "Suffering comes from desire", "Freedom from desire ends suffering", "Eightfold Path leads to freedom"],
      branches: ["Theravada (Thailand, Sri Lanka, Myanmar)", "Mahayana (China, Japan, Korea)", "Vajrayana (Tibet)"],
    },
    Judaism: {
      followers: "15 million", holyBook: "Torah (first 5 books of Moses) + Talmud", origin: "c. 2000 BCE",
      coreBeliefs: "One God (monotheism), covenant relationship, chosen people, Messianic hope",
      branches: ["Orthodox", "Conservative", "Reform", "Reconstructionist"],
    },
    TraditionalAfrican: {
      description: "Diverse indigenous spiritual traditions across Africa",
      keyFeatures: ["Ancestor veneration", "Spirit world interaction", "Community rituals", "Oral tradition", "Nature connection"],
      examples: ["Yoruba (Orisha)", "Igbo (Odinani)", "Akan (Sunsum)", "Zulu (Ubuntu spirituality)", "San (Bushman beliefs)"],
    },
  },
};

export function getFoodRecommendation(country, dietary = "any") {
  const foods = FOOD_KNOWLEDGE.globalCuisines;
  const countryMap = {
    kenya: foods.African.eastAfrica.Kenya,
    nigeria: foods.African.westAfrica.Nigeria,
    ethiopia: foods.African.eastAfrica.Ethiopia,
    japan: foods.Asian.Japanese.dishes,
    india: foods.Asian.Indian.dishes,
    italy: foods.European.Italian,
    france: foods.European.French,
    mexico: foods.Americas.Mexican,
    usa: foods.Americas.American,
    china: foods.Asian.Chinese.dishes,
  };
  const key = country.toLowerCase();
  const dishes = countryMap[key] || ["Ugali", "Pilau", "Jollof Rice", "Injera"];
  if (dietary === "vegetarian") return dishes.filter(d => !/(meat|chicken|beef|fish|suya|nyama|choma)/i.test(d));
  return dishes;
}

export function getCulturalEtiquette(country) {
  const etiquette = {
    japan: ["Remove shoes before entering homes", "Bow instead of handshake", "Avoid pointing with chopsticks", "Gift-giving is an art — present with both hands"],
    india: ["Remove shoes at temples", "Don't point feet at sacred objects or people", "Accept food with right hand", "Namaste greeting with palms together"],
    kenya: ["Greet elders first", "Accept food/drinks when offered", "Use both hands or right hand to give/receive", "Respect for elders is paramount"],
    arabia: ["No alcohol in many settings", "Dress modestly", "Remove shoes at mosque", "Do not eat/drink during Ramadan in public"],
    germany: ["Punctuality is crucial", "Firm handshake", "Direct communication expected", "Don't jaywalk"],
    brazil: ["Physical affection normal (kisses on cheek)", "Time is flexible ('Brazilian time')", "Football is religion", "Don't discuss Argentina"],
  };
  return etiquette[country.toLowerCase()] || [`Research specific customs before visiting ${country}`, "Respect local dress codes", "Learn basic greetings in the local language"];
}
