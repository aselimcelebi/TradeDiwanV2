"use client";

import { useMemo } from "react";
import { Trade } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Target,
  Zap,
  BarChart3,
  Eye,
  AlertCircle
} from "lucide-react";
import { format, getDay, getHours, startOfDay, differenceInDays } from "date-fns";

interface InsightsPageClientProps {
  trades: Trade[];
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  category: 'performance' | 'behavior' | 'timing' | 'risk';
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
  confidence: number; // 0-100
}

export default function InsightsPageClient({ trades }: InsightsPageClientProps) {
  const { t } = useLanguage();

  // Generate AI-like insights
  const insights = useMemo(() => {
    const insights: Insight[] = [];

    if (trades.length === 0) {
      return [{
        id: 'no-data',
        type: 'info',
        category: 'performance',
        title: 'Henüz analiz edecek veri yok',
        description: 'Insights oluşturmak için daha fazla işlem verisi gerekiyor.',
        confidence: 100
      }];
    }

    // Calculate metrics for insights
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      return pnl > 0;
    });
    const winRate = (winningTrades.length / totalTrades) * 100;

    // Day of week analysis
    const dayPerformance = new Map();
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    trades.forEach(trade => {
      const day = getDay(new Date(trade.date));
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (!dayPerformance.has(day)) {
        dayPerformance.set(day, { trades: 0, pnl: 0, wins: 0 });
      }
      
      const current = dayPerformance.get(day);
      current.trades++;
      current.pnl += pnl;
      if (pnl > 0) current.wins++;
    });

    // Find best and worst days
    let bestDay = { day: -1, winRate: 0, pnl: 0 };
    let worstDay = { day: -1, winRate: 100, pnl: 0 };

    dayPerformance.forEach((data, day) => {
      const dayWinRate = (data.wins / data.trades) * 100;
      if (dayWinRate > bestDay.winRate && data.trades >= 3) {
        bestDay = { day, winRate: dayWinRate, pnl: data.pnl };
      }
      if (dayWinRate < worstDay.winRate && data.trades >= 3) {
        worstDay = { day, winRate: dayWinRate, pnl: data.pnl };
      }
    });

    // Time of day analysis
    const hourPerformance = new Map();
    trades.forEach(trade => {
      const hour = getHours(new Date(trade.date));
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (!hourPerformance.has(hour)) {
        hourPerformance.set(hour, { trades: 0, pnl: 0, wins: 0 });
      }
      
      const current = hourPerformance.get(hour);
      current.trades++;
      current.pnl += pnl;
      if (pnl > 0) current.wins++;
    });

    // Symbol analysis
    const symbolPerformance = new Map();
    trades.forEach(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (!symbolPerformance.has(trade.symbol)) {
        symbolPerformance.set(trade.symbol, { trades: 0, pnl: 0, wins: 0 });
      }
      
      const current = symbolPerformance.get(trade.symbol);
      current.trades++;
      current.pnl += pnl;
      if (pnl > 0) current.wins++;
    });

    // Strategy analysis
    const strategyPerformance = new Map();
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (!strategyPerformance.has(strategy)) {
        strategyPerformance.set(strategy, { trades: 0, pnl: 0, wins: 0 });
      }
      
      const current = strategyPerformance.get(strategy);
      current.trades++;
      current.pnl += pnl;
      if (pnl > 0) current.wins++;
    });

    // Generate insights based on analysis

    // 1. Win Rate Insights
    if (winRate >= 70) {
      insights.push({
        id: 'high-winrate',
        type: 'success',
        category: 'performance',
        title: 'Yüksek Kazanma Oranı',
        description: `%${winRate.toFixed(1)} kazanma oranınız mükemmel seviyede. Bu tutarlılığı korumaya odaklanın.`,
        metric: formatPercentage(winRate / 100),
        confidence: 95
      });
    } else if (winRate < 40) {
      insights.push({
        id: 'low-winrate',
        type: 'warning',
        category: 'performance',
        title: 'Düşük Kazanma Oranı',
        description: `%${winRate.toFixed(1)} kazanma oranınız gelişime açık. Giriş kriterlerinizi gözden geçirin.`,
        metric: formatPercentage(winRate / 100),
        recommendation: 'Strateji kurallarınızı daha sıkı uygulayın ve risk yönetimini geliştirin.',
        confidence: 85
      });
    }

    // 2. Day of Week Insights
    if (bestDay.day >= 0 && bestDay.winRate > 60) {
      insights.push({
        id: 'best-day',
        type: 'success',
        category: 'timing',
        title: `${dayNames[bestDay.day]} Günleri Güçlü`,
        description: `${dayNames[bestDay.day]} günlerinde %${bestDay.winRate.toFixed(1)} kazanma oranı ile en iyi performansınızı gösteriyorsunuz.`,
        metric: formatPercentage(bestDay.winRate / 100),
        recommendation: `${dayNames[bestDay.day]} günlerinde daha aktif trading yapabilirsiniz.`,
        confidence: 80
      });
    }

    if (worstDay.day >= 0 && worstDay.winRate < 40) {
      insights.push({
        id: 'worst-day',
        type: 'warning',
        category: 'timing',
        title: `${dayNames[worstDay.day]} Günleri Zorlu`,
        description: `${dayNames[worstDay.day]} günlerinde %${worstDay.winRate.toFixed(1)} kazanma oranı ile zorlanıyorsunuz.`,
        metric: formatPercentage(worstDay.winRate / 100),
        recommendation: `${dayNames[worstDay.day]} günlerinde daha az işlem yapın veya stratejinizi gözden geçirin.`,
        confidence: 75
      });
    }

    // 3. Symbol Performance Insights
    const bestSymbol = Array.from(symbolPerformance.entries())
      .filter(([_, data]) => data.trades >= 3)
      .sort((a, b) => (b[1].wins / b[1].trades) - (a[1].wins / a[1].trades))[0];

    if (bestSymbol && (bestSymbol[1].wins / bestSymbol[1].trades) > 0.6) {
      insights.push({
        id: 'best-symbol',
        type: 'success',
        category: 'performance',
        title: `${bestSymbol[0]} Sembolünde Başarılı`,
        description: `${bestSymbol[0]} sembolünde %${((bestSymbol[1].wins / bestSymbol[1].trades) * 100).toFixed(1)} kazanma oranı ile güçlüsünüz.`,
        metric: formatCurrency(bestSymbol[1].pnl),
        recommendation: `${bestSymbol[0]} sembolüne daha fazla odaklanabilirsiniz.`,
        confidence: 85
      });
    }

    // 4. Strategy Performance Insights
    const bestStrategy = Array.from(strategyPerformance.entries())
      .filter(([_, data]) => data.trades >= 3)
      .sort((a, b) => b[1].pnl - a[1].pnl)[0];

    if (bestStrategy && bestStrategy[1].pnl > 0) {
      insights.push({
        id: 'best-strategy',
        type: 'success',
        category: 'behavior',
        title: `${bestStrategy[0]} Stratejisi Etkili`,
        description: `${bestStrategy[0]} stratejiniz ${formatCurrency(bestStrategy[1].pnl)} toplam kazanç sağladı.`,
        metric: formatCurrency(bestStrategy[1].pnl),
        recommendation: 'Bu stratejiye daha fazla odaklanın ve kurallarını optimize edin.',
        confidence: 90
      });
    }

    // 5. Risk Management Insights
    const avgTradeSize = trades.reduce((sum, trade) => sum + trade.qty, 0) / trades.length;
    const stdDev = Math.sqrt(trades.reduce((sum, trade) => {
      const diff = trade.qty - avgTradeSize;
      return sum + (diff * diff);
    }, 0) / trades.length);

    if (stdDev / avgTradeSize > 0.5) {
      insights.push({
        id: 'inconsistent-sizing',
        type: 'warning',
        category: 'risk',
        title: 'Tutarsız Pozisyon Büyüklüğü',
        description: 'Position size\'larınızda yüksek varyasyon var. Risk yönetimi tutarlılığını artırın.',
        recommendation: 'Sabit risk yüzdesi veya position sizing modeli kullanın.',
        confidence: 70
      });
    }

    // 6. Recent Performance Insights
    const recentTrades = trades.slice(-10);
    const recentWinRate = recentTrades.filter(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      return pnl > 0;
    }).length / recentTrades.length;

    if (recentWinRate > 0.7 && recentTrades.length >= 5) {
      insights.push({
        id: 'recent-improvement',
        type: 'success',
        category: 'performance',
        title: 'Son Dönem Performansı Güçlü',
        description: `Son ${recentTrades.length} işlemde %${(recentWinRate * 100).toFixed(1)} kazanma oranı ile güçlü performans.`,
        metric: formatPercentage(recentWinRate),
        confidence: 80
      });
    } else if (recentWinRate < 0.3 && recentTrades.length >= 5) {
      insights.push({
        id: 'recent-decline',
        type: 'danger',
        category: 'performance',
        title: 'Son Dönem Performansı Düşük',
        description: `Son ${recentTrades.length} işlemde %${(recentWinRate * 100).toFixed(1)} kazanma oranı. Dikkatli olun.`,
        metric: formatPercentage(recentWinRate),
        recommendation: 'Trading boyutunu azaltın ve stratejinizi gözden geçirin.',
        confidence: 85
      });
    }

    // 7. Trading Frequency Insights
    if (trades.length > 0) {
      const firstTrade = new Date(trades[0].date);
      const lastTrade = new Date(trades[trades.length - 1].date);
      const tradingDays = differenceInDays(lastTrade, firstTrade) || 1;
      const tradesPerDay = trades.length / tradingDays;

      if (tradesPerDay > 10) {
        insights.push({
          id: 'overtrading',
          type: 'warning',
          category: 'behavior',
          title: 'Yüksek İşlem Frekansı',
          description: `Günde ortalama ${tradesPerDay.toFixed(1)} işlem yapıyorsunuz. Overtrading riskine dikkat.`,
          recommendation: 'Kalite odaklı trading yapın, işlem sayısını azaltın.',
          confidence: 75
        });
      } else if (tradesPerDay < 1) {
        insights.push({
          id: 'undertrading',
          type: 'info',
          category: 'behavior',
          title: 'Düşük İşlem Frekansı',
          description: `Günde ortalama ${tradesPerDay.toFixed(1)} işlem yapıyorsunuz. Fırsat kaçırıyor olabilirsiniz.`,
          recommendation: 'Setup kriterlerinizi gözden geçirin, daha fazla fırsat arayın.',
          confidence: 60
        });
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }, [trades]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      case 'behavior': return <Eye className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'risk': return <Target className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      performance: 'Performans',
      behavior: 'Davranış',
      timing: 'Zamanlama',
      risk: 'Risk'
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-500" />
            {t.insights}
          </h1>
          <p className="text-gray-600">AI destekli analiz ve akıllı trading önerileri</p>
        </div>

        {/* Insights Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{insights.length}</div>
              <div className="text-sm text-gray-600">Toplam Insight</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {insights.filter(i => i.type === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Güçlü Alanlar</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {insights.filter(i => i.type === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Geliştirilebilir</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {insights.filter(i => i.type === 'danger').length}
              </div>
              <div className="text-sm text-gray-600">Riskli Alanlar</div>
            </CardContent>
          </Card>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getInsightBadgeColor(insight.type)}>
                          {getCategoryIcon(insight.category)}
                          <span className="ml-1">{getCategoryLabel(insight.category)}</span>
                        </Badge>
                        <Badge variant="outline">
                          %{insight.confidence} güvenilir
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-700">{insight.description}</p>

                    {insight.metric && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Metrik:</span>
                        <span className="font-semibold text-lg text-blue-600">
                          {insight.metric}
                        </span>
                      </div>
                    )}

                    {insight.recommendation && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Öneri:</p>
                            <p className="text-sm text-blue-700 mt-1">{insight.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {insights.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz insight bulunmuyor
              </h3>
              <p className="text-gray-600">
                Daha fazla işlem verisi toplandıkça, AI destekli analiz ve öneriler burada görünecek.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
