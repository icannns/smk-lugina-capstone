// ASCII Courier has a fixed 0.6 em advance: 82 characters at 10 pt fit
// inside the 495 pt A4 content width, including unbroken filenames/URLs.
export function pdfLines(value: string, width = 82): string[] {
  const ascii = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[^\x20-\x7e\n]/g, " ");
  return ascii.split(/\r?\n/).flatMap((paragraph) => {
    const result: string[] = [];
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      let remaining = word;
      if (line && line.length + 1 + remaining.length > width) {
        result.push(line);
        line = "";
      }
      while (remaining.length > width) {
        result.push(remaining.slice(0, width));
        remaining = remaining.slice(width);
      }
      if (remaining) line += `${line ? " " : ""}${remaining}`;
    }
    result.push(line);
    return result;
  });
}

export function createPrototypePdf(
  title: string,
  lines: string[],
  footer: string,
) {
  const content = [title, ...lines, footer].flatMap((line) => pdfLines(line));
  const pages: string[][] = [];
  for (let i = 0; i < content.length; i += 43)
    pages.push(content.slice(i, i + 43));
  const escape = (text: string) => text.replace(/([\\()])/g, "\\$1");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
  ];
  pages.forEach((page, index) => {
    const stream = [
      "BT /F1 10 Tf 1 0 0 1 50 790 Tm (PROTOTIPE - CONTOH PEMBELAJARAN) Tj ET",
      ...page.map(
        (line, i) =>
          `BT /F1 10 Tf 1 0 0 1 50 ${758 - i * 16} Tm (${escape(line)}) Tj ET`,
      ),
      `BT /F1 10 Tf 1 0 0 1 50 46 Tm (Data fiktif - bukan dokumen resmi. Halaman ${index + 1}/${pages.length}) Tj ET`,
    ].join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join(
      "",
    )}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
