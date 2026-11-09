import Image from "next/image";
import assets from "@/lib/siswa/design-assets.json";
function SourceImage({ name }: { name: keyof typeof assets }) {
  const asset = assets[name];
  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt=""
      priority
    />
  );
}
export function LoginGraphic() {
  return (
    <aside
      aria-label="Belajar berbasis project bersama Lugina"
      className="relative hidden min-h-[1024px] overflow-hidden bg-gradient-to-b from-[#f6f9ff] to-[#ebf2ff] lg:block"
    >
      <div className="absolute left-[8.333%] top-[130px] flex h-40 w-[calc(100%-80px)] max-w-[600px] flex-col justify-center gap-2 font-bold leading-[1.2] text-[#162034]">
        <p className="text-[clamp(24px,2.222vw,32px)]">
          Belajar Lewat Project Nyata &amp; Bangun
        </p>
        <p className="text-[clamp(28px,2.5vw,36px)] text-primary">
          Portofolio Terbaikmu
        </p>
        <p className="text-[clamp(28px,2.5vw,36px)]">Bersama Lugina PjBL !</p>
      </div>
      <div className="absolute left-[11.111%] top-[360px]">
        <SourceImage name="370:1538:imgDottedGridDecor" />
      </div>
      <div className="absolute left-[16.667%] top-[380px]">
        <SourceImage name="370:1538:imgSoftAmbientGlow" />
      </div>
      <div
        aria-hidden
        className="absolute left-1/2 top-[420px] h-[400px] w-[460px] -translate-x-1/2"
      >
        <div className="absolute left-[50px] top-[50px] h-[180px] w-[360px] rounded-[90px] bg-[linear-gradient(153.43deg,#8ce0d1_0%,#73b8fa_35.714%,#948cfa_71.429%)]" />
        <div className="absolute left-[190px] top-[65px]">
          <SourceImage name="370:1538:imgEllipse" />
        </div>
        <div className="absolute left-[205px] top-[80px]">
          <SourceImage name="370:1538:imgEllipse1" />
        </div>
        <div className="absolute left-[197px] top-[135px] h-2 w-[30px] rounded bg-white/90" />
        <div className="absolute left-[92.5px] top-[163px] h-[5px] w-[60px] rotate-30 bg-[#1a1a1f]" />
        <div className="absolute left-[190.2px] top-[181px] h-[5px] w-[70px] rotate-170 bg-[#1a1a1f]" />
        <div className="absolute left-[150px] top-[185px] h-[7px] w-[130px] rounded-[3px] bg-[#c7d1e5]" />
        <div className="absolute left-40 top-28 h-[75px] w-[110px] rounded-md border-[1.5px] border-[#c7d1e5] bg-[#f0f5ff]">
          <div className="absolute left-[3.5px] top-[4.5px] h-1.5 w-[100px] rounded-sm bg-[#4080f2]" />
          <div className="absolute left-[3.5px] top-[16.5px] h-1 w-[60px] rounded-sm bg-[#b2c7e5]" />
          <div className="absolute left-[3.5px] top-[24.5px] h-1 w-[90px] rounded-sm bg-[#d1e0f2]" />
        </div>
        <div className="absolute left-[175px] top-[230px] h-[75px] w-[5px] bg-[#1a1a1f]" />
        <div className="absolute left-[245px] top-[230px] h-[75px] w-[5px] bg-[#1a1a1f]" />
        <div className="absolute left-[60px] top-[305px] h-1 w-80 rounded-sm bg-[#1a1a1f]" />
      </div>
    </aside>
  );
}
export function RegistrationGraphic() {
  return (
    <aside
      aria-label="Ilustrasi milestone dan portofolio"
      className="relative hidden min-h-[1024px] overflow-hidden bg-gradient-to-b from-primary to-[#1640b8] lg:block"
    >
      <div
        aria-hidden
        className="absolute left-[180px] top-[520px] size-[600px] rounded-full bg-[radial-gradient(circle,rgba(97,166,255,0.4),rgba(37,99,235,0))]"
      />
      <div
        aria-hidden
        className="absolute left-[14.706%] top-40 flex h-[220px] w-[260px] flex-col gap-4 overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_12px_24px_#00000026]"
      >
        <p className="text-[13px] font-medium text-[#6b7280]">
          Milestone Belajar
        </p>
        <p className="text-4xl font-bold">100%</p>
        <div className="relative h-10 w-[212px] overflow-hidden">
          <div className="absolute left-[7.89px] top-[25px] flex h-[29.889px] w-[56.492px] items-center justify-center">
            <div className="h-[5px] w-[60px] shrink-0 rotate-25 rounded-[3px] bg-[#f59e26]" />
          </div>
          <div className="absolute left-[60px] top-[-13.94px] flex h-[28.64px] w-[67.489px] items-center justify-center">
            <div className="h-[5px] w-[70px] shrink-0 -rotate-20 rounded-[3px] bg-primary" />
          </div>
          <div className="absolute left-[122.5px] top-[30px] flex h-[36.83px] w-[58.792px] items-center justify-center">
            <div className="h-[5px] w-[65px] shrink-0 rotate-30 rounded-[3px] bg-[#10b981]" />
          </div>
          <span className="absolute left-[85px] top-0 grid size-11 place-items-center rounded-full bg-[#111827] text-base font-bold text-white">
            95
          </span>
        </div>
      </div>
      <span
        aria-hidden
        className="absolute left-[58.824%] top-[210px] grid size-[52px] place-items-center rounded-full bg-white text-2xl shadow-lg"
      >
        🎨
      </span>
      <span
        aria-hidden
        className="absolute left-[67.647%] top-[350px] grid size-[52px] place-items-center rounded-full bg-white text-2xl shadow-lg"
      >
        ⚡
      </span>
      <div className="absolute left-[14.706%] top-[480px] flex h-[210px] w-[420px] flex-col gap-4 rounded-[20px] bg-white p-7 shadow-[0_12px_24px_#00000026]">
        <div className="flex h-10 shrink-0 items-center justify-between">
          <span className="h-1.5 w-11 rounded bg-primary" />
          <p className="text-[13px] font-bold text-[#d9800d]">
            🏆 Contoh Sertifikat
          </p>
        </div>
        <h2 className="text-lg font-bold">
          Portofolio &amp; Sertifikat Belajar
        </h2>
        <p className="text-[13px] leading-4 text-[#616b7a]">
          Arsip karya dan dokumen penyelesaian belajar contoh. Bukan sertifikasi
          kompetensi resmi.
        </p>
      </div>
    </aside>
  );
}
