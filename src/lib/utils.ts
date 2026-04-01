import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  qty: number,
  side: "LONG" | "SHORT",
  fees: number = 0
): number {
  const gross = (exitPrice - entryPrice) * qty * (side === "LONG" ? 1 : -1);
  return gross - fees;
}

export function calculateRMultiple(pnl: number, risk: number): number | null {
  if (!risk || risk === 0) return null;
  return pnl / risk;
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  showSign: boolean = false
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatPercentage(
  value: number,
  decimals: number = 1,
  showSign: boolean = false
): string {
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export interface TradeMetrics {
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTrade: number;
  worstTrade: number;
  maxDrawdown: number;
  avgRMultiple: number | null;
}

export function calculateTradeMetrics(
  trades: Array<{
    entryPrice: number;
    exitPrice: number;
    qty: number;
    side: "LONG" | "SHORT";
    fees: number;
    risk?: number | null;
  }>
): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalPnL: 0, winRate: 0, avgWin: 0, avgLoss: 0,
      profitFactor: 0, expectancy: 0, totalTrades: 0,
      winningTrades: 0, losingTrades: 0, bestTrade: 0,
      worstTrade: 0, maxDrawdown: 0, avgRMultiple: null,
    };
  }

  const pnls = trades.map((t) =>
    calculatePnL(t.entryPrice, t.exitPrice, t.qty, t.side, t.fees)
  );

  const totalPnL      = pnls.reduce((s, p) => s + p, 0);
  const winningPnLs   = pnls.filter((p) => p > 0);
  const losingPnLs    = pnls.filter((p) => p < 0);
  const winningTrades = winningPnLs.length;
  const losingTrades  = losingPnLs.length;
  const totalTrades   = trades.length;
  const winRate       = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgWin        = winningTrades > 0 ? winningPnLs.reduce((s, p) => s + p, 0) / winningTrades : 0;
  const avgLoss       = losingTrades  > 0 ? Math.abs(losingPnLs.reduce((s, p) => s + p, 0) / losingTrades) : 0;
  const totalGains    = winningPnLs.reduce((s, p) => s + p, 0);
  const totalLosses   = Math.abs(losingPnLs.reduce((s, p) => s + p, 0));
  const profitFactor  = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0;
  const expectancy    = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
  const bestTrade     = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade    = pnls.length > 0 ? Math.min(...pnls) : 0;

  let peak = 0, maxDrawdown = 0, runningTotal = 0;
  for (const pnl of pnls) {
    runningTotal += pnl;
    if (runningTotal > peak) peak = runningTotal;
    const dd = peak - runningTotal;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const rMultiples = trades
    .map((t, i) => t.risk && t.risk > 0 ? pnls[i] / t.risk : null)
    .filter((r): r is number => r !== null);
  const avgRMultiple = rMultiples.length > 0
    ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length
    : null;

  return {
    totalPnL, winRate, avgWin, avgLoss, profitFactor,
    expectancy, totalTrades, winningTrades, losingTrades,
    bestTrade, worstTrade, maxDrawdown, avgRMultiple,
  };
}

export function calculateStreak(
  trades: Array<{
    entryPrice: number;
    exitPrice: number;
    qty: number;
    side: "LONG" | "SHORT";
    fees: number;
  }>
): { current: number; type: "win" | "loss" | null; max: number } {
  if (trades.length === 0) return { current: 0, type: null, max: 0 };

  const pnls = trades.map((t) =>
    calculatePnL(t.entryPrice, t.exitPrice, t.qty, t.side, t.fees)
  );

  let currentStreak = 0;
  let currentType: "win" | "loss" | null = null;

  for (let i = pnls.length - 1; i >= 0; i--) {
    const tradeType = pnls[i] > 0 ? "win" : "loss";
    if (currentType === null) { currentType = tradeType; currentStreak = 1; }
    else if (currentType === tradeType) currentStreak++;
    else break;
  }

  let tempStreak = 0, maxStreak = 0, tempType: "win" | "loss" | null = null;
  for (const pnl of pnls) {
    const tradeType = pnl > 0 ? "win" : "loss";
    if (!tempType || tempType === tradeType) {
      tempType = tradeType;
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempType = tradeType;
      tempStreak = 1;
    }
  }

  return { current: currentStreak, type: currentType, max: maxStreak };
}

export function getUserIdFromSession(session: any): string | null {
  return session?.user?.id ?? null;
}
