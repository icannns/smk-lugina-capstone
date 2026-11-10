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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Ditugaskan</span>
            <span className="size-2 rounded-full bg-primary" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-gray-900 tracking-tight">32</div>
          <div className="text-xs text-secondary">Target responden</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Terkirim</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-emerald-600 tracking-tight">24</div>
          <div className="text-xs text-secondary">Respon telah masuk</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Draf</span>
            <span className="size-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-amber-600 tracking-tight">5</div>
          <div className="text-xs text-secondary">Sedang proses pengisian</div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal text-secondary">Belum mulai</span>
            <span className="size-2 rounded-full bg-gray-400" />
          </div>
          <div className="text-[30px] font-semibold leading-9 text-gray-700 tracking-tight">3</div>
          <div className="text-xs text-secondary">Menunggu pengisian</div>
        </article>
      </section>

      {/* Info Notice Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3 text-xs text-primary leading-relaxed">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <span>
          Nama hanya ditampilkan bagi pengguna yang berwenang. Data berikut bersifat simulasi; Skor Survei tersedia ditampilkan dari contoh keluaran sumber.
        </span>
      </div>

      {/* Filters & Search Row */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Pencarian */}
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-secondary mb-1.5">Pencarian</label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nama atau ID responden..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-control border border-line bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-primary"
              />
            </div>
          </div>

          {/* Filter Status */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-secondary mb-1.5">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full appearance-none rounded-control border border-line bg-white px-3 pr-8 text-sm text-gray-900 focus:outline-primary"
              >
                <option value="Semua status">Semua status</option>
                <option value="Terkirim">Terkirim</option>
                <option value="Draf">Draf</option>
                <option value="Belum mulai">Belum mulai</option>
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Filter Kelompok */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-secondary mb-1.5">Kelompok</label>
            <div className="relative">
              <select
                className="h-10 w-full appearance-none rounded-control border border-line bg-white px-3 pr-8 text-sm text-gray-900 focus:outline-primary"
              >
                <option>Kelompok yang diizinkan</option>
                <option>Kelas XII RPL 1</option>
                <option>Kelas XII RPL 2</option>
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Table Data */}
      <section className="rounded-2xl border border-line bg-white shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line text-xs font-medium text-secondary bg-gray-50/70">
                <th className="py-3 px-6">Nama responden / ID</th>
                <th className="py-3 px-6">Survei / versi</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Dikirim</th>
                <th className="py-3 px-6">Skor Survei</th>
                <th className="py-3 px-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-secondary text-sm">
                    Tidak ada responden yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-secondary">{student.id}</div>
                    </td>
                    <td className="py-4 px-6 text-secondary text-xs">
                      <div className="text-gray-900 font-medium">{student.surveyVersion.split(" ")[0]} {student.surveyVersion.split(" ")[1]}</div>
                      <div className="text-secondary">{student.surveyVersion.split(" ")[2]}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          student.status === "Terkirim"
                            ? "bg-emerald-50 text-emerald-700"
                            : student.status === "Draf"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-secondary"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary text-xs">
                      {student.sentDate}
                    </td>
                    <td className="py-4 px-6">
                      {student.surveyScore !== null ? (
                        <div>
                          <div className="font-semibold text-gray-900">{student.surveyScore.toFixed(1).replace(".", ",")}</div>
                          <div className="text-[11px] text-secondary">{student.scoreStatus}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-secondary">{student.scoreStatus}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {student.actionText === "Lihat detail" ? (
                        <button
                          onClick={onSwitchToAnalytics}
                          className="text-xs font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1 cursor-pointer"
                        >
                          Lihat detail
                          <ExternalLink className="size-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
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
        <div className="px-6 py-3.5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
          <div>
            1–{Math.min(pageSize, filteredStudents.length)} dari {filteredStudents.length} siswa
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-control border border-line bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-control border border-line bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={onSwitchToAnalytics}
          className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          Lihat ringkasan & analitik
        </button>
        <button
          className="h-10 px-4 rounded-control border border-line bg-white hover:bg-gray-50 text-secondary text-sm font-medium transition-colors"
        >
          Ekspor dikelola admin
        </button>
      </div>
    </div>
  );
}
