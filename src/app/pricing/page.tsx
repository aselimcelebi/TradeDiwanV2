"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Zap, TrendingUp } from "lucide-react";

const FREE_FEATURES = [
  "50 işlem / ay",
  "Temel dashboard",
  "Günlük journal",
  "Takvim görünümü",
];

const PRO_FEATURES = [
  "Sınırsız işlem",
  "Gelişmiş analitik & raporlar",
  "MT5 / Binance otomatik import",
  "Insights & AI önerileri",
  "Çoklu broker desteği",
  "Öncelikli destek",
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Bir hata oluştu");
    } catch {
      alert("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const isPro = (session?.user as any)?.plan === "pro";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid rgba(99,102,241,0.3)" }}>
          <Zap className="w-3 h-3" /> Basit ve şeffaf fiyatlandırma
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Potansiyelini ortaya çıkar
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Ücretsiz başla, hazır olunca Pro'ya geç
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* Free Plan */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Ücretsiz
            </h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>$0</span>
              <span className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>/ay</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--green)" }} />
                {f}
              </li>
            ))}
          </ul>

          <button
            disabled
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
              cursor: "not-allowed",
            }}
          >
            Mevcut Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: `2px solid ${isPro ? "var(--green)" : "var(--brand)"}`,
          }}
        >
          {/* Popular badge */}
          {!isPro && (
            <div
              className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-md"
              style={{ background: "var(--brand)", color: "#fff" }}
            >
              Popüler
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--brand-light)" }}>
              Pro
            </h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>$15</span>
              <span className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>/ay</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand-light)" }} />
                {f}
              </li>
            ))}
          </ul>

          {isPro ? (
            <button
              onClick={handlePortal}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--green-dim)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)" }}
            >
              {loading ? "Yükleniyor..." : "Aboneliği Yönet"}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--brand)", color: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--brand-light)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--brand)")}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Yükleniyor...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Pro'ya Geç
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        İstediğin zaman iptal edebilirsin. Kredi kartı güvenle Stripe tarafından işlenir.
      </p>
    </div>
  );
}
