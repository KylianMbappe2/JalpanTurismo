import { previewAssets } from './preview-assets.js';

const xml = text => {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('El documento contiene una estructura no admitida.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('No se pudo leer el contenido del documento.');
  return doc;
};
const nodes = (parent, name) => [...parent.getElementsByTagNameNS('*', name)];
const text = parent => nodes(parent, 't').map(node => node.textContent).join('');

export async function renderOffice(bytes, name, root) {
  const { unzipSync, strFromU8 } = await import(previewAssets.zip);
  let budget = 0, entries = 0;
  const files = unzipSync(bytes, { filter: entry => {
    if (++entries > 1000) throw new Error('El documento tiene demasiados componentes.');
    const selectedXml = /^(word\/document\.xml|ppt\/slides\/slide\d+\.xml|xl\/(workbook\.xml|sharedStrings\.xml|worksheets\/sheet\d+\.xml))$/.test(entry.name);
    const selectedImage = /^(word|ppt|xl)\/media\/[^/]+\.(png|jpe?g|webp)$/i.test(entry.name);
    if (!selectedXml && !selectedImage) return false;
    budget += entry.originalSize;
    if (entry.originalSize > 5242880 || budget > 12000000) throw new Error('El documento es demasiado grande para la vista previa.');
    return true;
  } });
  const read = key => files[key] ? xml(strFromU8(files[key])) : null;
  const images = async () => {
    const keys = Object.keys(files).filter(key => /\.(png|jpe?g|webp)$/i.test(key)).slice(0, 20);
    if (!keys.length) return;
    const heading = document.createElement('h3'); heading.textContent = 'Imágenes del archivo'; root.append(heading);
    for (const [index, key] of keys.entries()) {
      const mime = /\.png$/i.test(key) ? 'image/png' : /\.webp$/i.test(key) ? 'image/webp' : 'image/jpeg';
      const reader = new FileReader();
      const url = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(new Blob([files[key]], { type: mime })); });
      const image = new Image(); image.alt = `Imagen ${index + 1} del documento`; image.src = url; image.className = 'preview-office-image';
      try { await image.decode(); root.append(image); } catch { /* El original sigue disponible si una imagen no se puede mostrar. */ }
    }
  };

  const note = document.createElement('p'); note.className = 'preview-note';
  note.textContent = 'Vista del contenido. Descarga el original para conservar su diseño, imágenes y formato.'; root.append(note);
  const addText = (title, content) => {
    const section = document.createElement('section'); const heading = document.createElement('h3'); heading.textContent = title;
    const body = document.createElement('pre'); body.className = 'preview-text'; body.textContent = content.slice(0, 300000) || 'No se encontró texto en este apartado.';
    section.append(heading, body); root.append(section);
  };
  if (/\.docx$/i.test(name)) {
    const doc = read('word/document.xml'); if (!doc) throw new Error('No encontramos el texto del documento.');
    addText('Documento', nodes(doc, 'p').map(text).join('\n')); await images(); return;
  }
  if (/\.pptx$/i.test(name)) {
    const slides = Object.keys(files).filter(key => /^ppt\/slides\//.test(key)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!slides.length) throw new Error('No encontramos las diapositivas.');
    for (const [index, key] of slides.slice(0, 50).entries()) addText(`Diapositiva ${index + 1}`, nodes(read(key), 'p').map(text).join('\n'));
    await images(); return;
  }
  const strings = nodes(read('xl/sharedStrings.xml') ?? document.implementation.createDocument(null, 'empty'), 'si').map(text);
  const sheets = Object.keys(files).filter(key => /^xl\/worksheets\//.test(key)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!sheets.length) throw new Error('No encontramos las hojas de cálculo.');
  const names = nodes(read('xl/workbook.xml') ?? document.implementation.createDocument(null, 'empty'), 'sheet').map(sheet => sheet.getAttribute('name'));
  for (const [index, key] of sheets.slice(0, 10).entries()) {
    const heading = document.createElement('h3'); heading.textContent = names[index] || `Hoja ${index + 1}`;
    const region = document.createElement('div'); region.className = 'preview-sheet';
    const table = document.createElement('table');
    for (const row of nodes(read(key), 'row').slice(0, 100)) {
      const tr = document.createElement('tr');
      const cells = new Map();
      for (const cell of nodes(row, 'c')) {
        const letters = (cell.getAttribute('r') ?? '').match(/^[A-Z]+/)?.[0] ?? '';
        const column = letters ? [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1 : cells.size;
        if (column >= 20) continue;
        const value = nodes(cell, 'v')[0]?.textContent ?? '';
        cells.set(column, cell.getAttribute('t') === 's' ? strings[Number(value)] ?? '' : cell.getAttribute('t') === 'inlineStr' ? text(cell) : value);
      }
      const last = Math.max(-1, ...cells.keys());
      for (let column = 0; column <= last; column++) { const td = document.createElement('td'); td.textContent = cells.get(column) ?? ''; tr.append(td); }
      table.append(tr);
    }
    region.append(table); root.append(heading, region);
  }
  note.textContent += ' Se muestran hasta 100 filas y 20 columnas por hoja.';
  await images();
}
