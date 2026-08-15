"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Crosshair,
  ShieldCheck,
  Bot,
  BadgeCheck,
  Mail,
  Heart,
  ChevronRight,
} from "lucide-react";

/* Inline brand glyphs (lucide dropped brand icons for trademark reasons) */
const IconLinkedIn = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.5V23h-4V8z"/></svg>
);
const IconFacebook = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
);
const IconX = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.96 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z"/></svg>
);
const IconYouTube = (p: { size?: number }) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.11-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.39.52A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.13c1.89.52 9.39.52 9.39.52s7.5 0 9.39-.52a3 3 0 0 0 2.11-2.13A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
);
const IconApple = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="currentColor"><path d="M16.37 12.78c-.02-2.06 1.68-3.05 1.76-3.1-0.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.03 8.23.69.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.68.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.63-3.05zM14.6 6.6c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.14z"/></svg>
);
const IconPlay = (p: { size?: number }) => (
  <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.3c-.3.3-.5.7-.5 1.2v17c0 .5.2.9.5 1.2l10-10.7-10-8.7zm12 10.4l2.8 2.8-3.4 1.9-2.6-2.7 3.2-2zm-3.2-2.8L9.6 7 15 3.9c.3-.2.6-.2.9 0l1.6.9-4.7 5zm0 5.6l-1.6.9c-.3.2-.6.2-.9 0L4.5 20l6.7-7.1 1.2 1.6z"/></svg>
);

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "How it Works", href: "#" },
      { label: "Pricing", href: "/subscription" },
      { label: "Integrations", href: "#" },
      { label: "Security", href: "#" },
      { label: "Updates", href: "#" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Field Collections", href: "/collect" },
      { label: "Receivables", href: "/customers" },
      { label: "Payment Tracking", href: "/finance" },
      { label: "Route Management", href: "/areas" },
      { label: "Performance Analytics", href: "/reports" },
      { label: "Reports & Insights", href: "/reports" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Our Mission", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "User Guide", href: "#" },
      { label: "Video Tutorials", href: "#" },
      { label: "API Documentation", href: "#" },
      { label: "Support", href: "#" },
      { label: "System Status", href: "#" },
    ],
  },
];

const BADGES = [
  { Icon: Zap, title: "FAST", sub: "Real-time Collections" },
  { Icon: Crosshair, title: "ACCURATE", sub: "Error-free Tracking" },
  { Icon: ShieldCheck, title: "SECURE", sub: "Bank-level Security" },
  { Icon: Bot, title: "AUTOMATED", sub: "Smart Workflow" },
  { Icon: BadgeCheck, title: "TRUSTED", sub: "Reliable & Transparent" },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="w-full bg-[#0a1122] text-[#c7d2e8] border-t border-white/10">
      <div className="px-6 md:px-10 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2.2fr_1.3fr]">
          {/* Brand + badges */}
          <div>
            <Image
              src="/brand/wordmark-full.png"
              alt="VasoolX"
              width={220}
              height={55}
              className="mb-3"
              style={{ filter: "brightness(0) invert(1)", height: 44, width: "auto" }}
            />
            <p className="text-lg font-semibold text-white">
              Every Collection. <span className="text-[#4f7df0]">Digitally Controlled.</span>
            </p>
            <p className="mt-3 text-sm text-[#93a1c4] max-w-sm">
              The next-generation collection management platform built for speed,
              accuracy and complete control over your receivables.
            </p>
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-4">
              {BADGES.map((b) => (
                <div key={b.title} className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full grid place-items-center border border-[#4f7df0]/40 text-[#4f7df0] mb-2">
                    <b.Icon size={20} />
                  </div>
                  <div className="text-[11px] font-bold text-white">{b.title}</div>
                  <div className="text-[10px] text-[#93a1c4] leading-tight mt-0.5">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {COLS.map((c) => (
              <div key={c.title}>
                <h4 className="text-[#4f7df0] font-bold tracking-wide mb-4">{c.title}</h4>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="flex items-center gap-1.5 text-sm text-[#a9b6d6] hover:text-white transition"
                      >
                        <ChevronRight size={13} className="text-[#4f7df0]" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter + apps */}
          <div>
            <h4 className="text-white font-bold tracking-wide mb-3">STAY UPDATED</h4>
            <p className="text-sm text-[#93a1c4] mb-4">
              Subscribe to our newsletter for product updates, tips and best practices.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubscribed(true);
              }}
              className="flex gap-2 mb-2"
            >
              <div className="relative flex-1">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7aa0]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/12 text-white placeholder:text-[#6b7aa0] outline-none focus:border-[#4f7df0]"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-[#4f7df0] text-white font-semibold hover:brightness-110 transition"
              >
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-[#3ddc97] mb-4">✓ Subscribed — thank you!</p>
            )}

            <h4 className="text-white font-bold tracking-wide mt-6 mb-3">DOWNLOAD THE APP</h4>
            <div className="flex flex-wrap gap-3">
              <StoreButton Icon={IconPlay} top="GET IT ON" bottom="Google Play" />
              <StoreButton Icon={IconApple} top="Download on the" bottom="App Store" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 md:px-10 py-5">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between text-sm">
          <div className="flex items-center gap-2 text-[#93a1c4]">
            <ShieldCheck size={18} className="text-[#4f7df0]" />
            © {new Date().getFullYear()} VasoolX. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#a9b6d6]">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Service</Link>
            <Link href="#" className="hover:text-white">Refund Policy</Link>
            <Link href="#" className="hover:text-white">Cookie Policy</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:flex items-center gap-1.5 text-[#93a1c4] text-xs">
              Made with <Heart size={13} className="text-[#4f7df0] fill-[#4f7df0]" /> for smarter collections
            </span>
            <div className="flex gap-2">
              {[IconLinkedIn, IconFacebook, IconX, IconYouTube].map((Ic, i) => (
                <Link key={i} href="#" className="w-9 h-9 rounded-full border border-white/15 grid place-items-center text-[#a9b6d6] hover:text-white hover:border-[#4f7df0] transition">
                  <Ic size={16} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StoreButton({ Icon, top, bottom }: { Icon: React.ComponentType<{ size?: number; className?: string }>; top: string; bottom: string }) {
  return (
    <button className="flex items-center gap-3 h-14 px-4 rounded-xl bg-black border border-white/15 hover:border-white/30 transition">
      <Icon size={26} className="text-white" />
      <div className="text-left leading-tight">
        <div className="text-[10px] text-[#93a1c4]">{top}</div>
        <div className="text-sm font-bold text-white">{bottom}</div>
      </div>
    </button>
  );
}
