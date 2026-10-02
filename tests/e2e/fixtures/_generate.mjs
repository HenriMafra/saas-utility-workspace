// Gera fixtures reais para os testes E2E: sample.pdf, sample2.pdf, sample.png
// Uso: node tests/e2e/fixtures/_generate.mjs
import { PDFDocument, StandardFonts } from "pdf-lib";
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

async function makePdf(pages, file) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([595, 842]);
    p.drawText(`Pagina ${i + 1} - Praticca teste E2E`, { x: 50, y: 780, size: 20, font });
    p.drawText("Conteudo de exemplo para validar processamento de PDF.", {
      x: 50, y: 740, size: 12, font,
    });
  }
  fs.writeFileSync(file, await doc.save());
}

// --- Encoder PNG mínimo (RGB, sem dependências) ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePng(w, h, rgb, file) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter byte
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      // gradiente simples para não comprimir a zero
      raw[o] = (rgb[0] + x) % 256;
      raw[o + 1] = (rgb[1] + y) % 256;
      raw[o + 2] = rgb[2];
    }
  }
  const idat = zlib.deflateSync(raw);
  fs.writeFileSync(
    file,
    Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]),
  );
}

await makePdf(3, path.join(DIR, "sample.pdf"));
await makePdf(2, path.join(DIR, "sample2.pdf"));
makePng(240, 160, [60, 108, 255], path.join(DIR, "sample.png"));
console.log("Fixtures geradas:", fs.readdirSync(DIR).filter((f) => !f.startsWith("_")).join(", "));
