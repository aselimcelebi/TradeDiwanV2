"use client";

import { useMemo } from "react";
import { Trade } from "@prisma/client";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import {
  Lightbulb, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Target, Zap, Eye, AlertCircle,
} from "lucide-react";
import { getDay, differenceInDays } from "date-fns";

interface InsightsPageClientProps { trades: Trade[] }

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "danger";
  category: "performance" | "behavior" | "timing" | "risk";
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
  confidence: number;
}

const calcPnL = (t: Trade) =>
  (t.exitPrice - t.entryPrice) * t.qty * (t.side === "LONG" ? 1 : -1) - t.fees;

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function InsightsPageClient({ trades }: InsightsPageClientProps) {
  const insights = useMemo<Insight[]>(() => {
    if (trades.length === 0) return [{
      id: "no-data", type: "info", category: "performance",
      title: "Henüz analiz edecek veri yok",
      description: "Insights oluşturmak için daha fazla işlem verisi gerekiyor.",
      confidence: 100,
    }];

    const result: Insight[] = [];
    const total   = trades.length;
    const wins    = trades.filter(t => calcPnL(t) > 0);
    const winRate = (wins.length / total) * 100;

    if (winRate >= 70) result.push({ id: "high-wr", type: "success", category: "performance", title: "Yüksek Kazanma Oranı", description: `%${winRate.toFixed(1)} kazanma oranınız mükemmel seviyede.`, metric: formatPercentage(winRate / 100), confidence: 95 });
    else if (winRate < 40) result.push({ id: "low-wr", type: "warning", category: "performance", title: "Düşük Kazanma Oranı", description: `%${winRate.toFixed(1)} kazanma oranınız gelişime açık. Giriş kriterlerinizi gözden geçirin.`, metric: formatPercentage(winRate / 100), recommendation: "Strateji kurallarınızı daha sıkı uygulayın ve risk yönetimini geliştirin.", confidence: 85 });

    const dayMap = new Map<number, { trades: number; pnl: number; wins: number }>();
    trades.forEach(t => {
      const d = getDay(new Date(t.date)), p = calcPnL(t);
      const cur = dayMap.get(d) ?? { trades: 0, pnl: 0, wins: 0 };
      dayMap.set(d, { trades: cur.trades + 1, pnl: cur.pnl + p, wins: cur.wins + (p > 0 ? 1 : 0) });
    });
    let bestDay = { day: -1, wr: 0, pnl: 0 }, worstDay = { day: -1, wr: 100, pnl: 0 };
    dayMap.forEach((v, d) => {
      if (v.trades < 3) return;
      const wr = (v.wins / v.trades) * 100;
      if (wr > bestDay.wr)  bestDay  = { day: d, wr, pnl: v.pnl };
      if (wr < worstDay.wr) worstDay = { day: d, wr, pnl: v.pnl };
    });
    if (bestDay.day >= 0 && bestDay.wr > 60)
      result.push({ id: "best-day", type: "success", category: "timing", title: `${DAY_NAMES[bestDay.day]} Günleri Güçlü`, description: `${DAY_NAMES[bestDay.day]} günlerinde %${bestDay.wr.toFixed(1)} kazanma oranı ile en iyi performansınızı gösteriyorsunuz.`, metric: formatPercentage(bestDay.wr / 100), recommendation: `${DAY_NAMES[bestDay.day]} günlerinde daha aktif trading yapabilirsiniz.`, confidence: 80 });
    if (worstDay.day >= 0 && worstDay.wr < 40)
      result.push({ id: "worst-day", type: "warning", category: "timing", title: `${DAY_NAMES[worstDay.day]} Günleri Zorlu`, description: `${DAY_NAMES[worstDay.day]} günlerinde %${worstDay.wr.toFixed(1)} kazanma oranı ile zorlanıyorsunuz.`, metric: formatPercentage(worstDay.wr / 100), recommendation: `${DAY_NAMES[worstDay.day]} günlerinde daha az işlem yapın.`, confidence: 75 });

    const symMap = new Map<string, { trades: number; pnl: number; wins: number }>();
    trades.forEach(t => {
      const p = calcPnL(t), cur = symMap.get(t.symbol) ?? { trades: 0, pnl: 0, wins: 0 };
      symMap.set(t.symbol, { trades: cur.trades + 1, pnl: cur.pnl + p, wins: cur.wins + (p > 0 ? 1 : 0) });
    });
    const bestSym = Array.from(symMap.entries()).filter(([, v]) => v.trades >= 3).sort((a, b) => (b[1].wins / b[1].trades) - (a[1].wins / a[1].trades))[0];
    if (bestSym && (bestSym[1].wins / bestSym[1].trades) > 0.6)
      result.push({ id: "best-sym", type: "success", category: "performance", title: `${bestSym[0]} Sembolünde Başarılı`, description: `${bestSym[0]} sembolünde %${((bestSym[1].wins / bestSym[1].trades) * 100).toFixed(1)} kazanma oranı ile güçlüsünüz.`, metric: formatCurrency(bestSym[1].pnl), recommendation: `${bestSym[0]} sembolüne daha fazla odaklanabilirsiniz.`, confidence: 85 });

    const strMap = new Map<string, { trades: number; pnl: number }>();
    trades.forEach(t => {
      const s = t.strategy || "Unknown", p = calcPnL(t), cur = strMap.get(s) ?? { trades: 0, pnl: 0 };
      strMap.set(s, { trades: cur.trades + 1, pnl: cur.pnl + p });
    });
    const bestStr = Array.from(strMap.entries()).filter(([, v]) => v.trades >= 3).sort((a, b) => b[1].pnl - a[1].pnl)[0];
    if (bestStr && bestStr[1].pnl > 0)
      result.push({ id: "best-str", type: "success", category: "behavior", title: `${bestStr[0]} Stratejisi Etkili`, description: `${bestStr[0]} stratejiniz ${formatCurrency(bestStr[1].pnl)} toplam kazanç sağladı.`, metric: formatCurrency(bestStr[1].pnl), recommendation: "Bu stratejiye daha fazla odaklanın ve kurallarını optimize edin.", confidence: 90 });

    if (trades.length > 1) {
      const days = differenceInDays(new Date(trades[trades.length - 1].date), new Date(trades[0].date)) || 1;
      const freq = trades.length / days;
      if (freq > 10) result.push({ id: "overtrading", type: "warning", category: "behavior", title: "Yüksek İşlem Frekansı", description: `Günde ortalama ${freq.toFixed(1)} işlem yapıyorsunuz. Overtrading riskine dikkat.`, recommendation: "Kalite odaklı trading yapın, işlem sayısını azaltın.", confidence: 75 });
    }

    const recent = trades.slice(-10);
    if (recent.length >= 5) {
      const rw = recent.filter(t => calcPnL(t) > 0).length / recent.length;
      if (rw > 0.7) result.push({ id: "recent-up", type: "success", category: "performance", title: "Son Dönem Performansı Güçlü", description: `Son ${recent.length} işlemde %${(rw * 100).toFixed(1)} kazanma oranı.`, metric: formatPercentage(rw), confidence: 80 });
      else if (rw < 0.3) result.push({ id: "recent-down", type: "danger", category: "performance", title: "Son Dönem Performansı Düşük", description: `Son ${recent.length} işlemde %${(rw * 100).toFixed(1)} kazanma oranı. Dikkatli olun.`, metric: formatPercentage(rw), recommendation: "Trading boyutunu azaltın ve stratejinizi gözden geçirin.", confidence: 85 });
    }

    return result.sort((a, b) => b.confidence - a.confidence);
  }, [trades]);

  const typeConfig = {
    success: { Icon: CheckCircle,   color: "#10b981", bg: "var(--green-dim)", border: "rgba(16,185,129,0.20)" },
    warning: { Icon: AlertTriangle, color: "#f59e0b", bg: "var(--amber-dim)", border: "rgba(245,158,11,0.20)" },
    danger:  { Icon: AlertCircle,   color: "#ef4444", bg: "var(--red-dim)",   border: "rgba(239,68,68,0.20)"  },
    info:    { Icon: Lightbulb,     color: "#3b82f6", bg: "var(--blue-dim)",  border: "rgba(59,130,246,0.20)" },
  };

  const catConfig = {
    performance: { Icon: TrendingUp, label: "Performans" },
    behavior:    { Icon: Eye,        label: "Davranış"   },
    timing:      { Icon: Clock,      label: "Zamanlama"  },
    risk:        { Icon: Target,     label: "Risk"       },
  };

  const summary = [
    { label: "Toplam Insight",   val: insights.length, color: "#3b82f6" },
    { label: "Güçlü Alanlar",    val: insights.filter(i => i.type === "success").length, color: "#10b981" },
    { label: "Geliştirilebilir", val: insights.filter(i => i.type === "warning").length, color: "#f59e0b" },
    { label: "Riskli Alanlar",   val: insights.filter(i => i.type === "danger").length,  color: "#ef4444" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summary.map(s => (
            <div key={s.label} className="card p-5 text-center">
              <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.val}</p>
              <p className="text-xs font-medium mt-1.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {insights.map(insight => {
            const tc  = typeConfig[insight.type];
            const cc  = catConfig[insight.category];
            return (
              <div key={insight.id} className="card p-5" style={{ borderLeft: `3px solid ${tc.color}` }}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tc.bg }}>
                    <tc.Icon className="w-4 h-4" style={{ color: tc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{insight.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: tc.bg, color: tc.color }}>
                          <cc.Icon className="w-3 h-3" />
                          {cc.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                          %{insight.confidence}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{insight.description}</p>
                    {insight.metric && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Metrik:</span>
                        <span className="font-bold font-mono text-base" style={{ color: tc.color }}>{insight.metric}</span>
                      </div>
                    )}
                    {insight.recommendation && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: "var(--brand-dim)", border: "1px solid rgba(13,148,136,0.15)" }}>
                        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
                        <div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--brand)" }}>Öneri</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{insight.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
