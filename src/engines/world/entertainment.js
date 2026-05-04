/**
 * Wave AI — Entertainment Engine
 * Movies, music, games, sports, TV, streaming, books, celebrities,
 * pop culture, trends, and global entertainment knowledge.
 */

export const ENTERTAINMENT = {
  movies: {
    allTimeGreats: [
      { title: "The Shawshank Redemption", year: 1994, director: "Frank Darabont", imdb: 9.3, genre: "Drama" },
      { title: "The Godfather", year: 1972, director: "Francis Ford Coppola", imdb: 9.2, genre: "Crime/Drama" },
      { title: "Schindler's List", year: 1993, director: "Steven Spielberg", imdb: 9.0, genre: "Historical Drama" },
      { title: "The Dark Knight", year: 2008, director: "Christopher Nolan", imdb: 9.0, genre: "Action/Superhero" },
      { title: "Inception", year: 2010, director: "Christopher Nolan", imdb: 8.8, genre: "Sci-Fi/Thriller" },
      { title: "Parasite", year: 2019, director: "Bong Joon-ho", imdb: 8.5, genre: "Thriller/Drama", note: "First non-English film to win Best Picture" },
      { title: "Black Panther", year: 2018, director: "Ryan Coogler", imdb: 7.3, genre: "Superhero/Drama", note: "Cultural landmark for African representation" },
      { title: "Coming to America", year: 1988, director: "John Landis", imdb: 7.0, genre: "Comedy", note: "Iconic Africa-themed comedy" },
    ],
    africanCinema: ["Nollywood (Nigeria) — world's 2nd largest film industry by volume", "Hollywood of Africa produces 2,500+ films/year", "Notable: The Wedding Party, King of Boys, Lionheart"],
    genres: ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation", "Documentary", "Musical", "Western", "Fantasy"],
    streamingPlatforms: ["Netflix", "Disney+", "Prime Video", "Hulu", "HBO Max", "Peacock", "Apple TV+", "Showmax (Africa)", "StarTimes"],
  },

  music: {
    genres: {
      global: ["Pop", "Rock", "Hip-Hop/Rap", "R&B/Soul", "Electronic/EDM", "Classical", "Jazz", "Country", "Reggae", "Latin"],
      african: ["Afrobeats", "Highlife", "Bongo Flava", "Kwaito", "Benga", "Mbalax", "Gqom", "Soukous", "Jùjú", "Amapiano"],
    },
    icons: {
      global: ["Michael Jackson", "Madonna", "The Beatles", "Elvis Presley", "Bob Dylan", "Prince", "Whitney Houston", "David Bowie"],
      african: ["Fela Kuti", "Miriam Makeba", "Ali Farka Touré", "Salif Keita", "Youssou N'Dour", "Hugh Masekela"],
      modern: ["Drake", "Beyoncé", "Taylor Swift", "The Weeknd", "Burna Boy", "Wizkid", "Davido", "Sauti Sol"],
    },
    theory: {
      notes: ["C", "D", "E", "F", "G", "A", "B"],
      scales: ["Major", "Minor", "Pentatonic", "Blues", "Chromatic", "Dorian", "Mixolydian"],
      tempos: { slow: "60-80 BPM", moderate: "80-120 BPM", fast: "120-180 BPM", veryFast: "180+ BPM" },
    },
  },

  videoGames: {
    allTimeBest: [
      "The Legend of Zelda: Breath of the Wild", "Red Dead Redemption 2", "The Last of Us",
      "Grand Theft Auto V", "Minecraft", "FIFA series", "Call of Duty series",
      "Elden Ring", "God of War", "Cyberpunk 2077",
    ],
    genres: ["Action-Adventure", "RPG", "FPS", "Strategy", "Sports", "Simulation", "Platformer", "Horror", "Battle Royale", "MMORPG"],
    platforms: ["PlayStation 5", "Xbox Series X", "Nintendo Switch", "PC/Steam", "Mobile (iOS/Android)"],
    esports: {
      topGames: ["League of Legends", "Dota 2", "CS:GO", "Fortnite", "Valorant", "Rocket League", "Overwatch"],
      prizePool: "Dota 2 International 2021 — $40M prize pool",
    },
  },

  sports: {
    global: {
      football: { fans: "4 billion globally", worldCup: "Most watched sporting event", africaStars: ["Didier Drogba", "Samuel Eto'o", "Sadio Mané", "Mohamed Salah", "Victor Osimhen"] },
      basketball: { fans: "2.2 billion", NBA: "World's premier basketball league", stars: ["LeBron James", "Stephen Curry", "Giannis Antetokounmpo"] },
      cricket: { fans: "2.5 billion", hotspots: ["India", "England", "Australia", "West Indies", "Pakistan"] },
      athletics: { events: ["100m", "Marathon", "High Jump", "Shot Put", "Javelin", "Decathlon"], africaExcels: "East African distance runners dominate (Kenya, Ethiopia)" },
      tennis: { grandSlams: ["Australian Open", "French Open", "Wimbledon", "US Open"], legends: ["Federer", "Nadal", "Djokovic", "Serena Williams"] },
    },
  },

  television: {
    greats: ["Breaking Bad", "Game of Thrones", "Friends", "The Wire", "Chernobyl", "Stranger Things", "The Office", "Black Mirror", "Money Heist"],
    genres: ["Drama", "Comedy", "Reality TV", "Documentary", "Anime", "Soap Opera", "Talk Show", "True Crime"],
    streamingEra: "Netflix revolutionized TV in 2013 with House of Cards — first streaming Original. Now 500+ streaming services globally.",
  },

  books: {
    allTimeBest: [
      "Don Quixote (1605) — Cervantes", "1984 (1949) — Orwell", "Pride and Prejudice (1813) — Austen",
      "To Kill a Mockingbird (1960) — Lee", "The Great Gatsby (1925) — Fitzgerald",
      "Harry Potter Series — Rowling", "The Alchemist — Paulo Coelho", "Things Fall Apart — Chinua Achebe",
    ],
    africanLit: ["Things Fall Apart (Chinua Achebe)", "Purple Hibiscus (Chimamanda Adichie)", "Weep Not Child (Ngũgĩ wa Thiong'o)", "Half of a Yellow Sun (Chimamanda Adichie)"],
    genres: ["Literary Fiction", "Genre Fiction", "Science Fiction", "Fantasy", "Mystery/Thriller", "Romance", "Non-Fiction", "Biography", "Self-Help", "History"],
  },
};

export function recommendMovie(mood) {
  const recommendations = {
    happy: [
      { title: "The Grand Budapest Hotel", why: "Whimsical, colorful comedy" },
      { title: "Paddington 2", why: "Pure wholesome joy" },
      { title: "About Time", why: "Heartwarming romantic drama" },
    ],
    sad: [
      { title: "Good Will Hunting", why: "Powerful emotional journey" },
      { title: "Inside Out", why: "About processing emotions" },
      { title: "The Pursuit of Happyness", why: "Inspiring story of perseverance" },
    ],
    excited: [
      { title: "Mad Max: Fury Road", why: "Non-stop adrenaline" },
      { title: "Top Gun: Maverick", why: "High-octane action" },
      { title: "The Dark Knight", why: "Intense thriller masterpiece" },
    ],
    romantic: [
      { title: "La La Land", why: "Beautiful love story" },
      { title: "Crazy Rich Asians", why: "Glamorous modern romance" },
      { title: "Eternal Sunshine of the Spotless Mind", why: "Deep exploration of love and memory" },
    ],
    scared: [
      { title: "Get Out", why: "Intelligent psychological horror" },
      { title: "Hereditary", why: "Deeply unsettling family drama-horror" },
      { title: "A Quiet Place", why: "Unique tension-building horror" },
    ],
  };
  const key = Object.keys(recommendations).find(k => mood.toLowerCase().includes(k));
  return key ? recommendations[key] : recommendations.happy;
}

export function getRandomEntertainmentFact() {
  const facts = [
    "The word 'Nollywood' was coined by The New York Times in 2002.",
    "Minecraft has sold over 238 million copies, making it the best-selling game ever.",
    "The Beatles have more #1 albums in the UK than any other artist — 15.",
    "The first Oscar ceremony in 1929 lasted 15 minutes.",
    "Afrobeats was declared a global music genre by Spotify in 2022.",
    "The FIFA World Cup final is watched by ~1.5 billion people.",
    "J.K. Rowling was rejected by 12 publishers before Harry Potter was accepted.",
    "Video games are a $220B global industry, bigger than movies and music combined.",
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}
