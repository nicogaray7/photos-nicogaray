#!/usr/bin/env node
// Publication en lot des photos du site sur Instagram, en carrousels.
//
// Regroupement : geographie d'abord (pays + region), puis theme quand un lieu
// depasse la taille d'un carrousel. L'orientation ne se melange jamais dans un
// meme carrousel : Instagram recadre toutes les diapositives sur le format de
// la premiere, un portrait glisse au milieu de paysages est massacre.
//
// Legendes en anglais : titleEn / descriptionEn / lien /en/gallery/.
// Chaque diapositive porte sa propre legende (fonctionnalite de juin 2026) et
// son alt_text. Si l'API refuse la legende par diapositive, --legende-unique
// retombe sur une legende numerotee au niveau du carrousel.
//
//   node ig-batch.mjs                 # plan, aucun appel a Instagram
//   node ig-batch.mjs --publier       # publie
//   node ig-batch.mjs --publier --max 1   # ne publie que le premier lot
//
import { PrismaClient } from '@prisma/client';
import { signerOriginal } from './ig-r2.mjs';

const API = 'https://graph.facebook.com/v21.0';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';
const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';
const ID = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const publier = args.includes('--publier');
// L'API ne transmet pas de legende par diapositive (teste le 29/08/2026 : le
// parametre est ignore et illisible en relecture). On numerote donc dans la
// legende du carrousel. --par-diapo retente le parametre si Meta l'ouvre un jour.
const parDiapo = args.includes('--par-diapo');
const MAX_LOTS = Number(opt('--max', '999'));
const TAILLE_CARROUSEL = Number(opt('--taille', '10'));
// Slugs deja publies a la main ou lors d'un essai : on ne les republie pas.
const EXCLUS = new Set((opt('--sauf', '') || '').split(',').filter(Boolean));
// Reprise apres interruption : les lots sont deterministes, on saute les N premiers.
const DEPUIS = Number(opt('--depuis', '1'));
// Publication simultanee sur la Page Facebook. --facebook publie sur les deux,
// --facebook-seul ne touche pas a Instagram (rattrapage des lots deja passes).
const versFacebook = args.includes('--facebook') || args.includes('--facebook-seul');
const facebookSeul = args.includes('--facebook-seul');
const PAGE = process.env.IG_PAGE_ID;
const PLAFOND_24H = 100;
const TAILLE_MAX = 8 * 1024 * 1024;
// Meta plafonne le nombre d'appels de l'app sur une fenetre glissante d'une
// heure. 224 photos font plus de 300 appels : sans repos entre les lots, la
// limite tombe vers le lot 38. On respire, et on rattrape les erreurs #4.
const PAUSE_LOT = Number(opt('--pause', '20')) * 1000;
const PAUSE_PHOTO = Number(opt('--pause-photo', '800'));

const HASHTAGS = '#travelphotography #landscapephotography #wallpaper #fineartprint';
// Le compte publie en anglais : les tags et les noms de lieux de la base sont
// en francais, ils sont traduits avant d'atteindre une legende.
const THEMES = {
  mer: 'Sea and ocean', montagne: 'Mountains', desert: 'Desert',
  'coucher-de-soleil': 'Sunset', tropical: 'Tropics', foret: 'Forest',
  ville: 'City', lac: 'Lakes', cascade: 'Waterfalls',
};

const PAYS_EN = {
  AU: 'Australia', BB: 'Barbados', CA: 'Canada', CZ: 'Czechia', EE: 'Estonia',
  ES: 'Spain', FR: 'France', HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia',
  LT: 'Lithuania', LV: 'Latvia', PH: 'Philippines', PT: 'Portugal',
  SI: 'Slovenia', SK: 'Slovakia', VN: 'Vietnam',
};

// Repli quand countryCode manque en base.
const PAYS_FR_EN = {
  'Australie': 'Australia', 'France': 'France', 'Indonesie': 'Indonesia',
  'Indonésie': 'Indonesia', 'Philippines': 'Philippines', 'Viêt Nam': 'Vietnam',
  'Espagne': 'Spain', 'Lettonie': 'Latvia', 'Slovénie': 'Slovenia',
  'Barbade': 'Barbados', 'Portugal': 'Portugal', 'Estonie': 'Estonia',
  'Lituanie': 'Lithuania', 'Tchéquie': 'Czechia', 'Hongrie': 'Hungary',
  'Slovaquie': 'Slovakia', 'Croatie': 'Croatia', 'Canada': 'Canada',
};

const REGIONS_EN = {
  'Australie occidentale': 'Western Australia',
  'Province de Cao Bằng': 'Cao Bằng Province',
  'Province de Lâm Đồng': 'Lâm Đồng Province',
  'Province de Ninh Bình': 'Ninh Bình Province',
  'Îles Canaries': 'Canary Islands',
  'Apskritis de Vilnius': 'Vilnius County',
  'Région de Bratislava': 'Bratislava Region',
  'Pays basque autonome': 'Basque Country',
  'Castille-La Manche': 'Castilla-La Mancha',
  'Andalousie': 'Andalusia',
  'Bretagne': 'Brittany',
  'France métropolitaine': 'Metropolitan France',
};

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Les erreurs #4 (limite de requetes) et #2 (panne temporaire) ne sont pas des
// refus : elles disent d'attendre. On attend, en doublant a chaque tentative.
const TRANSITOIRES = new Set([4, 2, 341]);

async function poste(chemin, params, essai = 0) {
  const r = await fetch(`${API}${chemin}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, access_token: TOKEN }),
  });
  const j = await r.json();
  if (j.error && TRANSITOIRES.has(j.error.code) && essai < 5) {
    const attente = 60000 * Math.pow(2, essai);
    console.log(`    limite atteinte, pause de ${Math.round(attente / 60000)} min puis reprise`);
    await dormir(attente);
    return poste(chemin, params, essai + 1);
  }
  if (!r.ok || j.error) throw new Error(`${chemin} : ${JSON.stringify(j.error ?? j).slice(0, 300)}`);
  return j;
}

async function lit(chemin, params = {}, essai = 0) {
  const u = new URL(`${API}${chemin}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) u.searchParams.set(k, v);
  const j = await (await fetch(u)).json();
  if (j.error && TRANSITOIRES.has(j.error.code) && essai < 5) {
    await dormir(60000 * Math.pow(2, essai));
    return lit(chemin, params, essai + 1);
  }
  if (j.error) throw new Error(`${chemin} : ${JSON.stringify(j.error).slice(0, 300)}`);
  return j;
}

// --- regroupement -----------------------------------------------------------

function lieu(p) {
  const pays = PAYS_EN[p.countryCode] || PAYS_FR_EN[p.country] || p.country || 'Elsewhere';
  let region = p.region && p.region !== p.country ? p.region : null;
  if (region && region in REGIONS_EN) region = REGIONS_EN[region];
  if (region && region === pays) region = null;
  return region ? `${region}, ${pays}` : pays;
}

function themeDe(p) {
  for (const t of Object.keys(THEMES)) if (p.tags.includes(t)) return t;
  return null;
}

function decouper(tab, n) {
  const out = [];
  for (let i = 0; i < tab.length; i += n) out.push(tab.slice(i, i + n));
  return out;
}

export function grouper(photos) {
  // 1. par lieu, puis par orientation : jamais de melange dans un carrousel.
  const parCle = new Map();
  for (const p of photos) {
    const cle = `${lieu(p)}||${p.orientation}`;
    if (!parCle.has(cle)) parCle.set(cle, []);
    parCle.get(cle).push(p);
  }

  const lots = [];
  for (const [cle, groupe] of parCle) {
    const [nomLieu] = cle.split('||');
    if (groupe.length <= TAILLE_CARROUSEL) {
      lots.push({ titre: nomLieu, photos: groupe });
      continue;
    }
    // 2. le lieu deborde : on le decoupe par theme avant de decouper au couteau.
    const parTheme = new Map();
    for (const p of groupe) {
      const t = themeDe(p) || '_';
      if (!parTheme.has(t)) parTheme.set(t, []);
      parTheme.get(t).push(p);
    }
    for (const [t, sous] of parTheme) {
      const nom = t === '_' ? nomLieu : `${nomLieu} · ${THEMES[t]}`;
      for (const morceau of decouper(sous, TAILLE_CARROUSEL)) lots.push({ titre: nom, photos: morceau });
    }
  }
  // les plus gros lots d'abord : ils portent le plus de photos par publication.
  return lots.sort((a, b) => b.photos.length - a.photos.length);
}

// --- legendes ---------------------------------------------------------------

const titreDe = (p) => p.titleEn || p.title || p.slug;
const descDe = (p) => (p.descriptionEn || p.description || '').replace(/\s+/g, ' ').trim();
const lienDe = (p) => `${SITE}/en/gallery/${p.slug}`;

function legendeSimple(p) {
  const bouts = [titreDe(p)];
  const d = descDe(p);
  if (d) bouts.push(d.length > 900 ? d.slice(0, 897) + '...' : d);
  const ou = lieu(p);
  if (ou && ou !== 'Ailleurs') bouts.push(`\u{1F4CD} ${ou}`);
  bouts.push(`Print and wallpaper: ${lienDe(p)}`);
  bouts.push(HASHTAGS);
  return bouts.join('\n\n');
}

function legendeDiapo(p) {
  const d = descDe(p);
  const t = titreDe(p);
  const texte = d ? `${t}. ${d}` : t;
  return texte.length > 2100 ? texte.slice(0, 2097) + '...' : texte;
}

// Legende du carrousel. Sans legende par diapositive, on numerote dans le corps.
function legendeCarrousel(lot) {
  const bouts = [`${lot.titre} · ${lot.photos.length} photographs`];
  if (!parDiapo) {
    bouts.push(lot.photos.map((p, i) => `${i + 1}. ${titreDe(p)}. ${descDe(p)}`).join('\n').slice(0, 1600));
  }
  bouts.push(`Prints and wallpapers: ${SITE}/en`);
  bouts.push(HASHTAGS);
  return bouts.join('\n\n').slice(0, 2190);
}

// --- publication ------------------------------------------------------------

async function urlDe(p) {
  if (p.originalKey) return signerOriginal(p.originalKey, 3600);
  return R2 && p.previewKey ? `${R2.replace(/\/$/, '')}/${p.previewKey}` : '';
}

async function attendre(id) {
  for (let i = 0; i < 40; i++) {
    await dormir(1500);
    const s = await lit(`/${id}`, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR') throw new Error('traitement echoue : ' + (s.status || ''));
  }
  throw new Error('conteneur pas pret apres 60 s');
}

async function publierLot(lot) {
  if (lot.photos.length === 1) {
    const p = lot.photos[0];
    const c = await poste(`/${ID}/media`, {
      image_url: await urlDe(p),
      caption: legendeSimple(p),
      alt_text: titreDe(p),
    });
    await attendre(c.id);
    const r = await poste(`/${ID}/media_publish`, { creation_id: c.id });
    return r.id;
  }

  const enfants = [];
  for (const p of lot.photos) {
    const params = {
      image_url: await urlDe(p),
      is_carousel_item: 'true',
      alt_text: titreDe(p),
    };
    if (parDiapo) params.caption = legendeDiapo(p);
    const c = await poste(`/${ID}/media`, params);
    enfants.push(c.id);
    await dormir(PAUSE_PHOTO);
  }
  for (const id of enfants) await attendre(id);

  const carrousel = await poste(`/${ID}/media`, {
    media_type: 'CAROUSEL',
    children: enfants.join(','),
    caption: legendeCarrousel(lot),
  });
  await attendre(carrousel.id);
  const r = await poste(`/${ID}/media_publish`, { creation_id: carrousel.id });
  return r.id;
}

// La Page Facebook n'impose ni ratio ni plafond de 8 Mo : l'original part tel
// quel. Les photos sont d'abord envoyees non publiees, puis rattachees a un
// unique post, ce qui donne un album au lieu de N publications separees.
async function publierLotFacebook(lot) {
  const ids = [];
  for (const p of lot.photos) {
    const r = await poste(`/${PAGE}/photos`, { url: await urlDe(p), published: 'false' });
    ids.push(r.id);
  }
  if (lot.photos.length === 1) {
    const r = await poste(`/${PAGE}/feed`, {
      message: legendeSimple(lot.photos[0]),
      attached_media: JSON.stringify([{ media_fbid: ids[0] }]),
    });
    return r.id;
  }
  const params = { message: legendeCarrousel(lot) };
  ids.forEach((id, n) => { params[`attached_media[${n}]`] = JSON.stringify({ media_fbid: id }); });
  const r = await poste(`/${PAGE}/feed`, params);
  return r.id;
}

// --- main -------------------------------------------------------------------

async function main() {
  if (publier && (!ID || !TOKEN)) {
    console.error('REFUS : IG_USER_ID et IG_ACCESS_TOKEN sont requis pour --publier.');
    process.exit(2);
  }
  if (publier && versFacebook && !PAGE) {
    console.error('REFUS : IG_PAGE_ID est requis pour publier sur la Page Facebook.');
    process.exit(2);
  }
  const prisma = new PrismaClient();
  const photos = await prisma.photo.findMany({
    where: { published: true },
    select: { slug: true, title: true, titleEn: true, description: true, descriptionEn: true,
              previewKey: true, originalKey: true, fileSize: true, orientation: true,
              country: true, countryCode: true, region: true, tags: true, takenAt: true },
    orderBy: [{ takenAt: 'desc' }],
  });
  await prisma.$disconnect();

  const trop = photos.filter((p) => p.fileSize > TAILLE_MAX);
  const retenues = photos.filter((p) => p.fileSize <= TAILLE_MAX && !EXCLUS.has(p.slug));
  const tousLots = grouper(retenues);
  const lots = tousLots.slice(DEPUIS - 1, DEPUIS - 1 + MAX_LOTS);

  console.log(`${photos.length} photos publiees, ${trop.length} ecartee(s) au-dessus de 8 Mo, ${EXCLUS.size} exclue(s) explicitement, ${retenues.length} retenues`);
  if (trop.length) console.log('  ecartees : ' + trop.map((p) => `${p.slug} (${(p.fileSize / 1048576).toFixed(1)} Mo)`).join(', '));
  if (DEPUIS > 1) console.log(`reprise au lot ${DEPUIS} sur ${tousLots.length}`);
  console.log(`${lots.length} publication(s) : ${lots.filter((l) => l.photos.length > 1).length} carrousel(s), ${lots.filter((l) => l.photos.length === 1).length} photo(s) seule(s)`);

  if (publier && !facebookSeul) {
    const q = await lit(`/${ID}/content_publishing_limit`);
    const dejaFait = q.data?.[0]?.quota_usage ?? 0;
    if (dejaFait + lots.length > PLAFOND_24H) {
      console.error(`REFUS : ${dejaFait} publication(s) sur 24 h + ${lots.length} prevues depassent le plafond de ${PLAFOND_24H}.`);
      process.exit(2);
    }
    console.log(`Quota 24 h : ${dejaFait}/${PLAFOND_24H} avant ce lot.\n`);
  } else {
    console.log('');
  }

  let ok = 0, ko = 0;
  for (const [i, lot] of lots.entries()) {
    console.log(`--- [${DEPUIS + i}/${tousLots.length}] ${lot.titre} (${lot.photos.length})`);
    console.log('    ' + lot.photos.map((p) => p.slug).join(', ').slice(0, 220));
    if (!publier) continue;
    try {
      if (!facebookSeul) {
        const id = await publierLot(lot);
        console.log(`    INSTAGRAM id=${id}`);
      }
      if (versFacebook) {
        const idFb = await publierLotFacebook(lot);
        console.log(`    FACEBOOK  id=${idFb}`);
      }
      ok++;
      await dormir(PAUSE_LOT);
    } catch (e) {
      console.error(`    ECHEC  ${e.message}`);
      ko++;
      await dormir(PAUSE_LOT);
    }
  }
  if (publier) console.log(`\n${ok} publiee(s), ${ko} en echec.`);
  else console.log('\nPlan seulement. Relance avec --publier.');
}

main().catch((e) => { console.error('erreur :', e.message); process.exit(1); });
