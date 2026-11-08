import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <a
        href="#auth-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-white focus:p-3"
      >
        Lewati ke formulir
      </a>
      <aside
        aria-label="Lugina PjBL"
        className="relative isolate overflow-hidden bg-[linear-gradient(125.112deg,#155dfc_0%,#155dfc_50%,#009689_100%)] px-6 py-8 text-white sm:px-12 lg:min-h-dvh lg:p-12"
      >
        <div
          aria-hidden="true"
          className="absolute -z-10 left-[60%] top-24 size-40 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -z-10 left-[51.111%] top-[65.625%] size-112 rounded-full bg-white/10"
        />
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-white text-base font-bold leading-6 text-[#1447e6]">
            L
          </span>
          <div>
            <p className="text-sm font-semibold leading-5">Lugina PjBL</p>
            <p className="text-xs leading-4 text-blue-100">
              SMK Lugina Rancaekek
            </p>
          </div>
        </div>
        <div className="mt-8 max-w-112 lg:absolute lg:top-[calc(50%-114px)] lg:mt-0 lg:w-[calc(100%-96px)]">
          <p className="text-2xl font-semibold leading-8 tracking-[-0.6px] sm:text-3xl sm:leading-10 lg:text-4xl lg:leading-[45px] lg:tracking-[-0.9px]">
            Belajar lewat event, pantau progres, dan kumpulkan karya — dalam
            satu tempat.
          </p>
          <p className="mt-4 hidden text-base leading-6 text-blue-100 sm:block">
            Platform Pembelajaran Berbasis Event SMK Lugina Rancaekek.
          </p>
        </div>
        <p className="absolute bottom-12 hidden text-sm leading-5 text-blue-100 lg:block">
          © 2026 SMK Lugina Rancaekek
        </p>
      </aside>
      <main
        id="auth-content"
        className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-10 lg:min-h-dvh lg:p-6"
      >
        {children}
      </main>
    </div>
  );
}
