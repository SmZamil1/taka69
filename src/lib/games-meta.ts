export type GameMeta = {
  code: string;
  href: string;
  en: string;
  bn: string;
  tag: string;
  players: string;
  cover: string;
  gradient: string;
  category: "hot" | "slots" | "crash" | "table";
};

export const GAMES: GameMeta[] = [
  {
    code: "crash",
    href: "/games/crash",
    en: "Crash",
    bn: "ক্র্যাশ",
    tag: "HOT",
    players: "2.4k",
    cover: "/games/crash.jpg",
    gradient: "from-rose-600 via-red-700 to-black",
    category: "crash",
  },
  {
    code: "dice",
    href: "/games/dice",
    en: "Dice",
    bn: "ডাইস",
    tag: "FAIR",
    players: "1.1k",
    cover: "/games/dice.jpg",
    gradient: "from-indigo-600 to-violet-900",
    category: "table",
  },
  {
    code: "mines",
    href: "/games/mines",
    en: "Mines",
    bn: "মাইনস",
    tag: "SKILL",
    players: "980",
    cover: "/games/mines.jpg",
    gradient: "from-amber-600 to-orange-900",
    category: "table",
  },
  {
    code: "wheel",
    href: "/games/wheel",
    en: "Fortune Wheel",
    bn: "ফর্চুন হুইল",
    tag: "SPIN",
    players: "760",
    cover: "/games/wheel.jpg",
    gradient: "from-cyan-600 to-blue-900",
    category: "hot",
  },
  {
    code: "slots",
    href: "/games/slots",
    en: "Neon Slots",
    bn: "নিয়ন স্লট",
    tag: "LUCK",
    players: "1.8k",
    cover: "/games/slots.jpg",
    gradient: "from-fuchsia-600 to-purple-950",
    category: "slots",
  },
  {
    code: "plinko",
    href: "/games/plinko",
    en: "Plinko",
    bn: "প্লিঙ্কো",
    tag: "NEW",
    players: "640",
    cover: "/games/plinko.svg",
    gradient: "from-emerald-600 to-teal-950",
    category: "hot",
  },
  {
    code: "hilo",
    href: "/games/hilo",
    en: "Hi-Lo",
    bn: "হাই-লো",
    tag: "FAST",
    players: "520",
    cover: "/games/hilo.svg",
    gradient: "from-sky-600 to-slate-900",
    category: "table",
  },
];

export const PAYMENT_METHODS = [
  {
    id: "bkash",
    name: "bKash",
    color: "#E2136E",
    logo: "bK",
    noteEn: "Virtual TC request — admin credits play-money only",
    noteBn: "ভার্চুয়াল TC রিকোয়েস্ট — অ্যাডমিন শুধু প্লে-মানি দেয়",
  },
  {
    id: "nagad",
    name: "Nagad",
    color: "#F15A29",
    logo: "Ng",
    noteEn: "Virtual TC request — admin credits play-money only",
    noteBn: "ভার্চুয়াল TC রিকোয়েস্ট — অ্যাডমিন শুধু প্লে-মানি দেয়",
  },
  {
    id: "rocket",
    name: "Rocket",
    color: "#8B2C8A",
    logo: "Rk",
    noteEn: "Virtual TC request — admin credits play-money only",
    noteBn: "ভার্চুয়াল TC রিকোয়েস্ট — অ্যাডমিন শুধু প্লে-মানি দেয়",
  },
  {
    id: "upay",
    name: "Upay",
    color: "#F9A825",
    logo: "Up",
    noteEn: "Virtual TC request — admin credits play-money only",
    noteBn: "ভার্চুয়াল TC রিকোয়েস্ট — অ্যাডমিন শুধু প্লে-মানি দেয়",
  },
];
