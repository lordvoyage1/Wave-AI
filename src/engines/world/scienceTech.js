/**
 * Wave AI — Science & Technology Engine
 * Physics, chemistry, biology, space science, AI/ML,
 * technology trends, innovations, and scientific literacy.
 */

export const SCIENCE_KNOWLEDGE = {
  physics: {
    fundamentalForces: [
      { name: "Gravity", range: "Infinite", strength: "Weakest", carrier: "Graviton (theoretical)", effect: "Attraction between masses" },
      { name: "Electromagnetism", range: "Infinite", strength: "Strong", carrier: "Photon", effect: "Light, electricity, magnetism, chemistry" },
      { name: "Weak nuclear", range: "10⁻¹⁸ m", strength: "Weak", carrier: "W/Z bosons", effect: "Radioactive decay, nuclear reactions" },
      { name: "Strong nuclear", range: "10⁻¹⁵ m", strength: "Strongest", carrier: "Gluon", effect: "Holds atomic nucleus together" },
    ],
    constants: {
      speedOfLight: "299,792,458 m/s (c)",
      planckConstant: "6.626 × 10⁻³⁴ J·s (h)",
      gravitationalConstant: "6.674 × 10⁻¹¹ N·m²/kg² (G)",
      boltzmann: "1.381 × 10⁻²³ J/K (kB)",
      avogadro: "6.022 × 10²³ mol⁻¹ (NA)",
    },
    theories: {
      generalRelativity: "Einstein 1915: Gravity is curvature of spacetime caused by mass/energy",
      quantumMechanics: "Behavior of matter at atomic/subatomic scales — probability, wave-particle duality",
      stringTheory: "Proposed fundamental particles are vibrating strings in 10-11 dimensions",
      bigBang: "Universe began ~13.8 billion years ago from an infinitely hot, dense singularity",
    },
    discoveries2020s: [
      "James Webb Space Telescope — first light images 2022, deepest view of universe",
      "Gravitational wave detection from black hole mergers (LIGO/Virgo)",
      "Higgs boson confirmed 2012, properties measured to high precision",
      "First image of a black hole (M87*, 2019), then Milky Way's Sagittarius A* (2022)",
    ],
  },

  chemistry: {
    periodicTable: {
      elements: 118,
      periods: 7,
      groups: 18,
      families: ["Alkali metals", "Alkaline earth metals", "Transition metals", "Halogens", "Noble gases", "Lanthanides", "Actinides"],
      mostAbundant: { universe: "Hydrogen (75%)", earth: "Oxygen (46% of crust)", human_body: "Oxygen (65%), Carbon (18%), Hydrogen (10%)" },
    },
    reactions: {
      types: ["Synthesis", "Decomposition", "Single displacement", "Double displacement", "Combustion", "Acid-base", "Oxidation-reduction (Redox)"],
      rates: ["Temperature (Arrhenius equation)", "Concentration", "Catalyst presence", "Surface area", "Pressure (gases)"],
    },
    applications: {
      medicine: "Drug design, vaccines, diagnostics, materials for implants",
      energy: "Batteries (Li-ion), fuel cells, solar cells (silicon), hydrogen production",
      materials: "Plastics, composites, superconductors, nanomaterials, graphene",
      agriculture: "Fertilizers, pesticides, soil chemistry, crop protection",
    },
  },

  biology: {
    cellBiology: {
      types: { prokaryotic: "No nucleus (bacteria, archaea)", eukaryotic: "Has nucleus (animals, plants, fungi, protists)" },
      organelles: ["Nucleus (DNA storage)", "Mitochondria (energy/ATP)", "Ribosome (protein synthesis)", "Endoplasmic reticulum", "Golgi apparatus", "Lysosome", "Chloroplast (photosynthesis)"],
      processes: ["Cell division (Mitosis/Meiosis)", "Protein synthesis", "Cellular respiration", "Photosynthesis", "Apoptosis"],
    },
    genetics: {
      DNA: "Double helix, 4 bases (A, T, G, C), base pairs encode proteins",
      genome: { human: "3 billion base pairs, ~20,000 protein-coding genes", smallest: "Parasites: ~160 genes", largest: "Paris japonica plant: 150 billion base pairs" },
      evolution: "Natural selection (Darwin), random mutation, genetic drift, gene flow",
      crispr: "CRISPR-Cas9: molecular scissors for precise gene editing — Nobel Prize 2020",
    },
    ecology: {
      biodiversity: "8.7 million estimated species, only 1.2 million catalogued",
      foodWebs: "Primary producers → herbivores → carnivores → decomposers",
      keystone: "Species with disproportionate ecosystem impact (wolves, sea otters, elephants)",
      threats: ["Habitat destruction", "Climate change", "Invasive species", "Pollution", "Overexploitation"],
    },
  },
};

export const TECHNOLOGY_TRENDS = {
  AI_ML: {
    milestones: [
      { year: 2012, event: "AlexNet wins ImageNet, deep learning revolution begins" },
      { year: 2017, event: "Transformer architecture introduced (Attention Is All You Need)" },
      { year: 2018, event: "BERT by Google — bidirectional language understanding" },
      { year: 2020, event: "GPT-3 by OpenAI — 175B parameters, in-context learning" },
      { year: 2022, event: "ChatGPT launches, AI goes mainstream, 100M users in 60 days" },
      { year: 2023, event: "GPT-4, Claude, Gemini, Llama 2 — AI race accelerates" },
      { year: 2024, event: "Multimodal AI, agents, open-source parity with closed models" },
    ],
    openSource: {
      models: ["Mistral 7B", "Llama 3", "Phi-3", "Gemma", "Falcon", "Codestral 22B"],
      platforms: ["HuggingFace", "Ollama", "LM Studio", "Jan.ai"],
      note: "Wave AI uses open-source models — Mistral 7B and Codestral 22B via HuggingFace",
    },
    applications: ["Natural language processing", "Computer vision", "Robotics", "Drug discovery", "Climate modeling", "Code generation", "Creative arts"],
    risks: ["Bias and fairness", "Misinformation", "Job displacement", "Privacy", "Autonomous weapons", "AGI alignment"],
  },
  
  emerging: {
    quantum: "Quantum computers use qubits for exponential speedup — 2025: ~1000 qubit machines",
    biotech: "mRNA vaccines (COVID), CRISPR gene therapy, synthetic biology, longevity research",
    space: "SpaceX Starship, Artemis Moon return, Mars missions 2030s, satellite internet (Starlink)",
    energy: "Solid-state batteries, nuclear fusion (NIF breakthrough 2022), perovskite solar",
    robotics: "Boston Dynamics Atlas, Figure 01, Tesla Optimus — humanoid robots advancing",
    blockchain: "Web3, DeFi, NFTs (mixed success), CBDC (Central Bank Digital Currencies)",
    ar_vr: "Apple Vision Pro, Meta Quest, spatial computing, digital twins",
  },

  africanTech: {
    hubs: ["Nairobi (Silicon Savannah)", "Lagos (Yabacon Valley)", "Cape Town", "Kigali", "Accra", "Cairo"],
    unicorns: ["Flutterwave (Nigeria, $3B)", "Jumia (Pan-African)", "Chipper Cash", "Wave (Senegal)", "Interswitch"],
    innovations: ["M-Pesa mobile money", "M-Kopa solar pay-as-you-go", "BRCK education device", "Andela developer training", "Zipline drone delivery", "Wave AI — East Africa's first advanced AI"],
    investment: "$5.2B raised by African startups in 2022",
  },
};

export function explainScientificConcept(concept) {
  const explanations = {
    "black hole": "A region of spacetime where gravity is so extreme that nothing — not even light — can escape. Formed when massive stars collapse. The event horizon is the point of no return.",
    "quantum entanglement": "When two particles become correlated so that measuring one instantly affects the other, regardless of distance. Einstein called it 'spooky action at a distance.'",
    "crispr": "Molecular scissors that can cut DNA at precise locations. Copied from bacteria immune systems. Can potentially cure genetic diseases, create disease-resistant crops, and modify organisms.",
    "dark matter": "Invisible matter that constitutes ~27% of the universe. Detected only through gravitational effects. We know it exists but don't know what it is.",
    "mitosis": "Cell division producing two identical daughter cells. Used for growth and repair. 4 phases: Prophase → Metaphase → Anaphase → Telophase.",
    "photosynthesis": "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants convert sunlight, CO₂, and water into glucose and oxygen.",
    "entropy": "Measure of disorder in a system. The Second Law of Thermodynamics: entropy always increases in a closed system. Why things tend to disorder, not order.",
  };
  const key = Object.keys(explanations).find(k => concept.toLowerCase().includes(k));
  return key ? explanations[key] : `${concept} is a fascinating scientific concept. It relates to how our universe fundamentally works.`;
}

export function getLatestSpaceNews() {
  return [
    "James Webb Telescope discovers oldest galaxy JADES-GS-z13-0 — 320M years after Big Bang",
    "India's Chandrayaan-3 becomes first mission to land near Moon's south pole (2023)",
    "SpaceX Starship completed first fully successful integrated flight test (2024)",
    "NASA's Artemis program plans to return humans to the Moon by 2026",
    "Parker Solar Probe achieves closest approach to the Sun — 6.1 million km (2024)",
    "Discovery of potential signs of biological activity on Venus (phosphine detected)",
  ];
}
