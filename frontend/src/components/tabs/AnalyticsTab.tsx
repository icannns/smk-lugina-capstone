"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  SlidersHorizontal,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  ArrowUpDown,
  Filter
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell
} from "recharts";
import { AnalyticsResponse, TechnostressStudent } from "../../types";
import { fallbackAnalysisData } from "../../data/sampleAnalysisData";

const API_BASE = "http://localhost:8000";

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsResponse>(fallbackAnalysisData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Settings
  const [ngramMode, setNgramMode] = useState<string>("both");
  const [cloudTheme, setCloudTheme] = useState<string>("white");
  const [maxWords, setMaxWords] = useState<number>(60);
  const [customStopwords, setCustomStopwords] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Chart controls
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Tinggi",
    "Sedang",
    "Rendah"
  ]);

  // Raw data expander
  const [showRawTable, setShowRawTable] = useState<boolean>(false);

  // Function to fetch analysis from FastAPI backend
  const fetchAnalysis = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // 1. Get sample data from backend or local
      const sampleResp = await fetch(`${API_BASE}/api/sample`);
      if (!sampleResp.ok) {
        throw new Error(`Gagal menghubungi API Sample: ${sampleResp.statusText}`);
      }
      const samplePayload = await sampleResp.json();

      // 2. Call /api/analyze
      const stopwordsArray = customStopwords
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const analyzeResp = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: samplePayload,
          ngram_mode: ngramMode,
          cloud_theme: cloudTheme,
          max_words: maxWords,
          custom_stopwords: stopwordsArray
        })
      });

      if (!analyzeResp.ok) {
        const errJson = await analyzeResp.json().catch(() => ({}));
        throw new Error(errJson.detail || "Gagal memproses analitik");
      }

      const result: AnalyticsResponse = await analyzeResp.json();
      setData(result);
    } catch (err: any) {
      console.warn("Backend API tidak terjangkau, menggunakan data fallback simulasi:", err);
      setApiError(
        "Koneksi ke server Python API (http://localhost:8000) belum terhubung. Menampilkan data hasil pengujian lokal yang tersimpan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [ngramMode, cloudTheme, maxWords]);

  // Helper download base64
  const handleDownloadImage = (base64Url: string | null | undefined, fileName: string) => {
    if (!base64Url) return;
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process chart data
  const chartStudents = [...(data.students || [])]
    .filter((s) => selectedCategories.includes(s.kategori))
    .sort((a, b) => {
      const scoreA = a.kalkulasi ?? 0;
      const scoreB = b.kalkulasi ?? 0;
      if (sortOrder === "desc") return scoreB - scoreA;
      if (sortOrder === "asc") return scoreA - scoreB;
      return a.name.localeCompare(b.name);
    });

  // Category counts
  const totalRecords = data.summary.total_records || chartStudents.length;
  const highCount = data.summary.stress_counts?.Tinggi ?? 0;
  const medCount = data.summary.stress_counts?.Sedang ?? 0;
  const lowCount = data.summary.stress_counts?.Rendah ?? 0;

  const highPct = totalRecords ? Math.round((highCount / totalRecords) * 100) : 0;
  const medPct = totalRecords ? Math.round((medCount / totalRecords) * 100) : 0;
  const lowPct = totalRecords ? Math.round((lowCount / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Notice / Status Banner */}
      {apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Mode Simulasi Mandiri:</span> {apiError}
            <div className="mt-1 text-xs text-amber-700">
              Jalankan <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-medium">python api.py</code> di folder backend untuk komputasi NLP & pembuatan gambar Word Cloud secara langsung.
            </div>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Hubungkan Ulang
          </button>
        </div>
      )}

      {/* Control & Configuration Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Analitik NLP & Technostress Komparatif
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/50">
                  Hybrid Contract
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Deteksi pemicu stres teknologi berdasarkan skala Likert & esai kualitatif siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 text-slate-700 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengaturan Ekstraksi</span>
              {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Memproses..." : "Analisis Data"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Configuration Drawer */}
        {showConfig && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Mode N-gram */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Mode N-Gram</label>
              <select
                value={ngramMode}
                onChange={(e) => setNgramMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="both">🔤 Gabungan (Kata + Frasa)</option>
                <option value="bigram">🔗 Frasa 2 Kata (Bigram Saja)</option>
                <option value="unigram">📝 Kata Tunggal (Unigram Saja)</option>
              </select>
            </div>

            {/* Tema Kanvas Word Cloud */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Tema Kanvas</label>
              <select
                value={cloudTheme}
                onChange={(e) => setCloudTheme(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="white">☀️ Terang (Clean White)</option>
                <option value="#0f172a">🌙 Gelap (Dark Slate)</option>
              </select>
            </div>

            {/* Batas Maksimal Kata */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700">Maks Kata / Frasa</label>
                <span className="font-bold text-blue-600">{maxWords}</span>
              </div>
              <input
                type="range"
                min={20}
                max={120}
                step={10}
                value={maxWords}
                onChange={(e) => setMaxWords(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Stopwords Tambahan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Tambah Stopwords</label>
              <input
                type="text"
                placeholder="pisahkan dengan koma..."
                value={customStopwords}
                onChange={(e) => setCustomStopwords(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Responden</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">{totalRecords}</div>
          <div className="text-xs font-medium text-slate-400 mt-1">Siswa terverifikasi</div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        {/* High Stress Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Stres Tinggi
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">{highCount}</div>
          <div className="text-xs font-medium text-rose-400 mt-1">
            {highPct}% responden (Skor ≥ 3.50)
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-xs">
            🔴
          </div>
        </div>

        {/* Medium Stress Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Stres Sedang
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{medCount}</div>
          <div className="text-xs font-medium text-blue-400 mt-1">
            {medPct}% responden (Skor 2.50 – 3.49)
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">
            🔵
          </div>
        </div>

        {/* Low Stress Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Stres Rendah
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{lowCount}</div>
          <div className="text-xs font-medium text-emerald-400 mt-1">
            {lowPct}% responden (Skor &lt; 2.50)
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold text-xs">
            🟢
          </div>
        </div>
      </div>

      {/* SEKSI 1: Grafik Sebaran Technostress Siswa */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              📊 1. Visualisasi Sebaran Tingkat Technostress Siswa
            </h4>
            <p className="text-xs text-slate-500">
              Skor kalkulasi rata-rata kuisioner (1.00 – 5.00) dengan garis batas ambang intervensi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs focus:outline-none"
              >
                <option value="desc">Skor Tertinggi ke Terendah</option>
                <option value="asc">Skor Terendah ke Tertinggi</option>
                <option value="name">Berdasarkan Nama Siswa</option>
              </select>
            </div>

            {/* Filter Kategori Checkboxes */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              {(["Tinggi", "Sedang", "Rendah"] as const).map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const color =
                  cat === "Tinggi"
                    ? "text-rose-600 border-rose-200 bg-rose-50"
                    : cat === "Sedang"
                    ? "text-blue-600 border-blue-200 bg-blue-50"
                    : "text-emerald-600 border-emerald-200 bg-emerald-50";
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedCategories.length > 1) {
                          setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                        }
                      } else {
                        setSelectedCategories([...selectedCategories, cat]);
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all ${
                      isSelected ? color : "bg-white text-slate-400 border-slate-200 opacity-60"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recharts Horizontal Bar Chart */}
        <div style={{ height: Math.max(380, chartStudents.length * 36) }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartStudents}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 120, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={[0, 5.0]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 500 }}
                width={110}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const student = payload[0].payload as TechnostressStudent;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl text-xs space-y-1 z-50">
                        <div className="font-bold text-sm">{student.name} ({student.id})</div>
                        <div className="flex items-center gap-2">
                          <span>Kategori:</span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              student.kategori === "Tinggi"
                                ? "bg-rose-500 text-white"
                                : student.kategori === "Sedang"
                                ? "bg-blue-500 text-white"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            {student.kategori}
                          </span>
                        </div>
                        <div>Skor Likert: <span className="font-bold text-amber-300">{student.kalkulasi?.toFixed(2)}</span> / 5.00</div>
                        <div>Skala Bulat: {student.rounded_scale}</div>
                        <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-700">Waktu: {student.post_date}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Reference Lines */}
              <ReferenceLine
                x={3.5}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "Ambang Tinggi (≥ 3.50)", position: "top", fill: "#ef4444", fontSize: 10, fontWeight: "bold" }}
              />
              <ReferenceLine
                x={2.5}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "Ambang Rendah (< 2.50)", position: "top", fill: "#10b981", fontSize: 10, fontWeight: "bold" }}
              />
              <Bar dataKey="kalkulasi" radius={[0, 6, 6, 0]} barSize={18}>
                {chartStudents.map((entry, index) => {
                  const fill =
                    entry.kategori === "Tinggi"
                      ? "#ef4444"
                      : entry.kategori === "Sedang"
                      ? "#3b82f6"
                      : "#10b981";
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grouped Student Pills */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stres Tinggi */}
          <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-100">
            <div className="text-xs font-bold text-rose-700 flex items-center justify-between mb-2">
              <span>🔴 Stres Tinggi (Skala 4–5)</span>
              <span className="bg-rose-200/60 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {data.students.filter((s) => s.kategori === "Tinggi").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Tinggi")
                .map((s) => (
                  <div key={s.id} className="text-xs text-slate-700 flex justify-between items-center bg-white/70 px-2 py-1 rounded">
                    <span>{s.name}</span>
                    <span className="font-bold text-rose-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stres Sedang */}
          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
            <div className="text-xs font-bold text-blue-700 flex items-center justify-between mb-2">
              <span>🔵 Stres Sedang (Skala 3)</span>
              <span className="bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {data.students.filter((s) => s.kategori === "Sedang").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Sedang")
                .map((s) => (
                  <div key={s.id} className="text-xs text-slate-700 flex justify-between items-center bg-white/70 px-2 py-1 rounded">
                    <span>{s.name}</span>
                    <span className="font-bold text-blue-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stres Rendah */}
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-between mb-2">
              <span>🟢 Stres Rendah (Skala 1–2)</span>
              <span className="bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {data.students.filter((s) => s.kategori === "Rendah").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Rendah")
                .map((s) => (
                  <div key={s.id} className="text-xs text-slate-700 flex justify-between items-center bg-white/70 px-2 py-1 rounded">
                    <span>{s.name}</span>
                    <span className="font-bold text-emerald-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI 2: Word Cloud Komparatif (2 Kolom) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h4 className="font-bold text-slate-900 text-base">
            🎨 2. Visualisasi Word Cloud Komparatif & Ekstraksi Narasi
          </h4>
          <p className="text-xs text-slate-500">
            Perbandingan komparatif kata kunci kendala pada kelompok stres tinggi (merah) vs kepuasan belajar pada kelompok stres rendah (hijau)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Kiri: Stres Tinggi */}
          <div className="border border-rose-100 rounded-2xl p-5 bg-gradient-to-b from-rose-50/30 to-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-bold text-rose-700 text-sm">
                    Kelompok Stres Tinggi (Keluhan & Kendala Utama)
                  </span>
                </div>
                {data.wordclouds?.Tinggi && (
                  <button
                    onClick={() => handleDownloadImage(data.wordclouds?.Tinggi, "wordcloud_stres_tinggi.png")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh HD
                  </button>
                )}
              </div>

              {/* Tampilan Gambar Word Cloud */}
              <div className="bg-white rounded-xl border border-slate-100 p-2 min-h-[260px] flex items-center justify-center overflow-hidden">
                {data.wordclouds?.Tinggi ? (
                  <img
                    src={data.wordclouds.Tinggi}
                    alt="Word Cloud Stres Tinggi"
                    className="w-full h-auto object-contain rounded-lg max-h-[320px]"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="text-rose-400 font-medium text-xs">
                      {apiError ? "Jalankan backend API untuk generasi gambar HD" : "Sedang memuat gambar..."}
                    </div>
                    {/* Visual fallback tag cloud jika backend belum menyala */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm pt-2">
                      {data.top_ngrams?.high?.slice(0, 8).map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: `${Math.max(11, Math.min(18, 11 + t.Frekuensi))}px`,
                            color: idx < 3 ? "#dc2626" : "#f87171"
                          }}
                          className="font-bold bg-rose-50/80 px-2 py-0.5 rounded"
                        >
                          {t.Frasa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Frasa Bar Mini Chart */}
            <div className="mt-4 pt-3 border-t border-rose-100/80">
              <div className="text-xs font-bold text-rose-800 mb-2">Top 5 Frasa Keluhan Terbanyak:</div>
              <div className="space-y-1.5">
                {data.top_ngrams?.high?.slice(0, 5).map((ngram, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-28 truncate text-slate-700 font-medium">{ngram.Frasa}</span>
                    <div className="flex-1 bg-rose-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (ngram.Frekuensi / (data.top_ngrams.high[0]?.Frekuensi || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-rose-700 w-6 text-right">{ngram.Frekuensi}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Kanan: Stres Rendah */}
          <div className="border border-emerald-100 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/30 to-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-emerald-700 text-sm">
                    Kelompok Stres Rendah (Kepuasan Belajar)
                  </span>
                </div>
                {data.wordclouds?.Rendah && (
                  <button
                    onClick={() => handleDownloadImage(data.wordclouds?.Rendah, "wordcloud_stres_rendah.png")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh HD
                  </button>
                )}
              </div>

              {/* Tampilan Gambar Word Cloud */}
              <div className="bg-white rounded-xl border border-slate-100 p-2 min-h-[260px] flex items-center justify-center overflow-hidden">
                {data.wordclouds?.Rendah ? (
                  <img
                    src={data.wordclouds.Rendah}
                    alt="Word Cloud Stres Rendah"
                    className="w-full h-auto object-contain rounded-lg max-h-[320px]"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="text-emerald-500 font-medium text-xs">
                      {apiError ? "Jalankan backend API untuk generasi gambar HD" : "Sedang memuat gambar..."}
                    </div>
                    {/* Visual fallback tag cloud jika backend belum menyala */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm pt-2">
                      {data.top_ngrams?.low?.slice(0, 8).map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: `${Math.max(11, Math.min(18, 11 + t.Frekuensi))}px`,
                            color: idx < 3 ? "#059669" : "#34d399"
                          }}
                          className="font-bold bg-emerald-50/80 px-2 py-0.5 rounded"
                        >
                          {t.Frasa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Frasa Bar Mini Chart */}
            <div className="mt-4 pt-3 border-t border-emerald-100/80">
              <div className="text-xs font-bold text-emerald-800 mb-2">Top 5 Frasa Positif Terbanyak:</div>
              <div className="space-y-1.5">
                {data.top_ngrams?.low?.slice(0, 5).map((ngram, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-28 truncate text-slate-700 font-medium">{ngram.Frasa}</span>
                    <div className="flex-1 bg-emerald-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (ngram.Frekuensi / (data.top_ngrams.low[0]?.Frekuensi || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-emerald-700 w-6 text-right">{ngram.Frekuensi}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI 3: Inspeksi Data Mentah (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowRawTable(!showRawTable)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-500" />
            <div>
              <div className="font-bold text-slate-900 text-sm">
                📋 Inspeksi Detail Narasi & Jawaban Esai Siswa
              </div>
              <div className="text-xs text-slate-400">
                Lihat teks lengkap sebelum dan sesudah ekstraksi token NLP ({data.students.length} responden)
              </div>
            </div>
          </div>
          {showRawTable ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showRawTable && (
          <div className="p-6 border-t border-slate-100">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-semibold text-slate-600 bg-slate-50">
                    <th className="py-2.5 px-3">ID Siswa</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Skor Likert</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Teks Narasi Esai Terbuka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{st.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{st.name}</td>
                      <td className="py-2 px-3 font-bold text-indigo-600">{st.kalkulasi?.toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.kategori === "Tinggi"
                              ? "bg-rose-100 text-rose-700"
                              : st.kategori === "Sedang"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {st.kategori}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 max-w-md truncate" title={st.essay_text}>
                        {st.essay_text || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
