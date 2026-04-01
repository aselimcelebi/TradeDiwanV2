"use client";

import { useState } from "react";
import { Broker } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { Plus, Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddBrokerModal from "./add-broker-modal";

interface BrokerWithCounts extends Broker {
  _count: {
    trades: number;
  };
}

interface BrokerManagementContentProps {
  brokers: BrokerWithCounts[];
}

export default function BrokerManagementContent({ brokers }: BrokerManagementContentProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerWithCounts | null>(null);
  const { t } = useLanguage();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      connected: { label: "Bağlı", variant: "default" as const },
      connecting: { label: "Bağlanıyor", variant: "secondary" as const },
      disconnected: { label: "Bağlantı Yok", variant: "outline" as const },
      error: { label: "Hata", variant: "destructive" as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.disconnected;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      MT5: "🏛️",
      MT4: "🏦", 
      Binance: "🟡",
      cTrader: "📊",
      NinjaTrader: "🥷"
    };
    return platformMap[platform] || "📈";
  };

  const handleDeleteBroker = async (brokerId: string) => {
    if (!confirm("Bu broker hesabını silmek istediğinizden emin misiniz?")) return;
    
    try {
      const response = await fetch(`/api/brokers/${brokerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting broker:', error);
    }
  };

  const handleReconnect = async (brokerId: string) => {
    try {
      const response = await fetch(`/api/brokers/${brokerId}/reconnect`, {
        method: 'POST'
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error reconnecting broker:', error);
    }
  };

  const handleSync = async (brokerId: string, platform: string) => {
    if (platform !== 'Binance') {
      alert('Otomatik senkronizasyon şu anda sadece Binance için desteklenmektedir.');
      return;
    }

    try {
      const response = await fetch(`/api/brokers/${brokerId}/sync`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Başarılı!\n${result.message}`);
        window.location.reload();
      } else {
        alert(`❌ Hata: ${result.error}\n${result.details || ''}`);
      }
    } catch (error) {
      console.error('Error syncing broker:', error);
      alert('Senkronizasyon sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Broker Yönetimi</h1>
          <p className="text-neutral-600 mt-1">
            Trading platformlarınızı bağlayın ve yönetin
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Yeni Broker Ekle</span>
        </Button>
      </div>

      {/* Brokers Grid */}
      {brokers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Henüz broker hesabınız yok
              </h3>
              <p className="text-neutral-600 mb-4">
                Trading platformlarınızı bağlayarak otomatik trade senkronizasyonu başlatın
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                İlk Broker'ınızı Ekleyin
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {brokers.map((broker) => (
            <Card key={broker.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(broker.platform)}</span>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{broker.name}</h3>
                    <p className="text-sm text-neutral-600">{broker.platform}</p>
                  </div>
                </div>
                {getStatusIcon(broker.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Durum:</span>
                  {getStatusBadge(broker.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Hesap:</span>
                  <span className="text-sm font-medium">{broker.accountId}</span>
                </div>

                {broker.server && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Server:</span>
                    <span className="text-sm font-medium">{broker.server}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Para Birimi:</span>
                  <span className="text-sm font-medium">{broker.currency || 'USD'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Trade Sayısı:</span>
                  <span className="text-sm font-medium">{broker._count.trades}</span>
                </div>

                {broker.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Son Sync:</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(broker.lastSync).toLocaleString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-border">
                {broker.platform === 'Binance' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(broker.id, broker.platform)}
                    className="flex-1 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Sync Trades
                  </Button>
                )}
                
                {broker.status !== 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReconnect(broker.id)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Yeniden Bağlan
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBroker(broker)}
                  className="flex-1"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Ayarlar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBroker(broker.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Broker Modal */}
      <AddBrokerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Broker Modal - TODO: Implement */}
      {selectedBroker && (
        <AddBrokerModal
          isOpen={!!selectedBroker}
          onClose={() => setSelectedBroker(null)}
          broker={selectedBroker}
        />
      )}
    </div>
  );
}
