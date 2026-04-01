"use client";

import { useMemo } from "react";
import { Trade } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculateTradeMetrics, formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface ReportsPageClientProps {
  trades: Trade[];
}

export default function ReportsPageClient({ trades }: ReportsPageClientProps) {
  const { t, language } = useLanguage();
  const metrics = calculateTradeMetrics(trades);

  // Prepare data for charts
  const chartData = useMemo(() => {
    // Equity curve data
    let cumulativePnL = 0;
    const equityCurve = trades.map((trade, index) => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      cumulativePnL += pnl;
      return {
        date: format(new Date(trade.date), 'dd MMM'),
        tradeNumber: index + 1,
        pnl: pnl,
        cumulativePnL: cumulativePnL,
        symbol: trade.symbol,
      };
    });

    // Daily PnL data
    const dailyPnLMap = new Map();
    trades.forEach(trade => {
      const dateKey = format(startOfDay(new Date(trade.date)), 'yyyy-MM-dd');
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (dailyPnLMap.has(dateKey)) {
        dailyPnLMap.set(dateKey, dailyPnLMap.get(dateKey) + pnl);
      } else {
        dailyPnLMap.set(dateKey, pnl);
      }
    });

    const dailyPnL = Array.from(dailyPnLMap.entries()).map(([date, pnl]) => ({
      date: format(new Date(date), 'dd MMM'),
      pnl: pnl,
      color: pnl >= 0 ? '#16A34A' : '#DC2626',
    }));

    // Win/Loss distribution
    const winningTrades = trades.filter(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      return pnl > 0;
    }).length;

    const winLossData = [
      { name: 'Kazanan', value: winningTrades, color: '#16A34A' },
      { name: 'Kaybeden', value: trades.length - winningTrades, color: '#DC2626' },
    ];

    // PnL by Symbol
    const symbolPnLMap = new Map();
    trades.forEach(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (symbolPnLMap.has(trade.symbol)) {
        symbolPnLMap.set(trade.symbol, symbolPnLMap.get(trade.symbol) + pnl);
      } else {
        symbolPnLMap.set(trade.symbol, pnl);
      }
    });

    const symbolPnL = Array.from(symbolPnLMap.entries())
      .map(([symbol, pnl]) => ({ symbol, pnl }))
      .sort((a, b) => b.pnl - a.pnl);

    // PnL by Strategy
    const strategyPnLMap = new Map();
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (strategyPnLMap.has(strategy)) {
        strategyPnLMap.set(strategy, strategyPnLMap.get(strategy) + pnl);
      } else {
        strategyPnLMap.set(strategy, pnl);
      }
    });

    const strategyPnL = Array.from(strategyPnLMap.entries())
      .map(([strategy, pnl]) => ({ strategy, pnl }))
      .sort((a, b) => b.pnl - a.pnl);

    // Time of day analysis
    const hourlyPnL = new Map();
    trades.forEach(trade => {
      const hour = new Date(trade.date).getHours();
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      
      if (hourlyPnL.has(hour)) {
        hourlyPnL.set(hour, hourlyPnL.get(hour) + pnl);
      } else {
        hourlyPnL.set(hour, pnl);
      }
    });

    const timeAnalysis = Array.from(hourlyPnL.entries())
      .map(([hour, pnl]) => ({ 
        hour: `${hour.toString().padStart(2, '0')}:00`, 
        pnl 
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    return {
      equityCurve,
      dailyPnL,
      winLossData,
      symbolPnL,
      strategyPnL,
      timeAnalysis,
    };
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#6B5BFF', '#16A34A', '#DC2626', '#F59E0B', '#8B5CF6'];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.reports}</h1>
          <p className="text-gray-600">Detaylı trading analitiği ve performans metrikleri</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.netPnl}</p>
                  <p className={`text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.totalPnL)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.tradeWinRate}</p>
                  <p className="text-xl font-bold">{formatPercentage(metrics.winRate)}</p>
                </div>
                <Target className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.profitFactor}</p>
                  <p className="text-xl font-bold">{metrics.profitFactor.toFixed(2)}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatPercentage(metrics.maxDrawdown)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equity Curve */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativePnL" 
                    stroke="#6B5BFF" 
                    fill="#6B5BFF" 
                    fillOpacity={0.1}
                    name="Kümülatif P&L"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily PnL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Günlük P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.dailyPnL}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" fill="#6B5BFF" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win/Loss Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Kazanma/Kaybetme Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.winLossData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Symbol Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Sembol Bazında Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.symbolPnL.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" fill="#16A34A" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strategy Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Strateji Bazında Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.strategyPnL}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strategy" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" fill="#8B5CF6" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detaylı Metrikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Genel Metrikler</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Toplam İşlem:</span>
                    <span className="font-medium">{trades.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kazanan İşlem:</span>
                    <span className="font-medium text-green-600">{metrics.winningTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kaybeden İşlem:</span>
                    <span className="font-medium text-red-600">{metrics.losingTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En Büyük Kazanç:</span>
                    <span className="font-medium text-green-600">{formatCurrency(metrics.bestTrade)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En Büyük Kayıp:</span>
                    <span className="font-medium text-red-600">{formatCurrency(metrics.worstTrade)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Ortalama Değerler</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ortalama Kazanç:</span>
                    <span className="font-medium text-green-600">{formatCurrency(metrics.avgWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ortalama Kayıp:</span>
                    <span className="font-medium text-red-600">{formatCurrency(metrics.avgLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>İşlem Başına Ortalama:</span>
                    <span className="font-medium">{formatCurrency(metrics.expectancy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk/Ödül Oranı:</span>
                    <span className="font-medium">{(Math.abs(metrics.avgWin) / Math.abs(metrics.avgLoss)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expectancy:</span>
                    <span className="font-medium">{formatCurrency(metrics.expectancy)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Risk Metrikleri</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Profit Factor:</span>
                    <span className="font-medium">{metrics.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kazanma Oranı:</span>
                    <span className="font-medium">{formatPercentage(metrics.winRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-medium text-red-600">{formatPercentage(metrics.maxDrawdown)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mevcut Seri:</span>
                    <span className="font-medium">{0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En Uzun Kazanç Serisi:</span>
                    <span className="font-medium text-green-600">{0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
