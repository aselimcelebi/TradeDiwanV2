"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useBroker } from "@/contexts/broker-context";
import { cn } from "@/lib/utils";
import { Sun, Moon, Filter, Calendar, ChevronDown, Building2, Check, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

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
  title:            string;
  subtitle?:        string;
  showFilters?:     boolean;
  onFiltersChange?: (f: FilterOptions & { dateRange: DateRange }) => void;
  onImportTrades?:  () => void;
  selectedBrokerId?: string;
  onBrokerChange?:  (id: string) => void;
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
  const { theme, toggleTheme } = useTheme();

  const [brokers, setBrokers]                 = useState<Broker[]>([]);
  const [filters, setFilters]                 = useState<FilterOptions>({ symbol: "", strategy: "", side: "ALL", outcome: "ALL" });
  const [dateRange, setDateRange]             = useState<DateRange>(DATE_RANGES[2]);
  const [showFilterDrop, setShowFilterDrop]   = useState(false);
  const [showDateDrop, setShowDateDrop]       = useState(false);
  const [showBrokerDrop, setShowBrokerDrop]   = useState(false);
  const [showProfileDrop, setShowProfileDrop] = useState(false);

  const brokerRef  = useRef<HTMLDivElement>(null);
  const filterRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/brokers")
      .then(r => r.ok ? r.json() : [])
      .then(data => setBrokers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
    background:   "#ffffff",
    border:       "1px solid rgba(15,23,42,0.10)",
    boxShadow:    "0 8px 24px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
    borderRadius: "14px",
  };

  const btnStyle: React.CSSProperties = {
    background:   "#ffffff",
    border:       "1px solid rgba(15,23,42,0.10)",
    color:        "#475569",
    borderRadius: "10px",
    padding:      "5px 12px",
    fontSize:     "12px",
    fontWeight:   500,
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "6px",
    cursor:       "pointer",
    transition:   "all 0.15s",
    whiteSpace:   "nowrap" as const,
    boxShadow:    "0 1px 3px rgba(15,23,42,0.06)",
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 gap-3"
      style={{
        background:     "var(--bg-base)",
        borderBottom:   "1px solid var(--border-subtle)",
        minHeight:      "56px",
      }}
    >
      {/* Left: Title */}
      <div className="flex-shrink-0">
        <h1 className="text-sm font-semibold leading-none" style={{ color: "#0f172a" }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{subtitle}</p>}
      </div>

      {/* Center: Controls */}
      <div className="flex items-center gap-2 flex-1 justify-center">

        {/* Broker Selector */}
        <div className="relative" ref={brokerRef}>
          <button
            onClick={() => { setShowBrokerDrop(!showBrokerDrop); setShowFilterDrop(false); setShowProfileDrop(false); }}
            style={{
              ...btnStyle,
              borderColor: selectedBrokerId ? "#0d9488" : "rgba(15,23,42,0.10)",
              color:       selectedBrokerId ? "#0d9488" : "#475569",
              background:  selectedBrokerId ? "rgba(13,148,136,0.07)" : "#ffffff",
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
              <div
                onClick={() => { setSelectedBrokerId(null); setShowBrokerDrop(false); }}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors"
                style={{ background: !selectedBrokerId ? "rgba(13,148,136,0.07)" : "transparent" }}
                onMouseEnter={e => { if (selectedBrokerId) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (selectedBrokerId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div className="flex items-center gap-2">
                  <span>🌐</span>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "#0f172a" }}>Tüm Hesaplar</div>
                    <div className="text-xs" style={{ color: "#94a3b8" }}>Tüm broker verileri</div>
                  </div>
                </div>
                {!selectedBrokerId && <Check style={{ width: 14, height: 14, color: "#0d9488" }} />}
              </div>

              {brokers.length > 0 && (
                <div className="border-t" style={{ borderColor: "rgba(15,23,42,0.07)" }}>
                  {brokers.map(broker => (
                    <div
                      key={broker.id}
                      onClick={() => { setSelectedBrokerId(broker.id); setShowBrokerDrop(false); }}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors"
                      style={{ background: selectedBrokerId === broker.id ? "rgba(13,148,136,0.07)" : "transparent" }}
                      onMouseEnter={e => { if (selectedBrokerId !== broker.id) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (selectedBrokerId !== broker.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{PLATFORM_ICONS[broker.platform] || "🏦"}</span>
                        <div>
                          <div className="font-medium" style={{ color: "#0f172a" }}>{broker.name}</div>
                          <div className="text-xs" style={{ color: "#94a3b8" }}>
                            {broker.platform} · {broker.accountId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: broker.status === "connected" ? "#10b981" : "#cbd5e1" }}
                        />
                        {selectedBrokerId === broker.id && <Check style={{ width: 14, height: 14, color: "#0d9488" }} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {brokers.length === 0 && (
                <div className="px-4 py-4 text-xs text-center" style={{ color: "#94a3b8" }}>
                  Henüz broker eklenmemiş
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtrele */}
        {showFilters && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => { setShowFilterDrop(!showFilterDrop); setShowBrokerDrop(false); setShowDateDrop(false); }}
              style={{
                ...btnStyle,
                borderColor: activeFilterCount > 0 ? "#0d9488" : "rgba(15,23,42,0.10)",
                color:       activeFilterCount > 0 ? "#0d9488" : "#475569",
                background:  activeFilterCount > 0 ? "rgba(13,148,136,0.07)" : "#ffffff",
              }}
            >
              <Filter style={{ width: 13, height: 13 }} />
              Filtrele
              {activeFilterCount > 0 && (
                <span style={{ background: "#0d9488", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterDrop && (
              <div className="absolute top-full left-0 mt-1.5 w-72 z-50 p-4 animate-slide-up" style={dropStyle}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "#64748b" }}>Sembol</label>
                    <input className="input text-sm" placeholder="BTCUSDT, EURUSD..." value={filters.symbol}
                      onChange={e => setFilters(p => ({ ...p, symbol: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "#64748b" }}>Strateji</label>
                    <input className="input text-sm" placeholder="Breakout, Scalping..." value={filters.strategy}
                      onChange={e => setFilters(p => ({ ...p, strategy: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "#64748b" }}>Yön</label>
                      <select className="input text-sm" value={filters.side}
                        onChange={e => setFilters(p => ({ ...p, side: e.target.value as any }))}>
                        <option value="ALL">Tümü</option>
                        <option value="LONG">Long</option>
                        <option value="SHORT">Short</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "#64748b" }}>Sonuç</label>
                      <select className="input text-sm" value={filters.outcome}
                        onChange={e => setFilters(p => ({ ...p, outcome: e.target.value as any }))}>
                        <option value="ALL">Tümü</option>
                        <option value="WIN">Kazanan</option>
                        <option value="LOSS">Kaybeden</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(15,23,42,0.07)" }}>
                    <button onClick={clearFilters} className="flex-1 btn-secondary text-xs py-1.5">Temizle</button>
                    <button onClick={() => applyFilters()} className="flex-1 btn-primary text-xs py-1.5">Uygula</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tarih */}
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
              <div className="absolute top-full left-0 mt-1.5 w-40 z-50 py-1.5 animate-slide-up" style={dropStyle}>
                {DATE_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setDateRange(r); applyFilters(filters, r); setShowDateDrop(false); }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color:      dateRange.value === r.value ? "#0d9488" : "#475569",
                      background: dateRange.value === r.value ? "rgba(13,148,136,0.07)" : "transparent",
                      fontWeight: dateRange.value === r.value ? 500 : 400,
                    }}
                    onMouseEnter={e => { if (dateRange.value !== r.value) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
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

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="flex-shrink-0 p-2 rounded-xl transition-all"
        style={{ color: "var(--text-secondary)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        title={theme === "light" ? "Dark moda geç" : "Light moda geç"}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}
      >
        {theme === "light"
          ? <Moon style={{ width: 15, height: 15 }} />
          : <Sun style={{ width: 15, height: 15, color: "#f59e0b" }} />
        }
      </button>

      {/* Right: Profile */}
      <div className="relative flex-shrink-0" ref={profileRef}>
        <button
          onClick={() => { setShowProfileDrop(!showProfileDrop); setShowBrokerDrop(false); setShowFilterDrop(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
          style={{ color: "#475569" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.05)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff" }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? "T"}
          </div>
          <ChevronDown style={{ width: 12, height: 12 }} />
        </button>

        {showProfileDrop && (
          <div className="absolute top-full right-0 mt-1.5 w-52 z-50 overflow-hidden animate-slide-up" style={dropStyle}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(15,23,42,0.07)" }}>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{session?.user?.name ?? "Kullanıcı"}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>{session?.user?.email ?? ""}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: "#475569" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
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
