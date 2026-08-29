import { prisma } from '@/lib/prisma';
import { r2PublicUrl } from '@/lib/r2-url';

// RSS média que Pinterest peut consommer automatiquement (Bulk create > RSS
// feed) pour créer des épingles sans intervention manuelle à chaque photo.
// Canal d'automatisation légitime : c'est notre propre flux, sur notre propre
// domaine, aucune action n'est prise au nom de Nico sur un compte tiers.
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const photos = await prisma.photo
    .findMany({
      where: { published: true },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        slug: true,
        title: true,
        description: true,
        previewKey: true,
        updatedAt: true,
        fileSize: true,
      },
    })
    .catch(() => []);

  const items = photos
    .map((p) => {
      const img = r2PublicUrl(p.previewKey);
      if (!img) return '';
      const link = `${BASE}/fr/gallery/${p.slug}?utm_source=pinterest&utm_medium=organic&utm_campaign=rss_feed`;
      const desc = p.description || p.title;
      return `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="false">${escapeXml(p.slug)}</guid>
    <description>${escapeXml(desc)}</description>
    <pubDate>${p.updatedAt.toUTCString()}</pubDate>
    <enclosure url="${escapeXml(img)}" type="image/jpeg" length="${p.fileSize || 0}" />
  </item>`;
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Nico Garay Photography</title>
  <link>${BASE}</link>
  <description>Photographies de voyage en édition numérique haute résolution.</description>
  <language>fr</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
