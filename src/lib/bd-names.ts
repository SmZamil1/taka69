/** Large pool of Bangladeshi-style display names for live boards */
const FIRST = [
  "Rahim", "Karim", "Nila", "Sadia", "Rafi", "Mim", "Tanvir", "Ayesha", "Hasan", "Rima",
  "Imran", "Jui", "Sakib", "Nusrat", "Fahim", "Lamia", "Arif", "Pritom", "Sumaiya", "Nayeem",
  "Mehedi", "Shila", "Rasel", "Farzana", "Shuvo", "Tania", "Jahid", "Mitu", "Bappy", "Rupa",
  "Sajid", "Keya", "Noman", "Popy", "Asif", "Shathi", "Rony", "Mousumi", "Liton", "Nasrin",
  "Shakil", "Anika", "Masud", "Sultana", "Rakib", "Faria", "Sohel", "Orpa", "Mamun", "Jannat",
  "Shamim", "Rumana", "Hridoy", "Sabrina", "Parvez", "Nafisa", "Kamrul", "Afrin", "Babu", "Toma",
  "Rashed", "Maliha", "Sohag", "Shahnaz", "Anwar", "Lubna", "Faisal", "Shima", "Yousuf", "Mimi",
  "Adnan", "Rokeya", "Bishal", "Trisha", "Nayeem", "Sanjida", "Rajib", "Nishat", "Tareq", "Afrida",
  "Zahid", "Mou", "Siam", "Priya", "Ovi", "Nusba", "Emon", "Shimu", "Riyad", "Tamanna",
  "Apon", "Bristy", "Nayeem", "Shorna", "Pavel", "Momena", "Shanto", "Rokeya", "Uzzal", "Fariha",
];

const MASKED = [
  "r***m", "k***m", "n***a", "s***a", "t***r", "a***a", "h***n", "i***n", "s***b", "f***m",
  "m***i", "j***d", "b***y", "l***n", "p***z", "y***f", "z***d", "e***n", "u***l", "o***i",
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Unique-ish random BD names for a round (never same fixed order). */
export function randomBdNames(count: number): string[] {
  const n = Math.max(1, Math.min(count, 200));
  const pool = shuffle([...FIRST, ...MASKED]);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const base = pool[i % pool.length];
    // second pass: append small digit so long boards stay unique
    if (i < pool.length) out.push(base);
    else out.push(`${base}${Math.floor(Math.random() * 90 + 10)}`);
  }
  // final shuffle so first strip isn't alphabetical leftovers
  return shuffle(out);
}

export function randomBdName(): string {
  return randomBdNames(1)[0];
}
