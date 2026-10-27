import { readFile, mkdir, writeFile, rename, stat } from 'node:fs/promises';

export async function preparePreviewAssets() {
  const pdf = JSON.parse(await readFile(new URL('../node_modules/pdfjs-dist/package.json', import.meta.url)));
  const zip = JSON.parse(await readFile(new URL('../node_modules/fflate/package.json', import.meta.url)));
  const base = `/vendor/file-preview/pdfjs-${pdf.version}-fflate-${zip.version}`;
  const target = new URL(`../public${base}/`, import.meta.url);
  await mkdir(target, { recursive: true });
  for (const [source, name] of [
    ['pdfjs-dist/build/pdf.min.mjs', 'pdf.js'], ['pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.js'],
    ['fflate/esm/browser.js', 'zip.js'], ['pdfjs-dist/LICENSE', 'PDFJS-LICENSE.txt'], ['fflate/LICENSE', 'FFLATE-LICENSE.txt'],
  ]) {
    const bytes = await readFile(new URL(`../node_modules/${source}`, import.meta.url));
    const dest = new URL(name, target);
    if ((await stat(dest).catch(() => null))?.size === bytes.length) continue;
    const temp = new URL(`${name}.${process.pid}.tmp`, target);
    await writeFile(temp, bytes); await rename(temp, dest);
  }
  const manifest = `// Generado por scripts/preview-assets.mjs. Los motores se cargan solo al abrir un archivo.\nexport const previewAssets = ${JSON.stringify({ pdf: `${base}/pdf.js`, worker: `${base}/pdf.worker.js`, zip: `${base}/zip.js` })};\n`;
  const manifestPath = new URL('../public/preview-assets.js', import.meta.url);
  if (await readFile(manifestPath, 'utf8').catch(() => '') !== manifest) await writeFile(manifestPath, manifest);
}
