"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

type VerifyStatus = "loading" | "verified" | "pending";

export function HumanVerificationGate() {
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [turnstile, setTurnstile] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/security/human-verify?mode=status", { cache: "no-store" });
    if (!response.ok) {
      setStatus("verified");
      return;
    }
    const data = (await response.json()) as {
      verified: boolean;
      turnstile: boolean;
      siteKey: string | null;
    };
    if (data.verified) {
      setStatus("verified");
      return;
    }
    setTurnstile(data.turnstile);
    setSiteKey(data.siteKey);
    setStatus("pending");
  }, []);

  const loadChallenge = useCallback(async () => {
    const response = await fetch("/api/security/human-verify", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      challenge: string;
      turnstile: boolean;
      siteKey: string | null;
    };
    setChallenge(data.challenge);
    setTurnstile(data.turnstile);
    setSiteKey(data.siteKey);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status === "pending" && !turnstile) {
      void loadChallenge();
    }
  }, [status, turnstile, loadChallenge]);

  const completeVerification = useCallback(
    async (payload: { holdDurationMs?: number; turnstileToken?: string }) => {
      setError(null);
      const response = await fetch("/api/security/human-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          holdDurationMs: payload.holdDurationMs ?? 0,
          turnstileToken: payload.turnstileToken,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Verification failed. Please try again.");
        if (!turnstile) void loadChallenge();
        return;
      }

      setStatus("verified");
    },
    [challenge, turnstile, loadChallenge],
  );

  const stopHold = useCallback(() => {
    setHolding(false);
    holdStartRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (turnstile) return;
    setHolding(true);
    setError(null);
    holdStartRef.current = Date.now();

    const tick = () => {
      if (!holdStartRef.current) return;
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / 1800) * 100);
      setProgress(pct);
      if (elapsed >= 1800) {
        stopHold();
        void completeVerification({ holdDurationMs: elapsed });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [turnstile, completeVerification, stopHold]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (status === "loading" || status === "verified") return null;

  return (
    <div className="bf-human-gate fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="bf-human-gate__backdrop absolute inset-0 bg-[#030303]/92 backdrop-blur-xl" />

      <div className="bf-human-gate__card relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c0c0c]/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="bf-human-gate__glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="bf-human-gate__glow pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[var(--bf-accent)]/[0.06] blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04]">
            <svg
              className="h-8 w-8 text-white/90"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path
                d="M12 3l7 4v5c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V7l7-4z"
                strokeLinejoin="round"
              />
              <path d="M9.5 12.5 11 14l3.5-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Security check
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            Verifying you&apos;re human
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            One quick check helps keep cried.bio free of bots and spam. This only appears on the
            home page during your first visit.
          </p>

          {turnstile && siteKey ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <TurnstileWidget
                siteKey={siteKey}
                onSuccess={(token) => {
                  turnstileTokenRef.current = token;
                  void completeVerification({ turnstileToken: token });
                }}
                onError={() => setError("Verification failed. Please try again.")}
              />
              <p className="text-xs text-neutral-600">Complete the challenge to continue</p>
            </div>
          ) : (
            <div className="mt-8">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  startHold();
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                className={`bf-human-gate__hold relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                  holding
                    ? "border-white/20 bg-white/[0.08] text-white"
                    : "border-white/[0.12] bg-white/[0.04] text-neutral-200 hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className="bf-human-gate__hold-progress absolute inset-y-0 left-0 bg-white/[0.08] transition-none"
                  style={{ width: `${progress}%` }}
                />
                <span className="relative">
                  {holding ? "Keep holding…" : "Press and hold to verify"}
                </span>
              </button>
              <p className="mt-3 text-xs text-neutral-600">Hold for about 2 seconds</p>
            </div>
          )}

          {error ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
