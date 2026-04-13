"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import DashboardLayout from "./dashboard-layout";
import { useTheme } from "@/contexts/theme-context";
import {
  User, Lock, CreditCard, Palette, Bell, Shield,
  Save, Eye, EyeOff, Check, AlertTriangle, TrendingUp,
  Sun, Moon, ChevronRight, LogOut, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Tab = "profil" | "guvenlik" | "plan" | "gorunum";

const PLAN_INFO = {
  free: {
    label:    "Ücretsiz",
    color:    "var(--text-muted)",
    bg:       "var(--bg-elevated)",
    features: ["50 işlem/ay", "Temel analitik", "1 broker bağlantısı"],
  },
  pro: {
    label:    "Pro",
    color:    "#0d9488",
    bg:       "var(--brand-dim)",
    features: ["Sınırsız işlem", "Gelişmiş analitik", "Sınırsız broker", "AI Insights", "Öncelikli destek"],
  },
  enterprise: {
    label:    "Enterprise",
    color:    "#f59e0b",
    bg:       "var(--amber-dim)",
    features: ["Pro'nun tamamı", "Team özellikler", "Özel entegrasyonlar", "SLA garantisi"],
  },
};

export default function SettingsPageClient() {
  const { data: session, update: updateSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("profil");

  // Profile state
  const [profile, setProfile]       = useState({ name: "", email: "" });
  const [profileSaving, setPS]      = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password state
  const [pw, setPw]         = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwS]  = useState(false);
  const [pwMsg, setPwMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // User data
  const [userData, setUserData] = useState<{ plan: string; createdAt: string } | null>(null);
  const [portalLoading, setPL]  = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile({ name: data.name ?? "", email: data.email ?? "" });
          setUserData({ plan: data.plan, createdAt: data.createdAt });
        }
      });
  }, []);

  const saveProfile = async () => {
    setPS(true);
    setProfileMsg(null);
    try {
      const res  = await fetch("/api/user/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({ type: "err", text: data.error }); return; }
      setProfileMsg({ type: "ok", text: "Profil güncellendi" });
      await updateSession({ name: profile.name, email: profile.email });
    } catch {
      setProfileMsg({ type: "err", text: "Bir hata oluştu" });
    } finally {
      setPS(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const savePassword = async () => {
    if (pw.new !== pw.confirm) { setPwMsg({ type: "err", text: "Yeni şifreler eşleşmiyor" }); return; }
    if (pw.new.length < 8)     { setPwMsg({ type: "err", text: "Şifre en az 8 karakter olmalı" }); return; }
    setPwS(true);
    setPwMsg(null);
    try {
      const res  = await fetch("/api/user/password", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: pw.current, newPassword: pw.new }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ type: "err", text: data.error }); return; }
      setPwMsg({ type: "ok", text: "Şifre başarıyla değiştirildi" });
      setPw({ current: "", new: "", confirm: "" });
    } catch {
      setPwMsg({ type: "err", text: "Bir hata oluştu" });
    } finally {
      setPwS(false);
      setTimeout(() => setPwMsg(null), 3000);
    }
  };

  const openStripePortal = async () => {
    setPL(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPL(false);
    }
  };

  const plan     = userData?.plan ?? "free";
  const planInfo = PLAN_INFO[plan as keyof typeof PLAN_INFO] ?? PLAN_INFO.free;

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: "profil",   label: "Profil",    Icon: User      },
    { id: "guvenlik", label: "Güvenlik",  Icon: Lock      },
    { id: "plan",     label: "Plan",      Icon: CreditCard },
    { id: "gorunum",  label: "Görünüm",   Icon: Palette   },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13,
    background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
    color: "var(--text-primary)", outline: "none", transition: "border-color 0.15s",
  };

  const Msg = ({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) => {
    if (!msg) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{
        background: msg.type === "ok" ? "var(--green-dim)" : "var(--red-dim)",
        color:      msg.type === "ok" ? "#10b981"          : "#ef4444",
        border:     `1px solid ${msg.type === "ok" ? "rgba(16,185,129,0.20)" : "rgba(239,68,68,0.20)"}`,
      }}>
        {msg.type === "ok" ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
        {msg.text}
      </div>
    );
  };

  const PwField = ({ field, label, placeholder }: { field: "current" | "new" | "confirm"; label: string; placeholder: string }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <div className="relative">
        <input
          type={showPw[field] ? "text" : "password"}
          value={pw[field]}
          onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          style={{ ...inputStyle, paddingRight: 40 }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--brand)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        >
          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Ayarlar</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Hesap ve uygulama tercihlerinizi yönetin</p>
        </div>

        <div className="flex flex-col md:flex-row gap-5">

          {/* Sidebar nav */}
          <nav className="md:w-48 flex-shrink-0">
            <div className="card p-2 space-y-0.5">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: tab === t.id ? "var(--brand-dim)" : "transparent",
                    color:      tab === t.id ? "var(--brand)"     : "var(--text-secondary)",
                    borderLeft: tab === t.id ? "2px solid var(--brand)" : "2px solid transparent",
                  }}
                >
                  <t.Icon className="w-4 h-4 flex-shrink-0" />
                  {t.label}
                </button>
              ))}

              <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── Profil ── */}
            {tab === "profil" && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Profil Bilgileri</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Ad ve email adresinizi güncelleyin</p>
                </div>
                <div className="p-6 space-y-5">

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff" }}>
                      {profile.name?.[0]?.toUpperCase() ?? "T"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{profile.name || "—"}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{profile.email}</p>
                      {userData?.createdAt && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Üye: {format(new Date(userData.createdAt), "dd MMM yyyy", { locale: tr })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Ad Soyad</label>
                      <input
                        value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        placeholder="Adın Soyadın"
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--brand)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                        placeholder="trader@example.com"
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--brand)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border-default)")}
                      />
                    </div>
                  </div>

                  <Msg msg={profileMsg} />

                  <div className="flex justify-end">
                    <button onClick={saveProfile} disabled={profileSaving} className="btn-primary" style={{ padding: "7px 18px" }}>
                      {profileSaving
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        : <><Save className="w-3.5 h-3.5 inline mr-1.5" />Kaydet</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Güvenlik ── */}
            {tab === "guvenlik" && (
              <div className="space-y-4">
                <div className="card overflow-hidden">
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Şifre Değiştir</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Güvenliğiniz için güçlü bir şifre kullanın</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <PwField field="current" label="Mevcut Şifre"   placeholder="••••••••" />
                    <PwField field="new"     label="Yeni Şifre"     placeholder="En az 8 karakter" />
                    <PwField field="confirm" label="Şifreyi Doğrula" placeholder="Tekrar girin" />

                    <Msg msg={pwMsg} />

                    <div className="flex justify-end">
                      <button onClick={savePassword} disabled={pwSaving || !pw.current || !pw.new || !pw.confirm} className="btn-primary" style={{ padding: "7px 18px" }}>
                        {pwSaving
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          : <><Lock className="w-3.5 h-3.5 inline mr-1.5" />Şifreyi Güncelle</>
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="card overflow-hidden" style={{ borderColor: "rgba(239,68,68,0.20)" }}>
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: "#ef4444" }} />
                      <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Tehlikeli Alan</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Hesabı Sil</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Tüm verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
                      </div>
                      <button
                        className="btn-secondary text-sm flex-shrink-0"
                        style={{ padding: "7px 14px", color: "#ef4444", borderColor: "rgba(239,68,68,0.30)" }}
                        onClick={() => alert("Hesap silme işlemi için destek@tradediwan.com adresine yazın.")}
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Hesabı Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Plan ── */}
            {tab === "plan" && (
              <div className="space-y-4">

                {/* Current plan */}
                <div className="card overflow-hidden">
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Mevcut Plan</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: planInfo.bg }}>
                        <TrendingUp className="w-5 h-5" style={{ color: planInfo.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base" style={{ color: planInfo.color }}>{planInfo.label}</p>
                          <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: planInfo.bg, color: planInfo.color }}>Aktif</span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {plan === "free" ? "Ücretsiz, kredi kartı yok" : "Aylık faturalandırma"}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {planInfo.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
                          <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan !== "free" && (
                      <button onClick={openStripePortal} disabled={portalLoading} className="btn-secondary w-full" style={{ padding: "8px" }}>
                        {portalLoading
                          ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
                          : <><CreditCard className="w-3.5 h-3.5 inline mr-1.5" />Fatura & Abonelik Yönetimi</>
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Upgrade (if free) */}
                {plan === "free" && (
                  <div className="card overflow-hidden" style={{ borderColor: "rgba(13,148,136,0.25)" }}>
                    <div className="px-6 py-4" style={{ background: "var(--brand-dim)", borderBottom: "1px solid rgba(13,148,136,0.15)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Pro'ya Yükselt</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Tüm özelliklere erişim</p>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-2 mb-5">
                        {PLAN_INFO.pro.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0d9488" }} />
                            <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => window.location.href = "/pricing"}
                        className="btn-primary w-full"
                        style={{ padding: "9px" }}
                      >
                        Pro Planı İncele
                        <ChevronRight className="w-4 h-4 inline ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Görünüm ── */}
            {tab === "gorunum" && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Görünüm Tercihleri</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Uygulama temasını özelleştirin</p>
                </div>
                <div className="p-6 space-y-4">

                  {/* Theme toggle cards */}
                  <div>
                    <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Tema</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "light", label: "Açık Tema",  Icon: Sun,  desc: "Gündüz kullanımı için" },
                        { id: "dark",  label: "Koyu Tema",  Icon: Moon, desc: "Gece kullanımı için" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => { if (theme !== opt.id) toggleTheme(); }}
                          className="p-4 rounded-2xl text-left transition-all"
                          style={{
                            background:   theme === opt.id ? "var(--brand-dim)" : "var(--bg-elevated)",
                            border:       `2px solid ${theme === opt.id ? "var(--brand)" : "var(--border-default)"}`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <opt.Icon className="w-5 h-5" style={{ color: theme === opt.id ? "var(--brand)" : "var(--text-muted)" }} />
                            {theme === opt.id && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-semibold" style={{ color: theme === opt.id ? "var(--brand)" : "var(--text-primary)" }}>{opt.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System preference info */}
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Tema tercihiniz tarayıcı localStorage'da saklanır ve sonraki ziyaretlerde hatırlanır.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
