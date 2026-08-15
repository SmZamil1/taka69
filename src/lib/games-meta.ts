export type GameMeta = {
  code: string;
  href: string;
  en: string;
  bn: string;
  tag: string;
  players: string;
  cover: string;
  gradient: string;
  category: "hot" | "slots" | "crash" | "table" | "live" | "provider" | "predict";
  provider?: string;
  isNew?: boolean;
};

export const GAMES: GameMeta[] = [
  {
    code: "aviator", href: "/games/aviator",
    en: "Aviator", bn: "এভিয়েটর",
    tag: "TOP 🔥", players: "9.1k", cover: "/games/aviator.jpg",
    gradient: "from-rose-600 via-orange-600 to-black", category: "crash", isNew: true,
  },
  // ── Crash Games ────────────────────────────────────────────
  {
    code: "crash", href: "/games/crash",
    en: "Aviator Crash", bn: "এভিয়েটর ক্র্যাশ",
    tag: "HOT 🔥", players: "4.8k", cover: "/games/crash.jpg",
    gradient: "from-rose-600 via-red-700 to-black", category: "crash",
  },
  {
    code: "fortuneplane", href: "/games/fortuneplane",
    en: "Fortune Plane", bn: "ফরচুন প্লেন",
    tag: "NEW ✨", players: "2.9k", cover: "/games/fortuneplane.jpg",
    gradient: "from-cyan-600 to-fuchsia-900", category: "crash", provider: "Spribe",
  },
  {
    code: "crash2", href: "/games/crash2",
    en: "Crash X", bn: "ক্র্যাশ এক্স",
    tag: "FAST ⚡", players: "3.2k", cover: "/games/crash.jpg",
    gradient: "from-violet-600 to-purple-900", category: "crash", isNew: true,
  },
  // ── Color Prediction ────────────────────────────────────────
  {
    code: "wingo1", href: "/wingo",
    en: "WinGo 1Min", bn: "উইনগো ১মিনিট",
    tag: "HOT 🎯", players: "6.2k", cover: "/games/wingo.jpg",
    gradient: "from-amber-500 to-orange-900", category: "predict",
  },
  {
    code: "wingo3", href: "/wingo",
    en: "WinGo 3Min", bn: "উইনগো ৩মিনিট",
    tag: "POPULAR", players: "3.4k", cover: "/games/wingo.jpg",
    gradient: "from-emerald-500 to-teal-900", category: "predict",
  },
  // ── Table Games ────────────────────────────────────────────
  {
    code: "dice", href: "/games/dice",
    en: "Dice", bn: "ডাইস",
    tag: "FAIR", players: "1.1k", cover: "/games/dice.jpg",
    gradient: "from-indigo-600 to-violet-900", category: "table",
  },
  {
    code: "mines", href: "/games/mines",
    en: "Mines", bn: "মাইনস",
    tag: "SKILL", players: "980", cover: "/games/mines.jpg",
    gradient: "from-amber-600 to-orange-900", category: "table",
  },
  {
    code: "wheel", href: "/games/wheel",
    en: "Fortune Wheel", bn: "ফরচুন হুইল",
    tag: "SPIN", players: "760", cover: "/games/wheel.jpg",
    gradient: "from-cyan-600 to-blue-900", category: "hot",
  },
  {
    code: "plinko", href: "/games/plinko",
    en: "Plinko", bn: "প্লিঙ্কো",
    tag: "DROP", players: "640", cover: "/games/plinko.jpg",
    gradient: "from-emerald-600 to-teal-950", category: "hot",
  },
  {
    code: "hilo", href: "/games/hilo",
    en: "Hi-Lo", bn: "হাই-লো",
    tag: "FAST", players: "520", cover: "/games/hilo.jpg",
    gradient: "from-sky-600 to-slate-900", category: "table",
  },
  {
    code: "keno", href: "/games/keno",
    en: "Keno", bn: "কেনো",
    tag: "NEW", players: "430", cover: "/games/keno.jpg",
    gradient: "from-lime-600 to-green-900", category: "table", isNew: true,
  },
  {
    code: "coinflip", href: "/games/coinflip",
    en: "Coin Flip", bn: "কয়েন ফ্লিপ",
    tag: "50/50", players: "890", cover: "/games/coinflip.jpg",
    gradient: "from-yellow-500 to-amber-900", category: "table", isNew: true,
  },
  // ── Slots ───────────────────────────────────────────────────
  {
    code: "slots", href: "/games/slots",
    en: "Neon Slots", bn: "নিয়ন স্লট",
    tag: "LUCK", players: "1.8k", cover: "/games/slots.jpg",
    gradient: "from-fuchsia-600 to-purple-950", category: "slots",
  },
  // ── JILI Provider ──────────────────────────────────────────
  {
    code: "buffalo", href: "/games/buffalo",
    en: "Thunder Buffalo", bn: "থান্ডার বাফেলো",
    tag: "JILI", players: "3.1k", cover: "/games/buffalo.jpg",
    gradient: "from-amber-600 to-green-950", category: "provider", provider: "Jili",
  },
  {
    code: "sevenup", href: "/games/sevenup",
    en: "Seven Rise", bn: "সেভেন রাইজ",
    tag: "JILI", players: "2.4k", cover: "/games/sevenup.jpg",
    gradient: "from-blue-600 to-indigo-950", category: "provider", provider: "Jili",
  },
  {
    code: "crab", href: "/games/crab",
    en: "Treasure Crab", bn: "ট্রেজার ক্র্যাব",
    tag: "JILI", players: "1.7k", cover: "/games/crab.jpg",
    gradient: "from-teal-500 to-cyan-950", category: "provider", provider: "Jili",
  },
  {
    code: "pyramid", href: "/games/pyramid",
    en: "Scarab Gold", bn: "স্কারাব গোল্ড",
    tag: "JILI", players: "2.0k", cover: "/games/pyramid.jpg",
    gradient: "from-amber-500 to-yellow-950", category: "provider", provider: "Jili",
  },
  {
    code: "minecart", href: "/games/minecart",
    en: "Gem Cart", bn: "জেম কার্ট",
    tag: "JILI", players: "1.5k", cover: "/games/minecart.jpg",
    gradient: "from-stone-600 to-amber-950", category: "provider", provider: "Jili",
  },
  // ── PG Soft ────────────────────────────────────────────────
  {
    code: "candy", href: "/games/candy",
    en: "Candy Gems", bn: "ক্যান্ডি জেমস",
    tag: "PG", players: "2.8k", cover: "/games/candy.jpg",
    gradient: "from-fuchsia-500 to-purple-950", category: "provider", provider: "PG Soft",
  },
  {
    code: "tiger", href: "/games/tiger",
    en: "Jungle Tiger", bn: "জঙ্গল টাইগার",
    tag: "PG", players: "2.5k", cover: "/games/tiger.jpg",
    gradient: "from-emerald-600 to-yellow-900", category: "provider", provider: "PG Soft",
  },
  {
    code: "mermaid", href: "/games/mermaid",
    en: "Pearl Mermaid", bn: "পার্ল মারমেইড",
    tag: "PG", players: "1.9k", cover: "/games/mermaid.jpg",
    gradient: "from-sky-500 to-blue-950", category: "provider", provider: "PG Soft",
  },
  {
    code: "mahjong", href: "/games/mahjong",
    en: "Neon Mahjong", bn: "নিয়ন মাহজং",
    tag: "PG", players: "3.4k", cover: "/games/mahjong.jpg",
    gradient: "from-rose-600 to-red-950", category: "provider", provider: "PG Soft",
  },
  {
    code: "wolf", href: "/games/wolf",
    en: "Ice Wolf", bn: "আইস উলফ",
    tag: "PG", players: "1.8k", cover: "/games/wolf.jpg",
    gradient: "from-sky-400 to-slate-950", category: "provider", provider: "PG Soft",
  },
  // ── Fa Chai ────────────────────────────────────────────────
  {
    code: "dragon", href: "/games/dragon",
    en: "Jade Dragon", bn: "জেড ড্রাগন",
    tag: "FC", players: "2.2k", cover: "/games/dragon.jpg",
    gradient: "from-red-600 to-amber-900", category: "provider", provider: "Fa Chai",
  },
  // ── JDB ────────────────────────────────────────────────────
  {
    code: "frog", href: "/games/frog",
    en: "Lucky Frog", bn: "লাকি ফ্রগ",
    tag: "JDB", players: "1.4k", cover: "/games/frog.jpg",
    gradient: "from-lime-500 to-emerald-950", category: "provider", provider: "JDB",
  },
  {
    code: "chili", href: "/games/chili",
    en: "Chili Fire", bn: "চিলি ফায়ার",
    tag: "JDB", players: "1.6k", cover: "/games/chili.jpg",
    gradient: "from-orange-600 to-red-950", category: "provider", provider: "JDB",
  },
  // ── Live Casino ────────────────────────────────────────────
  {
    code: "roulette", href: "/games/roulette",
    en: "Live Roulette", bn: "লাইভ রুলেট",
    tag: "LIVE", players: "1.3k", cover: "/games/roulette.jpg",
    gradient: "from-indigo-600 to-violet-950", category: "live", provider: "Evolution",
  },
  {
    code: "baccarat", href: "/games/baccarat",
    en: "Live Baccarat", bn: "লাইভ বাকারা",
    tag: "LIVE", players: "2.1k", cover: "/games/baccarat.jpg",
    gradient: "from-emerald-700 to-green-950", category: "live", provider: "Evolution", isNew: true,
  },
  // ── Studio Hubs ────────────────────────────────────────────
  {
    code: "jili", href: "/games/jili",
    en: "Jili Hot", bn: "জিলি হট",
    tag: "JILI", players: "2.1k", cover: "/games/buffalo.jpg",
    gradient: "from-red-600 to-rose-950", category: "provider", provider: "Jili",
  },
  {
    code: "pg", href: "/games/pg",
    en: "PG Soft", bn: "পিজি সফট",
    tag: "PG", players: "1.9k", cover: "/games/candy.jpg",
    gradient: "from-amber-500 to-yellow-900", category: "provider", provider: "PG Soft",
  },
  {
    code: "spribe", href: "/games/spribe",
    en: "Spribe", bn: "স্প্রাইব",
    tag: "SPRIBE", players: "2.6k", cover: "/games/fortuneplane.jpg",
    gradient: "from-sky-500 to-blue-950", category: "provider", provider: "Spribe",
  },
  {
    code: "evolution", href: "/games/evolution",
    en: "Evolution", bn: "এভোলিউশন",
    tag: "LIVE", players: "1.4k", cover: "/games/roulette.jpg",
    gradient: "from-violet-600 to-purple-950", category: "live", provider: "Evolution",
  },
  {
    code: "fa_chai", href: "/games/fa_chai",
    en: "Fa Chai", bn: "ফা চাই",
    tag: "FC", players: "870", cover: "/games/dragon.jpg",
    gradient: "from-emerald-500 to-green-950", category: "provider", provider: "Fa Chai",
  },
  {
    code: "jdb", href: "/games/jdb",
    en: "JDB", bn: "জেডিবি",
    tag: "JDB", players: "910", cover: "/games/frog.jpg",
    gradient: "from-orange-500 to-red-950", category: "provider", provider: "JDB",
  },
];

export const PAYMENT_METHODS = [
  { id: "bkash",  name: "bKash",  color: "#E2136E", logo: "/payments/bkash.png",  noteEn: "Send Money → TrxID + screenshot", noteBn: "সেন্ড মানি → TrxID + স্ক্রিনশট" },
  { id: "nagad",  name: "Nagad",  color: "#F15A29", logo: "/payments/nagad.png",  noteEn: "Send Money → TrxID + screenshot", noteBn: "সেন্ড মানি → TrxID + স্ক্রিনশট" },
  { id: "rocket", name: "Rocket", color: "#8B2C8A", logo: "/payments/rocket.png", noteEn: "Send Money → TrxID + screenshot", noteBn: "সেন্ড মানি → TrxID + স্ক্রিনশট" },
  { id: "upay",   name: "Upay",   color: "#F9A825", logo: "/payments/upay.png",   noteEn: "Send Money → TrxID + screenshot", noteBn: "সেন্ড মানি → TrxID + স্ক্রিনশট" },
];
