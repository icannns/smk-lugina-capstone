import { isDisplayName } from "./text-validation";
export function emailError(email: string): string | undefined {
  if (!email.trim()) return "Email wajib diisi.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "Masukkan alamat email yang valid.";
}

export function nameError(name: string): string | undefined {
  if (!isDisplayName(name)) return "Nama tidak boleh mengandung karakter kontrol.";
  if (name.trim().length < 2) return "Nama lengkap minimal 2 karakter.";
}
export function phoneError(phone: string): string | undefined {
  if (phone && !/^(?:\+62|0)[0-9\s-]{8,14}$/.test(phone.trim()))
    return "Gunakan format nomor contoh 08xxxxxxxxxx atau +62xxxxxxxxxx.";
}
