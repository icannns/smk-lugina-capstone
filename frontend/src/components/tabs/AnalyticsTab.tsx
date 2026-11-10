"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  SlidersHorizontal,
  RefreshCw,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowUpDown
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      const sampleResp = await fetch(`${API_BASE}/api/sample`);
      if (!sampleResp.ok) {
        throw new Error(`Gagal menghubungi API Sample: ${sampleResp.statusText}`);
      }
      const samplePayload = await sampleResp.json();

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
        "Koneksi ke server Python API belum aktif. Menampilkan data evaluasi tersimpan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [ngramMode, cloudTheme, maxWords]);

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
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 flex items-start justify-between gap-3 text-xs text-amber-800 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Mode Simulasi Offline: </span>
              {apiError} Jalankan <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-medium text-amber-900">python api.py</code> di folder backend untuk komputasi NLP & gambar Word Cloud secara langsung.
            </div>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="h-8 shrink-0 rounded-control border border-amber-300 bg-white px-3 text-xs font-medium text-amber-900 hover:bg-amber-100/50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Hubungkan Ulang
          </button>
        </div>
      )}

      {/* Control & Configuration Header Card */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Brain className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900 leading-5">
                  Analitik NLP & Technostress Komparatif
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-primary font-medium">
                  Hybrid Likert + Esai
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Pemetaan tingkat stres teknologi siswa dan ekstraksi kata kunci komparatif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="h-9 flex-1 md:flex-initial rounded-control border border-line bg-white px-3.5 text-xs font-medium text-secondary hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <SlidersHorizontal className="size-3.5 text-secondary" />
              <span>Pengaturan Ekstraksi</span>
              {showConfig ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            <button
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="h-9 flex-1 md:flex-initial rounded-control bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Memproses..." : "Analisis Data"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Configuration Drawer */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Mode N-Gram</label>
              <select
                value={ngramMode}
                onChange={(e) => setNgramMode(e.target.value)}
                className="h-9 w-full rounded-control border border-line bg-white px-3 text-xs text-gray-900 focus:outline-primary"
              >
                <option value="both">Gabungan (Kata + Frasa)</option>
                <option value="bigram">Frasa 2 Kata (Bigram Saja)</option>
                <option value="unigram">Kata Tunggal (Unigram Saja)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Tema Kanvas</label>
              <select
                value={cloudTheme}
                onChange={(e) => setCloudTheme(e.target.value)}
                className="h-9 w-full rounded-control border border-line bg-white px-3 text-xs text-gray-900 focus:outline-primary"
              >
                <option value="white">Terang (Clean White)</option>
                <option value="#0f172a">Gelap (Dark Slate)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-secondary">Maksimal Kata</label>
                <span className="font-semibold text-primary">{maxWords}</span>
              </div>
              <input
                type="range"
                min={20}
                max={120}
                step={10}
                value={maxWords}
                onChange={(e) => setMaxWords(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer mt-1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Stopwords Tambahan</label>
              <input
                type="text"
                placeholder="pisahkan dengan koma..."
                value={customStopwords}
                onChange={(e) => setCustomStopwords(e.target.value)}
                className="h-9 w-full rounded-control border border-line bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-primary"
              />
            </div>
          </div>
        )}
      </section>

      {/* 4 Metric Cards (Clean Lugina PjBL Style) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responden */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Total Responden</span>
            <span className="size-2 rounded-full bg-primary" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-gray-900 tracking-tight">
            {totalRecords}
          </div>
          <div className="text-xs text-secondary">
            Siswa terverifikasi
          </div>
        </article>

        {/* Stres Tinggi */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Stres Tinggi</span>
            <span className="size-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-rose-600 tracking-tight">
            {highCount}
          </div>
          <div className="text-xs text-secondary">
            {highPct}% responden (Skor ≥ 3.50)
          </div>
        </article>

        {/* Stres Sedang */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Stres Sedang</span>
            <span className="size-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-blue-600 tracking-tight">
            {medCount}
          </div>
          <div className="text-xs text-secondary">
            {medPct}% responden (Skor 2.50 – 3.49)
          </div>
        </article>

        {/* Stres Rendah */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Stres Rendah</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-emerald-600 tracking-tight">
            {lowCount}
          </div>
          <div className="text-xs text-secondary">
            {lowPct}% responden (Skor &lt; 2.50)
          </div>
        </article>
      </section>

      {/* SEKSI 1: Visualisasi Sebaran Technostress Siswa */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-5">
              1. Visualisasi Sebaran Tingkat Technostress Siswa
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Skor rata-rata kuesioner skala 1.00 – 5.00 dengan garis batas ambang intervensi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 text-secondary" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-9 rounded-control border border-line bg-white px-2.5 text-xs text-secondary focus:outline-primary"
              >
                <option value="desc">Skor Tertinggi ke Terendah</option>
                <option value="asc">Skor Terendah ke Tertinggi</option>
                <option value="name">Berdasarkan Nama Siswa</option>
              </select>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 pl-2 border-l border-line">
              {(["Tinggi", "Sedang", "Rendah"] as const).map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const color =
                  cat === "Tinggi"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : cat === "Sedang"
                    ? "bg-blue-50 text-primary border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";
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
                    className={`h-8 px-2.5 rounded-control text-xs font-medium border transition-colors ${
                      isSelected ? color : "bg-white text-gray-400 border-line hover:bg-gray-50"
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
        <div style={{ height: Math.max(360, chartStudents.length * 32) }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartStudents}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 110, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={[0, 5.0]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                width={105}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const student = payload[0].payload as TechnostressStudent;
                    return (
                      <div className="bg-gray-900 text-white rounded-xl p-3 shadow-lg text-xs space-y-1 z-50">
                        <div className="font-semibold text-sm">{student.name} ({student.id})</div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Kategori:</span>
                          <span
                            className={`font-medium px-2 py-0.5 rounded text-[10px] ${
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
                        <div>Skor Likert: <span className="font-semibold text-amber-300">{student.kalkulasi?.toFixed(2)}</span> / 5.00</div>
                        <div className="text-gray-400 text-[10px] pt-1 border-t border-gray-700">Waktu: {student.post_date}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={3.5}
                stroke="#e11d48"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{ value: "Ambang Tinggi (≥ 3.50)", position: "top", fill: "#e11d48", fontSize: 10, fontWeight: 500 }}
              />
              <ReferenceLine
                x={2.5}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{ value: "Ambang Rendah (< 2.50)", position: "top", fill: "#059669", fontSize: 10, fontWeight: 500 }}
              />
              <Bar dataKey="kalkulasi" radius={[0, 4, 4, 0]} barSize={14}>
                {chartStudents.map((entry, index) => {
                  const fill =
                    entry.kategori === "Tinggi"
                      ? "#f43f5e"
                      : entry.kategori === "Sedang"
                      ? "#3b82f6"
                      : "#10b981";
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grouped Student Panels */}
        <div className="pt-4 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stres Tinggi */}
          <div className="rounded-xl border border-line bg-gray-50/50 p-3.5">
            <div className="text-xs font-semibold text-gray-900 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                Stres Tinggi (Skala 4–5)
              </span>
              <span className="bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-full text-[10px] font-medium">
                {data.students.filter((s) => s.kategori === "Tinggi").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Tinggi")
                .map((s) => (
                  <div key={s.id} className="text-xs text-secondary flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-line/60">
                    <span>{s.name}</span>
                    <span className="font-semibold text-rose-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stres Sedang */}
          <div className="rounded-xl border border-line bg-gray-50/50 p-3.5">
            <div className="text-xs font-semibold text-gray-900 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                Stres Sedang (Skala 3)
              </span>
              <span className="bg-blue-50 text-primary border border-blue-200/60 px-2 py-0.5 rounded-full text-[10px] font-medium">
                {data.students.filter((s) => s.kategori === "Sedang").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Sedang")
                .map((s) => (
                  <div key={s.id} className="text-xs text-secondary flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-line/60">
                    <span>{s.name}</span>
                    <span className="font-semibold text-blue-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stres Rendah */}
          <div className="rounded-xl border border-line bg-gray-50/50 p-3.5">
            <div className="text-xs font-semibold text-gray-900 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                Stres Rendah (Skala 1–2)
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[10px] font-medium">
                {data.students.filter((s) => s.kategori === "Rendah").length} Siswa
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.students
                .filter((s) => s.kategori === "Rendah")
                .map((s) => (
                  <div key={s.id} className="text-xs text-secondary flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-line/60">
                    <span>{s.name}</span>
                    <span className="font-semibold text-emerald-600 text-[11px]">{s.kalkulasi?.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEKSI 2: Word Cloud Komparatif (2 Kolom Berdampingan) */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 leading-5">
            2. Visualisasi Word Cloud Komparatif & Analisis Frasa
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Perbandingan kata kunci kendala pada kelompok stres tinggi vs kepuasan belajar pada kelompok stres rendah
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Kiri: Stres Tinggi */}
          <div className="rounded-xl border border-line bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    Kelompok Stres Tinggi (Kendala Utama)
                  </span>
                </div>
                {data.wordclouds?.Tinggi && (
                  <button
                    onClick={() => handleDownloadImage(data.wordclouds?.Tinggi, "wordcloud_stres_tinggi.png")}
                    className="h-8 rounded-control border border-line bg-white hover:bg-gray-50 text-secondary text-xs font-medium px-3 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="size-3.5" />
                    Unduh PNG
                  </button>
                )}
              </div>

              {/* Tampilan Gambar Word Cloud */}
              <div className="bg-gray-50/70 rounded-xl border border-line p-2 min-h-[250px] flex items-center justify-center overflow-hidden">
                {data.wordclouds?.Tinggi ? (
                  <img
                    src={data.wordclouds.Tinggi}
                    alt="Word Cloud Stres Tinggi"
                    className="w-full h-auto object-contain rounded-lg max-h-[300px]"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="text-secondary font-medium text-xs">
                      {apiError ? "Jalankan backend API untuk generasi gambar HD" : "Sedang memuat gambar..."}
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm pt-2">
                      {data.top_ngrams?.high?.slice(0, 8).map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: `${Math.max(11, Math.min(16, 11 + t.Frekuensi))}px`
                          }}
                          className="font-medium bg-rose-50 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-control"
                        >
                          {t.Frasa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Frasa Bars */}
            <div className="mt-4 pt-3 border-t border-line">
              <div className="text-xs font-medium text-secondary mb-2">Top 5 Frasa Keluhan Terbanyak:</div>
              <div className="space-y-2">
                {data.top_ngrams?.high?.slice(0, 5).map((ngram, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    <span className="w-28 truncate text-secondary">{ngram.Frasa}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (ngram.Frekuensi / (data.top_ngrams.high[0]?.Frekuensi || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="font-semibold text-gray-700 w-6 text-right text-[11px]">{ngram.Frekuensi}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Kanan: Stres Rendah */}
          <div className="rounded-xl border border-line bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    Kelompok Stres Rendah (Kepuasan Belajar)
                  </span>
                </div>
                {data.wordclouds?.Rendah && (
                  <button
                    onClick={() => handleDownloadImage(data.wordclouds?.Rendah, "wordcloud_stres_rendah.png")}
                    className="h-8 rounded-control border border-line bg-white hover:bg-gray-50 text-secondary text-xs font-medium px-3 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="size-3.5" />
                    Unduh PNG
                  </button>
                )}
              </div>

              {/* Tampilan Gambar Word Cloud */}
              <div className="bg-gray-50/70 rounded-xl border border-line p-2 min-h-[250px] flex items-center justify-center overflow-hidden">
                {data.wordclouds?.Rendah ? (
                  <img
                    src={data.wordclouds.Rendah}
                    alt="Word Cloud Stres Rendah"
                    className="w-full h-auto object-contain rounded-lg max-h-[300px]"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="text-secondary font-medium text-xs">
                      {apiError ? "Jalankan backend API untuk generasi gambar HD" : "Sedang memuat gambar..."}
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm pt-2">
                      {data.top_ngrams?.low?.slice(0, 8).map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: `${Math.max(11, Math.min(16, 11 + t.Frekuensi))}px`
                          }}
                          className="font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-control"
                        >
                          {t.Frasa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Frasa Bars */}
            <div className="mt-4 pt-3 border-t border-line">
              <div className="text-xs font-medium text-secondary mb-2">Top 5 Frasa Positif Terbanyak:</div>
              <div className="space-y-2">
                {data.top_ngrams?.low?.slice(0, 5).map((ngram, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    <span className="w-28 truncate text-secondary">{ngram.Frasa}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (ngram.Frekuensi / (data.top_ngrams.low[0]?.Frekuensi || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="font-semibold text-gray-700 w-6 text-right text-[11px]">{ngram.Frekuensi}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEKSI 3: Inspeksi Data Mentah (Akordeon) */}
      <section className="rounded-2xl border border-line bg-white overflow-hidden shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a]">
        <button
          onClick={() => setShowRawTable(!showRawTable)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-secondary" />
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                Inspeksi Detail Narasi & Jawaban Esai Siswa
              </div>
              <div className="text-xs text-secondary">
                Lihat teks esai dan hasil kalkulasi per responden ({data.students.length} responden)
              </div>
            </div>
          </div>
          {showRawTable ? <ChevronUp className="size-4 text-secondary" /> : <ChevronDown className="size-4 text-secondary" />}
        </button>

        {showRawTable && (
          <div className="p-6 border-t border-line">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line font-medium text-secondary bg-gray-50/60">
                    <th className="py-2.5 px-3">ID Siswa</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Skor Likert</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Teks Narasi Esai Terbuka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.students.map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50/40">
                      <td className="py-2 px-3 font-mono font-medium text-secondary">{st.id}</td>
                      <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">{st.name}</td>
                      <td className="py-2 px-3 font-semibold text-primary">{st.kalkulasi?.toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            st.kategori === "Tinggi"
                              ? "bg-rose-50 text-rose-700"
                              : st.kategori === "Sedang"
                              ? "bg-blue-50 text-primary"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {st.kategori}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-secondary max-w-md truncate" title={st.essay_text}>
                        {st.essay_text || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
