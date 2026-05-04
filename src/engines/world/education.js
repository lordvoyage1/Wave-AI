/**
 * Wave AI — Education Engine
 * Comprehensive knowledge about education systems, learning science,
 * teaching methods, academic subjects, and skill development.
 */

export const EDUCATION_SYSTEMS = {
  global: {
    topRanked: [
      { country: "Finland", rank: 1, approach: "Student-centered, minimal standardized testing, heavy teacher autonomy, outdoor learning" },
      { country: "Singapore", rank: 2, approach: "Rigorous, meritocratic, strong STEM emphasis, bilingual policy" },
      { country: "Japan", rank: 3, approach: "Discipline, group harmony, moral education, after-school juku" },
      { country: "South Korea", rank: 4, approach: "Highly competitive, Hagwons (private tutoring), high achievement culture" },
      { country: "Estonia", rank: 5, approach: "Digital-first education, coding from age 7, project-based learning" },
      { country: "Canada", rank: 6, approach: "Inclusive, multicultural, province-controlled, student wellbeing focus" },
    ],
    levels: ["Early childhood (0-5)", "Primary/Elementary (6-11)", "Middle school (12-14)", "High school (15-18)", "Tertiary/University (18+)", "Postgraduate", "Lifelong learning"],
    africanContext: {
      challenges: ["Infrastructure gaps", "Teacher shortages", "Language barriers", "Gender disparities", "Economic barriers"],
      innovations: ["M-Pesa-enabled school fees", "Mobile learning platforms", "Radio education", "Community schools", "AfriLearn", "eLimu"],
      eastAfrica: "Kenya, Tanzania, Uganda, Rwanda — ECOWAS education integration, growing EdTech sector",
    },
  },
};

export const LEARNING_SCIENCE = {
  howMemoryWorks: {
    stages: ["Encoding (converting experience to memory)", "Storage (maintaining information)", "Retrieval (accessing stored information)"],
    types: {
      sensory: "Brief impression from senses — 0.5 to 3 seconds",
      shortTerm: "Active working memory — 7±2 items for ~30 seconds",
      longTerm: {
        explicit: { episodic: "Personal experiences", semantic: "Facts and general knowledge" },
        implicit: { procedural: "How to do things (bike riding)", priming: "Unconscious influence" },
      },
    },
    forgettingCurve: "Ebbinghaus: without review, we forget ~70% within 24 hours. Spaced repetition combats this.",
  },

  learningStyles: {
    VARK: {
      Visual: "Learns best through charts, maps, diagrams, color-coding",
      Auditory: "Learns best through listening, discussions, lectures, music",
      ReadWrite: "Learns best through reading and writing, lists, notes",
      Kinesthetic: "Learns best through hands-on experience, practice, experiments",
    },
    note: "Modern research suggests most people learn from a mix of all styles",
  },

  effectiveTechniques: [
    { technique: "Spaced Repetition", description: "Reviewing material at increasing intervals", effectiveness: "★★★★★" },
    { technique: "Active Recall", description: "Testing yourself instead of re-reading", effectiveness: "★★★★★" },
    { technique: "The Feynman Technique", description: "Explain concept simply as if teaching a child", effectiveness: "★★★★★" },
    { technique: "Interleaving", description: "Mixing different subjects/types of problems", effectiveness: "★★★★" },
    { technique: "Elaborative Interrogation", description: "Asking 'why' and 'how' to deepen understanding", effectiveness: "★★★★" },
    { technique: "Pomodoro Technique", description: "25min focus + 5min break cycles", effectiveness: "★★★★" },
    { technique: "Mind Mapping", description: "Visual organization of ideas and connections", effectiveness: "★★★" },
    { technique: "Sleep & Exercise", description: "Memory consolidation happens during sleep; exercise improves cognition", effectiveness: "★★★★★" },
  ],

  intelligences: {
    gardner: [
      "Linguistic (Word smart)", "Logical-Mathematical (Number smart)", "Spatial (Picture smart)",
      "Bodily-Kinesthetic (Body smart)", "Musical (Music smart)", "Interpersonal (People smart)",
      "Intrapersonal (Self smart)", "Naturalist (Nature smart)", "Existential (Philosophy smart)",
    ],
    note: "Every person has a unique combination of these intelligences",
  },
};

export const ACADEMIC_SUBJECTS = {
  STEM: {
    mathematics: ["Algebra", "Geometry", "Calculus", "Statistics", "Number Theory", "Linear Algebra", "Topology", "Discrete Math"],
    science: {
      physics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Quantum Mechanics", "Relativity", "Particle Physics"],
      chemistry: ["Organic", "Inorganic", "Physical", "Analytical", "Biochemistry", "Nuclear Chemistry"],
      biology: ["Genetics", "Ecology", "Evolution", "Cell Biology", "Neuroscience", "Microbiology", "Anatomy"],
    },
    technology: ["Computer Science", "Artificial Intelligence", "Cybersecurity", "Data Science", "Web Development", "Robotics"],
    engineering: ["Civil", "Mechanical", "Electrical", "Chemical", "Software", "Aerospace", "Biomedical"],
  },
  humanities: {
    languages: ["Literature", "Linguistics", "Creative Writing", "Rhetoric", "Translation"],
    history: ["Ancient History", "Medieval", "Modern", "African History", "Asian History", "World Wars"],
    philosophy: ["Ethics", "Logic", "Metaphysics", "Epistemology", "Political Philosophy", "Philosophy of Mind"],
    arts: ["Fine Arts", "Music Theory", "Theater", "Film Studies", "Architecture", "Design"],
  },
  social: ["Sociology", "Psychology", "Anthropology", "Economics", "Political Science", "Geography", "Law"],
};

export const CAREER_PATHS = {
  emerging: [
    { field: "AI/ML Engineering", demand: "Extremely High", salary: "$120k-$300k+ (USA)", skills: ["Python", "TensorFlow", "Mathematics", "Data Science"] },
    { field: "Cybersecurity", demand: "Very High", salary: "$90k-$200k+ (USA)", skills: ["Networking", "Cryptography", "Ethical Hacking", "Risk Analysis"] },
    { field: "Data Science", demand: "Very High", salary: "$95k-$175k+ (USA)", skills: ["Statistics", "Python/R", "SQL", "Visualization", "Machine Learning"] },
    { field: "Blockchain Development", demand: "High", salary: "$100k-$180k+ (USA)", skills: ["Solidity", "Cryptography", "Smart Contracts"] },
    { field: "Renewable Energy", demand: "Very High", salary: "$70k-$150k+ (USA)", skills: ["Engineering", "Materials Science", "Grid Management"] },
    { field: "Biotech/Genomics", demand: "High", salary: "$80k-$160k+ (USA)", skills: ["Biology", "Bioinformatics", "CRISPR", "Clinical Research"] },
  ],
};

export function explainConcept(concept, level = "intermediate") {
  const levels = {
    beginner: "Simply and with analogies, as if explaining to a 10-year-old",
    intermediate: "With some technical detail, assuming basic knowledge",
    advanced: "With full technical rigor and mathematical precision",
    expert: "Assuming domain expertise, including edge cases and nuances",
  };
  return `Explaining "${concept}" at ${level} level: ${levels[level] || levels.intermediate}`;
}

export function generateStudyPlan(subject, hoursPerDay, weeks) {
  const totalHours = hoursPerDay * 7 * weeks;
  return {
    subject,
    totalHours,
    schedule: {
      week1: `Foundation concepts — ${Math.floor(totalHours * 0.25)} hours`,
      week2: `Core principles — ${Math.floor(totalHours * 0.30)} hours`,
      week3: `Applied practice — ${Math.floor(totalHours * 0.30)} hours`,
      week4: `Review, testing, consolidation — ${Math.floor(totalHours * 0.15)} hours`,
    },
    dailyBreakdown: `${hoursPerDay}h/day: 25min study → 5min break (Pomodoro)`,
    resources: ["YouTube tutorials", "Khan Academy", "Coursera/edX", "Textbooks", "Practice problems", "Study groups"],
  };
}
