"use client";

import React from "react";
import { CheckCircle2, Clock, Calendar, Award } from "lucide-react";

export default function MilestoneTab() {
  const milestones = [
    {
      title: "Penyusunan Instrumen Survei",
      period: "15 - 19 Okt 2026",
      status: "Selesai",
      desc: "Validasi butir pertanyaan Likert 5 dimensi Technostress dan pertanyaan esai reflektif.",
      completed: true
    },
    {
      title: "Periode Pengisian Survei Siswa",
      period: "20 - 30 Okt 2026",
      status: "Sedang Berjalan",
      desc: "24 dari 32 responden telah menyelesaikan pengisian kuesioner dan narasi terbuka.",
      completed: false,
      active: true
    },
    {
      title: "Analisis NLP & Ekstraksi Technostress",
      period: "1 - 5 Nov 2026",
      status: "Terjadwal",
      desc: "Pemetaan kata kunci, pengelompokan tingkat stres komparatif, dan penarikan kesimpulan pedagogis.",
      completed: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Status Penilaian & Milestone Survei</h3>
            <p className="text-xs text-slate-500">Pelacakan tahapan pelaksanaan evaluasi Technostress di lingkungan sekolah</p>
          </div>
        </div>

        <div className="mt-8 relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative pl-6">
              <div
                className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  m.completed
                    ? "bg-emerald-500 border-white text-white shadow-xs"
                    : m.active
                    ? "bg-blue-600 border-white text-white shadow-xs"
                    : "bg-slate-100 border-white text-slate-400"
                }`}
              >
                {m.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-slate-900 text-sm">{m.title}</h4>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      m.completed
                        ? "bg-emerald-50 text-emerald-700"
                        : m.active
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{m.period}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xl">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
