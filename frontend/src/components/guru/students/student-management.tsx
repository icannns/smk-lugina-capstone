"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  studentEnrollments,
  studentEvents,
  students,
} from "@/lib/guru/student-data";
import { studentAssets } from "@/lib/guru/student-assets";
import {
  getStudentRecords,
  readStudentFilters,
  studentHref,
} from "@/lib/guru/student-selectors";
import type { StudentFilters, StudentSession } from "@/lib/guru/student-types";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../dashboard-dialog";
import { DashboardShell } from "../dashboard-shell";
import { StudentTable } from "./student-table";
import { StudentDetail } from "./student-detail";

export function StudentManagement() {
  const params = useSearchParams();
  const filters = readStudentFilters(params);
  const studentId = params.get("student");
  const [session, setSession] = useState<StudentSession>({
    notes: {},
    reviews: {},
  });
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  const event = studentEvents.find((e) => e.id === filters.event);
  const enrollment = studentEnrollments.find(
    (e) => e.eventId === filters.event && e.studentId === studentId,
  );
  const student = students.find((s) => s.id === studentId);
  const isDetail = !!studentId;
  const frame = isDetail
    ? "291:17339"
    : !filters.event
      ? "291:16571"
      : filters.milestone
        ? "291:17019"
        : "291:16703";
  function changeFilters(patch: Partial<StudentFilters>) {
    window.history.replaceState(
      null,
      "",
      studentHref({ ...filters, ...patch }),
    );
  }
  const overrides = {
    dashboard:
      studentAssets[
        !filters.event && !isDetail ? "initial-dashboard" : "list-dashboard"
      ],
    students: studentAssets["initial-students"],
    chevron: studentAssets["initial-chevron"],
  };
  return (
    <>
      <DashboardShell
        empty
        activePage="students"
        iconOverrides={overrides}
        onAction={setAction}
      >
        <main
          id="students-main"
          data-figma-node={frame}
          className={`mx-auto min-w-0 max-w-[1176px] px-5 py-8 sm:px-8 ${isDetail ? "min-[1360px]:min-h-[1321px]" : ""}`}
        >
          {isDetail ? (
            event && enrollment && student ? (
              <StudentDetail
                key={enrollment.id}
                student={student}
                event={event}
                enrollment={enrollment}
                reviewed={session.reviews[enrollment.id] ?? enrollment.reviewed}
                savedNote={session.notes[enrollment.id] ?? ""}
                onSave={(text) =>
                  setSession((old) => ({
                    ...old,
                    notes: { ...old.notes, [enrollment.id]: text },
                  }))
                }
                onReview={() =>
                  setSession((old) => ({
                    ...old,
                    reviews: { ...old.reviews, [enrollment.id]: true },
                  }))
                }
                onAction={setAction}
              />
            ) : (
              <div className="rounded-2xl border border-line bg-white p-8">
                <h1 className="text-2xl font-semibold">
                  Data siswa tidak ditemukan
                </h1>
                <p className="mt-3 text-sm text-secondary">
                  Siswa ini tidak terdaftar pada event contoh yang dipilih.
                </p>
                <Link
                  href="/guru/students"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Kembali ke Pengelolaan Data Siswa
                </Link>
              </div>
            )
          ) : (
            <StudentTable
              filters={filters}
              records={getStudentRecords(filters, session.reviews)}
              reviews={session.reviews}
              onChange={changeFilters}
            />
          )}
        </main>
      </DashboardShell>
      <DashboardDialog
        action={action}
        onClose={() => setAction(null)}
        onDelete={() => setAction(null)}
      />
    </>
  );
}
