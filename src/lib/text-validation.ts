/** XML 1.0 character repertoire, including valid supplementary Unicode. */
export function isXmlCharacter(code: number) {
  return code === 0x9 || code === 0xa || code === 0xd ||
    (code >= 0x20 && code <= 0xd7ff) ||
    (code >= 0xe000 && code <= 0xfffd) ||
    (code >= 0x10000 && code <= 0x10ffff);
}

/** Reject control characters in names before trimming, on both client and server. */
export function isDisplayName(value: string) {
  return Array.from(value).every((character) => {
    const code = character.codePointAt(0)!;
    return isXmlCharacter(code) && code >= 0x20 && !(code >= 0x7f && code <= 0x9f);
  });
}

/** Defend exports of historical data, even if it predates input validation. */
export function escapeXmlText(value: string) {
  return Array.from(value).filter((c) => isXmlCharacter(c.codePointAt(0)!)).join("")
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}
