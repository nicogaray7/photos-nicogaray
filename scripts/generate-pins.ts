/**
 * Génère l'image d'épingle verticale (1000x1500) de chaque photo publiée à
 * partir de sa preview filigranée, l'envoie sur R2 sous `pins/` et renseigne
 * Photo.pinKey. Le flux RSS Pinterest sert ensuite cette image à la place de la
 * preview horizontale.
 *
 * Usage :
 *   npx tsx scripts/generate-pins.ts            # seulement les photos sans pinKey
 *   npx tsx scripts/generate-pins.ts --force    # régénère tout
 *   npx tsx scripts/generate-pins.ts --limit 5  # échantillon de contrôle
 */
import { PrismaClient } from '@prisma/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2, r2Put, R2_BUCKET } from '../lib/r2';
import { buildPinImage } from '../lib/pin-image';

const prisma = new PrismaClient();

const force = process.argv.includes('--force');
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : undefined;

async function fetchKey(key: string): Promise<Buffer> {
  const resp = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const chunks: Buffer[] = [];
  // @ts-expect-error - stream type from AWS SDK is opaque
  for await (const c of resp.Body) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
}

async function main() {
  const photos = await prisma.photo.findMany({
    where: { published: true, ...(force ? {} : { pinKey: null }) },
    select: { id: true, slug: true, title: true, titleEn: true, city: true, country: true, previewKey: true },
    orderBy: { createdAt: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`${photos.length} épingle(s) à générer`);
  let done = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      const preview = await fetchKey(photo.previewKey);
      const place = [photo.city, photo.country].filter(Boolean).join(', ') || null;
      const pin = await buildPinImage({
        buffer: preview,
        // Le flux Pinterest est en anglais : on grave le titre anglais quand il existe.
        title: photo.titleEn ?? photo.title,
        place,
      });
      const key = `pins/${photo.slug}.jpg`;
      await r2Put(key, pin, 'image/jpeg');
      await prisma.photo.update({ where: { id: photo.id }, data: { pinKey: key } });
      done += 1;
      if (done % 20 === 0) console.log(`  ${done}/${photos.length}`);
    } catch (err) {
      failed += 1;
      console.error(`  échec ${photo.slug}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Terminé : ${done} générée(s), ${failed} échec(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
