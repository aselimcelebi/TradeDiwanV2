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
  const [form, setForm]         = useState({ name: "", email: "", password: "" });

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
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
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
    <div className="min-h-screen flex" style={{ background: "#f0f4f8" }}>

      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#0f172a" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #14b8a6, transparent)" }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #0d9488, transparent)" }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">TradeDiwan</span>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "rgba(13,148,136,0.15)", color: "#14b8a6", border: "1px solid rgba(13,148,136,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Profesyonel Trading Journal
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-5 text-white">
            İşlemlerini analiz et,<br />
            <span style={{ color: "#2dd4bf" }}>daha iyi karar ver.</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Profesyonel araçlarla performansını takip et, hatalarından öğren ve sürekli gelişim sağla.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { val: "10K+",  lbl: "Trader" },
              { val: "2M+",   lbl: "İşlem kaydı" },
              { val: "%68",   lbl: "Win rate artışı" },
            ].map((s) => (
              <div
                key={s.lbl}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-2xl font-bold font-mono" style={{ color: "#2dd4bf" }}>{s.val}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "rgba(255,255,255,0.25)" }}>
          © 2025 TradeDiwan. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold" style={{ color: "#0f172a" }}>TradeDiwan</span>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8" style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 8px 32px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04)" }}>

            <h2 className="text-2xl font-bold mb-1" style={{ color: "#0f172a" }}>
              {mode === "login" ? "Tekrar hoş geldin 👋" : "Hesap oluştur"}
            </h2>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>
              {mode === "login"
                ? "Hesabına giriş yap ve analize devam et"
                : "Ücretsiz başla, kredi kartı gerekmez"}
            </p>

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium mb-4 transition-all"
              style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.10)", color: "#0f172a" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,23,42,0.20)"; (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,23,42,0.10)"; (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
            >
              <Chrome className="w-4 h-4" />
              Google ile devam et
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "rgba(15,23,42,0.08)" }} />
              <span className="text-xs" style={{ color: "#94a3b8" }}>veya</span>
              <div className="flex-1 h-px" style={{ background: "rgba(15,23,42,0.08)" }} />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Ad Soyad</label>
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Email</label>
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Şifre</label>
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
                    style={{ color: "#94a3b8" }}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium" style={{ color: "#0d9488" }}>
                    Şifreni mi unuttun?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: loading ? "rgba(13,148,136,0.60)" : "linear-gradient(135deg, #0d9488, #14b8a6)",
                  color: "#fff",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(13,148,136,0.35)",
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
            <p className="text-center text-sm mt-5" style={{ color: "#64748b" }}>
              {mode === "login" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="font-semibold"
                style={{ color: "#0d9488" }}
              >
                {mode === "login" ? "Kayıt ol" : "Giriş yap"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
