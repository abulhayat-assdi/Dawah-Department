"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    const next = params.get("next") || "/dashboard";
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh-safe lg:grid-cols-2">
      {/* Brand panel */}
      <div className="brand-showcase relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        {/* Gold "Iqra" (Read) calligraphy watermark */}
        <span
          className="font-arabic pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none text-[16rem] leading-none text-gold-400/15"
          dir="rtl"
          aria-hidden="true"
        >
          اقْرَأْ
        </span>

        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gold-400 text-2xl text-brand-900 shadow-lg ring-1 ring-gold-200/40">
            ☪
          </span>
          <div>
            <p className="text-lg font-bold">Dawah Department</p>
            <p className="text-sm text-gold-200">
              ASSDI · As-Sunnah Skill Development Institute
            </p>
          </div>
        </div>

        <div className="relative">
          <p
            className="font-arabic text-4xl leading-none text-gold-300"
            dir="rtl"
            aria-label="Bismillah"
          >
            ﷽
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-snug">
            Authentic knowledge meets <br />
            <span className="text-gold-300">modern skill</span>
          </h1>
          <p className="mt-4 max-w-md text-white/85">
            Course progress, member activity and reporting for the Dawah
            Department of As-Sunnah Skill Development Institute — all in one
            platform.
          </p>
        </div>

        <p className="relative text-sm text-white/70">
          © {new Date().getFullYear()} ASSDI Dawah Department — All rights
          reserved
        </p>
      </div>

      {/* Form panel — the only panel phones see, so it carries the insets. */}
      <div className="flex items-center justify-center bg-slate-50 p-6 pb-[calc(1.5rem+var(--safe-bottom))] pl-[calc(1.5rem+var(--safe-left))] pr-[calc(1.5rem+var(--safe-right))] pt-[calc(1.5rem+var(--safe-top))]">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-800 text-2xl text-gold-300">
              ☪
            </span>
            <p className="mt-2 text-lg font-bold text-slate-900">
              Dawah Department
            </p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account details to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Having trouble with your account? Please contact the Super Admin
            (Coordinator).
          </p>
        </div>
      </div>
    </div>
  );
}
