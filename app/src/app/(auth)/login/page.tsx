"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, PlayCircle, Languages, Mail, Lock, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth/provider";
import { LogoMark } from "@/components/ui/Logo";
import { Button, Label } from "@/components/ui/primitives";
import { LanguagePills } from "@/components/shell/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError(t("auth.emailRequired") || "Email is required");
    if (!password) return setError(t("auth.passwordRequired") || "Password is required");
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) return setError(res.error);
    router.replace("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col justify-center animate-float-in">
      {/* ---------- Immersive brand backdrop ---------- */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: "linear-gradient(160deg, var(--brand) 0%, var(--brand-strong) 48%, #141c33 100%)" }}
      />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-[#8ea9f7]/30 blur-3xl animate-pulse" style={{ animationDelay: "1.2s" }} />
        <div className="absolute -bottom-28 left-1/4 w-72 h-72 rounded-full bg-[#2d3f7a]/40 blur-3xl animate-pulse" style={{ animationDelay: "0.6s" }} />
      </div>

      {/* ---------- Logo + welcome (on the gradient) ---------- */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative">
          <div className="absolute -inset-4 rounded-[30px] bg-white/25 blur-2xl" />
          <div className="relative p-1.5 rounded-[26px] bg-white/15 backdrop-blur-sm ring-1 ring-white/25 shadow-2xl">
            <LogoMark size={72} />
          </div>
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-white drop-shadow-sm">
          {t("auth.welcome")}
        </h1>
        <p className="mt-2 text-white/85 text-lg">{t("auth.signInToContinue")}</p>
      </div>

      {/* ---------- Glass form card ---------- */}
      <div
        className="rounded-[28px] p-6 sm:p-7 border border-white/15 shadow-2xl"
        style={{ background: "var(--sheet-bg)", backdropFilter: "blur(24px) saturate(150%)", WebkitBackdropFilter: "blur(24px) saturate(150%)" }}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <Label>{t("auth.email")}</Label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="field w-full h-12 pl-11 pr-4 text-[15px]"
                required
              />
            </div>
          </div>

          <div>
            <Label>{t("auth.password")}</Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" />
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field w-full h-12 pl-11 pr-12 text-[15px]"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]"
                aria-label="Toggle password"
              >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link href="#" className="text-[color:var(--brand)] font-semibold text-[14px]">
              {t("auth.forgotPassword")}
            </Link>
          </div>

          {error && (
            <p className="text-sm text-[color:var(--color-danger)] rounded-xl px-3 py-2 bg-[color:var(--color-danger)]/10">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" full disabled={loading} className="mt-1 group">
            {loading ? (
              t("auth.signingIn")
            ) : (
              <span className="inline-flex items-center gap-2">
                {t("auth.login")}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </Button>
        </form>

        <p className="text-center mt-5 text-[color:var(--text-soft)] text-[15px]">
          {t("auth.dontHaveAccount")}{" "}
          <Link href="/signup" className="text-[color:var(--brand)] font-bold">
            {t("auth.signup")}
          </Link>
        </p>
      </div>

      {/* ---------- Below card (on the gradient) ---------- */}
      <a
        href="https://vasool.app"
        target="_blank"
        rel="noreferrer"
        className="mt-6 flex items-center justify-center gap-2 text-white font-semibold"
      >
        <span className="w-8 h-8 rounded-full grid place-items-center bg-white/15 ring-1 ring-white/25">
          <PlayCircle className="text-white" size={20} />
        </span>
        {t("auth.watchDemoVideo")}
      </a>

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-white/80 text-[13px]">
          <Languages size={16} /> {t("auth.language")}
        </div>
        <LanguagePills />
        <div className="mt-3 text-center">
          <div className="text-lg font-extrabold text-white">VasoolX</div>
          <div className="text-[13px] text-white/70 mt-0.5">{t("app.tagline")}</div>
        </div>
      </div>
    </div>
  );
}
