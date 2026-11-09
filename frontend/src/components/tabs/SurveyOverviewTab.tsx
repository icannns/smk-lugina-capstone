"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Info, ExternalLink } from "lucide-react";
import { mockOverviewStudents } from "../../data/mockSurveyData";

interface SurveyOverviewTabProps {
  onSwitchToAnalytics?: () => void;
}

export default function SurveyOverviewTab({ onSwitchToAnalytics }: SurveyOverviewTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const filteredStudents = mockOverviewStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "Semua status" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* 4 Status KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">32</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Ditugaskan</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">24</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Terkirim</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">5</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Draf</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">3</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Belum mulai</div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-5 py-3.5 flex items-center gap-3 text-xs sm:text-sm text-blue-700 leading-relaxed">
        <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
        <span>
          Nama hanya ditampilkan bagi pengguna yang berwenang. Data berikut bersifat simulasi; Skor Survei tersedia ditampilkan dari contoh keluaran sumber.
        </span>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Pencarian */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pencarian</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nama atau ID responden"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Filter Status */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white pr-8 text-slate-700"
              >
                <option value="Semua status">Semua status</option>
                <option value="Terkirim">Terkirim</option>
                <option value="Draf">Draf</option>
                <option value="Belum mulai">Belum mulai</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Filter Kelompok */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelompok</label>
            <div className="relative">
              <select
                className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white pr-8 text-slate-700"
              >
                <option>Kelompok yang diizinkan</option>
                <option>Kelas XII RPL 1</option>
                <option>Kelas XII RPL 2</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 bg-slate-50/50">
                <th className="py-3.5 px-6 font-semibold">Nama responden / ID</th>
                <th className="py-3.5 px-6 font-semibold">Survei / versi</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold">Dikirim</th>
                <th className="py-3.5 px-6 font-semibold">Skor Survei</th>
                <th className="py-3.5 px-6 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada responden yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.id}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>{student.surveyVersion.split(" ")[0]} {student.surveyVersion.split(" ")[1]}</div>
                      <div className="text-xs text-slate-400">{student.surveyVersion.split(" ")[2]}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === "Terkirim"
                            ? "bg-emerald-50 text-emerald-700"
                            : student.status === "Draf"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs sm:text-sm">
                      {student.sentDate}
                    </td>
                    <td className="py-4 px-6">
                      {student.surveyScore !== null ? (
                        <div>
                          <div className="font-bold text-slate-900">{student.surveyScore.toFixed(1).replace(".", ",")}</div>
                          <div className="text-xs text-slate-400">{student.scoreStatus}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">{student.scoreStatus}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {student.actionText === "Lihat detail" ? (
                        <button
                          onClick={onSwitchToAnalytics}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                        >
                          Lihat detail
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {student.actionText}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            1-{Math.min(pageSize, filteredStudents.length)} dari {filteredStudents.length} siswa
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={onSwitchToAnalytics}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
        >
          Lihat ringkasan & analitik
        </button>
        <button
          className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
        >
          Ekspor dikelola admin
        </button>
      </div>
    </div>
  );
}
