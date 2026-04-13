"use client";

import { Trade, JournalEntry } from "@prisma/client";
import { calculateTradeMetrics, calculateStreak, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Zap, AlertTriangle } from "lucide-react";
import TradingCalendar from "./trading-calendar";

interface Props {
  trades: Trade[];
  journalEntries: JournalEntry[];
}

export default function DashboardContent({ trades, journalEntries }: Props) {
  const metrics = calculateTradeMetrics(trades);
  const streak  = calculateStreak(trades);

  const handleUpdate = () => window.location.reload();

  const last30 = trades.filter(t => {
    const d = new Date(t.date);
    const ago = new Date();
    ago.setDate(ago.getDate() - 30);
    return d >= ago;
  });
  const last30Metrics = calculateTradeMetrics(last30);

  // Haftalık breakdown (son 4 hafta)
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const end   = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const weekTrades = trades.filter(t => {
      const d = new Date(t.date);
      return d >= start && d < end;
    });
    const wm = calculateTradeMetrics(weekTrades);
    return { label: `Hafta ${4 - i}`, pnl: wm.totalPnL, trades: weekTrades.length, winRate: wm.winRate };
  }).reverse();

  const maxAbsPnl = Math.max(...weeklyData.map(w => Math.abs(w.pnl)), 1);

  const kpis = [
    {
      label: "Net P&L",
      value: formatCurrency(metrics.totalPnL, "USD", true),
      sub: `${trades.length} toplam işlem`,
      positive: metrics.totalPnL >= 0,
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      accent: metrics.totalPnL >= 0 ? "accent-green" : "accent-red",
      iconBg: metrics.totalPnL >= 0 ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
      iconColor: metrics.totalPnL >= 0 ? "#10b981" : "#ef4444",
      valueColor: metrics.totalPnL >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Profit Factor",
      value: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2),
      sub: metrics.profitFactor >= 1.5 ? "Mükemmel" : metrics.profitFactor >= 1 ? "Pozitif" : "Negatif",
      positive: metrics.profitFactor >= 1,
      icon: Target,
      accent: metrics.profitFactor >= 1 ? "accent-teal" : "accent-red",
      iconBg: "rgba(13,148,136,0.10)",
      iconColor: "#0d9488",
      valueColor: metrics.profitFactor >= 1.5 ? "#10b981" : metrics.profitFactor >= 1 ? "#0d9488" : "#ef4444",
    },
    {
      label: "Win Rate",
      value: `${metrics.winRate.toFixed(1)}%`,
      sub: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      positive: metrics.winRate >= 50,
      icon: Zap,
      accent: metrics.winRate >= 50 ? "accent-green" : "accent-amber",
      iconBg: metrics.winRate >= 50 ? "rgba(16,185,129,0.10)" : "rgba(245,158,11,0.10)",
      iconColor: metrics.winRate >= 50 ? "#10b981" : "#f59e0b",
      valueColor: metrics.winRate >= 50 ? "#10b981" : "#f59e0b",
    },
    {
      label: "Max Drawdown",
      value: formatCurrency(metrics.maxDrawdown),
      sub: "Toplam düşüş zirvesi",
      positive: false,
      icon: AlertTriangle,
      accent: "accent-red",
      iconBg: "rgba(239,68,68,0.10)",
      iconColor: "#ef4444",
      valueColor: "#ef4444",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`kpi-card ${kpi.accent}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  {kpi.label}
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.iconBg }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.iconColor }} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: kpi.valueColor }}>
                {kpi.value}
              </div>
              <div className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Calendar — 2 cols */}
        <div className="xl:col-span-2">
          <TradingCalendar
            trades={trades}
            journalEntries={journalEntries}
            onTradeUpdate={handleUpdate}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Win Rate Gauge */}
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#94a3b8" }}>Win Rate</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke={metrics.winRate >= 50 ? "#10b981" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(metrics.winRate / 100) * 201} 201`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold font-mono" style={{ color: "#0f172a" }}>
                    {metrics.winRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { label: "Kazanan", val: metrics.winningTrades, color: "#10b981" },
                  { label: "Kaybeden", val: metrics.losingTrades, color: "#ef4444" },
                  { label: "Toplam", val: metrics.totalTrades, color: "#0f172a" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span style={{ color: "#94a3b8" }}>{row.label}</span>
                    <span className="font-semibold font-mono" style={{ color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trade Stats */}
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#94a3b8" }}>
              İşlem İstatistikleri
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Ort. Kazanç",  val: formatCurrency(metrics.avgWin, "USD", true),        color: "#10b981" },
                { label: "Ort. Kayıp",   val: formatCurrency(-metrics.avgLoss, "USD", true),       color: "#ef4444" },
                { label: "Expectancy",   val: formatCurrency(metrics.expectancy, "USD", true),      color: metrics.expectancy >= 0 ? "#10b981" : "#ef4444" },
                { label: "En İyi",       val: formatCurrency(metrics.bestTrade, "USD", true),       color: "#10b981" },
                { label: "En Kötü",      val: formatCurrency(metrics.worstTrade, "USD", true),      color: "#ef4444" },
                ...(metrics.avgRMultiple !== null ? [{ label: "Ort. R", val: `${metrics.avgRMultiple >= 0 ? "+" : ""}${metrics.avgRMultiple.toFixed(2)}R`, color: metrics.avgRMultiple >= 0 ? "#10b981" : "#ef4444" }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-0.5">
                  <span className="text-xs" style={{ color: "#64748b" }}>{row.label}</span>
                  <span className="text-xs font-semibold font-mono tabular-nums" style={{ color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#94a3b8" }}>
              Haftalık Özet
            </p>
            <div className="space-y-3">
              {weeklyData.map(w => (
                <div key={w.label} className="flex items-center gap-3">
                  <div className="text-xs w-14 flex-shrink-0 font-medium" style={{ color: "#64748b" }}>{w.label}</div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (Math.abs(w.pnl) / maxAbsPnl) * 100)}%`,
                        background: w.pnl >= 0 ? "#10b981" : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="text-xs font-semibold font-mono text-right w-20 flex-shrink-0 tabular-nums" style={{ color: w.pnl >= 0 ? "#10b981" : "#ef4444" }}>
                    {formatCurrency(w.pnl, "USD", true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam İşlem",  val: metrics.totalTrades.toString(),                                   color: "#0f172a" },
          { label: "En İyi İşlem",  val: formatCurrency(metrics.bestTrade, "USD", true),                   color: "#10b981" },
          { label: "En Kötü İşlem", val: formatCurrency(metrics.worstTrade, "USD", true),                  color: "#ef4444" },
          { label: "Son 30 Gün",    val: formatCurrency(last30Metrics.totalPnL, "USD", true),              color: last30Metrics.totalPnL >= 0 ? "#10b981" : "#ef4444" },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-xl font-bold font-mono tabular-nums" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className="text-xs mt-1.5 font-medium" style={{ color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
