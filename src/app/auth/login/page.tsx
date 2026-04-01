"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, TrendingUp, ArrowRight, Chrome } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<Mode>("login");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const update = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Kayıt başarısız"); setLoading(false); return; }
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email veya şifre hatalı");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Bir hata oluştu, tekrar dene");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => signIn("google", { callbackUrl: "/" });

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #0d1117 0%, #141c2e 50%, #0d1117 100%)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--brand)" }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            TradeDiwan
          </span>
        </div>

        <div>
          <h1
            className="text-4xl font-bold leading-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            İşlemlerini analiz et,<br />
            <span style={{ color: "var(--brand-light)" }}>daha iyi karar ver.</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Profesyonel bir trading journal ile performansını takip et,
            hatalarından öğren ve sürekli gelişim sağla.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { val: "10K+",  lbl: "Trader" },
              { val: "2M+",   lbl: "İşlem kaydı" },
              { val: "%68",   lbl: "Ort. win rate artışı" },
            ].map((s) => (
              <div
                key={s.lbl}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="text-2xl font-bold font-mono"
                  style={{ color: "var(--brand-light)" }}
                >
                  {s.val}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © 2025 TradeDiwan. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--brand)" }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>TradeDiwan</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {mode === "login" ? "Tekrar hoş geldin" : "Hesap oluştur"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            {mode === "login"
              ? "Hesabına giriş yap ve analize devam et"
              : "Ücretsiz başla, kredi kartı gerekmez"}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium mb-4 transition-all"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
          >
            <Chrome className="w-4 h-4" />
            Google ile devam et
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>veya</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Ad Soyad
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Adın Soyadın"
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="trader@example.com"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Şifre
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? "text" : "password"}
                  placeholder={mode === "register" ? "En az 8 karakter" : "••••••••"}
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs" style={{ color: "var(--brand-light)" }}>
                  Şifreni mi unuttun?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: loading ? "var(--brand-dim)" : "var(--brand)",
                color: "#fff",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
            {mode === "login" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-medium"
              style={{ color: "var(--brand-light)" }}
            >
              {mode === "login" ? "Kayıt ol" : "Giriş yap"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
