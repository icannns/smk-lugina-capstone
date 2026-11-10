"use client";

import React, { useState } from "react";
import SurveyOverviewTab from "../tabs/SurveyOverviewTab";
import MilestoneTab from "../tabs/MilestoneTab";
import AnalyticsTab from "../tabs/AnalyticsTab";
import { Brain, FileSpreadsheet, Milestone } from "lucide-react";

export default function SurveyResultsContainer() {
  const [activeTab, setActiveTab] = useState<"overview" | "milestone" | "analytics">("overview");

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header Title */}
      <div>
        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
          HASIL / PEMANTAUAN
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Hasil Survei
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Adopsi Teknologi dan Technostress • Versi 1.0 • Penugasan 20–30 Okt 2026
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-sm overflow-x-auto">
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

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <SurveyOverviewTab onSwitchToAnalytics={() => setActiveTab("analytics")} />
        )}
        {activeTab === "milestone" && <MilestoneTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}
