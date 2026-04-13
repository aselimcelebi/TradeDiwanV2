"use client";

import { useState } from "react";
import { Broker } from "@prisma/client";
import { Plus, Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import AddBrokerModal from "./add-broker-modal";

interface BrokerWithCounts extends Broker { _count: { trades: number } }
interface BrokerManagementContentProps { brokers: BrokerWithCounts[] }

const PLATFORM_ICONS: Record<string, string> = {
  MT5: "🏛️", MT4: "🏦", Binance: "🟡", cTrader: "📊", NinjaTrader: "🥷",
};

const STATUS_CONFIG = {
  connected:    { label: "Bağlı",        color: "#10b981",            bg: "var(--green-dim)",    Icon: CheckCircle  },
  connecting:   { label: "Bağlanıyor",   color: "#3b82f6",            bg: "var(--blue-dim)",     Icon: RefreshCw    },
  disconnected: { label: "Bağlantı Yok", color: "var(--text-muted)",  bg: "var(--bg-elevated)",  Icon: AlertCircle  },
  error:        { label: "Hata",         color: "#ef4444",            bg: "var(--red-dim)",      Icon: XCircle      },
};

export default function BrokerManagementContent({ brokers }: BrokerManagementContentProps) {
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [selectedBroker, setSelected] = useState<BrokerWithCounts | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu broker hesabını silmek istediğinizden emin misiniz?")) return;
    const res = await fetch(`/api/brokers/${id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
  };

  const handleReconnect = async (id: string) => {
    const res = await fetch(`/api/brokers/${id}/reconnect`, { method: "POST" });
    if (res.ok) window.location.reload();
  };

  const handleSync = async (id: string, platform: string) => {
    if (platform !== "Binance") { alert("Otomatik senkronizasyon şu an sadece Binance için destekleniyor."); return; }
    const res    = await fetch(`/api/brokers/${id}/sync`, { method: "POST" });
    const result = await res.json();
    if (res.ok) { alert(`✅ ${result.message}`); window.location.reload(); }
    else alert(`❌ ${result.error}`);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Broker Yönetimi</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Trading platformlarınızı bağlayın ve yönetin</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>
          <Plus className="w-3.5 h-3.5 inline mr-1.5" />Broker Ekle
        </button>
      </div>

      {brokers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-elevated)" }}>
            <Plus className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Henüz broker hesabınız yok</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Trading platformlarınızı bağlayarak otomatik trade senkronizasyonu başlatın</p>
          <button onClick={() => setIsAddOpen(true)} className="btn-primary">İlk Broker'ı Ekle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {brokers.map(broker => {
            const sc = STATUS_CONFIG[broker.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected;
            return (
              <div key={broker.id} className="card p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{PLATFORM_ICONS[broker.platform] || "📈"}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{broker.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{broker.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                    <sc.Icon className={`w-3 h-3 ${broker.status === "connecting" ? "animate-spin" : ""}`} />
                    {sc.label}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Hesap",        val: broker.accountId },
                    { label: "Para Birimi",  val: broker.currency || "USD" },
                    { label: "Trade Sayısı", val: broker._count.trades.toString() },
                    ...(broker.server   ? [{ label: "Server",   val: broker.server }] : []),
                    ...(broker.lastSync ? [{ label: "Son Sync", val: new Date(broker.lastSync).toLocaleString("tr-TR") }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                      <span className="text-xs font-medium font-mono" style={{ color: "var(--text-secondary)" }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {broker.platform === "Binance" && (
                    <button onClick={() => handleSync(broker.id, broker.platform)} className="btn-secondary flex-1 text-xs" style={{ padding: "5px 8px", color: "#3b82f6" }}>
                      <Download className="w-3 h-3 inline mr-1" />Sync
                    </button>
                  )}
                  {broker.status !== "connected" && (
                    <button onClick={() => handleReconnect(broker.id)} className="btn-secondary flex-1 text-xs" style={{ padding: "5px 8px" }}>
                      <RefreshCw className="w-3 h-3 inline mr-1" />Bağlan
                    </button>
                  )}
                  <button onClick={() => setSelected(broker)} className="btn-secondary flex-1 text-xs" style={{ padding: "5px 8px" }}>
                    <Settings className="w-3 h-3 inline mr-1" />Ayarlar
                  </button>
                  <button onClick={() => handleDelete(broker.id)} className="btn-ghost p-2" style={{ color: "var(--red)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddBrokerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {selectedBroker && (
        <AddBrokerModal isOpen={!!selectedBroker} onClose={() => setSelected(null)} broker={selectedBroker} />
      )}
    </div>
  );
}
