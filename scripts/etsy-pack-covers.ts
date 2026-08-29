/**
 * Génère, pour chaque pack thématique destiné à Etsy, une image de couverture
 * carrée 2000x2000 (format d'annonce recommandé par Etsy) : mosaïque 3x3 des
 * meilleures photos du thème, bandeau de titre en bas.
 *
 * Les vignettes viennent des previews filigranées : une couverture d'annonce
 * est une vitrine publique, jamais le fichier vendu.
 *
 * Usage : npx tsx scripts/etsy-pack-covers.ts /chemin/de/sortie
 */
import { writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { r2, R2_BUCKET } from '../lib/r2';

const prisma = new PrismaClient();

const OUT_DIR = process.argv[2] ?? '/tmp';
const SIZE = 2000;
const GRID = 3;
const GAP = 12;
const BAND = 260; // hauteur du bandeau de titre

const PACKS = [
  { tag: 'mer', file: 'pack-mer', label: "FONDS D'ÉCRAN MER & OCÉAN" },
  { tag: 'montagne', file: 'pack-montagne', label: "FONDS D'ÉCRAN MONTAGNE" },
  { tag: 'outback', file: 'pack-desert', label: "FONDS D'ÉCRAN DÉSERT" },
  { tag: 'coucher-de-soleil', file: 'pack-coucher-de-soleil', label: "FONDS D'ÉCRAN COUCHER DE SOLEIL" },
  { tag: 'tropical', file: 'pack-tropical', label: "FONDS D'ÉCRAN TROPICAL" },
];

async function fetchKey(key: string): Promise<Buffer> {
  const resp = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const chunks: Buffer[] = [];
  // @ts-expect-error - stream type from AWS SDK is opaque
  for await (const c of resp.Body) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bandSvg(label: string): Buffer {
  const safe = xmlEscape(label);
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <rect x="0" y="${SIZE - BAND}" width="${SIZE}" height="${BAND}" fill="#12100E"/>
  <text x="${SIZE / 2}" y="${SIZE - BAND / 2 - 14}" text-anchor="middle"
    font-family="'DejaVu Sans', sans-serif" font-size="76" font-weight="700"
    fill="#FFFFFF" letter-spacing="2">${safe}</text>
  <text x="${SIZE / 2}" y="${SIZE - BAND / 2 + 62}" text-anchor="middle"
    font-family="'DejaVu Sans', sans-serif" font-size="40" font-weight="400"
    fill="#FFFFFF" fill-opacity="0.72" letter-spacing="3">10 PHOTOS HD · PHOTOS.NICOGARAY.COM</text>
</svg>`);
}

async function buildCover(tag: string, label: string): Promise<Buffer | null> {
  const photos = await prisma.photo.findMany({
    where: { published: true, tags: { has: tag } },
    select: { thumbKey: true, previewKey: true },
    orderBy: [{ featured: 'desc' }, { takenAt: 'desc' }],
    take: GRID * GRID,
  });
  if (photos.length < GRID * GRID) {
    console.warn(`  ${tag}: seulement ${photos.length} photo(s), couverture ignorée`);
    return null;
  }

  // Cellules rectangulaires : la largeur se répartit sur SIZE, la hauteur sur
  // l'espace restant au-dessus du bandeau. Un carré unique laisserait une bande
  // vide sur le côté puisque la zone utile n'est pas carrée.
  const gridArea = SIZE - BAND;
  const cellW = Math.floor((SIZE - GAP * (GRID + 1)) / GRID);
  const cellH = Math.floor((gridArea - GAP * (GRID + 1)) / GRID);

  const tiles = await Promise.all(
    photos.map(async (p, i) => {
      const buf = await fetchKey(p.thumbKey || p.previewKey);
      const resized = await sharp(buf)
        .rotate()
        .resize({ width: cellW, height: cellH, fit: 'cover', position: sharp.strategy.attention })
        .toBuffer();
      return {
        input: resized,
        left: GAP + (i % GRID) * (cellW + GAP),
        top: GAP + Math.floor(i / GRID) * (cellH + GAP),
      };
    }),
  );

  return sharp({
    create: { width: SIZE, height: SIZE, channels: 3, background: '#12100E' },
  })
    .composite([...tiles, { input: bandSvg(label), top: 0, left: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

async function main() {
  for (const pack of PACKS) {
    const cover = await buildCover(pack.tag, pack.label);
    if (!cover) continue;
    const path = `${OUT_DIR}/${pack.file}.jpg`;
    writeFileSync(path, cover);
    console.log(`${path} (${Math.round(cover.length / 1024)} Ko)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
