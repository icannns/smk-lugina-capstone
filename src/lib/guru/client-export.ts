"use client";
import { escapeXmlText } from "../text-validation";
import { createPrototypePdf } from "./prototype-pdf";
export function downloadText(
  filename: string,
  text: string,
  type = "text/plain;charset=utf-8",
) {
  const blob = new Blob([text], { type }),
    url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Minimal valid PDF containing only fictional prototype text. No signatures,
// official serial numbers, verification links or actual certificate issuance.
export function prototypePdf(
  title: string,
  lines: string[],
  filename: string,
  footer = "Bukan sertifikat resmi. Tidak ada penerbitan institusional.",
) {
  downloadText(
    filename,
    createPrototypePdf(title, lines, footer),
    "application/pdf",
  );
}

export function downloadSpreadsheet(
  filename: string,
  rows: (string | number)[][],
) {
  const xml = escapeXmlText;
  const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v) => (typeof v === "number" ? `<c><v>${v}</v></c>` : `<c t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`)).join("")}</row>`).join("")}</sheetData></worksheet>`;
  const files: Record<string, string> = {
    "[Content_Types].xml":
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Laporan Demo" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheet,
  };
  const enc = new TextEncoder(),
    chunks: Uint8Array<ArrayBuffer>[] = [],
    directory: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  const header = (size: number) => new Uint8Array(size),
    view = (b: Uint8Array) =>
      new DataView(b.buffer, b.byteOffset, b.byteLength);
  function crc32(bytes: Uint8Array) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let k = 0; k < 8; k++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  for (const [name, text] of Object.entries(files)) {
    const path = enc.encode(name),
      data = enc.encode(text),
      crc = crc32(data),
      h = header(30),
      v = view(h);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, data.length, true);
    v.setUint32(22, data.length, true);
    v.setUint16(26, path.length, true);
    chunks.push(h, path, data);
    const central = header(46),
      c = view(central);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, path.length, true);
    c.setUint32(42, offset, true);
    directory.push(central, path);
    offset += h.length + path.length + data.length;
  }
  const size = directory.reduce((n, c) => n + c.length, 0),
    end = header(22),
    e = view(end);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, Object.keys(files).length, true);
  e.setUint16(10, Object.keys(files).length, true);
  e.setUint32(12, size, true);
  e.setUint32(16, offset, true);
  const url = URL.createObjectURL(
      new Blob([...chunks, ...directory, end], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
