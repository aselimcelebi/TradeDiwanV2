"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play,
  Pause,
  Square,
  Settings,
  BarChart3,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus,
  MoreHorizontal
} from "lucide-react";

interface BacktestSession {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  strategy: string;
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  pnl: number;
  trades: number;
  winRate: number;
  duration: string;
}

export default function BacktestingPageClient() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  // Mock backtest sessions - TradeZella tarzı
  const [sessions] = useState<BacktestSession[]>([
    {
      id: '1',
      name: 'EURUSD Breakout Strategy',
      symbol: 'EURUSD',
      timeframe: '1H',
      strategy: 'Breakout',
      status: 'completed',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      pnl: 1250.50,
      trades: 45,
      winRate: 67.2,
      duration: '30 days'
    },
    {
      id: '2',
      name: 'BTCUSD Scalping Test',
      symbol: 'BTCUSD',
      timeframe: '5M',
      strategy: 'Scalping',
      status: 'active',
      startDate: new Date('2024-02-01'),
      pnl: 450.25,
      trades: 23,
      winRate: 73.9,
      duration: '12 days'
    },
    {
      id: '3',
      name: 'GBPJPY Swing Strategy',
      symbol: 'GBPJPY',
      timeframe: '4H',
      strategy: 'Swing Trading',
      status: 'paused',
      startDate: new Date('2024-01-15'),
      pnl: -180.75,
      trades: 12,
      winRate: 41.7,
      duration: '8 days'
    }
  ]);

  const filteredSessions = sessions.filter(session => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return session.status === 'active';
    if (activeTab === 'completed') return session.status === 'completed';
    return false;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };

    const labels = {
      active: 'Aktif',
      completed: 'Tamamlandı',
      paused: 'Duraklatıldı',
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4 text-green-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Play className="w-7 h-7 text-blue-500" />
              Backtesting 2.0
            </h1>
            <p className="text-gray-600">
              Stratejilerinizi geçmiş verilerle test edin ve optimize edin
            </p>
          </div>
          
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Backtest
          </Button>
        </div>

        {/* Coming Soon Banner - TradeZella benzeri */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Advanced Backtesting Engine - Coming Soon! 🚀
                  </h3>
                  <p className="text-gray-600 mt-1">
                    TradingView entegrasyonu ile profesyonel backtesting deneyimi yakında...
                  </p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                BETA
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview - TradeZella Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Multi-Timeframe</h3>
              <p className="text-sm text-gray-600">1M'den 1W'ya kadar</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">10 Yıl Veri</h3>
              <p className="text-sm text-gray-600">Kapsamlı tarihsel veri</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Risk Management</h3>
              <p className="text-sm text-gray-600">Dinamik SL/TP</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Real-time Replay</h3>
              <p className="text-sm text-gray-600">Saniye seviyesinde</p>
            </CardContent>
          </Card>
        </div>

        {/* Session Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">Tümü ({sessions.length})</TabsTrigger>
              <TabsTrigger value="active">
                Aktif ({sessions.filter(s => s.status === 'active').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Tamamlanan ({sessions.filter(s => s.status === 'completed').length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select defaultValue="recent">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">En Son</SelectItem>
                  <SelectItem value="pnl-high">En Yüksek P&L</SelectItem>
                  <SelectItem value="pnl-low">En Düşük P&L</SelectItem>
                  <SelectItem value="winrate">Kazanma Oranı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab}>
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz backtest oturumu yok
                  </h3>
                  <p className="text-gray-600 mb-4">
                    İlk backtest oturumunuzu başlatın ve stratejilerinizi test edin.
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Backtest Başlat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getStatusIcon(session.status)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold">{session.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>{session.symbol}</span>
                              <span>•</span>
                              <span>{session.timeframe}</span>
                              <span>•</span>
                              <span>{session.strategy}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              session.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {session.trades} trades • {session.winRate.toFixed(1)}% win
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusBadge(session.status)}
                            
                            <div className="flex items-center gap-1">
                              {session.status === 'active' && (
                                <Button variant="outline" size="sm">
                                  <Pause className="w-4 h-4" />
                                </Button>
                              )}
                              {session.status === 'paused' && (
                                <Button variant="outline" size="sm">
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Başlangıç:</span>
                            <p className="font-medium">
                              {session.startDate.toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Süre:</span>
                            <p className="font-medium">{session.duration}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">İşlem Sayısı:</span>
                            <p className="font-medium">{session.trades}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Kazanma Oranı:</span>
                            <p className="font-medium">{session.winRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* TradingView Integration Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              TradingView Entegrasyonu (Yakında)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Gelecek Özellikler:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Pine Script Strategy Import
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Real-time Chart Replay
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Multi-Symbol Testing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Economic Calendar Integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Advanced Risk Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Strategy Optimization
                  </li>
                </ul>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">TradingView Widget</h3>
                <p className="text-gray-600 text-sm">
                  Profesyonel backtesting arayüzü burada görünecek
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Educational Content */}
        <Card>
          <CardHeader>
            <CardTitle>Backtesting Nasıl Başlayacağınızı Öğrenin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Strateji Seçin</h3>
                <p className="text-sm text-gray-600">
                  Test etmek istediğiniz trading stratejisini belirleyin
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Parametreleri Ayarlayın</h3>
                <p className="text-sm text-gray-600">
                  Sembol, zaman dilimi ve risk parametrelerini configure edin
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Analiz Edin</h3>
                <p className="text-sm text-gray-600">
                  Sonuçları inceleyin ve stratejinizi optimize edin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
