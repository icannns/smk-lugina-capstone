import path from "node:path";
import { createHash } from "node:crypto";
import { fromBuffer, type Entry } from "yauzl";
import { fail } from "../domain/common";
export function maxFileBytes() {
  const n = Number(process.env.FILE_MAX_BYTES ?? 10485760);
  if (!Number.isSafeInteger(n) || n < 1024 || n > 10485760)
    throw new Error("Invalid file size configuration");
  return n;
}
export function safeFilename(raw: string) {
  const name = raw
    .normalize("NFC")
    .replace(/[\\/]/g, "_")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .replace(/^\.+/, "");
  if (!name || name.length > 180)
    fail("Nama file tidak valid atau melebihi 180 karakter.");
  return name;
}
export const mimeTypes = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
export function allowedByMilestone(type: string, formats: string[]) {
  return (
    !formats.length ||
    (type === mimeTypes.pdf && formats.includes("PDF")) ||
    ((type === mimeTypes.png || type === mimeTypes.jpg) &&
      formats.includes("Gambar")) ||
    (type === mimeTypes.docx && formats.includes("DOCX"))
  );
}
async function docxPackage(bytes: Buffer) {
  await new Promise<void>((resolve, reject) =>
    fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => {
        if (error || !zip)
          return reject(new Error("DOCX bukan paket ZIP yang valid."));
        let count = 0,
          total = 0,
          settled = false;
        const names = new Set<string>();
        const stop = (e: Error) => {
          if (settled) return;
          settled = true;
          zip.close();
          reject(e);
        };
        zip.on("error", stop);
        zip.on("entry", (entry: Entry) => {
          count++;
          total += entry.uncompressedSize;
          if (
            count > 1000 ||
            total > 100 * 1024 * 1024 ||
            entry.uncompressedSize > Math.max(entry.compressedSize, 1) * 200 ||
            entry.fileName.split("/").includes("..") ||
            entry.fileName.startsWith("/") ||
            entry.generalPurposeBitFlag & 1 ||
            ((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000 ||
            /(vbaProject|activeX|embeddings|\.(exe|dll|js|bat|cmd)$)/i.test(
              entry.fileName,
            )
          )
            return stop(
              new Error(
                "Paket DOCX tidak didukung atau melewati batas keamanan.",
              ),
            );
          if (names.has(entry.fileName))
            return stop(new Error("Paket DOCX memiliki entri duplikat."));
          names.add(entry.fileName);
          zip.readEntry();
        });
        zip.on("end", () => {
          if (settled) return;
          settled = true;
          if (
            !["[Content_Types].xml", "_rels/.rels", "word/document.xml"].every(
              (n) => names.has(n),
            )
          )
            reject(new Error("Struktur DOCX tidak ditemukan."));
          else resolve();
        });
        zip.readEntry();
      },
    ),
  );
}
export async function validateFile(file: File) {
  if (!file.size || file.size > maxFileBytes())
    fail("File kosong atau melebihi batas 10 MB.", 413, "FILE_SIZE");
  const name = safeFilename(file.name),
    ext = path.extname(name).slice(1).toLowerCase() as keyof typeof mimeTypes,
    type = mimeTypes[ext];
  if (!type || file.type !== type)
    fail(
      "Gunakan PDF, PNG, JPG/JPEG atau DOCX dengan MIME yang sesuai.",
      415,
      "FILE_TYPE",
    );
  const bytes = Buffer.from(await file.arrayBuffer());
  let valid = false;
  if (ext === "pdf")
    valid =
      /^%PDF-(1\.[0-9]|2\.0)/.test(bytes.subarray(0, 12).toString("ascii")) &&
      /%%EOF\s*$/.test(bytes.subarray(-1024).toString("latin1"));
  if (ext === "png")
    valid =
      bytes.length >= 45 &&
      bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) &&
      bytes.subarray(12, 16).toString() === "IHDR" &&
      bytes.readUInt32BE(16) > 0 &&
      bytes.readUInt32BE(20) > 0 &&
      bytes.readUInt32BE(16) * bytes.readUInt32BE(20) <= 40000000 &&
      bytes
        .subarray(-12)
        .equals(Buffer.from("0000000049454e44ae426082", "hex"));
  if (ext === "jpg" || ext === "jpeg")
    valid =
      bytes.length > 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      bytes.at(-2) === 255 &&
      bytes.at(-1) === 217;
  if (ext === "docx") {
    try {
      if (bytes.readUInt32LE(0) !== 0x04034b50) throw new Error("Bad ZIP");
      await docxPackage(bytes);
      valid = true;
    } catch {
      fail("Signature/struktur DOCX tidak valid.", 415, "FILE_SIGNATURE");
    }
  }
  if (!valid)
    fail(
      "Isi file tidak sesuai signature format yang dipilih.",
      415,
      "FILE_SIGNATURE",
    );
  return {
    name,
    type,
    bytes,
    size: bytes.length,
    checksum: createHash("sha256").update(bytes).digest("hex"),
  };
}
export async function uploadForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    fail("Gunakan multipart/form-data.", 415);
  const limit = maxFileBytes() + 65536;
  if (Number(request.headers.get("content-length")) > limit)
    fail("Upload terlalu besar.", 413);
  const reader = request.body?.getReader();
  if (!reader) fail("File wajib diisi.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const row = await reader.read();
    if (row.done) break;
    size += row.value.length;
    if (size > limit) {
      await reader.cancel();
      fail("Upload terlalu besar.", 413);
    }
    chunks.push(row.value);
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    fail("Multipart tidak valid.");
  }
  if (
    [...form.keys()].some(
      (k) => !["file", "expectedVersion", "requestId"].includes(k),
    ) ||
    ["file", "expectedVersion", "requestId"].some(
      (k) => form.getAll(k).length !== 1,
    )
  )
    fail("Kirim satu file, expectedVersion dan requestId.");
  const file = form.get("file");
  if (!(file instanceof File)) fail("File wajib diisi.");
  return {
    file,
    expectedVersion: form.get("expectedVersion"),
    requestId: form.get("requestId"),
  };
}
