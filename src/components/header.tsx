"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Filter, Calendar, ChevronDown, Upload, User,
  Settings, LogOut, Languages, Building2, Search,
  Bell, Moon, Sun,
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
  from?: Date;
  to?: Date;
}

interface Broker {
  id: string;
  name: string;
  platform: string;
  accountId: string;
  status: string;
}

interface HeaderProps {
  title:              string;
  subtitle?:          string;
  showFilters?:       boolean;
  onFiltersChange?:   (f: FilterOptions & { dateRange: DateRange }) => void;
  onImportTrades?:    () => void;
  selectedBrokerId?:  string;
  onBrokerChange?:    (id: string) => void;
}

const DATE_RANGES: DateRange[] = [
  { label: "Bugün",       value: "today" },
  { label: "Bu Hafta",    value: "week"  },
  { label: "Bu Ay",       value: "month" },
  { label: "Son 30 Gün",  value: "30days"},
  { label: "Tümü",        value: "all"   },
];

const PLATFORM_ICONS: Record<string, string> = {
  MT5: "📊", MT4: "📈", cTrader: "🔷",
  Binance: "🟡", Bybit: "🟠", NinjaTrader: "🥷",
};

export default function Header({
  title, subtitle, showFilters = true,
  onFiltersChange, onImportTrades,
  selectedBrokerId, onBrokerChange,
}: HeaderProps) {
  const { data: session } = useSession();

  const [filters, setFilters] = useState<FilterOptions>({
    symbol: "", strategy: "", side: "ALL", outcome: "ALL",
  });
  const [dateRange, setDateRange]           = useState<DateRange>(DATE_RANGES[2]);
  const [showFilterDrop, setShowFilterDrop] = useState(false);
  const [showDateDrop, setShowDateDrop]     = useState(false);
  const [showBrokerDrop, setShowBrokerDrop] = useState(false);
  const [showProfileDrop, setShowProfileDrop] = useState(false);
  const [brokers, setBrokers]               = useState<Broker[]>([]);

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
    filters.symbol, filters.strategy,
    filters.side !== "ALL" ? "1" : "",
    filters.outcome !== "ALL" ? "1" : "",
  ].filter(Boolean).length;

  const btnBase = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-100";
  const btnStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-secondary)",
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(10,12,16,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        minHeight: "56px",
      }}
    >
      {/* Left: Title */}
      <div>
        <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        )}
      </div>

      {/* Center: Filters */}
      {showFilters && (
        <div className="flex items-center gap-2">

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterDrop(!showFilterDrop); setShowDateDrop(false); }}
              className={btnBase}
              style={{
                ...btnStyle,
                ...(activeFilterCount > 0 ? {
                  borderColor: "var(--brand)",
                  color: "var(--brand-light)",
                  background: "var(--brand-dim)",
                } : {}),
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrele
              {activeFilterCount > 0 && (
                <span
                  className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand)", color: "#fff" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilterDrop && (
              <div
                className="absolute top-full left-0 mt-2 w-72 rounded-xl p-4 z-50 animate-slide-up"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-modal)",
                }}
              >
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

          {/* Date range */}
          <div className="relative">
            <button
              onClick={() => { setShowDateDrop(!showDateDrop); setShowFilterDrop(false); }}
              className={btnBase}
              style={btnStyle}
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateRange.label}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDateDrop && (
              <div
                className="absolute top-full left-0 mt-2 w-44 rounded-xl py-1 z-50 animate-slide-up"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {DATE_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setDateRange(r); applyFilters(filters, r); }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color: dateRange.value === r.value ? "var(--brand-light)" : "var(--text-secondary)",
                      background: dateRange.value === r.value ? "var(--brand-dim)" : "transparent",
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
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Import — disabled for now */}
        <button
          disabled
          className={cn(btnBase, "cursor-not-allowed opacity-40")}
          style={btnStyle}
          title="Yakında aktif olacak"
        >
          <Upload className="w-3.5 h-3.5" />
          İçe Aktar
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDrop(!showProfileDrop)}
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
            <ChevronDown className="w-3 h-3" />
          </button>

          {showProfileDrop && (
            <div
              className="absolute top-full right-0 mt-2 w-52 rounded-xl overflow-hidden z-50 animate-slide-up"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {session?.user?.name ?? "Kullanıcı"}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {session?.user?.email ?? ""}
                </p>
              </div>

              {/* Menu items */}
              {[
                { icon: Settings, label: "Ayarlar", action: () => {} },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}

              <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
