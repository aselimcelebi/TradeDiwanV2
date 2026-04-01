"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { mt5Connector, MT5Trade, MT5Account } from "@/lib/mt5-connector";
import { Wifi, WifiOff, Download, RefreshCw, Activity, DollarSign } from "lucide-react";

export default function MT5Status() {
  const { t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<MT5Account | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportTime, setLastImportTime] = useState<Date | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    // Set up MT5 connector event listeners
    mt5Connector.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    mt5Connector.onAccountUpdate((account) => {
      setAccountInfo(account);
    });

    mt5Connector.onTrade(async (trade) => {
      // Auto-import new trades
      await handleTradeImport(trade);
    });

    // Initial status check
    setIsConnected(mt5Connector.getConnectionStatus());
    setAccountInfo(mt5Connector.getAccountInfo());

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleTradeImport = async (mt5Trade: MT5Trade) => {
    try {
      const appTrade = mt5Connector.convertToAppTrade(mt5Trade);
      
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appTrade),
      });

      if (response.ok) {
        setImportedCount(prev => prev + 1);
        setLastImportTime(new Date());
        
        // Show success notification
        console.log('Trade imported successfully:', mt5Trade.ticket);
      }
    } catch (error) {
      console.error('Error importing trade:', error);
    }
  };

  const handleManualImport = async () => {
    if (!isConnected) return;
    
    setIsImporting(true);
    try {
      // Request last 30 days of trade history
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const toDate = new Date();
      
      mt5Connector.requestTradeHistory(fromDate, toDate);
      
      // Note: The actual import will happen via the onTrade callback
      setTimeout(() => setIsImporting(false), 3000);
    } catch (error) {
      console.error('Error requesting trade history:', error);
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4 space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </div>
          
          <div>
            <div className="font-medium text-neutral-900">
              MetaTrader 5
            </div>
            <div className={`text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
            </div>
          </div>
        </div>

        <button
          onClick={handleManualImport}
          disabled={!isConnected || isImporting}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isImporting ? 'İçe Aktarılıyor...' : 'İşlemleri İçe Aktar'}</span>
        </button>
      </div>

      {/* Account Info */}
      {isConnected && accountInfo && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-neutral-500" />
            <div>
              <div className="text-xs text-neutral-500">Hesap</div>
              <div className="text-sm font-medium text-neutral-900">
                {accountInfo.login}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-neutral-500" />
            <div>
              <div className="text-xs text-neutral-500">Bakiye</div>
              <div className="text-sm font-medium text-neutral-900">
                ${accountInfo.balance.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="text-xs text-neutral-500">Sunucu</div>
            <div className="text-sm font-medium text-neutral-900">
              {accountInfo.server} - {accountInfo.company}
            </div>
          </div>
        </div>
      )}

      {/* Import Statistics */}
      {importedCount > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Toplam İçe Aktarılan:</span>
            <span className="font-medium text-green-600">{importedCount} işlem</span>
          </div>
          {lastImportTime && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-neutral-500">Son İçe Aktarma:</span>
              <span className="text-neutral-500">
                {lastImportTime.toLocaleTimeString('tr-TR')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Connection Instructions */}
      {!isConnected && (
        <div className="pt-4 border-t border-border">
          <div className="text-xs text-neutral-500 space-y-1">
            <div className="font-medium">Bağlantı Kurma:</div>
            <div>1. MT5'te Trade Journal EA'sını yükleyin</div>
            <div>2. WebSocket portunu (8080) açın</div>
            <div>3. EA'yı aktif edin</div>
          </div>
        </div>
      )}
    </div>
  );
}
