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
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span>Hasil</span>
          <span>/</span>
          <span>Pemantauan</span>
        </div>
        <h1 className="text-[26px] font-semibold leading-[34px] text-gray-900 tracking-tight mt-1">
          Hasil Survei
        </h1>
        <p className="text-sm text-secondary mt-1">
          Adopsi Teknologi dan Technostress · Versi 1.0 · Penugasan 20–30 Okt 2026
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-line text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3.5 transition-all relative flex items-center gap-2 text-sm ${
            activeTab === "overview"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-secondary hover:text-gray-900 font-medium"
          }`}
        >
          <FileSpreadsheet className="size-4" />
          <span>Hasil Survei</span>
        </button>

        <button
          onClick={() => setActiveTab("milestone")}
          className={`pb-3 px-3.5 transition-all relative flex items-center gap-2 text-sm ${
            activeTab === "milestone"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-secondary hover:text-gray-900 font-medium"
          }`}
        >
          <Milestone className="size-4" />
          <span>Penilaian & milestone</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-3.5 transition-all relative flex items-center gap-2 text-sm ${
            activeTab === "analytics"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-secondary hover:text-gray-900 font-medium"
          }`}
        >
          <Brain className="size-4 text-primary" />
          <span>Analitik & Word Cloud</span>
          <span className="text-[11px] bg-primary-soft text-primary px-2 py-0.5 rounded-full font-medium">
            Baru
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-1">
        {activeTab === "overview" && (
          <SurveyOverviewTab onSwitchToAnalytics={() => setActiveTab("analytics")} />
        )}
        {activeTab === "milestone" && <MilestoneTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}
