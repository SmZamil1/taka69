"use client";

/** Immersive game shell — main layout hides nav/top bars */
export default function Page() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <iframe
        title="Extreme Plinko"
        src="/assets/games/extreme_plinko/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
