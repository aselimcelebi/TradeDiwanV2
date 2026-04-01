"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Wifi, Edit, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface BrokerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SyncMethod = 'auto' | 'file' | 'manual';
type Platform = 'mt4' | 'mt5' | 'ctrader' | 'ninjatrader';

interface BrokerConnection {
  id: string;
  platform: Platform;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  accountName: string;
  server: string;
  lastSync?: Date;
  error?: string;
}

export function BrokerSyncModal({ isOpen, onClose }: BrokerSyncModalProps) {
  const { t } = useLanguage();
  const [activeMethod, setActiveMethod] = useState<SyncMethod>('auto');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('mt5');
  const [connections, setConnections] = useState<BrokerConnection[]>([
    {
      id: '1',
      platform: 'mt5',
      status: 'connected',
      accountName: 'Demo Account - 12345',
      server: 'MetaQuotes-Demo',
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }
  ]);

  const [formData, setFormData] = useState({
    server: '',
    login: '',
    password: '',
    startDate: '',
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const platforms = [
    { value: 'mt4', label: 'MetaTrader 4', description: 'Most popular forex platform' },
    { value: 'mt5', label: 'MetaTrader 5', description: 'Advanced trading platform' },
    { value: 'ctrader', label: 'cTrader', description: 'Professional trading platform' },
    { value: 'ninjatrader', label: 'NinjaTrader', description: 'Futures & forex platform' },
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.server.trim()) {
      errors.server = t.required;
    } else if (!/^[a-zA-Z0-9\-\.]+$/.test(formData.server)) {
      errors.server = 'Geçersiz server formatı';
    }

    if (!formData.login.trim()) {
      errors.login = t.required;
    } else if (!/^\d{6,10}$/.test(formData.login)) {
      errors.login = 'Login 6-10 haneli sayı olmalıdır';
    }

    if (!formData.password.trim()) {
      errors.password = t.required;
    } else if (formData.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConnect = async () => {
    setConnectionError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsConnecting(true);
    
    try {
      const response = await fetch('/api/broker/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          server: formData.server,
          login: formData.login,
          password: formData.password,
          startDate: formData.startDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bağlantı başarısız');
      }

      if (result.success) {
        const newConnection: BrokerConnection = {
          id: Date.now().toString(),
          platform: selectedPlatform,
          status: 'connected',
          accountName: result.accountInfo.accountName,
          server: result.accountInfo.server,
          lastSync: new Date(),
        };
        
        setConnections(prev => [...prev, newConnection]);
        setFormData({ server: '', login: '', password: '', startDate: '' });
        
        // Show success message with auto-close modal
        setTimeout(() => {
          alert(`✅ Başarılı! ${result.tradesImported} işlem içe aktarıldı.`);
          onClose(); // Close modal after successful connection
        }, 500);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('platform', selectedPlatform);
    
    try {
      const response = await fetch('/api/broker/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Handle successful upload
        setUploadFile(null);
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const getStatusIcon = (status: BrokerConnection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: BrokerConnection['status']) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      connecting: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      disconnected: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      connected: t.connected,
      connecting: t.connecting,
      error: t.error,
      disconnected: t.disconnected,
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            {t.brokerSync}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as SyncMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              {t.autoSync}
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t.fileUpload}
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              {t.manual}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-6">
            {/* Connected Accounts */}
            {connections.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.connectedAccounts}</h3>
                <div className="grid gap-4">
                  {connections.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(connection.status)}
                            <div>
                              <div className="font-medium">{connection.accountName}</div>
                              <div className="text-sm text-muted-foreground">
                                {connection.server} • {connection.platform.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(connection.status)}
                            {connection.lastSync && (
                              <span className="text-xs text-muted-foreground">
                                {t.lastSync}: {connection.lastSync.toLocaleTimeString('tr-TR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Connection */}
            <Card>
              <CardHeader>
                <CardTitle>{t.addNewBroker}</CardTitle>
                <CardDescription>
                  {t.connectYourTradingAccount}
                </CardDescription>
                
                {/* Real MT5 Integration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-2">🚀 Gerçek MT5 Bağlantısı İçin</p>
                      <p className="text-blue-800 mb-3">
                        Sürekli otomatik işlem aktarımı için Expert Advisor kullanmanız gerekiyor. 
                        Bu form sadece demo test amaçlıdır.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={() => window.open('/mt5-expert-advisor-real.mq5', '_blank')}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          📥 Expert Advisor İndir (.mq5)
                        </button>
                        <button 
                          onClick={() => window.open('/docs/MT5-INTEGRATION-GUIDE.md', '_blank')}
                          className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          📚 Kurulum Rehberi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Demo Test Info */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 mb-1">Demo Test Bilgileri:</p>
                      <p className="text-green-700">
                        <strong>Server:</strong> MetaQuotes-Demo<br/>
                        <strong>Login:</strong> 12345678 veya 50123456<br/>
                        <strong>Password:</strong> herhangi (min 6 karakter)
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.platform}</Label>
                  <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          <div>
                            <div className="font-medium">{platform.label}</div>
                            <div className="text-sm text-muted-foreground">{platform.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.server}</Label>
                    <Input
                      placeholder="MetaQuotes-Demo"
                      value={formData.server}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, server: e.target.value }));
                        setValidationErrors(prev => ({ ...prev, server: '' }));
                      }}
                      className={validationErrors.server ? 'border-red-500' : ''}
                    />
                    {validationErrors.server && (
                      <p className="text-sm text-red-600">{validationErrors.server}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t.login}</Label>
                    <Input
                      placeholder="12345678"
                      value={formData.login}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, login: e.target.value }));
                        setValidationErrors(prev => ({ ...prev, login: '' }));
                      }}
                      className={validationErrors.login ? 'border-red-500' : ''}
                    />
                    {validationErrors.login && (
                      <p className="text-sm text-red-600">{validationErrors.login}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.investorPassword}</Label>
                    <Input
                      type="password"
                      placeholder="******"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={validationErrors.password ? 'border-red-500' : ''}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-600">{validationErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t.startDate} ({t.optional})</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Connection Error Display */}
                {connectionError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">{connectionError}</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting || !formData.server || !formData.login || !formData.password}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.connecting}...
                    </>
                  ) : (
                    t.connect
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.uploadTradeHistory}</CardTitle>
                <CardDescription>
                  {t.uploadInstructions}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.platform}</Label>
                  <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.selectFile}</Label>
                  <Input
                    type="file"
                    accept=".html,.csv,.xlsx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile && (
                    <div className="text-sm text-muted-foreground">
                      {t.selectedFile}: {uploadFile.name}
                    </div>
                  )}
                </div>

                <Button onClick={handleFileUpload} disabled={!uploadFile} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {t.uploadFile}
                </Button>
              </CardContent>
            </Card>

            {/* File Upload Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>{t.howToExport}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>MetaTrader 5:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4 text-muted-foreground">
                    <li>{t.mt5Step1}</li>
                    <li>{t.mt5Step2}</li>
                    <li>{t.mt5Step3}</li>
                    <li>{t.mt5Step4}</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>{t.manualEntry}</CardTitle>
                <CardDescription>
                  {t.manualEntryDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={onClose} className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  {t.addTradeManually}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
