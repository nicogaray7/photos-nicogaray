# photos-nicogaray

Ce dépôt sert le site photos : https://photos.nicogaray.com

- **Application** : Next.js (`package.json` : `photos-nicogaray`), Prisma sur PostgreSQL,
  images sur Cloudflare R2, paiement Stripe, bilingue FR/EN.
- **Déploiement** : `/home/claudebot/photos-redeploy.sh`, qui synchronise ce dossier vers
  `/opt/nico-garay`, préserve le `.env`, reconstruit l'image et redémarre le conteneur
  `nico-garay-app-1` derrière Traefik. Il tague `nico-garay-app:rollback-sec` avant de
  reconstruire, donc un retour arrière reste possible.
  L'ancien `prod-deploy.sh` servait à la migration depuis `/root` : ne plus l'utiliser.
  Passer par `build-guard` : la machine a 2 vCPU partagés avec la stack média.
- **Google Analytics** : propriété "Photos Nico Garay", identifiant de mesure `G-TF7WRXVYLC`.
- **Pinterest** : le SEUL flux est `/rss.xml` (226 photos), branché en auto-publication vers
  le tableau Travel Photography du compte `garaynicong`. `/pinterest-feed.xml` redirige en 308
  vers lui. Ne jamais recréer un second flux : Pinterest publierait chaque épingle deux fois.
- **Slugs** : renommer un slug casse une URL indexée. Toute renommage exige sa redirection
  permanente dans `next.config.mjs`, comme les 216 déjà en place.
- **Dépôt GitHub** : `nicogaray7/photos-nicogaray`.
