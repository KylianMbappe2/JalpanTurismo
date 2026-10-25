import { cp, mkdir } from 'node:fs/promises';

// Serve PDF.js from our own origin, using the exact version in pnpm-lock.yaml.
export async function preparePdfJs() {
  const source = new URL('../node_modules/pdfjs-dist/', import.meta.url);
  const destination = new URL('../public/vendor/pdfjs/', import.meta.url);
  await mkdir(destination, { recursive: true });
  for (const file of ['build/pdf.mjs', 'build/pdf.worker.mjs', 'cmaps', 'standard_fonts', 'wasm', 'LICENSE']) {
    await cp(new URL(file, source), new URL(file.replace('build/', ''), destination), { recursive: true });
  }
}
