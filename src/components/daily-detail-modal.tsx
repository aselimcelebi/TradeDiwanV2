"use client";

import { useState } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculatePnL, formatCurrency, formatDateTime } from "@/lib/utils";
import { X, Edit, Trash2, Plus, TrendingUp, TrendingDown, Save, FileText } from "lucide-react";
import AddTradeModal from "./add-trade-modal";

interface DayData {
  date: Date;
  trades: Trade[];
  journalEntry?: JournalEntry;
  totalPnL: number;
  tradeCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DailyDetailModalProps {
  day: DayData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DailyDetailModal({ day, isOpen, onClose, onUpdate }: DailyDetailModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"trades" | "journal">("trades");
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [journalData, setJournalData] = useState({
    whatWentWell: day.journalEntry?.whatWentWell || "",
    toImprove:    day.journalEntry?.toImprove    || "",
    mood:         day.journalEntry?.mood         || 3,
    notes:        day.journalEntry?.notes        || "",
    tags:         day.journalEntry?.tags         || "",
  });
  const [savingJournal, setSavingJournal] = useState(false);

  if (!isOpen) return null;

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm("Bu işlemi silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await fetch(`/api/trades?id=${tradeId}`, { method: "DELETE" });
      if (res.ok) onUpdate?.();
    } catch (err) { console.error(err); }
  };

  const handleEditTrade = async (tradeData: any) => {
    try {
      const res = await fetch("/api/trades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tradeData, id: editingTrade?.id }),
      });
      if (res.ok) { setEditingTrade(null); onUpdate?.(); }
    } catch (err) { console.error(err); }
  };

  const handleAddTrade = async (tradeData: any) => {
    try {
      const dayDate = new Date(day.date);
      dayDate.setHours(12, 0, 0, 0);
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tradeData, date: dayDate.toISOString() }),
      });
      if (res.ok) { setShowAddTrade(false); onUpdate?.(); }
    } catch (err) { console.error(err); }
  };

  const handleSaveJournal = async () => {
    setSavingJournal(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...journalData, date: day.date.toISOString() }),
      });
      if (res.ok) onUpdate?.();
    } catch (err) { console.error(err); }
    finally { setSavingJournal(false); }
  };

  const moodEmojis  = ["😞", "😕", "😐", "😊", "😄"];
  const moodLabelsTR = ["Çok Kötü", "Kötü", "Nötr", "İyi", "Mükemmel"];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-base)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    resize: "none" as any,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "6px",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {day.date.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm font-medium" style={{ color: day.totalPnL >= 0 ? "var(--green)" : "var(--red)" }}>
                  {formatCurrency(day.totalPnL, "USD", true)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{day.tradeCount} işlem</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
            {[
              { key: "trades", label: `İşlemler (${day.tradeCount})` },
              { key: "journal", label: "Günlük" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                style={{
                  color: activeTab === tab.key ? "var(--brand-light)" : "var(--text-muted)",
                  borderColor: activeTab === tab.key ? "var(--brand)" : "transparent",
                  background: "transparent",
                }}
              >
                {tab.label}
                {tab.key === "journal" && day.journalEntry && (
                  <span className="ml-2 w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--brand)" }} />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === "trades" ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>İşlemler</h3>
                  <button
                    onClick={() => setShowAddTrade(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    İşlem Ekle
                  </button>
                </div>

                {day.trades.length > 0 ? (
                  <div className="space-y-3">
                    {day.trades.map(trade => {
                      const pnl = calculatePnL(trade.entryPrice, trade.exitPrice, trade.qty, trade.side as "LONG" | "SHORT", trade.fees);
                      return (
                        <div
                          key={trade.id}
                          className="rounded-xl p-4"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: trade.side === "LONG" ? "var(--green-dim)" : "var(--red-dim)",
                                }}
                              >
                                {trade.side === "LONG"
                                  ? <TrendingUp className="w-4 h-4" style={{ color: "var(--green)" }} />
                                  : <TrendingDown className="w-4 h-4" style={{ color: "var(--red)" }} />
                                }
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                  {trade.symbol} — {trade.side}
                                </div>
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {trade.qty} @ {formatCurrency(trade.entryPrice)} → {formatCurrency(trade.exitPrice)}
                                </div>
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {formatDateTime(trade.date)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-bold font-mono" style={{ color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                                  {formatCurrency(pnl, "USD", true)}
                                </div>
                                {trade.strategy && (
                                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{trade.strategy}</div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingTrade(trade)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "var(--text-muted)" }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTrade(trade.id)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "var(--text-muted)" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {trade.notes && (
                            <div className="mt-3 text-xs p-3 rounded-lg" style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}>
                              {trade.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    Bu gün için henüz işlem bulunmuyor
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Günlük Değerlendirme</h3>
                  <button
                    onClick={handleSaveJournal}
                    disabled={savingJournal}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--brand)", color: "#fff", opacity: savingJournal ? 0.7 : 1 }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingJournal ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>

                {/* Mood */}
                <div>
                  <label style={labelStyle}>Günün Genel Havası</label>
                  <div className="flex gap-2">
                    {moodEmojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setJournalData(p => ({ ...p, mood: i + 1 }))}
                        className="w-11 h-11 rounded-xl text-lg transition-all"
                        style={{
                          border: `1px solid ${journalData.mood === i + 1 ? "var(--brand)" : "var(--border-default)"}`,
                          background: journalData.mood === i + 1 ? "var(--brand-dim)" : "var(--bg-base)",
                          opacity: journalData.mood && journalData.mood !== i + 1 ? 0.4 : 1,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {journalData.mood && (
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {moodLabelsTR[journalData.mood - 1]}
                    </div>
                  )}
                </div>

                {[
                  { key: "whatWentWell", label: "İyi Giden Şeyler",       placeholder: "Bugün trading'de iyi giden şeyler..." },
                  { key: "toImprove",   label: "Geliştirilecek Alanlar",  placeholder: "Gelecek sefer dikkat edilecek noktalar..." },
                  { key: "notes",       label: "Genel Notlar",            placeholder: "Piyasa koşulları, duygusal durum..." },
                ].map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <textarea
                      rows={3}
                      value={(journalData as any)[field.key]}
                      onChange={e => setJournalData(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  </div>
                ))}

                <div>
                  <label style={labelStyle}>Etiketler</label>
                  <input
                    type="text"
                    value={journalData.tags}
                    onChange={e => setJournalData(p => ({ ...p, tags: e.target.value }))}
                    placeholder="odaklı, sabırlı, duygusal (virgülle ayırın)"
                    style={{ ...inputStyle, resize: undefined }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddTrade && (
        <AddTradeModal isOpen onClose={() => setShowAddTrade(false)} onSubmit={handleAddTrade} />
      )}
      {editingTrade && (
        <AddTradeModal isOpen onClose={() => setEditingTrade(null)} onSubmit={handleEditTrade} editTrade={editingTrade as any} />
      )}
    </>
  );
}
