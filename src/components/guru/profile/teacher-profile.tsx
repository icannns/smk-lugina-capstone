"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  useEventDraftStore,
  saveTeacherProfile,
} from "@/lib/guru/event-draft-store";
import { profileIdentity } from "@/lib/guru/profile-data";
import type { TeacherProfile as Profile } from "@/lib/guru/teacher-types";
import { TeacherPage } from "../teacher-page";
import { FeatureHeading } from "../learning-ui";
import { Surface, DesignIcon, controlClass } from "../design-ui";
export function TeacherProfile() {
  const state = useEventDraftStore();
  return (
    <TeacherPage activePage="profile" frame="291:28235">
      <FeatureHeading
        title="Profil"
        description="Informasi ini tampil di header aplikasi dan feedback untuk siswa."
      />
      <ProfileForm
        key={JSON.stringify(state.profile)}
        initial={state.profile}
      />
      {state.storageError && (
        <p role="alert" className="mt-4 text-sm text-amber-800">
          {state.storageError}
        </p>
      )}
    </TeacherPage>
  );
}
function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter(),
    fileInput = useRef<HTMLInputElement>(null),
    [profile, setProfile] = useState(initial),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [image, setImage] = useState<ImageBitmap | null>(null),
    [imageError, setImageError] = useState("");
  const identity = profileIdentity(profile);
  async function choose(file?: File) {
    if (!file) return;
    setImageError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageError("Pilih foto JPG atau PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Ukuran foto maksimal 2 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width < 200 || bitmap.height < 200) {
        bitmap.close();
        setImageError("Ukuran foto minimal 200×200 px.");
        return;
      }
      setImage(bitmap);
    } catch {
      setImageError(
        "Foto tidak dapat dibaca. Pilih gambar JPG atau PNG yang valid.",
      );
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    if (!profile.name.trim()) next.name = "Nama lengkap wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
      next.email = "Masukkan email kontak yang valid.";
    if (profile.phone && !/^[+\d\s()-]{6,30}$/.test(profile.phone))
      next.phone = "Gunakan format nomor contoh yang valid.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`profile-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    const saved = await saveTeacherProfile({
      ...profile,
      name: profile.name.trim(),
      email: profile.email.trim(),
      role: profile.role.trim(),
    });
    if (saved) router.push("/guru/dashboard?profile=saved");
    else {
      setErrors({
        save: "Profil belum tersimpan di server. Periksa pesan error.",
      });
      setBusy(false);
    }
  }
  function field(
    key: keyof Pick<Profile, "name" | "email" | "phone" | "role">,
    label: string,
    required = false,
  ) {
    return (
      <div className={key === "name" ? "sm:col-span-2" : ""}>
        <label
          htmlFor={`profile-${key}`}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
          {required ? (
            <span className="text-red-600"> *</span>
          ) : (
            <span className="font-normal text-secondary"> (opsional)</span>
          )}
        </label>
        <input
          id={`profile-${key}`}
          type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
          maxLength={
            key === "name"
              ? 120
              : key === "role"
                ? 80
                : key === "phone"
                  ? 30
                  : 120
          }
          required={required}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={
            errors[key]
              ? `profile-${key}-error`
              : key === "email" || key === "role"
                ? `profile-${key}-hint`
                : undefined
          }
          value={profile[key]}
          onChange={(e) => {
            setProfile((p) => ({ ...p, [key]: e.target.value }));
            setErrors((p) => ({ ...p, [key]: "" }));
          }}
          className={controlClass}
          disabled={busy}
        />
        {errors[key] && (
          <p
            id={`profile-${key}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {errors[key]}
          </p>
        )}
        {key === "email" && (
          <p
            id="profile-email-hint"
            className="mt-1.5 text-xs leading-4 text-secondary"
          >
            Akun contoh {initial.email}. Google OAuth hanya simulasi; tidak
            terhubung ke akun eksternal.
          </p>
        )}
        {key === "role" && (
          <p
            id="profile-role-hint"
            className="mt-1.5 text-xs leading-4 text-secondary"
          >
            Akun contoh Guru pada platform internal SMK Lugina Rancaekek. Peran
            ini hanya label tampilan.
          </p>
        )}
      </div>
    );
  }
  return (
    <>
      <Surface className="max-w-[768px] !p-8">
        <form noValidate onSubmit={save}>
          <div className="mb-8 flex flex-wrap items-center gap-6">
            <span className="grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-[32px] font-semibold text-white">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Pratinjau foto profil contoh"
                  width={88}
                  height={88}
                  className="size-[88px] object-cover"
                  unoptimized
                />
              ) : (
                identity.initials || "G"
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs leading-4 text-secondary">
                JPG atau PNG · maks. 2 MB · minimal 200×200 px. Foto bisa
                dipotong setelah dipilih.
              </p>
              <input
                aria-label="Foto profil"
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => {
                  void choose(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="flex h-10 items-center gap-2 rounded-control px-4 text-sm"
              >
                <DesignIcon frame="291:28235" name="imgIcon" />
                Pilih Foto
              </button>
              {imageError && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {imageError}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
            {field("name", "Nama lengkap", true)}
            {field("email", "Email", true)}
            {field("phone", "Nomor HP")}
            {field("role", "Peran")}
          </div>
          <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-line pt-6">
            <button
              type="button"
              disabled={busy}
              onClick={() => router.push("/guru/dashboard")}
              className="h-10 rounded-control px-4 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-control bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
          {errors.save && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {errors.save}
            </p>
          )}
        </form>
      </Surface>
      <p className="mt-4 max-w-[768px] text-xs text-secondary">
        Prototipe · Gunakan identitas dan foto contoh. Perubahan profil disimpan di server setelah tombol Simpan ditekan.
      </p>
      {image && (
        <AvatarCrop
          bitmap={image}
          onCancel={() => {
            image.close();
            setImage(null);
          }}
          onApply={(avatar) => {
            setProfile((p) => ({ ...p, avatar }));
            image.close();
            setImage(null);
          }}
        />
      )}
    </>
  );
}
export function AvatarCrop({
  bitmap,
  onCancel,
  onApply,
}: {
  bitmap: ImageBitmap;
  onCancel: () => void;
  onApply: (value: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [zoom, setZoom] = useState(1);
  useEffect(() => {
    const d = dialog.current,
      previous = document.activeElement;
    d?.showModal();
    return () => {
      d?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [bitmap]);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const size = Math.min(bitmap.width, bitmap.height) / zoom;
    context.clearRect(0, 0, 256, 256);
    context.drawImage(
      bitmap,
      (bitmap.width - size) / 2,
      (bitmap.height - size) / 2,
      size,
      size,
      0,
      0,
      256,
      256,
    );
  }, [bitmap, zoom]);
  return (
    <dialog
      ref={dialog}
      onCancel={onCancel}
      aria-labelledby="crop-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-sm overflow-y-auto rounded-2xl border border-line bg-white p-6 text-foreground shadow-xl backdrop:bg-slate-950/35"
    >
      <h2 id="crop-title" className="text-lg font-semibold">
        Potong foto contoh
      </h2>
      <p className="mb-4 mt-1 text-xs text-secondary">
        Pemotongan lokal. Gambar disimpan ke server saat Simpan Profil.
      </p>
      <canvas
        ref={canvas}
        width={256}
        height={256}
        aria-label="Pratinjau potongan foto"
        className="mx-auto max-w-full rounded-full"
      />
      <label className="mt-4 block text-sm">
        Perbesar
        <input
          aria-label="Perbesar foto"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-2 w-full"
        />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-control border border-line px-4 py-2 text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            const value = canvas.current?.toDataURL("image/jpeg", 0.85);
            if (value) onApply(value);
          }}
          className="rounded-control bg-primary px-4 py-2 text-sm text-white"
        >
          Gunakan Foto
        </button>
      </div>
    </dialog>
  );
}
