import sharp from 'sharp';

/**
 * Génération de l'image d'épingle Pinterest.
 *
 * Pinterest distribue en colonnes verticales : une photo de paysage 3:2 y
 * occupe environ trois fois moins de surface qu'une épingle 2:3, et sort donc
 * très peu dans le feed. On recadre chaque photo au format 1000x1500 (2:3, le
 * ratio recommandé), on garde le filigrane de la preview (l'original HD reste
 * le produit vendu) et on grave le titre en bas, parce qu'une épingle sans
 * texte ne dit pas ce qu'on trouve derrière le clic.
 */

import { PIN_WIDTH, PIN_HEIGHT } from './pin-format';

export { PIN_WIDTH, PIN_HEIGHT };

const FONT = "'DejaVu Sans', 'Noto Sans', sans-serif";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Découpe un titre en lignes d'au plus `maxChars` caractères, sans couper les
 * mots. Approximation volontaire : sharp ne sait pas mesurer un texte SVG, donc
 * on calibre sur la largeur moyenne d'un caractère à cette taille de police.
 */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && current && lines[maxLines - 1] !== current) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 1)}…`;
  }
  return lines;
}

/**
 * Bandeau bas : dégradé sombre pour garder le texte lisible quelle que soit la
 * photo, titre sur deux lignes maximum, puis le lieu et le domaine.
 */
function overlaySvg(title: string, place: string | null): Buffer {
  const titleSize = 62;
  const lines = wrap(title, 26, 2);
  const placeText = [place, 'photos.nicogaray.com'].filter(Boolean).join('  ·  ');

  const blockHeight = lines.length * (titleSize + 14) + 84;
  const top = PIN_HEIGHT - blockHeight - 56;
  const gradientTop = Math.max(0, top - 220);

  const titleTspans = lines
    .map(
      (line, i) =>
        `<text x="64" y="${top + 8 + i * (titleSize + 14) + titleSize}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="#FFFFFF">${xmlEscape(line)}</text>`,
    )
    .join('\n    ');

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="55%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradientTop}" width="${PIN_WIDTH}" height="${PIN_HEIGHT - gradientTop}" fill="url(#shade)"/>
  ${titleTspans}
  <text x="64" y="${PIN_HEIGHT - 62}" font-family="${FONT}" font-size="30" font-weight="500" fill="#FFFFFF" fill-opacity="0.86" letter-spacing="1.4">${xmlEscape(placeText.toUpperCase())}</text>
</svg>`);
}

export interface PinImageInput {
  /** Preview filigranée de la photo (jamais l'original HD). */
  buffer: Buffer;
  title: string;
  place?: string | null;
}

export async function buildPinImage({ buffer, title, place }: PinImageInput): Promise<Buffer> {
  // `attention` recadre sur la zone la plus saillante : sur un paysage, ça garde
  // le sujet plutôt que le centre géométrique.
  const cropped = await sharp(buffer)
    .rotate()
    .resize({ width: PIN_WIDTH, height: PIN_HEIGHT, fit: 'cover', position: sharp.strategy.attention })
    .toBuffer();

  return sharp(cropped)
    .composite([{ input: overlaySvg(title, place ?? null), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}
