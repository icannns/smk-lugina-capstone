"use client";

import React from "react";
import { ClipboardList, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <ClipboardList className="w-4 h-4" />
        </div>
        <span className="font-semibold text-slate-800 text-sm tracking-tight">
          Lugina Survei
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <span className="text-xs font-semibold text-slate-500">Guru</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-xs">
            GR
          </div>
        </div>
      </div>
    </header>
  );
}
