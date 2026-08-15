"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth/provider";
import { LogoMark } from "@/components/ui/Logo";
import { Button, Input, Label, PhoneInput } from "@/components/ui/primitives";

export default function SignupPage() {
  const { t } = useI18n();
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    const res = await signUp(email.trim(), password, { name: name.trim(), phone });
    setLoading(false);
    if (res.error) return setError(res.error);
    router.replace("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-6 animate-float-in">
      <div className="flex flex-col items-center text-center mb-7">
        <LogoMark size={60} />
        <h1 className="mt-5 text-3xl font-extrabold text-[color:var(--text)]">
          {t("auth.signup")}
        </h1>
        <p className="mt-1.5 text-[color:var(--text-soft)]">
          {t("auth.createAccount")}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <Label required>{t("auth.fullName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <Label required>{t("auth.phoneNumber")}</Label>
          <PhoneInput value={phone} onChange={setPhone} />
        </div>

        <div>
          <Label required>{t("auth.email")}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />
        </div>

        <div>
          <Label required>{t("auth.password")}</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div>
          <Label required>{t("auth.confirmPassword")}</Label>
          <Input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
        )}

        <Button type="submit" size="lg" full disabled={loading} className="mt-1">
          {loading ? t("auth.creatingAccount") : t("auth.createAccountBtn")}
        </Button>
      </form>

      <p className="text-center mt-6 text-[color:var(--text-soft)]">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-[color:var(--brand)] font-semibold">
          {t("auth.login")}
        </Link>
      </p>

      <div className="mt-8 text-center">
        <div className="text-lg font-extrabold text-[color:var(--brand)]">
          VasoolX
        </div>
        <div className="text-sm text-[color:var(--text-soft)] mt-1">
          {t("app.tagline")}
        </div>
      </div>
    </div>
  );
}
