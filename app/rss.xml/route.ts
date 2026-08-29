import { prisma } from '@/lib/prisma';
import { r2PublicUrl } from '@/lib/r2-url';
import { PIN_WIDTH, PIN_HEIGHT } from '@/lib/pin-format';

// Flux RSS 2.0 pour la création groupée d'épingles Pinterest (1 flux = 1 tableau).
// Contient toutes les photos publiées du site (du plus ancien au plus récent).
// L'image servie est le recadrage vertical 1000x1500 (Photo.pinKey), au ratio 2:3
// recommandé par Pinterest : une photo horizontale y occupe trois fois moins de
// surface dans le feed et ne sort quasiment pas. Repli sur la preview tant que
// l'épingle n'est pas générée. Les deux sont filigranées ; l'original HD est le
// produit vendu et ne sort jamais ici. Le clic renvoie vers la page produit.
// Généré au runtime (pas au build) : sinon la DB n'est pas joignable pendant le
// build Docker et le flux sortirait vide.
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function itemDescription(photo: {
  title: string;
  titleEn: string | null;
  descriptionEn: string | null;
  city: string | null;
  country: string | null;
}): string {
  if (photo.descriptionEn) return photo.descriptionEn;
  const place = [photo.city, photo.country].filter(Boolean).join(', ');
  return `${photo.titleEn ?? photo.title}${place ? `, ${place}` : ''}. High-resolution travel photography in limited digital editions.`;
}

export async function GET() {
  const photos = await prisma.photo
    .findMany({
      where: { published: true },
      select: {
        slug: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        city: true,
        country: true,
        previewKey: true,
        pinKey: true,
        createdAt: true,
      },
      // Pinterest publie le plus ancien en premier : tri croissant par date
      // d'ajout pour un ordre de publication prévisible.
      orderBy: { createdAt: 'asc' },
    })
    .catch(() => []);

  const items = photos
    .map((photo) => {
      const img = r2PublicUrl(photo.pinKey ?? photo.previewKey);
      if (!img) return null;
      // Dimensions annoncées seulement pour l'épingle générée : la preview de
      // repli n'a pas de taille fixe et mentir à Pinterest la ferait rejeter.
      const size = photo.pinKey ? ` width="${PIN_WIDTH}" height="${PIN_HEIGHT}"` : '';
      // Flux en anglais : le clic doit atterrir sur la page anglaise.
      const pageUrl = `${BASE}/en/gallery/${photo.slug}`;
      const link = `${pageUrl}?utm_source=pinterest&utm_medium=rss`;
      return [
        '    <item>',
        `      <title>${xmlEscape(photo.titleEn ?? photo.title)}</title>`,
        `      <description>${xmlEscape(itemDescription(photo))}</description>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(pageUrl)}</guid>`,
        `      <pubDate>${photo.createdAt.toUTCString()}</pubDate>`,
        `      <media:content url="${xmlEscape(img)}" medium="image"${size}/>`,
        '    </item>',
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Nico Garay · Travel Photography</title>
    <link>${xmlEscape(BASE)}</link>
    <description>High-resolution travel photography in limited digital editions.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
