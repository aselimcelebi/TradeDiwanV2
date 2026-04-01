"use client";

import { useState, useMemo } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { formatCurrency } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  Smile,
  Meh,
  Frown,
  Save,
  Plus,
  Edit3
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays, subDays, isSameDay } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface DailyJournalClientProps {
  journalEntries: JournalEntry[];
  trades: Trade[];
}

interface DailyJournalForm {
  whatWentWell: string;
  toImprove: string;
  notes: string;
  mood: number;
  tags: string;
}

export default function DailyJournalClient({ journalEntries, trades }: DailyJournalClientProps) {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get current journal entry for selected date
  const currentEntry = journalEntries.find(entry => 
    isSameDay(new Date(entry.date), selectedDate)
  );

  const [formData, setFormData] = useState<DailyJournalForm>({
    whatWentWell: currentEntry?.whatWentWell || '',
    toImprove: currentEntry?.toImprove || '',
    notes: currentEntry?.notes || '',
    mood: currentEntry?.mood || 3,
    tags: currentEntry?.tags || '',
  });

  // Get trades for selected date
  const dailyTrades = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= dayStart && tradeDate <= dayEnd;
    });
  }, [trades, selectedDate]);

  // Calculate daily metrics
  const dailyMetrics = useMemo(() => {
    const totalPnL = dailyTrades.reduce((sum, trade) => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      return sum + pnl;
    }, 0);

    const winningTrades = dailyTrades.filter(trade => {
      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
      return pnl > 0;
    }).length;

    const winRate = dailyTrades.length > 0 ? (winningTrades / dailyTrades.length) * 100 : 0;

    return {
      totalPnL,
      tradeCount: dailyTrades.length,
      winRate,
      winningTrades,
      losingTrades: dailyTrades.length - winningTrades,
    };
  }, [dailyTrades]);

  // Group journal entries by date for calendar view
  const journalCalendar = useMemo(() => {
    const entries = new Map();
    journalEntries.forEach(entry => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      entries.set(dateKey, entry);
    });
    return entries;
  }, [journalEntries]);

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy, EEEE', { 
      locale: language === 'tr' ? tr : enUS 
    });
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/journal', {
        method: currentEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentEntry?.id,
          date: selectedDate.toISOString(),
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save journal entry');
      }

      setIsEditing(false);
      // Optionally refresh the page or update state
      window.location.reload();
    } catch (error) {
      console.error('Error saving journal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Smile className="w-5 h-5 text-green-500" />;
    if (mood >= 3) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  const getMoodLabel = (mood: number) => {
    const labels = {
      1: 'Çok Kötü',
      2: 'Kötü',
      3: 'Normal',
      4: 'İyi',
      5: 'Mükemmel'
    };
    return labels[mood as keyof typeof labels] || 'Normal';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.dailyJournal}</h1>
            <p className="text-gray-600">Günlük trading deneyimlerinizi kaydedin ve analiz edin</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleDateChange('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-48"
            />
            <Button variant="outline" onClick={() => handleDateChange('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => setSelectedDate(new Date())}>
              Bugün
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {formatDate(selectedDate)}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Daily Metrics */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Günlük Performans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Net P&L</span>
                  <span className={`font-bold ${dailyMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dailyMetrics.totalPnL)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">İşlem Sayısı</span>
                  <span className="font-semibold">{dailyMetrics.tradeCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kazanma Oranı</span>
                  <span className="font-semibold">{dailyMetrics.winRate.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kazanan/Kaybeden</span>
                  <span className="font-semibold">
                    <span className="text-green-600">{dailyMetrics.winningTrades}</span>
                    {' / '}
                    <span className="text-red-600">{dailyMetrics.losingTrades}</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Daily Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Günün İşlemleri</span>
                  <Badge variant="outline">{dailyTrades.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyTrades.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bu günde işlem bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dailyTrades.map((trade) => {
                      const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
                      return (
                        <div key={trade.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{trade.symbol}</div>
                            <div className="text-xs text-gray-500">
                              {trade.side} • {trade.qty} • {format(new Date(trade.date), 'HH:mm')}
                            </div>
                          </div>
                          <div className={`text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="font-semibold">{formatCurrency(pnl)}</div>
                            {pnl >= 0 ? (
                              <TrendingUp className="w-4 h-4 inline" />
                            ) : (
                              <TrendingDown className="w-4 h-4 inline" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center & Right Columns - Journal Entry */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Günlük Değerlendirme
                  </span>
                  <div className="flex items-center gap-2">
                    {currentEntry && !isEditing && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getMoodIcon(currentEntry.mood || 3)}
                        <span>{getMoodLabel(currentEntry.mood || 3)}</span>
                      </div>
                    )}
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        {currentEntry ? (
                          <>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Düzenle
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Günlük Ekle
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          İptal
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditing && !currentEntry ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Bu gün için günlük girişi yok</p>
                    <p className="text-sm">Günün trading deneyimlerini kaydetmek için "Günlük Ekle" butonuna tıklayın</p>
                  </div>
                ) : !isEditing && currentEntry ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">✅ İyi Giden Şeyler</h3>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-gray-700">{currentEntry.whatWentWell || 'Belirtilmemiş'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-orange-700 mb-2">🔄 Geliştirilecek Alanlar</h3>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-gray-700">{currentEntry.toImprove || 'Belirtilmemiş'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-blue-700 mb-2">📝 Genel Notlar</h3>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-gray-700">{currentEntry.notes || 'Not bulunmuyor'}</p>
                      </div>
                    </div>

                    {currentEntry.tags && (
                      <div>
                        <h3 className="font-semibold text-purple-700 mb-2">🏷️ Etiketler</h3>
                        <div className="flex flex-wrap gap-1">
                          {currentEntry.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline">{tag.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✅ Bugün iyi giden şeyler nelerdi?
                      </label>
                      <Textarea
                        value={formData.whatWentWell}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatWentWell: e.target.value }))}
                        placeholder="Başarılı stratejiler, iyi kararlar, disiplinli davranışlar..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔄 Nerelerde gelişim gösterebilirim?
                      </label>
                      <Textarea
                        value={formData.toImprove}
                        onChange={(e) => setFormData(prev => ({ ...prev, toImprove: e.target.value }))}
                        placeholder="Hatalar, kaçırılan fırsatlar, geliştirilmesi gereken alanlar..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Genel notlar ve gözlemler
                      </label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Piyasa koşulları, ruh hali, özel durumlar..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          😊 Bugünkü ruh haliniz (1-5)
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, mood: value }))}
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                                formData.mood === value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {value === 1 && '😞'}
                              {value === 2 && '😕'}
                              {value === 3 && '😐'}
                              {value === 4 && '😊'}
                              {value === 5 && '😄'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏷️ Etiketler (virgülle ayırın)
                        </label>
                        <Input
                          value={formData.tags}
                          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="scalping, news-trading, breakdown..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
