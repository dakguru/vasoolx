"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, PlayCircle, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth/provider";
import { LogoMark } from "@/components/ui/Logo";
import { Button, Input, Label } from "@/components/ui/primitives";
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
    <div className="flex-1 flex flex-col animate-float-in">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col items-center text-center mb-8">
          <LogoMark size={72} />
          <h1 className="mt-6 text-4xl font-extrabold text-[color:var(--text)]">
            {t("auth.welcome")}
          </h1>
          <p className="mt-2 text-[color:var(--text-soft)] text-lg">
            {t("auth.signInToContinue")}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <Label>{t("auth.email")}</Label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
          </div>

          <div>
            <Label>{t("auth.password")}</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]"
                aria-label="Toggle password"
              >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[color:var(--color-danger)] -mt-2">{error}</p>
          )}

          <Link
            href="#"
            className="text-[color:var(--brand)] font-semibold text-[15px] -mt-1"
          >
            {t("auth.forgotPassword")}
          </Link>

          <Button type="submit" size="lg" full disabled={loading}>
            {loading ? t("auth.signingIn") : t("auth.login")}
          </Button>
        </form>

        <p className="text-center mt-6 text-[color:var(--text-soft)]">
          {t("auth.dontHaveAccount")}{" "}
          <Link href="/signup" className="text-[color:var(--brand)] font-semibold">
            {t("auth.signup")}
          </Link>
        </p>

        <a
          href="https://vasool.app"
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-[color:var(--brand)] font-semibold"
        >
          <PlayCircle className="text-[#ff0000]" size={26} /> {t("auth.watchDemoVideo")}
        </a>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[color:var(--text-soft)]">
          <Languages size={18} /> {t("auth.language")}
        </div>
        <LanguagePills />
        <div className="mt-4 text-center">
          <div className="text-xl font-extrabold text-[color:var(--brand)]">
            VasoolX
          </div>
          <div className="text-sm text-[color:var(--text-soft)] mt-1">
            {t("app.tagline")}
          </div>
        </div>
      </div>
    </div>
  );
}
