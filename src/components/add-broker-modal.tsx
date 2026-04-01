"use client";

import { useState } from "react";
import { Broker } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Download, Info } from "lucide-react";

interface AddBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  broker?: Broker | null;
}

export default function AddBrokerModal({ isOpen, onClose, broker }: AddBrokerModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(broker?.platform || "");
  const [formData, setFormData] = useState({
    name: broker?.name || "",
    accountId: broker?.accountId || "",
    server: broker?.server || "",
    username: broker?.username || "",
    password: broker?.password || "",
    apiKey: broker?.apiKey || "",
    apiSecret: broker?.apiSecret || "",
    currency: broker?.currency || "USD",
    leverage: broker?.leverage?.toString() || "",
    company: broker?.company || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const platforms = [
    { 
      id: "MT5", 
      name: "MetaTrader 5", 
      icon: "🏛️",
      description: "En popüler forex platformu",
      supported: true
    },
    { 
      id: "MT4", 
      name: "MetaTrader 4", 
      icon: "🏦",
      description: "Klasik MT4 platformu", 
      supported: true
    },
    { 
      id: "Binance", 
      name: "Binance", 
      icon: "🟡",
      description: "Kripto para borsası",
      supported: true
    },
    { 
      id: "cTrader", 
      name: "cTrader", 
      icon: "📊",
      description: "Modern trading platformu",
      supported: false
    },
    { 
      id: "NinjaTrader", 
      name: "NinjaTrader", 
      icon: "🥷",
      description: "Futures ve forex platformu",
      supported: false
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const payload = {
        platform: selectedPlatform,
        ...formData,
        leverage: formData.leverage && formData.leverage.trim() !== '' ? parseInt(formData.leverage) : null
      };

      const url = broker ? `/api/brokers/${broker.id}` : '/api/brokers';
      const method = broker ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        const error = await response.text();
        alert('Hata: ' + error);
      }
    } catch (error) {
      console.error('Error saving broker:', error);
      alert('Beklenmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderPlatformSelection = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Platform Seçin</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedPlatform === platform.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-border hover:border-blue-200'
            } ${!platform.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => platform.supported && setSelectedPlatform(platform.id)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{platform.icon}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{platform.name}</h3>
                  {platform.supported ? (
                    <Badge variant="default">Destekleniyor</Badge>
                  ) : (
                    <Badge variant="outline">Yakında</Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-600">{platform.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderConnectionForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Broker Adı</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Örn: Ana MT5 Hesabım"
            required
          />
        </div>

        <div>
          <Label htmlFor="accountId">Hesap Numarası / Login</Label>
          <Input
            id="accountId"
            value={formData.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            placeholder="Örn: 12345678"
            required
          />
        </div>
      </div>

      {(selectedPlatform === 'MT5' || selectedPlatform === 'MT4') && (
        <>
          <div>
            <Label htmlFor="server">Server</Label>
            <Input
              id="server"
              value={formData.server}
              onChange={(e) => handleInputChange('server', e.target.value)}
              placeholder="Örn: MetaQuotes-Demo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Kullanıcı Adı (Opsiyonel)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="MT5'te genelde login ile aynı"
              />
            </div>

            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Broker şifreniz"
              />
            </div>
          </div>
        </>
      )}

      {selectedPlatform === 'Binance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={formData.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="Binance API Key"
            />
          </div>

          <div>
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={formData.apiSecret}
              onChange={(e) => handleInputChange('apiSecret', e.target.value)}
              placeholder="Binance API Secret"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="currency">Para Birimi</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="TRY">TRY</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="BTC">BTC</SelectItem>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="BNB">BNB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="leverage">Kaldıraç</Label>
          <Input
            id="leverage"
            type="number"
            value={formData.leverage}
            onChange={(e) => handleInputChange('leverage', e.target.value)}
            placeholder="100"
          />
        </div>

        <div>
          <Label htmlFor="company">Broker Şirketi</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Opsiyonel"
          />
        </div>
      </div>

      {selectedPlatform === 'MT5' && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">MT5 Otomatik Entegrasyon</h4>
              <p className="text-sm text-blue-800">
                Gerçek zamanlı trade senkronizasyonu için Expert Advisor (EA) kullanın.
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                  <Download className="h-3 w-3 mr-1" />
                  EA İndir
                </Button>
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Kurulum Rehberi
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {selectedPlatform === 'Binance' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-900">Binance API Entegrasyonu</h4>
              <p className="text-sm text-yellow-800">
                Otomatik trade senkronizasyonu için Binance API key'lerinizi güvenli şekilde kullanın.
              </p>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>• API Key ve Secret'ı Binance hesabınızdan oluşturun</p>
                <p>• Sadece "Read" izinleri yeterli (güvenlik için)</p>
                <p>• Futures ve Spot trading desteklenir</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  API Rehberi
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {broker ? 'Broker Düzenle' : 'Yeni Broker Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!broker && renderPlatformSelection()}
          
          {(selectedPlatform || broker) && renderConnectionForm()}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!selectedPlatform && !broker) || !formData.name || !formData.accountId}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {broker ? 'Güncelle' : 'Broker Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
