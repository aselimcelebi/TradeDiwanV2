"use client";

import { Trade, JournalEntry } from "@prisma/client";
import { calculateTradeMetrics, calculateStreak, formatCurrency, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Zap, BarChart3, Award, AlertTriangle } from "lucide-react";
import TradingCalendar from "./trading-calendar";

interface Props {
  trades: Trade[];
  journalEntries: JournalEntry[];
}

export default function DashboardContent({ trades, journalEntries }: Props) {
  const metrics = calculateTradeMetrics(trades);
  const streak  = calculateStreak(trades);

  const handleUpdate = () => window.location.reload();

  // Gerçek bakiye hesabı — son 30 günün P&L'i
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
    return {
      label: `Hafta ${4 - i}`,
      pnl: wm.totalPnL,
      trades: weekTrades.length,
      winRate: wm.winRate,
    };
  }).reverse();

  const kpis = [
    {
      label: "Net P&L",
      value: formatCurrency(metrics.totalPnL, "USD", true),
      sub: `${last30.length} işlem, son 30 gün`,
      color: metrics.totalPnL >= 0 ? "var(--green)" : "var(--red)",
      icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown,
      bg: metrics.totalPnL >= 0 ? "var(--green-dim)" : "var(--red-dim)",
    },
    {
      label: "Profit Factor",
      value: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2),
      sub: metrics.profitFactor >= 1.5 ? "Mükemmel" : metrics.profitFactor >= 1 ? "Pozitif" : "Negatif",
      color: metrics.profitFactor >= 1.5 ? "var(--green)" : metrics.profitFactor >= 1 ? "var(--amber)" : "var(--red)",
      icon: Target,
      bg: metrics.profitFactor >= 1 ? "var(--green-dim)" : "var(--red-dim)",
    },
    {
      label: "Seri",
      value: `${streak.current} ${streak.type === "win" ? "W" : streak.type === "loss" ? "L" : "—"}`,
      sub: streak.type === "win" ? "Kazanma serisi" : streak.type === "loss" ? "Kayıp serisi" : "Seri yok",
      color: streak.type === "win" ? "var(--green)" : streak.type === "loss" ? "var(--red)" : "var(--text-secondary)",
      icon: Zap,
      bg: streak.type === "win" ? "var(--green-dim)" : streak.type === "loss" ? "var(--red-dim)" : "var(--bg-elevated)",
    },
    {
      label: "Max Drawdown",
      value: formatCurrency(metrics.maxDrawdown),
      sub: "Toplam kayıp zirvesi",
      color: "var(--red)",
      icon: AlertTriangle,
      bg: "var(--red-dim)",
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {kpi.label}
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: kpi.bg }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Calendar — 2 cols */}
        <div className="xl:col-span-2">
          <TradingCalendar
            trades={trades}
            journalEntries={journalEntries}
            onTradeUpdate={handleUpdate}
          />
        </div>

        {/* Right widgets */}
        <div className="space-y-4">

          {/* Win Rate gauge */}
          <div className="card p-5">
            <div className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              Win Rate
            </div>
            <div className="flex items-center gap-4">
              {/* Circle gauge */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={metrics.winRate >= 50 ? "var(--green)" : "var(--red)"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(metrics.winRate / 100) * 213.6} 213.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                    {metrics.winRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Kazanan</span>
                  <span className="font-medium font-mono" style={{ color: "var(--green)" }}>{metrics.winningTrades}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Kaybeden</span>
                  <span className="font-medium font-mono" style={{ color: "var(--red)" }}>{metrics.losingTrades}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Toplam</span>
                  <span className="font-medium font-mono" style={{ color: "var(--text-primary)" }}>{metrics.totalTrades}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Stats */}
          <div className="card p-5">
            <div className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              İşlem İstatistikleri
            </div>
            <div className="space-y-3">
              {[
                { label: "Ort. Kazanç", val: formatCurrency(metrics.avgWin, "USD", true), c: "var(--green)" },
                { label: "Ort. Kayıp",  val: formatCurrency(-metrics.avgLoss, "USD", true), c: "var(--red)" },
                { label: "Expectancy",  val: formatCurrency(metrics.expectancy, "USD", true), c: metrics.expectancy >= 0 ? "var(--green)" : "var(--red)" },
                { label: "En İyi",      val: formatCurrency(metrics.bestTrade, "USD", true),  c: "var(--green)" },
                { label: "En Kötü",     val: formatCurrency(metrics.worstTrade, "USD", true), c: "var(--red)" },
                ...(metrics.avgRMultiple !== null ? [{ label: "Ort. R", val: `${metrics.avgRMultiple >= 0 ? "+" : ""}${metrics.avgRMultiple.toFixed(2)}R`, c: metrics.avgRMultiple >= 0 ? "var(--green)" : "var(--red)" }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="text-xs font-medium font-mono tabular-nums" style={{ color: row.c }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly breakdown */}
          <div className="card p-5">
            <div className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              Haftalık Özet
            </div>
            <div className="space-y-3">
              {weeklyData.map(w => (
                <div key={w.label} className="flex items-center gap-3">
                  <div className="text-xs w-14 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{w.label}</div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.abs(w.pnl) / 100)}%`,
                        background: w.pnl >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    />
                  </div>
                  <div className="text-xs font-mono text-right w-20 flex-shrink-0" style={{ color: w.pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                    {formatCurrency(w.pnl, "USD", true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam İşlem",  val: metrics.totalTrades.toString(),         mono: true  },
          { label: "En İyi İşlem",  val: formatCurrency(metrics.bestTrade, "USD", true), col: "var(--green)" },
          { label: "En Kötü İşlem", val: formatCurrency(metrics.worstTrade, "USD", true), col: "var(--red)" },
          { label: "Son 30 Gün",    val: formatCurrency(last30Metrics.totalPnL, "USD", true), col: last30Metrics.totalPnL >= 0 ? "var(--green)" : "var(--red)" },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-xl font-bold font-mono tabular-nums" style={{ color: (s as any).col ?? "var(--text-primary)" }}>
              {s.val}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
