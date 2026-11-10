"use client";

import React from "react";
import { CheckCircle2, Clock, Calendar, Award } from "lucide-react";

export default function MilestoneTab() {
  const milestones = [
    {
      title: "Penyusunan Instrumen Survei",
      period: "15 – 19 Okt 2026",
      status: "Selesai",
      desc: "Validasi butir pertanyaan Likert 5 dimensi Technostress dan pertanyaan esai reflektif.",
      completed: true
    },
    {
      title: "Periode Pengisian Survei Siswa",
      period: "20 – 30 Okt 2026",
      status: "Sedang Berjalan",
      desc: "24 dari 32 responden telah menyelesaikan pengisian kuesioner dan narasi terbuka.",
      completed: false,
      active: true
    },
    {
      title: "Analisis NLP & Ekstraksi Technostress",
      period: "1 – 5 Nov 2026",
      status: "Terjadwal",
      desc: "Pemetaan kata kunci, pengelompokan tingkat stres komparatif, dan penarikan kesimpulan pedagogis.",
      completed: false
    }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_0_0_1px_#0000000f,0_1px_2px_#1018280a]">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Award className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-5">Status Penilaian & Milestone Survei</h3>
            <p className="text-xs text-secondary mt-0.5">Pelacakan tahapan pelaksanaan evaluasi Technostress di lingkungan sekolah</p>
          </div>
        </div>

        <div className="relative border-l-2 border-line ml-4 space-y-7 pb-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative pl-6">
              <div
                className={`absolute -left-[17px] top-0 size-8 rounded-full border-2 flex items-center justify-center ${
                  m.completed
                    ? "bg-emerald-500 border-white text-white shadow-xs"
                    : m.active
                    ? "bg-primary border-white text-white shadow-xs"
                    : "bg-gray-100 border-white text-gray-400"
                }`}
              >
                {m.completed ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Clock className="size-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="font-semibold text-gray-900 text-sm">{m.title}</h4>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      m.completed
                        ? "bg-emerald-50 text-emerald-700"
                        : m.active
                        ? "bg-blue-50 text-primary"
                        : "bg-gray-100 text-secondary"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-secondary mt-1">
                  <Calendar className="size-3.5" />
                  <span>{m.period}</span>
                </div>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed max-w-xl">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
