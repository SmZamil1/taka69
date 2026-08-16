"use client";

import { Gift, LockKeyhole, Sparkles, Timer, Trophy } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { AccountCard, AccountHeader, AccountHero, EmptyState, FloatingAccountActions } from "@/components/account";

const promos = [
  { title: "নতুন খেলোয়াড় বোনাস", description: "নতুন সদস্যদের জন্য স্বাগত প্রোমো", reward: "৳ 500", status: "শীঘ্রই" },
  { title: "উইকলি রিওয়ার্ড", description: "এই সপ্তাহের যোগ্যতা অর্জন করলে পুরস্কার", reward: "৳ 1,000", status: "পর্যালোচনাধীন" },
];

export default function ClaimCenterPage() {
  const user = useAuthStore((s) => s.user);
  return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-28 text-[#173251]">
    <AccountHeader title="ক্লেইম সেন্টার" subtitle="আপনার প্রোমো ও পুরস্কার" />
    <div className="mx-auto max-w-lg space-y-4 pt-4">
      <AccountHero username={user?.username} avatar={user?.avatar} balance={user?.balance?.toLocaleString("en-BD") || "0"} badge="সদস্য" eyebrow="পুরস্কার কেন্দ্র" description="যোগ্য প্রোমো এখানে দেখানো হবে">
        <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-[11px] font-bold text-blue-50"><Timer className="h-4 w-4" /> পরবর্তী আপডেট: শীঘ্রই</div>
      </AccountHero>
      <AccountCard title="ক্লেইমযোগ্য প্রোমো" subtitle="আপনার জন্য উপলব্ধ অফার" icon={<Gift className="h-4 w-4" />}>
        <div className="space-y-3">
          {promos.map((promo) => <article key={promo.title} className="relative overflow-hidden rounded-xl border border-[#e1ebf4] bg-gradient-to-r from-[#f8fbff] to-[#edf6ff] p-3">
            <div className="absolute -right-5 -top-6 h-20 w-20 rounded-full bg-blue-200/30 blur-xl" />
            <div className="relative flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9ecfc] text-[#2576bd]"><Sparkles className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><h3 className="text-sm font-black">{promo.title}</h3><p className="mt-1 text-[10px] leading-4 text-[#7892a9]">{promo.description}</p><div className="mt-2 flex items-center gap-2 text-[10px] font-black text-[#e18a1b]"><Trophy className="h-3.5 w-3.5" /> {promo.reward}</div></div>
              <button type="button" disabled className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-2 text-[10px] font-black text-slate-500"><LockKeyhole className="h-3 w-3" /> {promo.status}</button>
            </div>
            <div className="relative mt-3 flex items-center justify-between border-t border-[#dce8f2] pt-2 text-[10px] text-[#8aa0b4]"><span>কাউন্টডাউন: --:--:--</span><span>API অপেক্ষমাণ</span></div>
          </article>)}
        </div>
      </AccountCard>
      <AccountCard title="পুরস্কার ইতিহাস" icon={<Trophy className="h-4 w-4" />}><EmptyState title="কোনো পুরস্কার ইতিহাস নেই" description="ক্লেইম সম্পন্ন হলে আপনার পুরস্কার এখানে দেখা যাবে।" /></AccountCard>
      <div className="rounded-xl border border-[#dce8f2] bg-[#e6f1fb] px-3 py-2.5 text-[11px] leading-5 text-[#61809d]">এই অ্যাপে বর্তমানে প্রোমো ক্লেইম API সংযুক্ত নেই। তাই ক্লেইম বোতামগুলো নিরাপদে নিষ্ক্রিয় রাখা হয়েছে।</div>
    </div>
    <FloatingAccountActions />
  </div>;
}
