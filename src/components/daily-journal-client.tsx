"use client";

import { useState, useMemo } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import {
  ChevronLeft, ChevronRight, BookOpen, TrendingUp, TrendingDown,
  Target, Smile, Meh, Frown, Save, Plus, Edit3,
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays, subDays, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

interface DailyJournalClientProps {
  journalEntries: JournalEntry[];
  trades: Trade[];
}

interface FormData {
  whatWentWell: string; toImprove: string; notes: string; mood: number; tags: string;
}

const calcPnL = (t: Trade) =>
  (t.exitPrice - t.entryPrice) * t.qty * (t.side === "LONG" ? 1 : -1) - t.fees;

const MOOD_EMOJIS = ["", "😞", "😕", "😐", "😊", "😄"];
const MOOD_LABELS  = ["", "Çok Kötü", "Kötü", "Normal", "İyi", "Mükemmel"];

export default function DailyJournalClient({ journalEntries, trades }: DailyJournalClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  const currentEntry = journalEntries.find(e => isSameDay(new Date(e.date), selectedDate));

  const [form, setForm] = useState<FormData>({
    whatWentWell: currentEntry?.whatWentWell || "",
    toImprove:    currentEntry?.toImprove    || "",
    notes:        currentEntry?.notes        || "",
    mood:         currentEntry?.mood         || 3,
    tags:         currentEntry?.tags         || "",
  });

  const dailyTrades = useMemo(() => {
    const s = startOfDay(selectedDate), e = endOfDay(selectedDate);
    return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
  }, [trades, selectedDate]);

  const metrics = useMemo(() => {
    const pnl  = dailyTrades.reduce((s, t) => s + calcPnL(t), 0);
    const wins = dailyTrades.filter(t => calcPnL(t) > 0).length;
    return { pnl, count: dailyTrades.length, winRate: dailyTrades.length > 0 ? (wins / dailyTrades.length) * 100 : 0, wins, losses: dailyTrades.length - wins };
  }, [dailyTrades]);

  const changeDate = (dir: "prev" | "next") => {
    setSelectedDate(d => dir === "prev" ? subDays(d, 1) : addDays(d, 1));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/journal", {
        method: currentEntry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentEntry?.id, date: selectedDate.toISOString(), ...form }),
      });
      setIsEditing(false);
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = () => {
    setForm({
      whatWentWell: currentEntry?.whatWentWell || "",
      toImprove:    currentEntry?.toImprove    || "",
      notes:        currentEntry?.notes        || "",
      mood:         currentEntry?.mood         || 3,
      tags:         currentEntry?.tags         || "",
    });
    setIsEditing(true);
  };

  const taStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13,
    background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
    color: "var(--text-primary)", outline: "none", resize: "vertical",
    fontFamily: "inherit",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">

        {/* Date nav */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {format(selectedDate, "dd MMMM yyyy, EEEE", { locale: tr })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeDate("prev")} className="btn-secondary p-2"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" className="input" style={{ width: 160, padding: "6px 10px" }}
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={e => { setSelectedDate(new Date(e.target.value)); setIsEditing(false); }} />
            <button onClick={() => changeDate("next")} className="btn-secondary p-2"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => { setSelectedDate(new Date()); setIsEditing(false); }} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>Bugün</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Stats + trades */}
          <div className="space-y-4">

            {/* Daily stats */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" style={{ color: "var(--brand)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Günlük Performans</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Net P&L",       val: formatCurrency(metrics.pnl, "USD", true), color: metrics.pnl >= 0 ? "#10b981" : "#ef4444" },
                  { label: "İşlem Sayısı",  val: metrics.count.toString() },
                  { label: "Win Rate",      val: `${metrics.winRate.toFixed(1)}%`, color: metrics.winRate >= 50 ? "#10b981" : "#f59e0b" },
                  { label: "K / L",         val: `${metrics.wins} / ${metrics.losses}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                    <span className="text-xs font-semibold font-mono" style={{ color: (row as any).color ?? "var(--text-primary)" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily trades list */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Günün İşlemleri</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>{dailyTrades.length}</span>
              </div>
              {dailyTrades.length === 0 ? (
                <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Bu günde işlem bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dailyTrades.map(trade => {
                    const pnl = calcPnL(trade);
                    return (
                      <div key={trade.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{trade.symbol}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {trade.side} · {trade.qty} · {format(new Date(trade.date), "HH:mm")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold font-mono" style={{ color: pnl >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(pnl, "USD", true)}</span>
                          {pnl >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: "#10b981" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "#ef4444" }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Journal entry */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Günlük Değerlendirme</p>
                  {currentEntry && !isEditing && (
                    <span className="text-lg">{MOOD_EMOJIS[currentEntry.mood || 3]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button onClick={startEdit} className="btn-primary" style={{ padding: "5px 14px", fontSize: 12 }}>
                      {currentEntry ? <><Edit3 className="w-3.5 h-3.5 inline mr-1" />Düzenle</> : <><Plus className="w-3.5 h-3.5 inline mr-1" />Günlük Ekle</>}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: "5px 12px", fontSize: 12 }}>İptal</button>
                      <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ padding: "5px 14px", fontSize: 12 }}>
                        <Save className="w-3.5 h-3.5 inline mr-1" />
                        {isSaving ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                {!isEditing && !currentEntry ? (
                  <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Bu gün için günlük girişi yok</p>
                    <p className="text-xs">"Günlük Ekle" ile kaydetmeye başla</p>
                  </div>
                ) : !isEditing && currentEntry ? (
                  <div className="space-y-4">
                    {[
                      { label: "✅ İyi Giden Şeyler",      val: currentEntry.whatWentWell, color: "var(--green-dim)", border: "rgba(16,185,129,0.20)" },
                      { label: "🔄 Geliştirilecek Alanlar", val: currentEntry.toImprove,   color: "var(--amber-dim)", border: "rgba(245,158,11,0.20)" },
                      { label: "📝 Genel Notlar",           val: currentEntry.notes,       color: "var(--blue-dim)",  border: "rgba(59,130,246,0.20)" },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
                        <div className="p-3 rounded-xl text-sm" style={{ background: s.color, border: `1px solid ${s.border}`, color: "var(--text-secondary)" }}>
                          {s.val || <span style={{ color: "var(--text-muted)" }}>Belirtilmemiş</span>}
                        </div>
                      </div>
                    ))}
                    {currentEntry.tags && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>🏷️ Etiketler</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentEntry.tags.split(",").map((tag, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "whatWentWell", label: "✅ Bugün iyi giden şeyler nelerdi?", placeholder: "Başarılı stratejiler, iyi kararlar...", rows: 3 },
                      { key: "toImprove",    label: "🔄 Nerelerde gelişim gösterebilirim?", placeholder: "Hatalar, kaçırılan fırsatlar...",     rows: 3 },
                      { key: "notes",        label: "📝 Genel notlar ve gözlemler",        placeholder: "Piyasa koşulları, özel durumlar...", rows: 4 },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{field.label}</label>
                        <textarea
                          style={{ ...taStyle, minHeight: field.rows * 32 }}
                          value={(form as any)[field.key]}
                          onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={field.rows}
                        />
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>😊 Ruh Hali (1–5)</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v} type="button"
                              onClick={() => setForm(p => ({ ...p, mood: v }))}
                              className="w-10 h-10 rounded-full text-lg transition-all"
                              style={{
                                border: `2px solid ${form.mood === v ? "var(--brand)" : "var(--border-default)"}`,
                                background: form.mood === v ? "var(--brand-dim)" : "var(--bg-elevated)",
                              }}
                            >
                              {MOOD_EMOJIS[v]}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{MOOD_LABELS[form.mood]}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>🏷️ Etiketler (virgülle)</label>
                        <input
                          className="input"
                          value={form.tags}
                          onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                          placeholder="scalping, news-trading..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
