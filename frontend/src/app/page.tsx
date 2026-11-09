"use client";

import React, { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import SurveyOverviewTab from "../components/tabs/SurveyOverviewTab";
import MilestoneTab from "../components/tabs/MilestoneTab";
import AnalyticsTab from "../components/tabs/AnalyticsTab";
import { Sparkles, Brain, FileSpreadsheet, Milestone } from "lucide-react";

export default function Home() {
  const [activeNav, setActiveNav] = useState("hasil");
  const [activeTab, setActiveTab] = useState<"overview" | "milestone" | "analytics">("overview");

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigasi Kiri */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
            HASIL / PEMANTAUAN
          </div>

          {/* Judul & Deskripsi Survei */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hasil Survei
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Adopsi Teknologi dan Technostress • Versi 1.0 • Penugasan 20–30 Okt 2026
            </p>
          </div>

          {/* Tab Bar Navigasi */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-sm overflow-x-auto">
            {/* Tab 1: Hasil Survei */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-3 font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Hasil Survei</span>
            </button>

            {/* Tab 2: Penilaian & Milestone */}
            <button
              onClick={() => setActiveTab("milestone")}
              className={`pb-3 px-3 font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === "milestone"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Milestone className="w-4 h-4" />
              <span>Penilaian & milestone</span>
            </button>

            {/* Tab 3: Analitik (NEW TAB!) */}
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 px-3 font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Analitik & Word Cloud</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                Baru
              </span>
            </button>
          </div>

          {/* Konten Tab Aktif */}
          <div className="pt-2">
            {activeTab === "overview" && (
              <SurveyOverviewTab onSwitchToAnalytics={() => setActiveTab("analytics")} />
            )}
            {activeTab === "milestone" && <MilestoneTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
