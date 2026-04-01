"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, List, FileText, BarChart3,
  Lightbulb, Activity, Play, Trophy, GraduationCap,
  HelpCircle, Plus, Menu, X, Wifi, LogOut, ChevronDown,
  TrendingUp, Settings, User,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

interface SidebarProps {
  onAddTrade?: () => void;
}

export default function Sidebar({ onAddTrade }: SidebarProps) {
  const pathname      = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const mainNav: NavItem[] = [
    { name: "Dashboard",     href: "/",          icon: LayoutDashboard },
    { name: "Günlük Journal", href: "/journal",   icon: BookOpen },
    { name: "İşlemler",       href: "/trades",    icon: List },
    { name: "Notlar",         href: "/notebook",  icon: FileText },
    { name: "Raporlar",       href: "/reports",   icon: BarChart3 },
    { name: "Insights",       href: "/insights",  icon: Lightbulb },
    { name: "Brokerlar",      href: "/brokers",   icon: Wifi },
  ];

  const comingNav: NavItem[] = [
    { name: "Backtesting",   href: "/backtesting", icon: Activity,      badge: "Yakında", disabled: true },
    { name: "Trade Replay",  href: "/replay",      icon: Play,          disabled: true },
    { name: "Yarışmalar",    href: "/challenges",  icon: Trophy,        badge: "Beta",    disabled: true },
    { name: "Akademi",       href: "/university",  icon: GraduationCap, disabled: true },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon   = item.icon;

    if (item.disabled) {
      return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-not-allowed" style={{ color: "var(--text-muted)" }}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{item.name}</span>
          {item.badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {item.badge}
            </span>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100",
          active ? "text-white" : "hover:text-white"
        )}
        style={{
          background: active ? "var(--brand-dim)" : "transparent",
          color: active ? "var(--brand-light)" : "var(--text-secondary)",
          borderLeft: active ? "2px solid var(--brand)" : "2px solid transparent",
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand)" }}>
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>TradeDiwan</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pro Plan</div>
        </div>
      </div>

      {/* Add Trade button */}
      <div className="px-4 py-3">
        <button
          onClick={onAddTrade}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "var(--brand)", color: "#fff" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--brand-light)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--brand)")}
        >
          <Plus className="w-4 h-4" />
          İşlem Ekle
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
        {mainNav.map(item => <NavLink key={item.href} item={item} />)}

        {/* Divider */}
        <div className="pt-4 pb-2 px-3">
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Yakında
          </span>
        </div>

        {comingNav.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* User section */}
      <div className="border-t p-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--border-default)" }}>
            {session?.user?.name?.[0]?.toUpperCase() ?? "T"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session?.user?.name ?? "Trader"}
            </div>
            <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
              {session?.user?.email ?? ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            title="Çıkış Yap"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        onClick={() => setOpen(!open)}
      >
        {open
          ? <X className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          : <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        }
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-40 animate-fade-in" onClick={() => setOpen(false)} />
      )}

      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-60 sidebar-gradient h-screen sticky top-0">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-60 sidebar-gradient transform transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>
    </>
  );
}
