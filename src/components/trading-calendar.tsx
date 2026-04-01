"use client";

import { useState, useMemo } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculatePnL, formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import DailyDetailModal from "./daily-detail-modal";

interface TradingCalendarProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  onTradeUpdate?: () => void;
}

interface DayData {
  date: Date;
  trades: Trade[];
  journalEntry?: JournalEntry;
  totalPnL: number;
  tradeCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const monthsTR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const months   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const daysOfWeekTR = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const daysOfWeek   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function TradingCalendar({ trades, journalEntries, onTradeUpdate }: TradingCalendarProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const calendarData = useMemo(() => {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: DayData[] = [];
    const loop = new Date(startDate);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    while (loop <= endDate) {
      const dayStr = `${loop.getFullYear()}-${String(loop.getMonth()+1).padStart(2,"0")}-${String(loop.getDate()).padStart(2,"0")}`;
      const dayTrades = trades.filter(trade => {
        const d = new Date(trade.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === dayStr;
      });
      const journalEntry = journalEntries.find(e => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === dayStr;
      });
      const totalPnL = dayTrades.reduce((s, t) => s + calculatePnL(t.entryPrice, t.exitPrice, t.qty, t.side as "LONG"|"SHORT", t.fees), 0);
      days.push({
        date: new Date(loop), trades: dayTrades, journalEntry, totalPnL,
        tradeCount: dayTrades.length,
        isCurrentMonth: loop.getMonth() === month,
        isToday: dayStr === todayStr,
      });
      loop.setDate(loop.getDate() + 1);
    }
    return days;
  }, [currentDate, trades, journalEntries]);

  const navigate = (dir: "prev"|"next") => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
    setCurrentDate(d);
  };

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {language === "tr"
              ? `${monthsTR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("prev")}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <CalendarIcon className="w-3 h-3" />
              {t.today || "Today"}
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {(language === "tr" ? daysOfWeekTR : daysOfWeek).map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "var(--text-muted)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarData.map((day, i) => {
              const hasWin  = day.tradeCount > 0 && day.totalPnL > 0;
              const hasLoss = day.tradeCount > 0 && day.totalPnL <= 0;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className="relative rounded-lg p-2 cursor-pointer transition-all duration-100"
                  style={{
                    minHeight: "72px",
                    opacity: day.isCurrentMonth ? 1 : 0.25,
                    background: hasWin  ? "rgba(34,197,94,0.08)"
                              : hasLoss ? "rgba(239,68,68,0.08)"
                              : "transparent",
                    border: day.isToday
                              ? "1px solid var(--brand)"
                              : hasWin  ? "1px solid rgba(34,197,94,0.25)"
                              : hasLoss ? "1px solid rgba(239,68,68,0.25)"
                              : "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!hasWin && !hasLoss) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                    if (!day.isToday && !hasWin && !hasLoss) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                  }}
                  onMouseLeave={e => {
                    if (!hasWin && !hasLoss) (e.currentTarget as HTMLElement).style.background = "transparent";
                    if (!day.isToday && !hasWin && !hasLoss) (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: day.isToday ? "var(--brand-light)"
                             : day.isCurrentMonth ? "var(--text-primary)"
                             : "var(--text-muted)",
                        fontWeight: day.isToday ? 700 : 500,
                      }}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.journalEntry && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                    )}
                  </div>

                  {day.tradeCount > 0 ? (
                    <div>
                      <div className="text-xs font-bold font-mono" style={{ color: day.totalPnL >= 0 ? "var(--green)" : "var(--red)" }}>
                        {formatCurrency(day.totalPnL, "USD", true)}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {day.tradeCount} işlem
                      </div>
                    </div>
                  ) : day.isCurrentMonth ? (
                    <div className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
                      —
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <DailyDetailModal
          day={selectedDay}
          isOpen
          onClose={() => setSelectedDay(null)}
          onUpdate={onTradeUpdate}
        />
      )}
    </>
  );
}
