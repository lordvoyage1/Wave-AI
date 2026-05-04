/**
 * Wave AI — World Concepts Knowledge Engine
 * Deep knowledge of how the world works, global systems,
 * civilizations, nature, and universal concepts.
 */

export const WORLD_CONCEPTS = {
  globalSystems: {
    political: ["democracy", "republic", "monarchy", "authoritarianism", "federalism", "parliamentary", "presidential", "socialist", "communist", "theocracy"],
    economic: ["capitalism", "socialism", "mixed economy", "free market", "command economy", "welfare state", "globalization", "protectionism", "Keynesianism", "monetarism"],
    social: ["multiculturalism", "secularism", "nationalism", "cosmopolitanism", "tribalism", "individualism", "collectivism", "egalitarianism", "meritocracy"],
    environmental: ["ecosystem", "biodiversity", "carbon cycle", "water cycle", "food chain", "climate zones", "biomes", "sustainability", "conservation"],
  },

  geography: {
    continents: {
      Africa: { countries: 54, population: "1.4B", area: "30.37M km²", highlights: ["Sahara Desert", "Nile River", "Great Rift Valley", "Congo Rainforest", "Mount Kilimanjaro"] },
      Asia: { countries: 49, population: "4.7B", area: "44.58M km²", highlights: ["Himalayas", "Yangtze River", "Gobi Desert", "Mekong River", "Arabian Peninsula"] },
      Europe: { countries: 44, population: "750M", area: "10.53M km²", highlights: ["Alps", "Mediterranean Sea", "Rhine River", "Scandinavia", "Iberian Peninsula"] },
      NorthAmerica: { countries: 23, population: "600M", area: "24.71M km²", highlights: ["Rocky Mountains", "Amazon", "Great Lakes", "Caribbean", "Arctic Circle"] },
      SouthAmerica: { countries: 12, population: "430M", area: "17.84M km²", highlights: ["Amazon Rainforest", "Andes Mountains", "Patagonia", "Galápagos", "Pantanal"] },
      Oceania: { countries: 14, population: "43M", area: "8.52M km²", highlights: ["Great Barrier Reef", "Outback", "Polynesia", "Melanesia", "New Zealand fjords"] },
      Antarctica: { countries: 0, population: "~5000 researchers", area: "14.2M km²", highlights: ["South Pole", "Ice sheets", "Research stations", "Emperor penguins"] },
    },
    naturalWonders: [
      "Great Barrier Reef", "Amazon River", "Victoria Falls", "Mount Everest",
      "Northern Lights", "Grand Canyon", "Sahara Desert", "Dead Sea",
      "Galápagos Islands", "Angel Falls", "Matterhorn", "Lake Baikal",
    ],
    oceans: {
      Pacific: { area: "165.25M km²", deepest: "Mariana Trench 11,034m" },
      Atlantic: { area: "106.46M km²", deepest: "Puerto Rico Trench 8,376m" },
      Indian: { area: "70.56M km²", deepest: "Java Trench 7,258m" },
      Southern: { area: "21.96M km²", deepest: "South Sandwich Trench 7,236m" },
      Arctic: { area: "14.06M km²", deepest: "Molloy Hole 5,669m" },
    },
  },

  naturalPhenomena: {
    weather: {
      hurricanes: "Tropical cyclones forming over warm ocean water, winds exceeding 119 km/h",
      tornadoes: "Violent rotating columns of air, winds up to 480 km/h",
      monsoon: "Seasonal wind pattern causing heavy rains, critical for South Asian agriculture",
      ElNino: "Periodic warming of Pacific Ocean causing global weather disruptions",
      LaNina: "Cooling of Pacific Ocean, opposite effects to El Niño",
      aurora: "Luminous plasma caused by solar wind particles interacting with atmosphere",
    },
    geology: {
      earthquakes: "Movement of tectonic plates causing ground shaking. Measured on Richter/Moment Magnitude scale",
      volcanoes: "Openings in Earth's crust releasing magma, ash, gases. Ring of Fire most active zone",
      tsunamis: "Giant ocean waves caused by undersea earthquakes, landslides, or volcanic eruptions",
      glaciers: "Massive slow-moving ice formations covering 10% of Earth's land surface",
    },
    astronomy: {
      solarSystem: "Sun + 8 planets + dwarf planets + asteroids + comets",
      blackHoles: "Regions of spacetime where gravity is so strong nothing can escape, not even light",
      galaxies: "Systems of millions/billions of stars. Milky Way contains 200-400 billion stars",
      cosmicEvents: ["Solar eclipse", "Lunar eclipse", "Meteor shower", "Comet passage", "Supernova", "Planetary alignment"],
    },
  },

  civilizations: {
    ancient: [
      { name: "Mesopotamia", era: "c. 3500–500 BCE", contribution: "First writing (cuneiform), first cities, first legal code (Hammurabi)" },
      { name: "Ancient Egypt", era: "c. 3100–30 BCE", contribution: "Pyramids, hieroglyphics, advanced medicine, paper (papyrus)" },
      { name: "Ancient Greece", era: "c. 800–146 BCE", contribution: "Democracy, philosophy, mathematics, Olympic Games" },
      { name: "Roman Empire", era: "27 BCE–476 CE", contribution: "Law, engineering, roads, aqueducts, Latin language" },
      { name: "Ancient China", era: "c. 2100 BCE–present", contribution: "Paper, printing, gunpowder, compass, silk" },
      { name: "Indus Valley", era: "c. 3300–1300 BCE", contribution: "Urban planning, sewage systems, standardized weights" },
      { name: "Maya", era: "c. 2000 BCE–1500 CE", contribution: "Calendar system, astronomy, mathematical zero" },
    ],
    modernEmpires: ["British Empire", "Ottoman Empire", "Mongol Empire", "Spanish Empire", "French Empire", "Russian Empire"],
  },

  globalChallenges: {
    current: [
      { issue: "Climate Change", cause: "Greenhouse gas emissions", impact: "Rising temperatures, extreme weather, sea level rise" },
      { issue: "Poverty", cause: "Inequality, lack of access", impact: "1.1B people live on <$1.90/day" },
      { issue: "Conflict", cause: "Political, ethnic, resource disputes", impact: "70M+ displaced people worldwide" },
      { issue: "Pandemic preparedness", cause: "Zoonotic spillover, travel", impact: "COVID-19 killed 7M+, disrupted global economy" },
      { issue: "Digital divide", cause: "Unequal tech access", impact: "2.7B people still offline" },
      { issue: "Food security", cause: "Climate, inequality, waste", impact: "820M people go hungry daily" },
    ],
  },
};

export function getWorldFact(category = "random") {
  const facts = [
    "There are approximately 8.1 billion humans on Earth as of 2024.",
    "The Amazon rainforest produces 20% of the world's oxygen.",
    "The Great Wall of China is 21,196 km long.",
    "Mount Everest grows about 4mm taller each year due to tectonic activity.",
    "The Pacific Ocean is larger than all of Earth's landmasses combined.",
    "Lightning strikes Earth about 100 times every second.",
    "There are more trees on Earth (3 trillion) than stars in the Milky Way.",
    "The Sahara Desert was green and had lakes 6,000 years ago.",
    "Antarctica is the world's largest desert by precipitation.",
    "More people have been to space than to the deepest part of the ocean.",
  ];
  if (category === "random") return facts[Math.floor(Math.random() * facts.length)];
  return facts[0];
}

export function getCountryInfo(country) {
  const countries = {
    kenya: { capital: "Nairobi", population: "55M", currency: "Kenyan Shilling", language: "Swahili & English", fact: "Home to Wave AI's creator, Wave Platforms Inc." },
    nigeria: { capital: "Abuja", population: "220M", currency: "Naira", language: "English + 500+ local languages", fact: "Most populous country in Africa" },
    usa: { capital: "Washington D.C.", population: "335M", currency: "US Dollar", language: "English", fact: "World's largest economy by nominal GDP" },
    china: { capital: "Beijing", population: "1.4B", currency: "Yuan (Renminbi)", language: "Mandarin", fact: "World's largest population, second largest economy" },
    india: { capital: "New Delhi", population: "1.44B", currency: "Indian Rupee", language: "Hindi + 21 scheduled languages", fact: "World's largest democracy" },
  };
  const key = country.toLowerCase().replace(/\s+/g, "");
  return countries[key] || { fact: `${country} is a fascinating country with rich culture and history.` };
}

export function getClimateZones() {
  return [
    { zone: "Tropical", characteristics: "Hot year-round, heavy rainfall, near equator", examples: ["Congo", "Amazon", "Southeast Asia"] },
    { zone: "Arid/Desert", characteristics: "Very low rainfall (<250mm/year), extreme temperature swings", examples: ["Sahara", "Arabian", "Gobi", "Atacama"] },
    { zone: "Temperate", characteristics: "Moderate temperatures, four distinct seasons", examples: ["Western Europe", "Eastern USA", "Japan"] },
    { zone: "Continental", characteristics: "Cold winters, hot summers, low precipitation", examples: ["Russia", "Canada", "Central Asia"] },
    { zone: "Polar", characteristics: "Extremely cold, minimal precipitation, permafrost", examples: ["Arctic", "Antarctica", "Siberia"] },
    { zone: "Mediterranean", characteristics: "Dry hot summers, mild wet winters", examples: ["Southern Europe", "California", "South Africa"] },
  ];
}
