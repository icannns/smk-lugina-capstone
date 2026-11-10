// Public fictional fixtures. No account, token, credential storage or API calls.
export const DEMO_EMAIL = "guru@example.com";
export const DEMO_PASSWORD = "DemoGuru123!";
export const GOOGLE_DEMO = {
  name: "Ahmad Rizky Pratama",
  email: "ahmad.rizky@example.com",
};

export function emailError(email: string): string | undefined {
  if (!email.trim()) return "Email wajib diisi.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "Masukkan alamat email yang valid.";
  if (!/^[^\s@]+@example\.com$/i.test(email.trim()))
    return "Prototipe hanya menerima email demo @example.com.";
}
export function passwordError(password: string): string | undefined {
  if (!password) return "Kata sandi wajib diisi.";
  if (password.length < 8) return "Kata sandi minimal 8 karakter.";
  if (password !== DEMO_PASSWORD)
    return `Gunakan kata sandi demo: ${DEMO_PASSWORD}`;
}
export function nameError(name: string): string | undefined {
  if (name.trim().length < 2) return "Nama lengkap minimal 2 karakter.";
}
export function phoneError(phone: string): string | undefined {
  if (phone && !/^(?:\+62|0)[0-9\s-]{8,14}$/.test(phone.trim()))
    return "Gunakan format nomor contoh 08xxxxxxxxxx atau +62xxxxxxxxxx.";
}
