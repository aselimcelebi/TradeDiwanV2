"use client";

import { useState } from "react";
import { Strategy } from "@prisma/client";
import DashboardLayout from "./dashboard-layout";
import {
  BookOpen, Plus, Edit3, Trash2, Eye, Save, X, Search, Target, FileText, Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface NotebookPageClientProps { strategies: Strategy[] }

interface StrategyForm { name: string; description: string; rules: string; images: string[] }

const TEMPLATES = [
  { name: "Breakout Strategy", description: "Fiyat kırılımlarını takip eden momentum stratejisi", rules: "1. Giriş Kuralları:\n- Önemli destek/direnç seviyelerinin kırılmasını bekle\n- Hacim onayı (normal volümün 1.5x üzeri)\n- RSI > 50\n\n2. Çıkış Kuralları:\n- Stop Loss: Kırılan seviyenin altına\n- Take Profit: Risk'in 2x katı\n\n3. Risk Yönetimi:\n- Max %2 risk per trade", images: [] },
  { name: "Scalping Strategy",  description: "1-5 dakikalık hızlı işlemler için kısa vadeli strateji",  rules: "1. Zaman Dilimi: 1M, 5M\n2. İndikatörler: EMA 9/21, RSI\n\n3. Giriş:\n- EMA 9 > EMA 21\n- RSI 30-70\n- Support pullback\n\n4. Çıkış:\n- Quick profit: 5-10 pips\n- Stop: 3-5 pips", images: [] },
  { name: "Swing Trading",      description: "Orta vadeli trend takibi için 1-5 günlük pozisyonlar",     rules: "1. Zaman Dilimi: 4H, Daily\n2. Golden Cross EMA 50/200\n\n3. Giriş:\n- Ana trend yönünde\n- Fibonacci %38.2 - %61.8\n\n4. Position:\n- Risk: %1-2\n- R:R minimum 1:3", images: [] },
];

const taStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13,
  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
  color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit",
};

export default function NotebookPageClient({ strategies }: NotebookPageClientProps) {
  const [search, setSearch]                 = useState("");
  const [isCreating, setIsCreating]         = useState(false);
  const [editing, setEditing]               = useState<Strategy | null>(null);
  const [viewing, setViewing]               = useState<Strategy | null>(null);
  const [isSaving, setIsSaving]             = useState(false);
  const [form, setForm]                     = useState<StrategyForm>({ name: "", description: "", rules: "", images: [] });

  const filtered = strategies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setForm({ name: "", description: "", rules: "", images: [] }); setIsCreating(false); setEditing(null); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/strategies", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing?.id, ...form }),
      });
      resetForm();
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (s: Strategy) => {
    setForm({ name: s.name, description: s.description || "", rules: s.rules || "", images: (s as any).images || [] });
    setEditing(s);
    setIsCreating(true);
  };

  const addImage = () => {
    const url = prompt("Görsel URL:");
    if (url) setForm(p => ({ ...p, images: [...p.images, url] }));
  };

  // View detail
  if (viewing) return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewing(null)} className="btn-secondary p-2"><X className="w-4 h-4" /></button>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{viewing.name}</h1>
          </div>
          <button onClick={() => handleEdit(viewing)} className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }}>
            <Edit3 className="w-3.5 h-3.5 inline mr-1.5" />Düzenle
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Açıklama</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{viewing.description || "Açıklama bulunmuyor."}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Strateji Kuralları</p>
              <pre className="text-sm whitespace-pre-wrap p-4 rounded-xl font-mono" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                {viewing.rules || "Kural bulunmuyor."}
              </pre>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Bilgiler</p>
            <div className="space-y-3">
              {[
                { label: "Oluşturulma", val: format(new Date(viewing.createdAt), "dd MMM yyyy", { locale: tr }) },
                { label: "Güncelleme",  val: format(new Date(viewing.updatedAt), "dd MMM yyyy", { locale: tr }) },
                { label: "Durum",       val: "Aktif", color: "#10b981" },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="text-xs font-medium" style={{ color: (row as any).color ?? "var(--text-primary)" }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: "var(--brand)" }} />
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Notlar & Stratejiler</h1>
          </div>
          {!isCreating && (
            <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
              <Plus className="w-3.5 h-3.5 inline mr-1.5" />Yeni Strateji
            </button>
          )}
        </div>

        {!isCreating ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input className="input pl-9" placeholder="Strateji ara..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Templates (if empty) */}
            {strategies.length === 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Başlamak için Şablonlar</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TEMPLATES.map((t, i) => (
                    <div key={i} className="card-elevated p-4">
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                      <button
                        onClick={() => { setForm({ ...t }); setIsCreating(true); }}
                        className="btn-secondary text-xs" style={{ padding: "4px 10px" }}
                      >
                        Şablonu Kullan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy cards */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(s => (
                  <div key={s.id} className="card p-5 transition-all hover:shadow-md">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setViewing(s)} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleEdit(s)} className="btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button className="btn-ghost p-1.5" style={{ color: "var(--red)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {s.description || "Açıklama bulunmuyor."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{format(new Date(s.updatedAt), "dd MMM yyyy")}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--green-dim)", color: "#10b981" }}>Aktif</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : strategies.length > 0 ? (
              <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">"{search}" için sonuç bulunamadı</p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {editing ? "Strateji Düzenle" : "Yeni Strateji Oluştur"}
              </p>
              <button onClick={resetForm} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Strateji Adı *</label>
                    <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Breakout Strategy" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Açıklama</label>
                    <textarea style={{ ...taStyle, minHeight: 80 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Stratejinin kısa açıklaması..." rows={3} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Görseller</label>
                    <div className="space-y-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input className="input flex-1 text-xs" value={url} readOnly />
                          <button onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))} className="btn-secondary p-2"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <button onClick={addImage} className="btn-secondary text-xs" style={{ padding: "5px 12px" }}>
                        <ImageIcon className="w-3.5 h-3.5 inline mr-1.5" />Görsel Ekle
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Strateji Kuralları</label>
                  <textarea style={{ ...taStyle, minHeight: 400, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} value={form.rules} onChange={e => setForm(p => ({ ...p, rules: e.target.value }))} placeholder={"Giriş Kuralları:\n1. ...\n\nÇıkış Kuralları:\n1. ...\n\nRisk:\n1. ..."} rows={18} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button onClick={resetForm} className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }}>İptal</button>
                <button onClick={handleSave} disabled={!form.name || isSaving} className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>
                  <Save className="w-3.5 h-3.5 inline mr-1.5" />
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
