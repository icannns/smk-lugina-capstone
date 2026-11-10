"use client";
import { useState, type ReactNode } from "react";
import { DashboardShell, type GuruPage } from "./dashboard-shell";
import { DashboardDialog, type DashboardDialogState } from "./dashboard-dialog";
import { designNavigation } from "./design-ui";
export function TeacherPage({
  children,
  frame,
  activePage,
  className = "",
}: {
  children: ReactNode;
  frame: string;
  activePage: GuruPage;
  className?: string;
}) {
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  return (
    <>
      <DashboardShell
        empty
        activePage={activePage}
        iconOverrides={designNavigation(frame)}
        onAction={setAction}
        mainId={`${activePage}-main`}
      >
        <main
          id={`${activePage}-main`}
          data-figma-node={frame}
          className={`mx-auto min-w-0 max-w-[1176px] px-5 py-8 sm:px-8 ${className}`}
        >
          {children}
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
