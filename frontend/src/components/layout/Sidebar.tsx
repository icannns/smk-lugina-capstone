"use client";

import React, { useState } from "react";
import { 
  ClipboardList, 
  LayoutGrid, 
  FileText, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export default function Sidebar({ activeNav, setActiveNav }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "dasbor", label: "Dasbor", icon: LayoutGrid },
    { id: "survei", label: "Survei", icon: FileText },
    { id: "hasil", label: "Hasil Survei", icon: BarChart3 },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 min-h-screen ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-slate-800 text-lg tracking-tight">
              Lugina Survei
            </span>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Collapse Button */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Guru • data sesuai izin</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Ciutkan sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
