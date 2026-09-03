// Lien signe court vers un original du bucket prive R2, sans passer par le
// code TypeScript du site (qui n'est pas executable tel quel par node).
// Meme configuration que lib/r2.ts : memes variables d'environnement.
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_ORIGINALS_BUCKET_NAME ?? 'nico-garay-originals';

export async function signerOriginal(key, expiresIn = 600) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}
