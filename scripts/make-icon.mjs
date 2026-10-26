#!/usr/bin/env node
/**
 * GÉNÉRATION DE L'ICÔNE WINDOWS
 * ============================================================================
 * `assets/app-icon-source.png` (1024×1024) → `assets/app-icon.ico`
 * L'ICO contient les tailles 16/24/32/48/64/128/256 en PNG (supporté par
 * Windows Vista+), ce qui donne une icône nette dans la barre des tâches, le
 * Bureau et l'Explorateur.
 *
 *   npm run icon
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets', 'app-icon-source.png');
const target = path.join(root, 'assets', 'app-icon.ico');
const previewTarget = path.join(root, 'assets', 'app-icon.png');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

if (!fs.existsSync(source)) {
  console.error(`Source introuvable : ${source}`);
  process.exit(1);
}

/** Recadre l'image sur la tuile puis ajoute une petite marge transparente. */
async function prepare() {
  const trimmed = await sharp(source).trim({ threshold: 12 }).toBuffer();
  return sharp(trimmed)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** Construit un conteneur ICO à partir de PNG (une entrée par taille). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type 1 = icône
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;

  entries.forEach((entry, index) => {
    const base = index * 16;
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 0); // largeur (0 = 256)
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1); // hauteur
    directory.writeUInt8(0, base + 2); // palette
    directory.writeUInt8(0, base + 3); // réservé
    directory.writeUInt16LE(1, base + 4); // plans
    directory.writeUInt16LE(32, base + 6); // bits par pixel
    directory.writeUInt32LE(entry.data.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += entry.data.length;
  });

  return Buffer.concat([header, directory, ...entries.map((e) => e.data)]);
}

const prepared = await prepare();
const entries = [];
for (const size of SIZES) {
  const data = await sharp(prepared).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
  entries.push({ size, data });
}

fs.writeFileSync(target, buildIco(entries));
fs.writeFileSync(previewTarget, await sharp(prepared).resize(512, 512).png().toBuffer());

console.log(`✓ ${path.relative(root, target)} (${SIZES.join(', ')} px, ${(fs.statSync(target).size / 1024).toFixed(1)} Ko)`);
console.log(`✓ ${path.relative(root, previewTarget)}`);
