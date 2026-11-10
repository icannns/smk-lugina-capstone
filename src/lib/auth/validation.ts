export const passwordRules = (value: string) => [
  value.length >= 8,
  /[0-9]|[^a-zA-Z0-9]/.test(value),
  /[a-z]/.test(value) && /[A-Z]/.test(value),
];
export const registrationPasswordError = (value: string) =>
  passwordRules(value).every(Boolean)
    ? undefined
    : "Kata sandi belum memenuhi ketiga persyaratan.";
