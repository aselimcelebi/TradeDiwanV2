"use client";

import { useState, useMemo } from "react";
import { Trade, Strategy } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculateTradeMetrics, formatCurrency, formatPercentage } from "@/lib/utils";
import DashboardLayout from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface TradesPageClientProps {
  trades: Trade[];
  strategies: Strategy[];
}

type SortField = 'date' | 'symbol' | 'side' | 'pnl' | 'qty' | 'entryPrice' | 'exitPrice';
type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  symbol: string;
  side: string;
  strategy: string;
  winLoss: string;
  dateFrom: string;
  dateTo: string;
}

export default function TradesPageClient({ trades, strategies }: TradesPageClientProps) {
  const { t, language } = useLanguage();
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    symbol: '',
    side: '',
    strategy: '',
    winLoss: '',
    dateFrom: '',
    dateTo: '',
  });

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!trade.symbol.toLowerCase().includes(searchLower) &&
            !trade.strategy?.toLowerCase().includes(searchLower) &&
            !trade.notes?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Symbol filter
      if (filters.symbol && trade.symbol !== filters.symbol) return false;
      
      // Side filter
      if (filters.side && trade.side !== filters.side) return false;
      
      // Strategy filter
      if (filters.strategy && trade.strategy !== filters.strategy) return false;
      
      // Win/Loss filter
      if (filters.winLoss) {
        const pnl = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
        if (filters.winLoss === 'win' && pnl <= 0) return false;
        if (filters.winLoss === 'loss' && pnl >= 0) return false;
      }

      // Date filters
      if (filters.dateFrom && new Date(trade.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(trade.date) > new Date(filters.dateTo)) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'pnl') {
        aValue = (a.exitPrice - a.entryPrice) * a.qty * (a.side === 'LONG' ? 1 : -1) - a.fees;
        bValue = (b.exitPrice - b.entryPrice) * b.qty * (b.side === 'LONG' ? 1 : -1) - b.fees;
      }

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, filters, sortField, sortDirection]);

  // Calculate metrics for filtered trades
  const metrics = calculateTradeMetrics(filteredTrades);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
  const uniqueStrategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))].sort();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      symbol: '',
      side: '',
      strategy: '',
      winLoss: '',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

  const calculatePnL = (trade: Trade) => {
    return (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1) - trade.fees;
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMM yyyy HH:mm', { 
      locale: language === 'tr' ? tr : enUS 
    });
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary font-medium"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.netPnl}</p>
                  <p className={`text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.totalPnL)}
                  </p>
                </div>
                {metrics.totalPnL >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.tradeWinRate}</p>
                  <p className="text-xl font-bold">{formatPercentage(metrics.winRate)}</p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.totalTrades}</p>
                  <p className="text-xl font-bold">{filteredTrades.length}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.profitFactor}</p>
                  <p className="text-xl font-bold">{metrics.profitFactor.toFixed(2)}</p>
                </div>
                <div className="text-2xl">⚡</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t.filters}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder={`${t.search}...`}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full"
                />
              </div>

              <Select value={filters.symbol} onValueChange={(value) => setFilters(prev => ({ ...prev, symbol: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t.symbol} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.all}</SelectItem>
                  {uniqueSymbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.side} onValueChange={(value) => setFilters(prev => ({ ...prev, side: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t.side} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.all}</SelectItem>
                  <SelectItem value="LONG">{t.long}</SelectItem>
                  <SelectItem value="SHORT">{t.short}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.strategy} onValueChange={(value) => setFilters(prev => ({ ...prev, strategy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t.strategy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.all}</SelectItem>
                  {uniqueStrategies.map(strategy => (
                    <SelectItem key={strategy} value={strategy!}>{strategy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filters.winLoss} onValueChange={(value) => setFilters(prev => ({ ...prev, winLoss: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Win/Loss" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.all}</SelectItem>
                  <SelectItem value="win">{t.win}</SelectItem>
                  <SelectItem value="loss">{t.loss}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="From Date"
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                placeholder="To Date"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                {t.clearFilters}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.trades} ({filteredTrades.length})</span>
              {selectedTrades.length > 0 && (
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedTrades.length})
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTrades(paginatedTrades.map(t => t.id));
                          } else {
                            setSelectedTrades([]);
                          }
                        }}
                        checked={selectedTrades.length === paginatedTrades.length && paginatedTrades.length > 0}
                      />
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="date">{t.dateTime}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="symbol">{t.symbol}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="side">{t.side}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="qty">{t.quantity}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="entryPrice">{t.entryPrice}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="exitPrice">{t.exitPrice}</SortButton>
                    </th>
                    <th className="text-left p-2">
                      <SortButton field="pnl">{t.pnl}</SortButton>
                    </th>
                    <th className="text-left p-2">{t.strategy}</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.map((trade) => {
                    const pnl = calculatePnL(trade);
                    return (
                      <tr key={trade.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedTrades.includes(trade.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTrades(prev => [...prev, trade.id]);
                              } else {
                                setSelectedTrades(prev => prev.filter(id => id !== trade.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2 text-sm">
                          {formatDate(new Date(trade.date))}
                        </td>
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2">
                          <Badge variant={trade.side === 'LONG' ? 'default' : 'secondary'}>
                            {trade.side === 'LONG' ? t.long : t.short}
                          </Badge>
                        </td>
                        <td className="p-2">{trade.qty}</td>
                        <td className="p-2">{trade.entryPrice.toFixed(5)}</td>
                        <td className="p-2">{trade.exitPrice.toFixed(5)}</td>
                        <td className={`p-2 font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(pnl)}
                        </td>
                        <td className="p-2 text-sm">{trade.strategy || '-'}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
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
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTrades.length)} of {filteredTrades.length} trades
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
