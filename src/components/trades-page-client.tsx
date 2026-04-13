"use client";

import { useState, useMemo } from "react";
import { Trade, Strategy } from "@prisma/client";
import { calculateTradeMetrics, formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { TrendingUp, TrendingDown, Filter, Search, Download, Edit3, Trash2, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TradesPageClientProps {
  trades: Trade[];
  strategies: Strategy[];
}

type SortField = "date" | "symbol" | "side" | "pnl" | "qty" | "entryPrice" | "exitPrice";
type SortDir = "asc" | "desc";

interface Filters {
  search: string; symbol: string; side: string;
  strategy: string; winLoss: string; dateFrom: string; dateTo: string;
}

const calcPnL = (t: Trade) =>
  (t.exitPrice - t.entryPrice) * t.qty * (t.side === "LONG" ? 1 : -1) - t.fees;

export default function TradesPageClient({ trades, strategies }: TradesPageClientProps) {
  const [filters, setFilters] = useState<Filters>({
    search: "", symbol: "", side: "", strategy: "", winLoss: "", dateFrom: "", dateTo: "",
  });
  const [sortField, setSortField]   = useState<SortField>("date");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 50;

  const filtered = useMemo(() => {
    let list = trades.filter(t => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.symbol.toLowerCase().includes(q) &&
            !t.strategy?.toLowerCase().includes(q) &&
            !t.notes?.toLowerCase().includes(q)) return false;
      }
      if (filters.symbol && t.symbol !== filters.symbol) return false;
      if (filters.side && t.side !== filters.side) return false;
      if (filters.strategy && t.strategy !== filters.strategy) return false;
      if (filters.winLoss) {
        const p = calcPnL(t);
        if (filters.winLoss === "win" && p <= 0) return false;
        if (filters.winLoss === "loss" && p >= 0) return false;
      }
      if (filters.dateFrom && new Date(t.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(t.date) > new Date(filters.dateTo)) return false;
      return true;
    });

    list.sort((a, b) => {
      let av: any = a[sortField], bv: any = b[sortField];
      if (sortField === "pnl") { av = calcPnL(a); bv = calcPnL(b); }
      if (sortField === "date") { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); }
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [trades, filters, sortField, sortDir]);

  const metrics    = calculateTradeMetrics(filtered);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const uniqueSymbols   = [...new Set(trades.map(t => t.symbol))].sort();
  const uniqueStrategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))].sort();

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const clearFilters = () => {
    setFilters({ search: "", symbol: "", side: "", strategy: "", winLoss: "", dateFrom: "", dateTo: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const kpis = [
    { label: "Net P&L",       val: formatCurrency(metrics.totalPnL, "USD", true), color: metrics.totalPnL >= 0 ? "#10b981" : "#ef4444", accent: metrics.totalPnL >= 0 ? "accent-green" : "accent-red", Icon: metrics.totalPnL >= 0 ? TrendingUp : TrendingDown },
    { label: "Win Rate",       val: `${metrics.winRate.toFixed(1)}%`,              color: metrics.winRate >= 50 ? "#10b981" : "#f59e0b",  accent: "accent-teal", Icon: TrendingUp },
    { label: "Toplam İşlem",   val: filtered.length.toString(),                   color: "var(--text-primary)",                           accent: "accent-teal", Icon: MoreHorizontal },
    { label: "Profit Factor",  val: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2), color: metrics.profitFactor >= 1 ? "#10b981" : "#ef4444", accent: "accent-teal", Icon: TrendingUp },
  ];

  const selStyle: React.CSSProperties = {
    background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
    color: "var(--text-primary)", borderRadius: 10, padding: "6px 10px", fontSize: 13, outline: "none", width: "100%",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5 animate-fade-in">

        {/* KPI strip */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className={`kpi-card ${k.accent}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{k.label}</p>
                <k.Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="text-xl font-bold font-mono tabular-nums" style={{ color: k.color }}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input className="input pl-9" placeholder="Ara: sembol, strateji, not..." value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters || hasActiveFilters ? "btn-primary" : "btn-secondary"}
              style={{ gap: 6, padding: "6px 14px" }}
            >
              <Filter className="w-4 h-4" />
              Filtrele
              {hasActiveFilters && <span style={{ background: "rgba(255,255,255,0.3)", borderRadius: 12, padding: "0 6px", fontSize: 11 }}>●</span>}
            </button>
            <button className="btn-secondary" style={{ gap: 6, padding: "6px 14px" }}>
              <Download className="w-4 h-4" />
              Export
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>
                Temizle
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <select style={selStyle} value={filters.symbol} onChange={e => setFilters(p => ({ ...p, symbol: e.target.value }))}>
                <option value="">Tüm Semboller</option>
                {uniqueSymbols.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select style={selStyle} value={filters.side} onChange={e => setFilters(p => ({ ...p, side: e.target.value }))}>
                <option value="">Long / Short</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
              <select style={selStyle} value={filters.strategy} onChange={e => setFilters(p => ({ ...p, strategy: e.target.value }))}>
                <option value="">Tüm Stratejiler</option>
                {uniqueStrategies.map(s => <option key={s!} value={s!}>{s}</option>)}
              </select>
              <select style={selStyle} value={filters.winLoss} onChange={e => setFilters(p => ({ ...p, winLoss: e.target.value }))}>
                <option value="">Kazanan / Kaybeden</option>
                <option value="win">Kazanan</option>
                <option value="loss">Kaybeden</option>
              </select>
              <input type="date" style={selStyle} value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
              <input type="date" style={selStyle} value={filters.dateTo}   onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {([
                    { label: "Tarih",   field: "date"       },
                    { label: "Sembol",  field: "symbol"     },
                    { label: "Yön",     field: "side"       },
                    { label: "Miktar",  field: "qty"        },
                    { label: "Giriş",   field: "entryPrice" },
                    { label: "Çıkış",   field: "exitPrice"  },
                    { label: "P&L",     field: "pnl"        },
                    { label: "Strateji",field: null         },
                  ] as const).map(col => (
                    <th key={col.label} className="text-left px-4 py-3 table-head whitespace-nowrap">
                      {col.field ? (
                        <button onClick={() => handleSort(col.field as SortField)}
                          className="flex items-center gap-1 transition-colors"
                          style={{ color: sortField === col.field ? "var(--brand)" : "var(--text-muted)" }}>
                          {col.label}
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                  <th className="table-head px-4 py-3 text-left">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                      {hasActiveFilters ? "Filtreye uygun işlem bulunamadı" : "Henüz işlem yok"}
                    </td>
                  </tr>
                ) : paged.map(trade => {
                  const pnl = calcPnL(trade);
                  return (
                    <tr key={trade.id} className="table-row">
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {format(new Date(trade.date), "dd MMM yy HH:mm", { locale: tr })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {trade.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span className={trade.side === "LONG" ? "badge-long" : "badge-short"}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {trade.qty}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {trade.entryPrice.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {trade.exitPrice.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 font-semibold font-mono tabular-nums text-sm" style={{ color: pnl >= 0 ? "#10b981" : "#ef4444" }}>
                        {formatCurrency(pnl, "USD", true)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {trade.strategy || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button className="btn-ghost p-1.5" style={{ color: "var(--red)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} / {filtered.length} işlem
              </span>
              <div className="flex items-center gap-1">
                <button className="btn-secondary px-3 py-1.5 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  ← Önceki
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={p === currentPage ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"}>
                    {p}
                  </button>
                ))}
                <button className="btn-secondary px-3 py-1.5 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Sonraki →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
