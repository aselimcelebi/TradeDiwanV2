"use client";

import { useState } from "react";
import { cn, formatCurrency, calculatePnL } from "@/lib/utils";
import { X, DollarSign, TrendingUp, TrendingDown, Star } from "lucide-react";

interface Trade {
  date:         string;
  symbol:       string;
  side:         "LONG" | "SHORT";
  qty:          number;
  entryPrice:   number;
  exitPrice:    number;
  fees:         number;
  risk?:        number;
  strategy?:    string;
  notes?:       string;
  tags?:        string;
  imageUrl?:    string;
  setupGrade?:  "A" | "B" | "C" | "D";
  emotionScore?: number;
}

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSubmit:   (trade: Trade) => Promise<void>;
  editTrade?: Trade & { id: string };
}

const GRADES = ["A", "B", "C", "D"] as const;
const MOODS  = ["😫", "😕", "😐", "🙂", "😄"];

export default function AddTradeModal({ isOpen, onClose, onSubmit, editTrade }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const [form, setForm] = useState<Trade>(() => editTrade ? {
    date:         new Date(editTrade.date).toISOString().slice(0, 16),
    symbol:       editTrade.symbol,
    side:         editTrade.side,
    qty:          editTrade.qty,
    entryPrice:   editTrade.entryPrice,
    exitPrice:    editTrade.exitPrice,
    fees:         editTrade.fees,
    risk:         editTrade.risk,
    strategy:     editTrade.strategy ?? "",
    notes:        editTrade.notes ?? "",
    tags:         editTrade.tags ?? "",
    imageUrl:     editTrade.imageUrl ?? "",
    setupGrade:   editTrade.setupGrade,
    emotionScore: editTrade.emotionScore,
  } : {
    date:         new Date().toISOString().slice(0, 16),
    symbol:       "",
    side:         "LONG",
    qty:          0,
    entryPrice:   0,
    exitPrice:    0,
    fees:         0,
    strategy:     "",
    notes:        "",
    tags:         "",
    imageUrl:     "",
    emotionScore: 3,
  });

  const pnl = form.entryPrice && form.exitPrice && form.qty
    ? calculatePnL(form.entryPrice, form.exitPrice, form.qty, form.side, form.fees) : 0;
  const rMultiple = form.risk && form.risk > 0 && pnl !== 0 ? pnl / form.risk : null;

  const update = (k: keyof Trade, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.date)              e.date       = "Tarih gerekli";
    if (!form.symbol.trim())     e.symbol     = "Sembol gerekli";
    if (form.qty <= 0)           e.qty        = "Miktar 0'dan büyük olmalı";
    if (form.entryPrice <= 0)    e.entryPrice = "Giriş fiyatı gerekli";
    if (form.exitPrice <= 0)     e.exitPrice  = "Çıkış fiyatı gerekli";
    if (form.fees < 0)           e.fees       = "Komisyon negatif olamaz";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "var(--text-muted)" };
  const errCls = "text-xs mt-1" ;
  const errStyle = { color: "var(--red)" };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl animate-slide-up"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {editTrade ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Side selector */}
            <div className="grid grid-cols-2 gap-3">
              {(["LONG", "SHORT"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update("side", s)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: form.side === s
                      ? (s === "LONG" ? "var(--green-dim)" : "var(--red-dim)")
                      : "var(--bg-surface)",
                    border: `1px solid ${form.side === s ? (s === "LONG" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)") : "var(--border-default)"}`,
                    color: form.side === s ? (s === "LONG" ? "var(--green)" : "var(--red)") : "var(--text-muted)",
                  }}
                >
                  {s === "LONG"
                    ? <TrendingUp className="w-4 h-4" />
                    : <TrendingDown className="w-4 h-4" />
                  }
                  {s}
                </button>
              ))}
            </div>

            {/* Date + Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Tarih & Saat *</label>
                <input type="datetime-local" className={cn("input", errors.date && "border-red-500")}
                  value={form.date} onChange={e => update("date", e.target.value)} />
                {errors.date && <p className={errCls} style={errStyle}>{errors.date}</p>}
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Sembol *</label>
                <input type="text" className={cn("input", errors.symbol && "border-red-500")}
                  placeholder="BTCUSDT, EURUSD..." value={form.symbol}
                  onChange={e => update("symbol", e.target.value.toUpperCase())} />
                {errors.symbol && <p className={errCls} style={errStyle}>{errors.symbol}</p>}
              </div>
            </div>

            {/* Qty + Risk */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Miktar *</label>
                <input type="number" step="any" className={cn("input", errors.qty && "border-red-500")}
                  placeholder="0.001" value={form.qty || ""}
                  onChange={e => update("qty", parseFloat(e.target.value) || 0)} />
                {errors.qty && <p className={errCls} style={errStyle}>{errors.qty}</p>}
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Risk ($)</label>
                <input type="number" step="any" className="input" placeholder="50.00"
                  value={form.risk || ""} onChange={e => update("risk", parseFloat(e.target.value) || undefined)} />
              </div>
            </div>

            {/* Entry + Exit + Fees */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "entryPrice", label: "Giriş Fiyatı *" },
                { key: "exitPrice",  label: "Çıkış Fiyatı *" },
                { key: "fees",       label: "Komisyon" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls} style={labelStyle}>{label}</label>
                  <input type="number" step="any" className={cn("input", errors[key] && "border-red-500")}
                    placeholder="0.00" value={(form as any)[key] || ""}
                    onChange={e => update(key as keyof Trade, parseFloat(e.target.value) || 0)} />
                  {errors[key] && <p className={errCls} style={errStyle}>{errors[key]}</p>}
                </div>
              ))}
            </div>

            {/* PnL Preview */}
            {form.entryPrice && form.exitPrice && form.qty > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>Tahmini sonuç</span>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono" style={{ color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                      {formatCurrency(pnl, "USD", true)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>P&L</div>
                  </div>
                  {rMultiple !== null && (
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono" style={{ color: rMultiple >= 0 ? "var(--green)" : "var(--red)" }}>
                        {rMultiple >= 0 ? "+" : ""}{rMultiple.toFixed(2)}R
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>R Çarpanı</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Setup Grade + Emotion */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Setup Kalitesi</label>
                <div className="flex gap-2">
                  {GRADES.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update("setupGrade", form.setupGrade === g ? undefined : g)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                      style={{
                        background: form.setupGrade === g ? "var(--brand-dim)" : "var(--bg-surface)",
                        border: `1px solid ${form.setupGrade === g ? "var(--brand)" : "var(--border-subtle)"}`,
                        color: form.setupGrade === g ? "var(--brand-light)" : "var(--text-muted)",
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Psikolojik Durum</label>
                <div className="flex gap-2">
                  {MOODS.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => update("emotionScore", i + 1)}
                      className="flex-1 py-2 rounded-lg text-sm transition-all"
                      style={{
                        background: form.emotionScore === i + 1 ? "var(--bg-hover)" : "var(--bg-surface)",
                        border: `1px solid ${form.emotionScore === i + 1 ? "var(--border-strong)" : "var(--border-subtle)"}`,
                        opacity: form.emotionScore && form.emotionScore !== i + 1 ? 0.4 : 1,
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategy + Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Strateji</label>
                <input type="text" className="input" placeholder="Breakout, Scalping..."
                  value={form.strategy ?? ""} onChange={e => update("strategy", e.target.value)} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Etiketler</label>
                <input type="text" className="input" placeholder="morning, news, volatility"
                  value={form.tags ?? ""} onChange={e => update("tags", e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls} style={labelStyle}>Notlar</label>
              <textarea rows={3} className="input resize-none"
                placeholder="Analiz, piyasa koşulları, dersler..."
                value={form.notes ?? ""} onChange={e => update("notes", e.target.value)} />
            </div>

            {/* Image URL */}
            <div>
              <label className={labelCls} style={labelStyle}>Ekran Görüntüsü URL</label>
              <input type="url" className="input" placeholder="https://..."
                value={form.imageUrl ?? ""} onChange={e => update("imageUrl", e.target.value)} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                İptal
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : editTrade ? "Güncelle" : "İşlem Ekle"
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
