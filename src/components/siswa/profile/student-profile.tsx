"use client";
import { nameError } from "@/lib/auth-demo";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { useEventDraftStore } from "@/lib/guru/event-draft-store";
import { saveStudentProfile } from "@/lib/siswa/student-actions";
import type { StudentProfile as Profile } from "@/lib/siswa/student-types";
import { STUDENT_NAME_MAX_LENGTH } from "@/lib/siswa/student-types";
import { Surface } from "../../guru/design-ui";
import { AvatarCrop } from "../../guru/profile/teacher-profile";
import { SiswaShell, SiswaIcon } from "../siswa-shell";
import { useStudentIdentity } from "../use-student-identity";
import {
  SiswaButton,
  SiswaLink,
  StudentNotice,
  studentControl,
} from "../siswa-ui";
export function StudentProfile() {
  const state = useEventDraftStore(),
    identity = useStudentIdentity();
  return (
    <SiswaShell frame="370:6265" active="profile">
      <header className="mb-6">
        <h1 className="text-[30px] font-semibold leading-[38px]">Profil</h1>
        <p className="mt-1 text-sm text-secondary">
          Informasi ini tampil di header, portofolio, dan dokumen belajar
          contoh.
        </p>
      </header>
      <ProfileForm key={identity.studentId} initial={identity} />
      {state.storageError && (
        <p role="alert" className="mt-3 text-xs text-amber-800">
          {state.storageError}
        </p>
      )}
    </SiswaShell>
  );
}
function ProfileForm({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [success, setSuccess] = useState(false),
    [image, setImage] = useState<ImageBitmap | null>(null),
    [busy, setBusy] = useState(false),
    file = useRef<HTMLInputElement>(null);
  async function choose(f?: File) {
    if (!f) return;
    setErrors((e) => ({ ...e, image: "" }));
    if (
      !["image/jpeg", "image/png"].includes(f.type) ||
      f.size > 2 * 1024 * 1024
    ) {
      setErrors((e) => ({
        ...e,
        image: "Pilih JPG atau PNG dengan ukuran maksimal 2 MB.",
      }));
      return;
    }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(f);
      if (bitmap.width < 200 || bitmap.height < 200) {
        bitmap.close();
        setErrors((e) => ({ ...e, image: "Ukuran foto minimal 200×200 px." }));
      } else setImage(bitmap);
    } catch {
      setErrors((e) => ({
        ...e,
        image:
          "Foto tidak dapat dibaca. Gunakan JPG atau PNG contoh yang valid.",
      }));
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setSuccess(false);
    const next: Record<string, string> = {};
    const invalidName = nameError(profile.name);
    if (invalidName) next.name = invalidName;
    else if (profile.name.length > STUDENT_NAME_MAX_LENGTH)
      next.name = `Nama maksimal ${STUDENT_NAME_MAX_LENGTH} karakter.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
      next.email = "Masukkan email kontak yang valid.";
    if (profile.phone && !/^[+\d\s()-]{6,30}$/.test(profile.phone))
      next.phone = "Gunakan format nomor contoh yang valid.";
    setErrors(next);
    if (Object.keys(next).length) {
      document
        .getElementById(`student-profile-${Object.keys(next)[0]}`)
        ?.focus();
      return;
    }
    setBusy(true);
    const saved = await saveStudentProfile(profile);
    setBusy(false);
    if (saved) {
      setSuccess(true);
    } else
      setErrors({
        save: "Profil belum dapat disimpan. Masuk kembali sebagai Siswa.",
      });
  }
  function field(
    key: "name" | "email" | "phone",
    label: string,
    helper?: string,
  ) {
    return (
      <div className={key === "name" ? "sm:col-span-2" : ""}>
        <label
          htmlFor={`student-profile-${key}`}
          className="mb-2 block text-sm font-medium"
        >
          {label}{" "}
          {key !== "phone" ? (
            <span className="text-danger">*</span>
          ) : (
            <span className="font-normal text-secondary">(opsional)</span>
          )}
        </label>
        <input
          id={`student-profile-${key}`}
          type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
          required={key !== "phone"}
          className={studentControl}
          value={profile[key]}
          onChange={(e) => {
            setProfile((p) => ({ ...p, [key]: e.target.value }));
            setErrors((p) => ({ ...p, [key]: "" }));
            setSuccess(false);
          }}
          maxLength={
            key === "phone"
              ? 30
              : key === "name"
                ? STUDENT_NAME_MAX_LENGTH
                : 120
          }
          aria-invalid={Boolean(errors[key])}
          aria-describedby={`student-profile-${key}-hint`}
        />
        <p
          id={`student-profile-${key}-hint`}
          className={`mt-2 text-xs leading-5 ${errors[key] ? "text-danger" : "text-secondary"}`}
          role={errors[key] ? "alert" : undefined}
        >
          {errors[key] || helper}
        </p>
      </div>
    );
  }
  return (
    <>
      <div
        className="max-w-[768px]"
        data-figma-node={success ? "370:6393" : "370:6265"}
      >
        {success && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <div>
              <p className="font-semibold">
                Perubahan profil berhasil disimpan.
              </p>
              <p className="mt-1 text-xs">
                Nama dan informasi profil telah diperbarui di server.
              </p>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setSuccess(false)}
            >
              ×
            </button>
          </div>
        )}
        <Surface className="!p-6 sm:!p-8">
          <form noValidate onSubmit={save}>
            <div className="mb-8 flex flex-wrap items-center gap-5">
              <div className="relative grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#2b7fff] to-[#00bba7]">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt="Foto profil contoh"
                    width={88}
                    height={88}
                    unoptimized
                  />
                ) : (
                  <>
                    <span className="text-[33.44px] font-semibold text-white">
                      {profile.name
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")}
                    </span>
                  </>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs leading-4 text-secondary">
                  JPG atau PNG · maks. 2 MB · minimal 200×200 px. Foto bisa
                  dipotong setelah dipilih.
                </p>
                <input
                  ref={file}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  aria-label="Foto profil contoh"
                  onChange={(e) => {
                    void choose(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
                <SiswaButton
                  variant="plain"
                  disabled={busy}
                  onClick={() => file.current?.click()}
                >
                  <SiswaIcon frame="370:6265" name="imgIcon" />
                  Pilih Foto
                </SiswaButton>
                {errors.image && (
                  <p role="alert" className="mt-2 text-xs text-danger">
                    {errors.image}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {field("name", "Nama lengkap")}
              {field("email", "Email", "Email contoh; akun login tetap.")}
              {field("phone", "Nomor HP", "Nomor contoh; tanpa notifikasi.")}
              <div>
                <label
                  htmlFor="student-role"
                  className="mb-2 block text-sm font-medium"
                >
                  Peran
                </label>
                <input
                  id="student-role"
                  readOnly
                  value="Siswa"
                  className={`${studentControl} !bg-gray-50 !text-secondary`}
                />
                <p className="mt-2 text-xs leading-5 text-secondary">
                  Peran akun tetap, tidak dapat diubah.
                </p>
              </div>
              <div>
                <label
                  htmlFor="student-school"
                  className="mb-2 block text-sm font-medium"
                >
                  Sekolah
                </label>
                <input
                  id="student-school"
                  readOnly
                  value="SMK Lugina Rancaekek"
                  className={`${studentControl} !bg-gray-50 !text-secondary`}
                />
                <p className="mt-2 text-xs leading-5 text-secondary">
                  Institusi penyelenggara Project-Based Learning.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <StudentNotice>
                <div className="flex items-start gap-3">
                  <span className="relative mt-0.5 shrink-0">
                    <SiswaIcon frame="370:6265" name="imgEllipse" />
                    <span
                      className="absolute inset-0 grid place-items-center text-[11px] font-bold leading-none"
                      aria-hidden
                    >
                      i
                    </span>
                  </span>
                  <div>
                    <p className="font-semibold">
                      Informasi E-Sertifikat &amp; Data Siswa
                    </p>
                    <p className="mt-1 text-xs leading-4">
                      Gunakan nama fiktif untuk demo. Nama profil dicantumkan
                      pada dokumen belajar contoh dan dibekukan saat klaim.
                      Perubahan profil tidak mengubah nama pada dokumen yang
                      sudah diklaim.
                    </p>
                  </div>
                </div>
              </StudentNotice>
            </div>
            <footer className="mt-8 flex flex-wrap justify-end gap-3 border-t border-line pt-6">
              <SiswaLink href="/siswa/dashboard">Batal</SiswaLink>
              <SiswaButton type="submit" disabled={busy}>
                Simpan Perubahan
              </SiswaButton>
            </footer>
            {errors.save && (
              <p role="alert" className="mt-3 text-xs text-danger">
                {errors.save}
              </p>
            )}
          </form>
        </Surface>
        <p className="mt-4 text-xs text-secondary">
          Prototipe · Gunakan identitas dan foto fiktif. Perubahan hanya
          disimpan di server setelah Simpan ditekan.
        </p>
      </div>
      {image && (
        <AvatarCrop
          bitmap={image}
          onCancel={() => {
            image.close();
            setImage(null);
          }}
          onApply={(avatar) => {
            setProfile((p) => ({ ...p, avatar }));
            setSuccess(false);
            image.close();
            setImage(null);
          }}
        />
      )}
    </>
  );
}
