"use client";

import { useMemo } from "react";
import { Trade } from "@prisma/client";
import { calculateTradeMetrics, formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { useTheme } from "@/contexts/theme-context";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, PieChart as PieIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";

interface ReportsPageClientProps { trades: Trade[] }

const calcPnL = (t: Trade) =>
  (t.exitPrice - t.entryPrice) * t.qty * (t.side === "LONG" ? 1 : -1) - t.fees;

export default function ReportsPageClient({ trades }: ReportsPageClientProps) {
  const { theme } = useTheme();
  const metrics = calculateTradeMetrics(trades);

  const gridColor  = theme === "dark" ? "#1e232b" : "#f1f5f9";
  const axisColor  = theme === "dark" ? "#475569" : "#94a3b8";
  const tooltipBg  = theme === "dark" ? "#111418" : "#ffffff";
  const tooltipBorder = theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";

  const data = useMemo(() => {
    let cum = 0;
    const equity = trades.map((t, i) => {
      const p = calcPnL(t);
      cum += p;
      return { date: format(new Date(t.date), "dd MMM"), trade: i + 1, pnl: p, cum };
    });

    const dailyMap = new Map<string, number>();
    trades.forEach(t => {
      const key = format(startOfDay(new Date(t.date)), "yyyy-MM-dd");
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + calcPnL(t));
    });
    const daily = Array.from(dailyMap.entries()).map(([d, pnl]) => ({
      date: format(new Date(d), "dd MMM"), pnl,
    }));

    const wins = trades.filter(t => calcPnL(t) > 0).length;
    const winLoss = [
      { name: "Kazanan", value: wins,                  color: "#10b981" },
      { name: "Kaybeden", value: trades.length - wins, color: "#ef4444" },
    ];

    const symMap = new Map<string, number>();
    trades.forEach(t => symMap.set(t.symbol, (symMap.get(t.symbol) ?? 0) + calcPnL(t)));
    const bySymbol = Array.from(symMap.entries()).map(([symbol, pnl]) => ({ symbol, pnl })).sort((a, b) => b.pnl - a.pnl).slice(0, 10);

    const strMap = new Map<string, number>();
    trades.forEach(t => {
      const s = t.strategy || "Diğer";
      strMap.set(s, (strMap.get(s) ?? 0) + calcPnL(t));
    });
    const byStrategy = Array.from(strMap.entries()).map(([strategy, pnl]) => ({ strategy, pnl })).sort((a, b) => b.pnl - a.pnl);

    return { equity, daily, winLoss, bySymbol, byStrategy };
  }, [trades]);

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 text-xs" style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
        {payload.map((e: any, i: number) => (
          <p key={i} style={{ color: e.color ?? "var(--text-secondary)" }}>
            {e.name}: {typeof e.value === "number" ? formatCurrency(e.value) : e.value}
          </p>
        ))}
      </div>
    );
  };

  const kpis = [
    { label: "Net P&L",      val: formatCurrency(metrics.totalPnL, "USD", true), color: metrics.totalPnL >= 0 ? "#10b981" : "#ef4444", Icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown, accent: metrics.totalPnL >= 0 ? "accent-green" : "accent-red" },
    { label: "Win Rate",     val: `${metrics.winRate.toFixed(1)}%`,              color: metrics.winRate >= 50 ? "#10b981" : "#f59e0b",  Icon: Target,    accent: "accent-teal" },
    { label: "Profit Factor",val: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2), color: metrics.profitFactor >= 1 ? "#10b981" : "#ef4444", Icon: Activity, accent: "accent-teal" },
    { label: "Max Drawdown", val: formatCurrency(metrics.maxDrawdown),           color: "#ef4444",                                       Icon: TrendingDown, accent: "accent-red" },
  ];

  const SectionTitle = ({ icon: Icon, children }: { icon: any, children: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <Icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{children}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">

        {/* KPI strip */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className={`kpi-card ${k.accent}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{k.label}</p>
                <k.Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums" style={{ color: k.color }}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        <div className="card overflow-hidden">
          <SectionTitle icon={TrendingUp}>Equity Curve</SectionTitle>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.equity}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="cum" stroke="#0d9488" strokeWidth={2} fill="url(#tealGrad)" name="Kümülatif P&L" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily PnL + Win/Loss */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <SectionTitle icon={BarChart3}>Günlük P&L</SectionTitle>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                    {data.daily.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <SectionTitle icon={PieIcon}>Kazanma / Kaybetme</SectionTitle>
            <div className="p-5 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.winLoss} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {data.winLoss.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Symbol + Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <SectionTitle icon={BarChart3}>Sembol Bazında P&L</SectionTitle>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.bySymbol} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v)} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="symbol" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                    {data.bySymbol.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <SectionTitle icon={BarChart3}>Strateji Bazında P&L</SectionTitle>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byStrategy}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="strategy" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                    {data.byStrategy.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#0d9488" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed metrics */}
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Detaylı Metrikler</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Genel", rows: [
                { label: "Toplam İşlem",    val: trades.length.toString() },
                { label: "Kazanan İşlem",   val: metrics.winningTrades.toString(), color: "#10b981" },
                { label: "Kaybeden İşlem",  val: metrics.losingTrades.toString(),  color: "#ef4444" },
                { label: "En Büyük Kazanç", val: formatCurrency(metrics.bestTrade),  color: "#10b981" },
                { label: "En Büyük Kayıp",  val: formatCurrency(metrics.worstTrade), color: "#ef4444" },
              ]},
              { title: "Ortalamalar", rows: [
                { label: "Ort. Kazanç",       val: formatCurrency(metrics.avgWin),    color: "#10b981" },
                { label: "Ort. Kayıp",        val: formatCurrency(metrics.avgLoss),   color: "#ef4444" },
                { label: "Ort. İşlem",        val: formatCurrency(metrics.expectancy) },
                { label: "Risk/Ödül",         val: (Math.abs(metrics.avgWin) / (Math.abs(metrics.avgLoss) || 1)).toFixed(2) },
                { label: "Expectancy",        val: formatCurrency(metrics.expectancy), color: metrics.expectancy >= 0 ? "#10b981" : "#ef4444" },
              ]},
              { title: "Risk", rows: [
                { label: "Profit Factor",   val: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2) },
                { label: "Win Rate",        val: `${metrics.winRate.toFixed(1)}%` },
                { label: "Max Drawdown",    val: formatCurrency(metrics.maxDrawdown), color: "#ef4444" },
                ...(metrics.avgRMultiple !== null ? [{ label: "Ort. R", val: `${metrics.avgRMultiple >= 0 ? "+" : ""}${metrics.avgRMultiple.toFixed(2)}R` }] : []),
              ]},
            ].map(section => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{section.title}</p>
                <div className="space-y-2">
                  {section.rows.map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                      <span className="text-xs font-semibold font-mono tabular-nums" style={{ color: (row as any).color ?? "var(--text-primary)" }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
