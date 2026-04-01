"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useBroker } from "@/contexts/broker-context";
import { cn } from "@/lib/utils";
import {
  Filter, Calendar, ChevronDown, Upload,
  Settings, LogOut, Building2, Check, X,
} from "lucide-react";

interface FilterOptions {
  symbol:   string;
  strategy: string;
  side:     "ALL" | "LONG" | "SHORT";
  outcome:  "ALL" | "WIN" | "LOSS";
}

interface DateRange {
  label: string;
  value: string;
}

interface Broker {
  id:        string;
  name:      string;
  platform:  string;
  accountId: string;
  status:    string;
}

interface HeaderProps {
  title:             string;
  subtitle?:         string;
  showFilters?:      boolean;
  onFiltersChange?:  (f: FilterOptions & { dateRange: DateRange }) => void;
  onImportTrades?:   () => void;
  selectedBrokerId?: string;
  onBrokerChange?:   (id: string) => void;
}

const DATE_RANGES: DateRange[] = [
  { label: "Bugün",      value: "today"  },
  { label: "Bu Hafta",   value: "week"   },
  { label: "Bu Ay",      value: "month"  },
  { label: "Son 30 Gün", value: "30days" },
  { label: "Tümü",       value: "all"    },
];

const PLATFORM_ICONS: Record<string, string> = {
  MT5: "📊", MT4: "📈", cTrader: "🔷",
  Binance: "🟡", Bybit: "🟠", NinjaTrader: "🥷",
};

export default function Header({
  title, subtitle, showFilters = true,
  onFiltersChange, onImportTrades,
}: HeaderProps) {
  const { data: session } = useSession();
  const { selectedBrokerId, setSelectedBrokerId } = useBroker();

  const [brokers, setBrokers]                   = useState<Broker[]>([]);
  const [filters, setFilters]                   = useState<FilterOptions>({ symbol: "", strategy: "", side: "ALL", outcome: "ALL" });
  const [dateRange, setDateRange]               = useState<DateRange>(DATE_RANGES[2]);
  const [showFilterDrop, setShowFilterDrop]     = useState(false);
  const [showDateDrop, setShowDateDrop]         = useState(false);
  const [showBrokerDrop, setShowBrokerDrop]     = useState(false);
  const [showProfileDrop, setShowProfileDrop]   = useState(false);

  const brokerRef  = useRef<HTMLDivElement>(null);
  const filterRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Broker listesini çek
  useEffect(() => {
    fetch("/api/brokers")
      .then(r => r.ok ? r.json() : [])
      .then(data => setBrokers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Dışarı tıklayınca dropdown'ları kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brokerRef.current  && !brokerRef.current.contains(e.target as Node))  setShowBrokerDrop(false);
      if (filterRef.current  && !filterRef.current.contains(e.target as Node))  setShowFilterDrop(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedBroker = brokers.find(b => b.id === selectedBrokerId);

  const applyFilters = (f = filters, dr = dateRange) => {
    onFiltersChange?.({ ...f, dateRange: dr });
    setShowFilterDrop(false);
    setShowDateDrop(false);
  };

  const clearFilters = () => {
    const reset: FilterOptions = { symbol: "", strategy: "", side: "ALL", outcome: "ALL" };
    setFilters(reset);
    applyFilters(reset);
  };

  const activeFilterCount = [
    filters.symbol,
    filters.strategy,
    filters.side !== "ALL" ? "1" : "",
    filters.outcome !== "ALL" ? "1" : "",
  ].filter(Boolean).length;

  const dropStyle: React.CSSProperties = {
    background:   "var(--bg-elevated)",
    border:       "1px solid var(--border-default)",
    boxShadow:    "0 10px 30px rgba(0,0,0,0.5)",
    borderRadius: "12px",
  };

  const btnStyle: React.CSSProperties = {
    background:   "var(--bg-elevated)",
    border:       "1px solid var(--border-default)",
    color:        "var(--text-secondary)",
    borderRadius: "8px",
    padding:      "5px 10px",
    fontSize:     "12px",
    fontWeight:   500,
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "6px",
    cursor:       "pointer",
    transition:   "all 0.1s",
    whiteSpace:   "nowrap" as any,
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-5 py-2.5 gap-3"
      style={{
        background:     "rgba(10,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom:   "1px solid var(--border-subtle)",
        minHeight:      "52px",
      }}
    >
      {/* Left: Title */}
      <div className="flex-shrink-0">
        <h1 className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>

      {/* Center: Broker selector + Filters */}
      <div className="flex items-center gap-2 flex-1 justify-center">

        {/* ── Broker Selector ── */}
        <div className="relative" ref={brokerRef}>
          <button
            onClick={() => { setShowBrokerDrop(!showBrokerDrop); setShowFilterDrop(false); setShowProfileDrop(false); }}
            style={{
              ...btnStyle,
              borderColor: selectedBrokerId ? "var(--brand)" : "var(--border-default)",
              color:       selectedBrokerId ? "var(--brand-light)" : "var(--text-secondary)",
              background:  selectedBrokerId ? "var(--brand-dim)"   : "var(--bg-elevated)",
            }}
          >
            <Building2 style={{ width: 13, height: 13 }} />
            {selectedBroker
              ? <>{PLATFORM_ICONS[selectedBroker.platform] || "🏦"} {selectedBroker.name}</>
              : "Tüm Hesaplar"
            }
            <ChevronDown style={{ width: 12, height: 12, opacity: 0.6 }} />
          </button>

          {showBrokerDrop && (
            <div className="absolute top-full left-0 mt-1.5 w-64 z-50 overflow-hidden animate-slide-up" style={dropStyle}>
              {/* Tüm hesaplar */}
              <div
                onClick={() => { setSelectedBrokerId(null); setShowBrokerDrop(false); }}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors"
                style={{
                  background: !selectedBrokerId ? "var(--brand-dim)" : "transparent",
                  color:      !selectedBrokerId ? "var(--brand-light)" : "var(--text-secondary)",
                }}
                onMouseEnter={e => { if (selectedBrokerId) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={e => { if (selectedBrokerId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div className="flex items-center gap-2">
                  <span>🌐</span>
                  <div>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>Tüm Hesaplar</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Tüm broker verileri</div>
                  </div>
                </div>
                {!selectedBrokerId && <Check style={{ width: 14, height: 14 }} />}
              </div>

              {brokers.length > 0 && (
                <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  {brokers.map(broker => (
                    <div
                      key={broker.id}
                      onClick={() => { setSelectedBrokerId(broker.id); setShowBrokerDrop(false); }}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors"
                      style={{
                        background: selectedBrokerId === broker.id ? "var(--brand-dim)" : "transparent",
                        color:      selectedBrokerId === broker.id ? "var(--brand-light)" : "var(--text-secondary)",
                      }}
                      onMouseEnter={e => { if (selectedBrokerId !== broker.id) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={e => { if (selectedBrokerId !== broker.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{PLATFORM_ICONS[broker.platform] || "🏦"}</span>
                        <div>
                          <div className="font-medium" style={{ color: "var(--text-primary)" }}>{broker.name}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {broker.platform} · {broker.accountId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: broker.status === "connected" ? "var(--green)" : "var(--text-muted)" }}
                        />
                        {selectedBrokerId === broker.id && <Check style={{ width: 14, height: 14 }} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {brokers.length === 0 && (
                <div className="px-4 py-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Henüz broker eklenmemiş
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Filtrele ── */}
        {showFilters && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => { setShowFilterDrop(!showFilterDrop); setShowBrokerDrop(false); setShowDateDrop(false); }}
              style={{
                ...btnStyle,
                borderColor: activeFilterCount > 0 ? "var(--brand)" : "var(--border-default)",
                color:       activeFilterCount > 0 ? "var(--brand-light)" : "var(--text-secondary)",
                background:  activeFilterCount > 0 ? "var(--brand-dim)"   : "var(--bg-elevated)",
              }}
            >
              <Filter style={{ width: 13, height: 13 }} />
              Filtrele
              {activeFilterCount > 0 && (
                <span style={{ background: "var(--brand)", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterDrop && (
              <div className="absolute top-full left-0 mt-1.5 w-72 z-50 p-4 animate-slide-up" style={dropStyle}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Sembol</label>
                    <input className="input text-sm" placeholder="BTCUSDT, EURUSD..." value={filters.symbol}
                      onChange={e => setFilters(p => ({ ...p, symbol: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Strateji</label>
                    <input className="input text-sm" placeholder="Breakout, Scalping..." value={filters.strategy}
                      onChange={e => setFilters(p => ({ ...p, strategy: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Yön</label>
                      <select className="input text-sm" value={filters.side}
                        onChange={e => setFilters(p => ({ ...p, side: e.target.value as any }))}>
                        <option value="ALL">Tümü</option>
                        <option value="LONG">Long</option>
                        <option value="SHORT">Short</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Sonuç</label>
                      <select className="input text-sm" value={filters.outcome}
                        onChange={e => setFilters(p => ({ ...p, outcome: e.target.value as any }))}>
                        <option value="ALL">Tümü</option>
                        <option value="WIN">Kazanan</option>
                        <option value="LOSS">Kaybeden</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <button onClick={clearFilters} className="flex-1 btn-secondary text-xs py-1.5">Temizle</button>
                    <button onClick={() => applyFilters()} className="flex-1 btn-primary text-xs py-1.5">Uygula</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tarih ── */}
        {showFilters && (
          <div className="relative">
            <button
              onClick={() => { setShowDateDrop(!showDateDrop); setShowFilterDrop(false); setShowBrokerDrop(false); }}
              style={btnStyle}
            >
              <Calendar style={{ width: 13, height: 13 }} />
              {dateRange.label}
              <ChevronDown style={{ width: 12, height: 12, opacity: 0.6 }} />
            </button>

            {showDateDrop && (
              <div className="absolute top-full left-0 mt-1.5 w-40 z-50 py-1 animate-slide-up" style={dropStyle}>
                {DATE_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setDateRange(r); applyFilters(filters, r); setShowDateDrop(false); }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color:      dateRange.value === r.value ? "var(--brand-light)" : "var(--text-secondary)",
                      background: dateRange.value === r.value ? "var(--brand-dim)"   : "transparent",
                    }}
                    onMouseEnter={e => { if (dateRange.value !== r.value) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={e => { if (dateRange.value !== r.value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Profile */}
      <div className="relative flex-shrink-0" ref={profileRef}>
        <button
          onClick={() => { setShowProfileDrop(!showProfileDrop); setShowBrokerDrop(false); setShowFilterDrop(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--border-default)" }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? "T"}
          </div>
          <ChevronDown style={{ width: 12, height: 12 }} />
        </button>

        {showProfileDrop && (
          <div className="absolute top-full right-0 mt-1.5 w-52 z-50 overflow-hidden animate-slide-up" style={dropStyle}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{session?.user?.name ?? "Kullanıcı"}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{session?.user?.email ?? ""}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </header>
  );
}