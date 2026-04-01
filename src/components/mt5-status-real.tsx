"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Activity, RefreshCw, AlertCircle, CheckCircle, Download } from "lucide-react";

interface MT5Connection {
  appId: string;
  account: {
    login: number;
    server: string;
    currency: string;
    balance: number;
    equity: number;
  };
  lastHeartbeat: string;
  status: 'active' | 'inactive';
  isOnline: boolean;
}

interface MT5StatusResponse {
  success: boolean;
  connections: MT5Connection[];
  totalConnections: number;
  onlineConnections: number;
}

export function MT5StatusReal() {
  const { t } = useLanguage();
  const [statusData, setStatusData] = useState<MT5StatusResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchMT5Status = async () => {
    try {
      setIsRefreshing(true);
      setError('');
      
      const response = await fetch('/api/mt5/import', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('MT5 status alınamadı');
      }

      const data: MT5StatusResponse = await response.json();
      setStatusData(data);

    } catch (err) {
      console.error('MT5 status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMT5Status();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMT5Status, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (isOnline: boolean) => {
    return (
      <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
      </Badge>
    );
  };

  const formatLastSeen = (lastHeartbeat: string) => {
    const date = new Date(lastHeartbeat);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Şimdi';
    if (diffMinutes < 60) return `${diffMinutes} dk önce`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  const downloadEA = () => {
    const link = document.createElement('a');
    link.href = '/mt5-expert-advisor-real.mq5';
    link.download = 'TradeJournal-EA.mq5';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          MT5 Real-Time Sync
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadEA}
            title="Expert Advisor İndir"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMT5Status}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {statusData && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>Toplam: {statusData.totalConnections}</span>
            <span className="text-green-600">Çevrimiçi: {statusData.onlineConnections}</span>
          </div>
        )}

        {!statusData || statusData.connections.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">MT5 bağlantısı yok</p>
            <p className="text-xs mt-1">
              Expert Advisor'ı MT5'te çalıştırın
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadEA}
              className="mt-2"
            >
              <Download className="w-4 h-4 mr-1" />
              EA İndir
            </Button>
          </div>
        ) : (
          statusData.connections.map((connection) => (
            <div key={connection.appId} className="space-y-2 p-3 border rounded-lg bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(connection.isOnline)}
                  <span className="text-sm font-medium">
                    Account {connection.account.login}
                  </span>
                </div>
                {getStatusBadge(connection.isOnline)}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Server:</span>
                  <span className="font-mono text-blue-600">{connection.account.server}</span>
                </div>
                
                {connection.isOnline && (
                  <>
                    <div className="flex justify-between">
                      <span>Balance:</span>
                      <span className="font-mono font-medium">
                        {connection.account.balance.toFixed(2)} {connection.account.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equity:</span>
                      <span className="font-mono font-medium">
                        {connection.account.equity.toFixed(2)} {connection.account.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>P&L:</span>
                      <span className={`font-mono font-medium ${
                        connection.account.equity - connection.account.balance >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(connection.account.equity - connection.account.balance >= 0 ? '+' : '')}
                        {(connection.account.equity - connection.account.balance).toFixed(2)} {connection.account.currency}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span>Son sinyal:</span>
                  <span className="font-medium">{formatLastSeen(connection.lastHeartbeat)}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* EA Installation Guide */}
        <details className="text-xs text-muted-foreground border-t pt-3">
          <summary className="cursor-pointer hover:text-foreground font-medium">
            🚀 Expert Advisor Kurulum Rehberi
          </summary>
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200">
            <div className="font-medium text-blue-700">Adım 1: EA Dosyasını İndirin</div>
            <div>• Yukarıdaki "EA İndir" butonuna tıklayın</div>
            
            <div className="font-medium text-blue-700 mt-2">Adım 2: MT5'e Yükleyin</div>
            <div>• MT5 → Dosya → Veri Klasörünü Aç</div>
            <div>• MQL5 → Experts klasörüne gidin</div>
            <div>• İndirilen .mq5 dosyasını kopyalayın</div>
            
            <div className="font-medium text-blue-700 mt-2">Adım 3: Ayarlar</div>
            <div>• MT5'i yeniden başlatın</div>
            <div>• Tools → Options → Expert Advisors</div>
            <div>• "Allow WebRequest for listed URL" işaretleyin</div>
            <div>• URL ekleyin: <code className="bg-gray-100 px-1 rounded">http://localhost:3000/api/mt5/import</code></div>
            
            <div className="font-medium text-blue-700 mt-2">Adım 4: Çalıştırın</div>
            <div>• EA'yı herhangi bir grafiğe sürükleyin</div>
            <div>• "Allow live trading" seçeneğini işaretleyin</div>
            <div>• İşlemler otomatik olarak senkronize edilecek! ✨</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
