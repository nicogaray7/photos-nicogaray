import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// --- Content-Security-Policy ---------------------------------------------
// Enforced (Content-Security-Policy, not Report-Only).
//
// Origins allowed:
//   - self
//   - GTM / GA4 (googletagmanager, google-analytics)
//   - Stripe (js.stripe.com scripts + frames, api.stripe.com + q.stripe.com xhr)
//   - R2 public image hosts: *.r2.cloudflarestorage.com, *.r2.dev, photos.nicogaray.com
//   - R2 public URL env var origin (runtime fallback)
//   - Google avatar/thumbnail hosts used by next/image remotePatterns
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';
let r2Origin = '';
try {
  if (r2PublicUrl) r2Origin = new URL(r2PublicUrl).origin;
} catch {
  r2Origin = '';
}

const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  // Cloudflare R2 - bucket URLs (cloudflarestorage.com) and R2 public dev URLs
  'https://*.r2.cloudflarestorage.com',
  'https://*.r2.dev',
  // Custom domain fronting the R2 bucket
  'https://photos.nicogaray.com',
  // Google user content (next/image remotePatterns)
  'https://lh3.googleusercontent.com',
  'https://yt3.ggpht.com',
  'https://yt3.googleusercontent.com',
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com',
  // Pinterest Tag (pixel de conversion)
  'https://ct.pinterest.com',
  // Dynamic R2 origin from env var (may duplicate one of the above, filtered)
  r2Origin,
]
  .filter(Boolean)
  .join(' ');

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  // 'unsafe-inline' is required for the gtag bootstrap snippet and Next.js
  // inline runtime; 'unsafe-eval' is not granted.
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://s.pinimg.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  // q.stripe.com is used by Stripe.js for fraud signals / telemetry
  "connect-src 'self' https://api.stripe.com https://q.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://ct.pinterest.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      // Cloudflare R2 public dev URLs (pub-<hash>.r2.dev)
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'photos.nicogaray.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      {
        // Permanent redirect of legacy "photographie-n-X" slugs to "photo-n-X"
        source: '/:locale/gallery/photographie-n-:n',
        destination: '/:locale/gallery/photo-n-:n',
        permanent: true,
      },
      // Generic "photo-n-X" slugs renamed to descriptive ones (organic
      // campaign, 2026-08-29): keep the indexed URLs alive.
      { source: '/:locale/gallery/photo-n-1', destination: '/:locale/gallery/palmiers-et-lagon-turquoise-a-la-barbade', permanent: true },
      { source: '/:locale/gallery/photo-n-15', destination: '/:locale/gallery/cretes-volcaniques-du-cantal-sous-le-soleil-d-ete', permanent: true },
      { source: '/:locale/gallery/photo-n-17', destination: '/:locale/gallery/vue-panoramique-sur-les-volcans-du-cantal-france', permanent: true },
      { source: '/:locale/gallery/photo-n-19', destination: '/:locale/gallery/vue-aerienne-sur-le-cantal-depuis-mandailles-saint-julien', permanent: true },
      { source: '/:locale/gallery/photo-n-34', destination: '/:locale/gallery/panorama-sur-la-vieille-ville-de-riga-et-la-daugava-automne', permanent: true },
      { source: '/:locale/gallery/photo-n-58', destination: '/:locale/gallery/rochers-rouges-et-piste-sinueuse-dans-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-107', destination: '/:locale/gallery/plage-sauvage-a-la-lumiere-doree-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-115', destination: '/:locale/gallery/moutons-au-paturage-dans-les-plaines-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-144', destination: '/:locale/gallery/village-cotier-sur-pilotis-a-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-145', destination: '/:locale/gallery/embarcadere-et-village-de-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-160', destination: '/:locale/gallery/tortue-verte-de-pres-sur-un-recif-indonesie', permanent: true },
      { source: '/:locale/gallery/photo-n-182', destination: '/:locale/gallery/lever-de-soleil-rose-sur-la-vallee-brumeuse-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-6', destination: '/:locale/gallery/rochers-de-granit-rose-face-a-la-mer-en-bretagne-perros-guirec', permanent: true },
      { source: '/:locale/gallery/photo-n-71', destination: '/:locale/gallery/falaises-de-gres-rouge-et-arbres-dans-un-canyon-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-187', destination: '/:locale/gallery/vieille-ville-de-hoi-an-illuminee-la-nuit', permanent: true },
      { source: '/:locale/gallery/photo-n-211', destination: '/:locale/gallery/col-en-lacets-spectaculaires-dans-les-montagnes-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-197', destination: '/:locale/gallery/chutes-d-eau-en-cascade-province-de-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-173', destination: '/:locale/gallery/aube-rouge-et-rose-sur-la-plage-de-san-juan-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-70', destination: '/:locale/gallery/paroi-de-gres-rouge-illuminee-au-bord-d-un-point-d-eau-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-72', destination: '/:locale/gallery/vallee-et-falaises-rouges-vue-depuis-un-rebord-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-108', destination: '/:locale/gallery/coucher-de-soleil-sur-l-ocean-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-135', destination: '/:locale/gallery/plage-et-bungalows-sur-l-ile-de-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-154', destination: '/:locale/gallery/petite-ile-deserte-aux-eaux-turquoise-linapacan', permanent: true },
      { source: '/:locale/gallery/photo-n-76', destination: '/:locale/gallery/crepuscule-orange-sur-la-plaine-de-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-199', destination: '/:locale/gallery/pagode-sur-un-escalier-entre-les-collines-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-56', destination: '/:locale/gallery/route-droite-dans-l-outback-australien-sous-un-grand-ciel', permanent: true },
      { source: '/:locale/gallery/photo-n-67', destination: '/:locale/gallery/canyon-avec-vegetation-au-fond-des-parois-ocres-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-165', destination: '/:locale/gallery/aube-doree-sur-la-mer-de-siquijor-philippines', permanent: true },
      { source: '/:locale/gallery/photo-n-125', destination: '/:locale/gallery/vallee-aride-et-falaises-rouges-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-210', destination: '/:locale/gallery/route-en-lacets-dans-la-montagne-province-de-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-43', destination: '/:locale/gallery/panorama-d-automne-sur-ljubljana-depuis-le-chateau', permanent: true },
      { source: '/:locale/gallery/photo-n-60', destination: '/:locale/gallery/route-deserte-dans-l-outback-rouge-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-85', destination: '/:locale/gallery/canyon-rocheux-et-route-dans-les-collines-d-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-138', destination: '/:locale/gallery/coucher-de-soleil-depuis-la-plage-de-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-152', destination: '/:locale/gallery/cote-sauvage-vue-depuis-la-mer-linapacan', permanent: true },
      { source: '/:locale/gallery/photo-n-24', destination: '/:locale/gallery/vue-large-sur-la-vallee-depuis-le-cantal-le-claux', permanent: true },
      { source: '/:locale/gallery/photo-n-10', destination: '/:locale/gallery/rochers-de-granit-rose-sur-la-cote-bretonne-france', permanent: true },
      { source: '/:locale/gallery/photo-n-100', destination: '/:locale/gallery/coucher-de-soleil-sur-la-brousse-aride-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-159', destination: '/:locale/gallery/tortue-verte-sur-un-recif-corallien-indonesie', permanent: true },
      { source: '/:locale/gallery/photo-n-7', destination: '/:locale/gallery/mer-bleue-et-ilots-depuis-des-rochers-roses-cote-bretonne', permanent: true },
      { source: '/:locale/gallery/photo-n-213', destination: '/:locale/gallery/vallee-karstique-de-xuan-truong-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-116', destination: '/:locale/gallery/coucher-de-soleil-sur-estuaire-avec-ponton-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-193', destination: '/:locale/gallery/panorama-sur-les-ilots-de-la-baie-d-ha-long', permanent: true },
      { source: '/:locale/gallery/photo-n-36', destination: '/:locale/gallery/panorama-d-automne-sur-vilnius-depuis-une-colline', permanent: true },
      { source: '/:locale/gallery/photo-n-31', destination: '/:locale/gallery/bateaux-rabelos-sur-le-douro-porto-depuis-vila-nova-de-gaia', permanent: true },
      { source: '/:locale/gallery/photo-n-32', destination: '/:locale/gallery/vieille-ville-de-tallinn-vue-en-hauteur-automne-2024', permanent: true },
      { source: '/:locale/gallery/photo-n-38', destination: '/:locale/gallery/panorama-sur-prague-et-la-vltava-depuis-une-hauteur-automne', permanent: true },
      { source: '/:locale/gallery/photo-n-40', destination: '/:locale/gallery/coucher-de-soleil-sur-budapest-et-le-danube-depuis-un-pont', permanent: true },
      { source: '/:locale/gallery/photo-n-42', destination: '/:locale/gallery/vue-sur-le-danube-depuis-les-hauteurs-de-bratislava-automne', permanent: true },
      { source: '/:locale/gallery/photo-n-45', destination: '/:locale/gallery/coucher-de-soleil-sur-la-mer-et-marina-a-split-croatie', permanent: true },
      { source: '/:locale/gallery/photo-n-49', destination: '/:locale/gallery/falaises-ocre-au-bord-de-l-atlantique-mogan-gran-canaria', permanent: true },
      { source: '/:locale/gallery/photo-n-51', destination: '/:locale/gallery/patinoire-en-plein-air-sous-la-neige-a-toronto-hiver-2025', permanent: true },
      { source: '/:locale/gallery/photo-n-53', destination: '/:locale/gallery/cascade-dans-la-vegetation-tropicale-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-161', destination: '/:locale/gallery/gros-plan-sur-une-tortue-verte-sous-l-eau-indonesie', permanent: true },
      { source: '/:locale/gallery/photo-n-55', destination: '/:locale/gallery/gorge-rocheuse-et-riviere-verte-en-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-61', destination: '/:locale/gallery/monolithe-plat-a-l-horizon-dans-le-desert-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-73', destination: '/:locale/gallery/coucher-de-soleil-rose-et-orange-sur-la-plaine-australienne', permanent: true },
      { source: '/:locale/gallery/photo-n-75', destination: '/:locale/gallery/coucher-de-soleil-orange-sur-le-bush-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-77', destination: '/:locale/gallery/vaste-plaine-arbustive-a-l-aube-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-80', destination: '/:locale/gallery/chameaux-sauvages-dans-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-63', destination: '/:locale/gallery/route-rouge-dans-le-desert-avec-mesa-a-l-horizon-macdonnell', permanent: true },
      { source: '/:locale/gallery/photo-n-68', destination: '/:locale/gallery/oasis-de-vegetation-dans-une-gorge-rocheuse-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-82', destination: '/:locale/gallery/plage-de-sable-blanc-et-mer-turquoise-a-broome-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-89', destination: '/:locale/gallery/route-infinie-sous-le-soleil-en-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-91', destination: '/:locale/gallery/route-rectiligne-vers-l-horizon-dans-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-141', destination: '/:locale/gallery/aube-sur-la-plage-de-culion-avec-barque-et-ilots', permanent: true },
      { source: '/:locale/gallery/photo-n-101', destination: '/:locale/gallery/collines-rouges-au-lever-du-jour-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-104', destination: '/:locale/gallery/plage-de-sable-blanc-et-eau-turquoise-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-93', destination: '/:locale/gallery/gorge-boisee-entre-des-falaises-de-roche-rouge-australie-occ', permanent: true },
      { source: '/:locale/gallery/photo-n-97', destination: '/:locale/gallery/crepuscule-sur-le-bush-pilbara-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-98', destination: '/:locale/gallery/collines-rougeoyantes-au-coucher-du-soleil-pilbara', permanent: true },
      { source: '/:locale/gallery/photo-n-110', destination: '/:locale/gallery/crepuscule-sur-plage-deserte-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-120', destination: '/:locale/gallery/mer-de-nuages-au-dessus-des-collines-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-121', destination: '/:locale/gallery/gorge-brumeuse-avec-riviere-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-124', destination: '/:locale/gallery/nature-s-window-sur-la-riviere-murchison-shire-of-northampton', permanent: true },
      { source: '/:locale/gallery/photo-n-114', destination: '/:locale/gallery/baie-paisible-au-crepuscule-rose-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-126', destination: '/:locale/gallery/gorge-boisee-et-mesa-rouge-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-119', destination: '/:locale/gallery/gorge-fluviale-avec-brume-matinale-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-136', destination: '/:locale/gallery/baie-encadree-de-collines-a-culion-au-coucher-du-soleil', permanent: true },
      { source: '/:locale/gallery/photo-n-130', destination: '/:locale/gallery/bangkas-devant-les-iles-calcaires-de-coron-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-132', destination: '/:locale/gallery/ile-boisee-et-eaux-turquoise-coron-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-134', destination: '/:locale/gallery/cote-montagneuse-par-temps-nuageux-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-142', destination: '/:locale/gallery/soleil-levant-derriere-les-iles-de-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-133', destination: '/:locale/gallery/ile-tropicale-et-plage-de-sable-blanc-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-74', destination: '/:locale/gallery/panorama-sur-la-plaine-aride-avec-arbustes-dores-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-156', destination: '/:locale/gallery/ile-boisee-au-profil-conique-linapacan', permanent: true },
      { source: '/:locale/gallery/photo-n-158', destination: '/:locale/gallery/plage-sauvage-vue-depuis-la-mer-el-nido', permanent: true },
      { source: '/:locale/gallery/photo-n-164', destination: '/:locale/gallery/coucher-de-soleil-sur-la-mer-depuis-larena-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-148', destination: '/:locale/gallery/bangka-et-plage-sauvage-a-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-149', destination: '/:locale/gallery/ile-verdoyante-et-eaux-turquoise-a-linapacan', permanent: true },
      { source: '/:locale/gallery/photo-n-29', destination: '/:locale/gallery/panorama-depuis-les-cretes-du-massif-du-cantal-le-falgoux', permanent: true },
      { source: '/:locale/gallery/photo-n-96', destination: '/:locale/gallery/brousse-rouge-et-monts-de-la-pilbara-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-212', destination: '/:locale/gallery/coucher-de-soleil-dans-un-col-de-montagne-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-105', destination: '/:locale/gallery/longue-plage-deserte-au-coucher-de-soleil-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-127', destination: '/:locale/gallery/riviere-serpentant-dans-une-gorge-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-155', destination: '/:locale/gallery/ile-et-bangkas-ancres-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-146', destination: '/:locale/gallery/village-de-pecheurs-sur-l-ile-de-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-3', destination: '/:locale/gallery/versants-montagneux-fleuris-en-corse-mai-2022', permanent: true },
      { source: '/:locale/gallery/photo-n-14', destination: '/:locale/gallery/vallee-verdoyante-vue-depuis-les-hauteurs-du-cantal', permanent: true },
      { source: '/:locale/gallery/photo-n-112', destination: '/:locale/gallery/baie-calme-au-crepuscule-avec-jetee-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-194', destination: '/:locale/gallery/route-droite-entre-les-karsts-province-de-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-78', destination: '/:locale/gallery/coucher-de-soleil-flamboyant-sur-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-168', destination: '/:locale/gallery/lever-de-soleil-sur-la-mer-a-san-juan-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-4', destination: '/:locale/gallery/cairn-au-sommet-d-un-mont-en-corse-printemps-2022', permanent: true },
      { source: '/:locale/gallery/photo-n-30', destination: '/:locale/gallery/vaches-en-prairie-face-aux-volcans-du-cantal-ete-2024', permanent: true },
      { source: '/:locale/gallery/photo-n-122', destination: '/:locale/gallery/gorge-et-riviere-dans-la-brume-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-35', destination: '/:locale/gallery/toits-de-riga-et-tour-de-television-depuis-les-hauteurs-automne', permanent: true },
      { source: '/:locale/gallery/photo-n-113', destination: '/:locale/gallery/coucher-de-soleil-sur-baie-rocheuse-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-33', destination: '/:locale/gallery/parc-au-bord-de-l-eau-en-automne-valka-lettonie', permanent: true },
      { source: '/:locale/gallery/photo-n-54', destination: '/:locale/gallery/riviere-sinueuse-et-foret-tropicale-en-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-46', destination: '/:locale/gallery/ile-et-baie-de-saint-sebastien-depuis-les-hauteurs-pays-basque', permanent: true },
      { source: '/:locale/gallery/photo-n-39', destination: '/:locale/gallery/sculpture-en-bronze-sur-rocher-budapest', permanent: true },
      { source: '/:locale/gallery/photo-n-57', destination: '/:locale/gallery/rochers-rouges-et-route-dans-le-desert-macdonnell-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-69', destination: '/:locale/gallery/reflet-d-un-arbre-dans-l-eau-d-une-gorge-parois-rouges-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-103', destination: '/:locale/gallery/coucher-de-soleil-sur-la-baie-cotiere-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-59', destination: '/:locale/gallery/route-rectiligne-dans-le-bush-australien-sous-ciel-bleu', permanent: true },
      { source: '/:locale/gallery/photo-n-79', destination: '/:locale/gallery/coucher-de-soleil-dore-sur-une-ville-en-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-5', destination: '/:locale/gallery/panorama-sur-les-monts-du-cantal-depuis-saint-jacques-des-blats', permanent: true },
      { source: '/:locale/gallery/photo-n-11', destination: '/:locale/gallery/vue-sur-le-fleuve-et-la-plaine-depuis-tolede-espagne', permanent: true },
      { source: '/:locale/gallery/photo-n-117', destination: '/:locale/gallery/coucher-de-soleil-sur-plage-avec-ciel-nuageux-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-50', destination: '/:locale/gallery/l-alhambra-au-coucher-du-soleil-depuis-les-hauteurs-de-grenade', permanent: true },
      { source: '/:locale/gallery/photo-n-20', destination: '/:locale/gallery/sentier-vers-un-sommet-conique-cantal', permanent: true },
      { source: '/:locale/gallery/photo-n-106', destination: '/:locale/gallery/plage-de-sable-blanc-au-coucher-du-soleil-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-128', destination: '/:locale/gallery/riviere-murchison-vue-depuis-les-hauteurs-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-37', destination: '/:locale/gallery/tour-medievale-en-briques-rouges-sur-une-colline-vilnius', permanent: true },
      { source: '/:locale/gallery/photo-n-13', destination: '/:locale/gallery/panorama-sur-les-monts-du-cantal-depuis-les-cretes', permanent: true },
      { source: '/:locale/gallery/photo-n-118', destination: '/:locale/gallery/coucher-de-soleil-spectaculaire-sur-plage-rocheuse-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-44', destination: '/:locale/gallery/quais-et-riviere-de-ljubljana-en-soiree-slovenie', permanent: true },
      { source: '/:locale/gallery/photo-n-47', destination: '/:locale/gallery/gorges-et-terrasses-agricoles-a-vega-de-san-mateo-gran-canaria', permanent: true },
      { source: '/:locale/gallery/photo-n-62', destination: '/:locale/gallery/mont-plat-dans-la-plaine-aride-vue-a-travers-les-arbustes', permanent: true },
      { source: '/:locale/gallery/photo-n-8', destination: '/:locale/gallery/chaos-de-rochers-de-granit-rose-et-mer-en-bretagne', permanent: true },
      { source: '/:locale/gallery/photo-n-25', destination: '/:locale/gallery/panorama-sur-les-sommets-verdoyants-le-falgoux', permanent: true },
      { source: '/:locale/gallery/photo-n-26', destination: '/:locale/gallery/massif-volcanique-et-landes-le-falgoux-cantal', permanent: true },
      { source: '/:locale/gallery/photo-n-64', destination: '/:locale/gallery/grand-rocher-rouge-au-coucher-du-soleil-dans-le-desert-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-9', destination: '/:locale/gallery/rochers-de-granit-rose-et-phare-au-loin-cote-bretonne', permanent: true },
      { source: '/:locale/gallery/photo-n-202', destination: '/:locale/gallery/route-de-montagne-dans-la-foret-dense-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-109', destination: '/:locale/gallery/soleil-couchant-sur-mer-agitee-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-41', destination: '/:locale/gallery/clocher-de-cathedrale-gothique-sur-les-toits-de-bratislava', permanent: true },
      { source: '/:locale/gallery/photo-n-65', destination: '/:locale/gallery/passage-entre-deux-parois-de-gres-rouge-en-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-162', destination: '/:locale/gallery/canyon-rocheux-avec-riviere-turquoise-cebu', permanent: true },
      { source: '/:locale/gallery/photo-n-28', destination: '/:locale/gallery/vue-depuis-les-hauteurs-sur-le-cantal-le-falgoux', permanent: true },
      { source: '/:locale/gallery/photo-n-16', destination: '/:locale/gallery/cretes-herbeuses-du-cantal-a-perte-de-vue', permanent: true },
      { source: '/:locale/gallery/photo-n-48', destination: '/:locale/gallery/ravine-et-ruine-isolee-dans-la-campagne-de-gran-canaria', permanent: true },
      { source: '/:locale/gallery/photo-n-52', destination: '/:locale/gallery/chutes-du-niagara-en-hiver-sous-la-neige-ontario', permanent: true },
      { source: '/:locale/gallery/photo-n-66', destination: '/:locale/gallery/falaise-de-gres-rouge-et-canyon-verdoyant-en-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-151', destination: '/:locale/gallery/plage-de-sable-blanc-et-bateau-linapacan', permanent: true },
      { source: '/:locale/gallery/photo-n-137', destination: '/:locale/gallery/lever-de-soleil-sur-la-baie-de-culion-avec-barques', permanent: true },
      { source: '/:locale/gallery/photo-n-166', destination: '/:locale/gallery/coucher-de-soleil-pastel-sur-la-mer-de-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-102', destination: '/:locale/gallery/route-deserte-et-mesa-rouge-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-12', destination: '/:locale/gallery/sentier-rocailleux-en-altitude-dans-le-cantal-france', permanent: true },
      { source: '/:locale/gallery/photo-n-111', destination: '/:locale/gallery/soleil-au-ras-de-l-horizon-sur-l-ocean-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-123', destination: '/:locale/gallery/roches-rouges-en-surplomb-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-81', destination: '/:locale/gallery/paysage-de-rocaille-rouge-et-vegetation-clairsemee-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-83', destination: '/:locale/gallery/vue-sur-la-mer-turquoise-depuis-les-dunes-broome-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-84', destination: '/:locale/gallery/collines-de-laterite-rouge-et-gorge-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-87', destination: '/:locale/gallery/gorge-et-collines-rouges-dans-l-outback-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-88', destination: '/:locale/gallery/canyon-et-route-dans-un-paysage-de-roche-rouge-australie-occ', permanent: true },
      { source: '/:locale/gallery/photo-n-90', destination: '/:locale/gallery/arbustes-secs-et-montagne-rouge-dans-l-outback-australien', permanent: true },
      { source: '/:locale/gallery/photo-n-92', destination: '/:locale/gallery/plaine-rouge-et-collines-tabulaires-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-94', destination: '/:locale/gallery/mont-plat-et-sol-rouge-au-lever-du-jour-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-95', destination: '/:locale/gallery/route-et-massif-montagneux-au-lever-du-soleil-australie-occ', permanent: true },
      { source: '/:locale/gallery/photo-n-178', destination: '/:locale/gallery/ciel-embrase-et-volcan-a-l-horizon-indonesie', permanent: true },
      { source: '/:locale/gallery/photo-n-99', destination: '/:locale/gallery/collines-de-fer-rouge-au-crepuscule-pilbara', permanent: true },
      { source: '/:locale/gallery/photo-n-147', destination: '/:locale/gallery/iles-et-rochers-boises-a-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-131', destination: '/:locale/gallery/petite-ile-tropicale-entouree-de-lagon-turquoise-coron', permanent: true },
      { source: '/:locale/gallery/photo-n-157', destination: '/:locale/gallery/baie-encaissee-et-plage-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-139', destination: '/:locale/gallery/ile-boisee-et-bangka-au-crepuscule-culion', permanent: true },
      { source: '/:locale/gallery/photo-n-150', destination: '/:locale/gallery/baie-encaissee-entre-collines-a-linapacan-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-140', destination: '/:locale/gallery/coucher-de-soleil-dore-sur-la-mer-a-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-153', destination: '/:locale/gallery/archipel-de-linapacan-depuis-la-mer-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-129', destination: '/:locale/gallery/bangka-en-mer-et-montagnes-calcaires-coron-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-143', destination: '/:locale/gallery/plage-deserte-et-bangkas-a-culion-palawan', permanent: true },
      { source: '/:locale/gallery/photo-n-2', destination: '/:locale/gallery/lac-turquoise-en-carriere-a-les-baux-de-provence', permanent: true },
      { source: '/:locale/gallery/photo-n-170', destination: '/:locale/gallery/coucher-de-soleil-dore-sur-la-mer-depuis-san-juan', permanent: true },
      { source: '/:locale/gallery/photo-n-172', destination: '/:locale/gallery/lever-de-soleil-sur-la-mer-de-san-juan-ciel-embrase', permanent: true },
      { source: '/:locale/gallery/photo-n-174', destination: '/:locale/gallery/coucher-de-soleil-hivernal-sur-la-mer-de-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-176', destination: '/:locale/gallery/surfeurs-dans-les-vagues-au-coucher-de-soleil-bali', permanent: true },
      { source: '/:locale/gallery/photo-n-180', destination: '/:locale/gallery/port-de-peche-traditionnel-au-viet-nam-province-de-lam-dong', permanent: true },
      { source: '/:locale/gallery/photo-n-186', destination: '/:locale/gallery/riviere-thu-bon-au-coucher-de-soleil-hoi-an', permanent: true },
      { source: '/:locale/gallery/photo-n-188', destination: '/:locale/gallery/singe-dans-un-arbre-peninsule-de-son-tra-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-190', destination: '/:locale/gallery/vallee-karstique-et-riviere-vue-du-sommet-ninh-binh', permanent: true },
      { source: '/:locale/gallery/photo-n-192', destination: '/:locale/gallery/ilots-karstiques-sur-la-baie-d-ha-long-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-195', destination: '/:locale/gallery/lac-vert-encercle-de-falaises-karstiques-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-206', destination: '/:locale/gallery/paysage-de-vallee-et-karsts-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-18', destination: '/:locale/gallery/vue-aerienne-sur-la-vallee-du-cantal-en-ete', permanent: true },
      { source: '/:locale/gallery/photo-n-207', destination: '/:locale/gallery/vallee-avec-terrasses-et-karsts-luxuriants-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-22', destination: '/:locale/gallery/sommet-pyramidal-et-landes-mandailles-saint-julien', permanent: true },
      { source: '/:locale/gallery/photo-n-204', destination: '/:locale/gallery/vallee-cultivee-entre-les-rochers-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-23', destination: '/:locale/gallery/paysage-volcanique-vert-cantal-france', permanent: true },
      { source: '/:locale/gallery/photo-n-27', destination: '/:locale/gallery/sommets-du-cantal-depuis-le-falgoux', permanent: true },
      { source: '/:locale/gallery/photo-n-175', destination: '/:locale/gallery/coucher-de-soleil-depuis-la-riviere-a-perth-australie', permanent: true },
      { source: '/:locale/gallery/photo-n-163', destination: '/:locale/gallery/cascade-turquoise-dans-la-jungle-de-cebu', permanent: true },
      { source: '/:locale/gallery/photo-n-179', destination: '/:locale/gallery/port-de-peche-avec-centaines-de-bateaux-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-208', destination: '/:locale/gallery/route-plane-entre-les-falaises-karstiques-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-209', destination: '/:locale/gallery/route-deserte-entre-falaises-karstiques-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-21', destination: '/:locale/gallery/vue-sur-la-vallee-de-mandailles-depuis-le-cantal', permanent: true },
      { source: '/:locale/gallery/photo-n-184', destination: '/:locale/gallery/rizieres-en-terrasses-dans-la-vallee-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-189', destination: '/:locale/gallery/etang-de-lotus-et-falaises-karstiques-ninh-binh', permanent: true },
      { source: '/:locale/gallery/photo-n-201', destination: '/:locale/gallery/vallee-terrassee-et-route-sinueuse-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-198', destination: '/:locale/gallery/vue-sur-les-chutes-d-eau-et-la-vallee-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-196', destination: '/:locale/gallery/piton-karstique-perce-d-une-arche-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-191', destination: '/:locale/gallery/drapeau-vietnamien-sur-une-falaise-karstique-ninh-binh', permanent: true },
      { source: '/:locale/gallery/photo-n-205', destination: '/:locale/gallery/vallee-aux-terrasses-et-karsts-denses-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-185', destination: '/:locale/gallery/rizieres-vertes-et-collines-arides-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-86', destination: '/:locale/gallery/collines-et-vallee-de-laterite-rouge-australie-occidentale', permanent: true },
      { source: '/:locale/gallery/photo-n-167', destination: '/:locale/gallery/barques-colorees-sur-la-plage-a-maree-basse-san-juan', permanent: true },
      { source: '/:locale/gallery/photo-n-183', destination: '/:locale/gallery/aube-dans-la-vallee-brumeuse-province-de-lam-dong', permanent: true },
      { source: '/:locale/gallery/photo-n-203', destination: '/:locale/gallery/riviere-et-cultures-entre-les-karsts-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-200', destination: '/:locale/gallery/plaine-agricole-et-karsts-province-de-cao-bang', permanent: true },
      { source: '/:locale/gallery/photo-n-181', destination: '/:locale/gallery/coucher-de-soleil-sur-la-baie-aux-bateaux-viet-nam', permanent: true },
      { source: '/:locale/gallery/photo-n-169', destination: '/:locale/gallery/aube-flamboyante-sur-la-mer-de-san-juan-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-171', destination: '/:locale/gallery/crepuscule-orange-sur-la-plage-de-san-juan-siquijor', permanent: true },
      { source: '/:locale/gallery/photo-n-177', destination: '/:locale/gallery/coucher-de-soleil-sur-une-baie-avec-volcan-indonesie', permanent: true },
      // Branded Pinterest link with UTM tags for GA4 attribution.
      {
        source: '/pin',
        destination: '/?utm_source=pinterest&utm_medium=social&utm_campaign=bio',
        permanent: false,
      },
      // Branded Instagram links with UTM tags for GA4 attribution.
      // Bio link → /ig (one link per profile, the main one)
      {
        source: '/ig',
        destination: '/?utm_source=instagram&utm_medium=social&utm_campaign=bio',
        permanent: false,
      },
      // Story link sticker → /ig/story
      {
        source: '/ig/story',
        destination: '/?utm_source=instagram&utm_medium=social&utm_campaign=story',
        permanent: false,
      },
      // Generic post / feed link with optional named campaign suffix
      {
        source: '/ig/post/:campaign',
        destination:
          '/?utm_source=instagram&utm_medium=social&utm_campaign=:campaign',
        permanent: false,
      },
      // Direct deep-link to a specific photo (use full slug)
      {
        source: '/ig/photo/:slug',
        destination:
          '/fr/gallery/:slug?utm_source=instagram&utm_medium=social&utm_campaign=photo_link',
        permanent: false,
      },
      // Gallery shortcut
      {
        source: '/ig/gallery',
        destination:
          '/fr/gallery?utm_source=instagram&utm_medium=social&utm_campaign=gallery_link',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Enforced CSP. To temporarily revert to report-only for debugging,
          // set CSP_REPORT_ONLY=true in the environment.
          {
            key:
              process.env.CSP_REPORT_ONLY === 'true'
                ? 'Content-Security-Policy-Report-Only'
                : 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
