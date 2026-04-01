"use client";

import { useState } from "react";
import { Strategy } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  Search,
  Target,
  TrendingUp,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface NotebookPageClientProps {
  strategies: Strategy[];
}

interface StrategyForm {
  name: string;
  description: string;
  rules: string;
  images: string[];
}

export default function NotebookPageClient({ strategies }: NotebookPageClientProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [viewingStrategy, setViewingStrategy] = useState<Strategy | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<StrategyForm>({
    name: '',
    description: '',
    rules: '',
    images: [],
  });

  // Default strategy templates
  const strategyTemplates = [
    {
      name: "Breakout Strategy",
      description: "Fiyat kırılımlarını takip eden momentum stratejisi",
      rules: `1. Giriş Kuralları:
- Önemli destek/direnç seviyelerinin kırılmasını bekle
- Hacim onayı (normal volümün 1.5x üzeri)
- RSI > 50 (bullish breakout için)
- Kırılım sonrası pullback'te giriş

2. Çıkış Kuralları:
- Stop Loss: Kırılan seviyenin altına
- Take Profit: Risk'in 2x katı
- Trailing Stop: ATR x 2

3. Risk Yönetimi:
- Max %2 risk per trade
- Günde max 3 breakout trade'i
- Düşük volatilite dönemlerinde bekle`,
      images: []
    },
    {
      name: "Scalping Strategy",
      description: "1-5 dakikalık hızlı işlemler için kısa vadeli strateji",
      rules: `1. Zaman Dilimi: 1M, 5M
2. İndikatörler: EMA 9/21, RSI, MACD

3. Giriş Sinyali:
- EMA 9 > EMA 21 (uptrend)
- RSI 30-70 arası
- MACD pozitif momentum
- Support seviyesinde pullback

4. Çıkış:
- Quick profit: 5-10 pips
- Stop loss: 3-5 pips
- Max hold: 15 dakika

5. Aktif Saatler:
- London session: 08:00-12:00
- New York session: 13:00-17:00`,
      images: []
    },
    {
      name: "Swing Trading",
      description: "Orta vadeli trend takibi için 1-5 günlük pozisyonlar",
      rules: `1. Zaman Dilimi: 4H, Daily
2. Trend Analizi: EMA 50/200 Golden Cross

3. Giriş Koşulları:
- Ana trend yönünde işlem
- Fibonacci %38.2 - %61.8 geri çekilme
- Momentum onayı (RSI divergence)
- Weekly destek/direnç yakınında

4. Position Management:
- Risk: %1-2 per trade
- R:R minimum 1:3
- Partial profit: %50 at 1R, %50 at 3R

5. Çıkış Sinyalleri:
- Trend değişim sinyali
- Major resistance test
- 5 günlük max holding period`,
      images: []
    }
  ];

  const filteredStrategies = strategies.filter(strategy =>
    strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rules: '',
      images: [],
    });
    setIsCreating(false);
    setEditingStrategy(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/strategies', {
        method: editingStrategy ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStrategy?.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save strategy');
      }

      resetForm();
      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error saving strategy:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (strategy: Strategy) => {
    setFormData({
      name: strategy.name,
      description: strategy.description || '',
      rules: strategy.rules || '',
      images: strategy.images || [],
    });
    setEditingStrategy(strategy);
    setIsCreating(true);
  };

  const handleUseTemplate = (template: any) => {
    setFormData({
      name: template.name,
      description: template.description,
      rules: template.rules,
      images: template.images,
    });
    setIsCreating(true);
  };

  const addImageUrl = () => {
    const url = prompt('Görsel URL girin:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (viewingStrategy) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setViewingStrategy(null)}>
                <X className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <h1 className="text-2xl font-bold">{viewingStrategy.name}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleEdit(viewingStrategy)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Favorile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Açıklama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {viewingStrategy.description || 'Açıklama bulunmuyor.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strateji Kuralları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                      {viewingStrategy.rules || 'Kural bulunmuyor.'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {viewingStrategy.images && viewingStrategy.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Görseller</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingStrategy.images.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Strategy image ${index + 1}`}
                          className="w-full h-48 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Strateji Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Oluşturulma Tarihi</label>
                    <p className="font-medium">
                      {format(new Date(viewingStrategy.createdAt), 'dd MMMM yyyy', {
                        locale: language === 'tr' ? tr : enUS
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Son Güncelleme</label>
                    <p className="font-medium">
                      {format(new Date(viewingStrategy.updatedAt), 'dd MMMM yyyy', {
                        locale: language === 'tr' ? tr : enUS
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Kullanım Durumu</label>
                    <p className="font-medium text-green-600">Aktif</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-500" />
              {t.notebook}
            </h1>
            <p className="text-gray-600">Trading stratejilerinizi kaydedin ve yönetin</p>
          </div>
          
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Strateji
          </Button>
        </div>

        {!isCreating ? (
          <>
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Strateji ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Strategy Templates */}
            {strategies.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Başlamak için Şablonlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategyTemplates.map((template, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {template.description}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUseTemplate(template)}
                          >
                            Şablonu Kullan
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strategies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy) => (
                <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{strategy.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingStrategy(strategy)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(strategy)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {strategy.description || 'Açıklama bulunmuyor.'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {format(new Date(strategy.updatedAt), 'dd MMM yyyy')}
                      </span>
                      <Badge variant="outline">Aktif</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStrategies.length === 0 && strategies.length > 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Arama sonucu bulunamadı
                </h3>
                <p className="text-gray-600">
                  "{searchTerm}" araması için sonuç bulunamadı.
                </p>
              </div>
            )}
          </>
        ) : (
          /* Create/Edit Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingStrategy ? 'Strateji Düzenle' : 'Yeni Strateji Oluştur'}</span>
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strateji Adı *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Örn: Breakout Strategy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Stratejinizin kısa açıklaması..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Görseller
                    </label>
                    <div className="space-y-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={url} readOnly className="flex-1" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addImageUrl}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Görsel Ekle
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strateji Kuralları
                  </label>
                  <Textarea
                    value={formData.rules}
                    onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                    placeholder={`Giriş Kuralları:
1. ...
2. ...

Çıkış Kuralları:
1. ...
2. ...

Risk Yönetimi:
1. ...`}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  İptal
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!formData.name || isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
