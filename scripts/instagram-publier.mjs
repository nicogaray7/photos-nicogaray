#!/usr/bin/env node
// Publication Instagram des photos du site, via l'API officielle Meta.
//
// Pourquoi l'API et pas le navigateur : automatiser l'interface d'Instagram
// viole ses conditions d'utilisation et fait fermer des comptes. L'API de
// publication de contenu est le seul chemin legitime, et elle demande un compte
// professionnel relie a une Page Facebook.
//
// Le site remplit deja ses deux conditions les plus penibles : les images sont
// servies a des URL publiques (R2) et chaque photo porte un titre et une
// description en base. Il ne restait donc qu'a les assembler.
//
// PAR DEFAUT CE SCRIPT NE PUBLIE RIEN. Il ecrit ce qu'il publierait. La regle de
// CLAUDE.md est sans exception : rien ne part au nom de Nico sans son accord,
// et --publier est cet accord, donne explicitement, une execution a la fois.
//
//   node instagram-publier.mjs --limite 5                 # apercu, aucun appel
//   node instagram-publier.mjs --limite 1 --publier       # publie pour de vrai
//
// Variables requises pour --publier : IG_USER_ID et IG_ACCESS_TOKEN.

import { PrismaClient } from '@prisma/client';

const API = 'https://graph.facebook.com/v21.0';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';
const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const publier = args.includes('--publier');
const limite = Number(opt('--limite', '5'));

// Instagram plafonne a 100 publications par 24 h. On reste tres en dessous :
// un compte qui deverse cent photos d'un coup ressemble a du spam, et le
// premier lecteur de ce signal est l'algorithme d'Instagram lui-meme.
const PLAFOND_JOUR = 100;

// La legende porte le sens, pas le remplissage. Titre, puis la description
// existante, puis le lien, puis peu de mots-cles mais justes.
export function construireLegende(photo) {
  const bouts = [];
  if (photo.title) bouts.push(photo.title);
  const texte = (photo.description || '').replace(/\s+/g, ' ').trim();
  if (texte) bouts.push(texte.length > 900 ? texte.slice(0, 897) + '...' : texte);
  bouts.push(`Tirage et fond d'ecran : ${SITE}/fr/gallery/${photo.slug}`);
  const cles = ['#photographiedevoyage', '#travelphotography', '#paysage', '#fondecran'];
  bouts.push(cles.join(' '));
  return bouts.join('\n\n');
}

export function urlImage(photo) {
  if (!photo.previewKey) return '';
  return R2 ? `${R2.replace(/\/$/, '')}/${photo.previewKey}` : '';
}

async function appel(chemin, params) {
  const r = await fetch(`${API}${chemin}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, access_token: process.env.IG_ACCESS_TOKEN }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`${chemin} : ${JSON.stringify(j.error ?? j).slice(0, 300)}`);
  return j;
}

async function publierUne(photo) {
  const image = urlImage(photo);
  if (!image) throw new Error('pas d image publique pour ' + photo.slug);
  const id = process.env.IG_USER_ID;
  // Deux temps imposes par l'API : on cree un conteneur, puis on le publie.
  const c = await appel(`/${id}/media`, { image_url: image, caption: construireLegende(photo) });
  const p = await appel(`/${id}/media_publish`, { creation_id: c.id });
  return p.id;
}

async function main() {
  if (publier && (!process.env.IG_USER_ID || !process.env.IG_ACCESS_TOKEN)) {
    console.error('REFUS : IG_USER_ID et IG_ACCESS_TOKEN sont requis pour --publier. Rien n a ete tente.');
    process.exit(2);
  }
  if (publier && limite > PLAFOND_JOUR) {
    console.error(`REFUS : ${limite} depasse le plafond Instagram de ${PLAFOND_JOUR} par 24 h.`);
    process.exit(2);
  }

  const prisma = new PrismaClient();
  const photos = await prisma.photo.findMany({
    where: { published: true },
    select: { slug: true, title: true, description: true, previewKey: true },
    orderBy: { createdAt: 'desc' },
    take: limite,
  });
  await prisma.$disconnect();

  console.log(publier ? `PUBLICATION REELLE de ${photos.length} photo(s)\n` : `APERCU de ${photos.length} photo(s), aucun appel a Instagram\n`);
  for (const p of photos) {
    const image = urlImage(p);
    console.log(`--- ${p.slug}`);
    console.log(`    image   : ${image || 'MANQUANTE'}`);
    console.log(`    legende : ${construireLegende(p).replace(/\n/g, ' | ').slice(0, 160)}...`);
    if (!publier) continue;
    try {
      const id = await publierUne(p);
      console.log(`    PUBLIEE  id=${id}`);
    } catch (e) {
      console.error(`    ECHEC    ${e.message}`);
    }
  }
  if (!publier) console.log('\nRien n a ete publie. Relance avec --publier quand la legende te convient.');
}

main().catch((e) => { console.error('erreur :', e.message); process.exit(1); });
