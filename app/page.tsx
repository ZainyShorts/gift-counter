"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MAX_COUNT = 5000;
const PRIZE = 5000;
const HOLD_SECONDS = 10;

function plantGifts(): number[] {
  return [743, 2218, 4087];
}

type Status = "playing" | "won" | "lost";

export default function Home() {
  const [gifts] = useState<number[]>(() => plantGifts());
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [hitGift, setHitGift] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const countRef = useRef(count);
  countRef.current = count;
  const giftsRef = useRef(gifts);
  giftsRef.current = gifts;

  const [confetti] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: ["#facc15", "#f472b6", "#34d399", "#60a5fa", "#a78bfa"][Math.floor(Math.random() * 5)],
      size: Math.random() * 10 + 6,
    }))
  );

  const startTimer = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdStartRef.current = performance.now();
    setHoldProgress(0);
    setTimerActive(true);

    const tick = (now: number) => {
      const elapsed = (now - holdStartRef.current!) / 1000;
      const progress = Math.min(elapsed, HOLD_SECONDS);
      setHoldProgress(progress);

      if (progress >= HOLD_SECONDS) {
        setTimerActive(false);
        // Check if current count is a gift
        const found = giftsRef.current.find((g) => g === countRef.current);
        if (found !== undefined) {
          setHitGift(found);
          setStatus("won");
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleUp = useCallback(() => {
    if (status !== "playing") return;
    setCount((prev) => {
      const next = Math.min(prev + 1, MAX_COUNT);
      if (next >= MAX_COUNT) {
        setStatus("lost");
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setTimerActive(false);
        return next;
      }
      return next;
    });
    setClicks((c) => c + 1);
    startTimer();
  }, [status, startTimer]);

  const handleDown = useCallback(() => {
    if (status !== "playing") return;
    setCount((prev) => Math.max(0, prev - 1));
    setClicks((c) => c + 1);
    startTimer();
  }, [status, startTimer]);

  // cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const reset = () => window.location.reload();

  const fillPct = (count / MAX_COUNT) * 100;
  const barColor = fillPct > 80 ? "#ef4444" : fillPct > 50 ? "#facc15" : "#34d399";
  const holdPct = (holdProgress / HOLD_SECONDS) * 100;
  const secondsLeft = Math.max(0, HOLD_SECONDS - holdProgress).toFixed(1);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-900 flex flex-col items-center justify-center p-6 select-none overflow-hidden relative">

      {/* Confetti */}
      {status === "won" &&
        confetti.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none fixed top-0 animate-bounce"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: "50%",
              animationDelay: `${p.delay}s`,
              animationDuration: `${0.6 + Math.random() * 0.8}s`,
              transform: `translateY(${Math.random() * 100}vh) rotate(${Math.random() * 360}deg)`,
              opacity: 0.9,
            }}
          />
        ))}

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl mb-2">
            🎰 Lucky Counter
          </h1>
          <p className="text-purple-300 text-sm">
            3 hidden gifts · Click &amp; wait 10 s without clicking again to win ${PRIZE.toLocaleString()}
          </p>
        </div>

        {/* Counter card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Big number */}
          <div className="text-center mb-6">
            <div
              className="text-8xl font-black tabular-nums"
              style={{ color: status === "lost" ? "#ef4444" : "white" }}
            >
              {count.toLocaleString()}
            </div>
            <div className="text-purple-400 text-sm mt-1">out of {MAX_COUNT.toLocaleString()}</div>
          </div>

          {/* Fill bar */}
          <div className="w-full bg-white/10 rounded-full h-4 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${fillPct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-400 mb-6">
            <span>0</span>
            <span>{clicks} clicks</span>
            <span>{MAX_COUNT.toLocaleString()}</span>
          </div>

          {/* 10-second timer — always visible after first click */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className={`font-semibold ${timerActive ? "text-yellow-300" : "text-white/30"}`}>
                {timerActive ? "⏱ Hold still to win…" : "⏱ Click to start timer"}
              </span>
              <span className={`font-black tabular-nums ${timerActive ? "text-yellow-300" : "text-white/30"}`}>
                {timerActive ? `${secondsLeft}s` : `${HOLD_SECONDS}.0s`}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${timerActive ? holdPct : 0}%`,
                  background: "linear-gradient(to right, #a855f7, #facc15)",
                }}
              />
            </div>
            <p className="text-white/30 text-xs text-center mt-2">
              Clicking resets the timer — stay still for 10 s to claim the prize
            </p>
          </div>

          {/* Gift dots */}
          <div className="flex justify-center gap-3 mb-8">
            {gifts.map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-white/20" />
                <span className="text-purple-400 text-xs">Gift {i + 1}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDown}
              disabled={status !== "playing" || count <= 0}
              className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed text-white font-black text-3xl py-5 rounded-2xl transition-all active:scale-95 cursor-pointer"
            >
              −
            </button>
            <button
              onClick={handleUp}
              disabled={status !== "playing" || count >= MAX_COUNT}
              className="flex-[2] bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-black text-3xl py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/30 cursor-pointer"
            >
              + Click
            </button>
          </div>
        </div>

        {/* Rules */}
        <p className="text-center text-purple-400/60 text-xs mt-6 leading-relaxed">
          Click + or − to move the counter. Each click resets the 10-second timer.
          Stop clicking and wait the full 10 seconds — if you&apos;re on a hidden gift, you win $5,000.
        </p>
      </div>

      {/* Win overlay */}
      {status === "won" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-3xl p-1 shadow-2xl shadow-yellow-400/40 max-w-sm w-full">
            <div className="bg-white rounded-[22px] p-8 text-center">
              <div className="text-6xl mb-3">🎁</div>
              <h2 className="text-3xl font-black text-gray-900 mb-1">You Won!</h2>
              <p className="text-gray-500 text-sm mb-4">
                You found the gift at <span className="font-bold text-purple-600">{hitGift?.toLocaleString()}</span> and waited 10 seconds!
              </p>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl py-6 px-4 mb-6">
                <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Your Prize</p>
                <p className="text-6xl font-black text-yellow-500">${PRIZE.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-1">Congratulations! 🎉</p>
              </div>
              <div className="flex justify-center gap-6 text-sm text-gray-400 mb-6">
                <div><span className="block font-bold text-gray-700 text-lg">{clicks}</span>clicks</div>
                <div><span className="block font-bold text-gray-700 text-lg">{hitGift?.toLocaleString()}</span>gift at</div>
                <div><span className="block font-bold text-gray-700 text-lg">10s</span>held</div>
              </div>
              <button onClick={reset} className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3 rounded-full text-lg transition-all active:scale-95 cursor-pointer">
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lose overlay */}
      {status === "lost" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
            <div className="text-6xl mb-3">💔</div>
            <h2 className="text-3xl font-black text-red-500 mb-2">Game Over!</h2>
            <p className="text-gray-500 mb-4">You reached 5,000 without holding a gift for 10 seconds.</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-400">
              <p>The gifts were hidden at:</p>
              <p className="font-bold text-gray-600 text-lg mt-1">{gifts.map((g) => g.toLocaleString()).join(" · ")}</p>
            </div>
            <button onClick={reset} className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-full text-lg transition-all active:scale-95 cursor-pointer">
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
