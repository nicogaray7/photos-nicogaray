import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { HeroCtaLink } from '@/components/analytics/HeroCtaLink';

// ---------------------------------------------------------------------------
// Guide definitions (hardcoded - no DB required)
// ---------------------------------------------------------------------------

type GuideSlug = 'fond-decran-iphone' | 'fond-decran-android';

interface Step {
  headingFr: string;
  headingEn: string;
  fr: string;
  en: string;
}

interface FaqItem {
  qFr: string;
  aFr: string;
  qEn: string;
  aEn: string;
}

interface GuideDef {
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  ledeFr: string;
  ledeEn: string;
  introFr: string;
  introEn: string;
  steps: Step[];
  tipFr: string;
  tipEn: string;
  outroFr: string;
  outroEn: string;
  faq: FaqItem[];
  ctaLabelFr: string;
  ctaLabelEn: string;
}

const GUIDES: Record<GuideSlug, GuideDef> = {
  'fond-decran-iphone': {
    titleFr: "Comment mettre une photo en fond d'écran sur iPhone",
    titleEn: 'How to set a photo as wallpaper on iPhone',
    descriptionFr:
      "Comment mettre une photo en fond d'écran sur iPhone, étape par étape : téléchargement, réglages, écran verrouillé et écran d'accueil, astuces et FAQ.",
    descriptionEn:
      'How to set a photo as wallpaper on iPhone, step by step: download, settings, lock screen and home screen, tips and FAQ.',
    ledeFr: "Une fois la photo téléchargée, l'installer prend moins d'une minute.",
    ledeEn: 'Once the photo is downloaded, setting it up takes less than a minute.',
    introFr:
      "Après l'achat d'une photo sur ce site, l'installer en fond d'écran sur iPhone ne prend qu'une poignée de secondes. iOS distingue l'écran verrouillé et l'écran d'accueil, et propose d'ajuster le cadrage avant de valider. Voici la marche à suivre en détail, valable sur toutes les versions récentes d'iOS.",
    introEn:
      "After buying a photo on this site, setting it as your iPhone wallpaper takes only a few seconds. iOS lets you set the lock screen and the home screen separately, and offers to adjust the crop before confirming. Here is the detailed process, valid on all recent versions of iOS.",
    steps: [
      {
        headingFr: 'Téléchargez la photo achetée',
        headingEn: 'Download the purchased photo',
        fr: "Après votre achat, vous recevez un e-mail avec un lien de téléchargement en haute résolution. Ouvrez ce lien depuis votre iPhone (Safari ou l'application Mail) : le fichier s'enregistre automatiquement dans l'application Photos, dans l'album Récents. S'il atterrit dans un dossier « Téléchargements » plutôt que dans Photos, appuyez sur l'icône de partage puis sur « Enregistrer l'image » pour le faire basculer dans votre pellicule.",
        en: 'After your purchase, you receive an email with a high-resolution download link. Open it on your iPhone (Safari or the Mail app): the file is saved automatically to the Photos app, in the Recents album. If it lands in a "Downloads" folder instead of Photos, tap the share icon then "Save Image" to move it into your camera roll.',
      },
      {
        headingFr: "Ouvrez les réglages de fond d'écran",
        headingEn: 'Open the wallpaper settings',
        fr: "Depuis l'écran d'accueil, ouvrez l'application Réglages, puis descendez jusqu'à Fond d'écran. Cet écran affiche vos fonds d'écran actuels pour l'écran verrouillé et l'écran d'accueil, ainsi qu'un bouton pour en ajouter un nouveau.",
        en: "From the home screen, open the Settings app, then scroll down to Wallpaper. This screen shows your current lock screen and home screen wallpapers, along with a button to add a new one.",
      },
      {
        headingFr: 'Sélectionnez la photo dans votre pellicule',
        headingEn: 'Select the photo from your camera roll',
        fr: "Appuyez sur Ajouter un nouveau fond d'écran. iOS propose plusieurs sources : choisissez Photos, puis retrouvez l'image téléchargée, généralement tout en haut de la pellicule puisqu'elle vient d'être ajoutée.",
        en: 'Tap Add New Wallpaper. iOS offers several sources: choose Photos, then find the downloaded image, usually right at the top of your camera roll since it was just added.',
      },
      {
        headingFr: 'Ajustez le cadrage et appliquez',
        headingEn: 'Adjust the crop and apply',
        fr: "Une fois la photo sélectionnée, déplacez-la et zoomez du bout du doigt pour choisir le cadrage exact. Appuyez ensuite sur Ajouter : iOS demande alors si vous voulez l'appliquer à l'écran verrouillé, à l'écran d'accueil, ou aux deux, avec un aperçu avant validation finale.",
        en: 'Once the photo is selected, drag and pinch to choose the exact crop. Then tap Add: iOS asks whether to apply it to the lock screen, the home screen, or both, with a preview before final confirmation.',
      },
    ],
    tipFr:
      "Astuce : pour un rendu net, choisissez toujours un fichier en format vertical (portrait), c'est le cas de toutes les photos de ce site.",
    tipEn:
      'Tip: for a crisp result, always pick a vertical (portrait) file, all photos on this site are already in that format.',
    outroFr:
      "Le fond d'écran peut être changé aussi souvent que vous le voulez : la procédure ci-dessus reste identique à chaque fois, qu'il s'agisse d'une photo de mer, de montagne ou d'un coucher de soleil dans le désert. Beaucoup de propriétaires d'iPhone se contentent d'une image trouvée en ligne en basse qualité, ce qui donne un rendu flou dès qu'on zoome ou qu'on active l'écran verrouillé always-on. Une photo achetée en haute résolution évite ce problème et reste nette sur tous les modèles récents, du iPhone SE au Pro Max.",
    outroEn:
      "You can change the wallpaper as often as you like: the process above stays the same every time, whether it is a sea photo, a mountain view, or a desert sunset. Many iPhone owners settle for a low-quality image found online, which looks blurry as soon as you zoom in or enable the always-on lock screen. A high-resolution purchased photo avoids that problem and stays sharp on every recent model, from the iPhone SE to the Pro Max.",
    faq: [
      {
        qFr: 'Pourquoi ma photo apparaît-elle floue ou pixelisée en fond d\'écran ?',
        aFr: "Vérifiez que vous avez bien téléchargé la version haute résolution reçue par e-mail, et non une capture d'écran ou un aperçu compressé. Toutes les photos de ce site sont livrées en format vertical haute définition, adaptées à l'écran d'un iPhone.",
        qEn: 'Why does my photo look blurry or pixelated as wallpaper?',
        aEn: 'Make sure you downloaded the high-resolution file from the email, not a screenshot or a compressed preview. Every photo on this site is delivered in high-definition vertical format, sized for an iPhone screen.',
      },
      {
        qFr: "Puis-je avoir un fond d'écran différent sur l'écran verrouillé et l'écran d'accueil ?",
        aFr: 'Oui. Quand iOS propose d\'appliquer la photo, choisissez « Personnaliser l\'écran verrouillé » ou « Personnaliser l\'écran d\'accueil » séparément plutôt que « Les deux ».',
        qEn: 'Can I use a different wallpaper for the lock screen and the home screen?',
        aEn: 'Yes. When iOS offers to apply the photo, choose "Customize Lock Screen" or "Customize Home Screen" separately instead of "Both".',
      },
      {
        qFr: 'Le fond d\'écran ne se met pas à jour, que faire ?',
        aFr: "Fermez complètement l'application Réglages (balayage vers le haut depuis le bas de l'écran, puis vers le haut sur l'aperçu) et rouvrez-la. Si le problème persiste, redémarrez l'iPhone.",
        qEn: "The wallpaper isn't updating, what should I do?",
        aEn: 'Fully close the Settings app (swipe up from the bottom, then swipe up on the app preview) and reopen it. If the issue persists, restart the iPhone.',
      },
      {
        qFr: 'Est-ce que ça fonctionne sur toutes les versions d\'iOS ?',
        aFr: "Oui, le principe est identique depuis iOS 16. Sur les versions antérieures, l'option de personnalisation séparée de l'écran verrouillé n'existe pas : la photo s'applique alors aux deux écrans en même temps.",
        qEn: 'Does this work on every version of iOS?',
        aEn: 'Yes, the process has been the same since iOS 16. On older versions, the separate lock screen customization option does not exist: the photo is then applied to both screens at once.',
      },
    ],
    ctaLabelFr: 'Voir tous les fonds d\'écran',
    ctaLabelEn: 'Browse all wallpapers',
  },

  'fond-decran-android': {
    titleFr: "Comment mettre une photo en fond d'écran sur Android",
    titleEn: 'How to set a photo as wallpaper on Android',
    descriptionFr:
      "Comment mettre une photo en fond d'écran sur Android, étape par étape : téléchargement, application Galerie, écran verrouillé et écran d'accueil, astuces et FAQ.",
    descriptionEn:
      'How to set a photo as wallpaper on Android, step by step: download, Gallery app, lock screen and home screen, tips and FAQ.',
    ledeFr: 'La marche à suivre est presque identique sur tous les téléphones Android.',
    ledeEn: 'The steps are nearly identical across Android phones.',
    introFr:
      "Après l'achat d'une photo sur ce site, l'installer en fond d'écran sur Android se fait en quelques appuis, directement depuis l'application Galerie ou Photos. Les libellés exacts des menus varient légèrement selon le fabricant (Samsung, Pixel, Xiaomi...), mais le principe reste le même sur tous les téléphones récents.",
    introEn:
      "After buying a photo on this site, setting it as your Android wallpaper takes just a few taps, directly from the Gallery or Photos app. Menu wording varies slightly by manufacturer (Samsung, Pixel, Xiaomi...), but the process is the same on every recent phone.",
    steps: [
      {
        headingFr: 'Téléchargez la photo achetée',
        headingEn: 'Download the purchased photo',
        fr: "Après votre achat, vous recevez un e-mail avec un lien de téléchargement en haute résolution. Ouvrez ce lien depuis votre téléphone : le fichier se télécharge et s'enregistre automatiquement dans votre galerie photo, en général dans un dossier « Téléchargements » ou « Download ».",
        en: 'After your purchase, you receive an email with a high-resolution download link. Open it on your phone: the file downloads and is saved automatically to your photo gallery, usually in a "Downloads" folder.',
      },
      {
        headingFr: 'Ouvrez la photo dans votre application Galerie',
        headingEn: 'Open the photo in your Gallery app',
        fr: "Lancez l'application Galerie, Photos ou l'équivalent installé sur votre téléphone (selon la marque : Galerie Samsung, Google Photos, Galerie Xiaomi...), puis ouvrez l'image tout juste téléchargée en plein écran.",
        en: 'Open the Gallery, Photos, or equivalent app on your phone (Samsung Gallery, Google Photos, Xiaomi Gallery, etc.), then open the freshly downloaded image in full screen.',
      },
      {
        headingFr: "Choisissez « Définir comme fond d'écran »",
        headingEn: 'Choose "Set as wallpaper"',
        fr: "Appuyez sur le menu (icône ⋮ ou Partager) en haut ou en bas de l'écran, puis sur Définir comme fond d'écran (ou « Utiliser comme »). Sur certains modèles, l'option se trouve directement dans un bouton dédié sous la photo.",
        en: 'Tap the menu (⋮ icon or Share) at the top or bottom of the screen, then Set as wallpaper (or "Use as"). On some models the option sits directly in a dedicated button below the photo.',
      },
      {
        headingFr: 'Ajustez le cadrage et confirmez',
        headingEn: 'Adjust the crop and confirm',
        fr: "Choisissez écran verrouillé, écran d'accueil, ou les deux, ajustez le cadrage avec les doigts pour bien centrer l'image, puis validez. Le nouveau fond d'écran s'applique immédiatement.",
        en: 'Choose lock screen, home screen, or both, adjust the crop with your fingers to center the image, then confirm. The new wallpaper applies immediately.',
      },
    ],
    tipFr:
      "Astuce : sur certains téléphones (Samsung, Pixel), le raccourci se trouve aussi dans Réglages > Fond d'écran et style.",
    tipEn:
      'Tip: on some phones (Samsung, Pixel), the shortcut is also in Settings > Wallpaper and style.',
    outroFr:
      "Vous pouvez répéter cette manipulation autant de fois que vous le souhaitez : la procédure reste identique, que la photo vienne d'être achetée ou qu'elle date de plusieurs mois dans votre galerie. Sur Android, la principale source de déception vient d'une image trop petite, étirée ou compressée par une messagerie, ce qui donne un rendu pixelisé une fois affichée en plein écran. Une photo achetée en haute résolution et déjà cadrée en vertical évite ce défaut, quel que soit le fabricant de votre téléphone.",
    outroEn:
      "You can repeat this process as many times as you like: it stays the same whether the photo was just purchased or has been sitting in your gallery for months. On Android, the main source of disappointment is an image that is too small, stretched, or compressed by a messaging app, which looks pixelated once displayed full screen. A high-resolution purchased photo, already cropped for portrait screens, avoids that issue regardless of your phone's manufacturer.",
    faq: [
      {
        qFr: 'Je ne trouve pas l\'option « Définir comme fond d\'écran », où chercher ?',
        aFr: "Si elle n'apparaît pas dans le menu de partage de la photo, essayez Réglages > Fond d'écran et style (ou « Écran verrouillé »), puis choisissez une photo depuis la galerie à cet endroit.",
        qEn: 'I can\'t find "Set as wallpaper", where should I look?',
        aEn: 'If it does not appear in the photo\'s share menu, try Settings > Wallpaper and style (or "Lock screen"), then pick a photo from the gallery there instead.',
      },
      {
        qFr: 'Pourquoi ma photo est-elle recadrée différemment de ce que j\'ai choisi ?',
        aFr: "Certains lanceurs (l'interface d'accueil du téléphone) recadrent automatiquement l'écran d'accueil différemment de l'écran verrouillé. Réglez chaque écran séparément si l'option est proposée à l'étape de confirmation.",
        qEn: 'Why is my photo cropped differently than what I chose?',
        aEn: 'Some launchers (the phone\'s home screen interface) crop the home screen automatically, differently from the lock screen. Set each screen separately if that option is offered at the confirmation step.',
      },
      {
        qFr: 'Le fichier téléchargé est-il assez grand pour un écran haute résolution ?',
        aFr: "Oui, toutes les photos de ce site sont livrées en haute résolution et en format vertical (portrait), adaptées à la quasi-totalité des écrans Android actuels, y compris les modèles à forte densité de pixels.",
        qEn: 'Is the downloaded file large enough for a high-resolution screen?',
        aEn: 'Yes, every photo on this site is delivered in high resolution and vertical (portrait) format, suited to virtually all current Android screens, including high pixel-density models.',
      },
      {
        qFr: 'Puis-je utiliser la photo comme fond d\'écran animé ?',
        aFr: "Non, il s'agit d'une image fixe. Certains téléphones proposent un léger effet de parallaxe automatique sur l'écran d'accueil, mais cela dépend du modèle et ne nécessite aucune manipulation supplémentaire.",
        qEn: 'Can I use the photo as a live/animated wallpaper?',
        aEn: 'No, it is a static image. Some phones apply a subtle automatic parallax effect on the home screen, but that depends on the model and requires no extra steps.',
      },
    ],
    ctaLabelFr: 'Voir tous les fonds d\'écran',
    ctaLabelEn: 'Browse all wallpapers',
  },
};

const ALL_SLUGS = Object.keys(GUIDES) as GuideSlug[];

function getGuide(slug: string): GuideDef | null {
  return GUIDES[slug as GuideSlug] ?? null;
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const locales = ['fr', 'en'];
  return ALL_SLUGS.flatMap((slug) => locales.map((locale) => ({ locale, slug })));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const guide = getGuide(params.slug);
  if (!guide) return {};
  const isEn = params.locale === 'en';
  return {
    title: isEn ? guide.titleEn : guide.titleFr,
    description: isEn ? guide.descriptionEn : guide.descriptionFr,
    alternates: {
      canonical: `/${params.locale}/guide/${params.slug}`,
      languages: {
        fr: `/fr/guide/${params.slug}`,
        en: `/en/guide/${params.slug}`,
      },
    },
    openGraph: {
      title: isEn ? guide.titleEn : guide.titleFr,
      description: isEn ? guide.descriptionEn : guide.descriptionFr,
      type: 'article',
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function GuidePage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const isEn = params.locale === 'en';
  const locale = params.locale;
  const title = isEn ? guide.titleEn : guide.titleFr;
  const intro = isEn ? guide.introEn : guide.introFr;
  const tip = isEn ? guide.tipEn : guide.tipFr;
  const outro = isEn ? guide.outroEn : guide.outroFr;
  const galleryHref = `/${locale}/gallery`;

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: isEn ? guide.descriptionEn : guide.descriptionFr,
    step: guide.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: isEn ? s.headingEn : s.headingFr,
      text: isEn ? s.en : s.fr,
    })),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((item) => ({
      '@type': 'Question',
      name: isEn ? item.qEn : item.qFr,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isEn ? item.aEn : item.aFr,
      },
    })),
  };

  return (
    <article className="py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Container size="narrow">
        <Link
          href={`/${locale}/gallery`}
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEn ? 'All photos' : 'Toutes les photos'}
        </Link>

        <p className="text-sm text-ink-muted uppercase tracking-widest mb-3">
          {isEn ? 'Guide' : 'Guide'}
        </p>
        <h1 className="text-display-xl font-display text-ink">{title}</h1>
        <p className="text-lg text-ink-muted mt-4">{intro}</p>

        {/*
          TODO(illustration) : aucune capture d'écran n'existe encore dans le repo
          (public/ ne contient que world-50m.json). Quand des captures seront
          disponibles, remplacer ce bloc par un <Image> Next.js avec un alt
          descriptif par étape, par ex. pour l'étape 3 iPhone :
          alt="Capture d'écran iOS : sélection de la photo téléchargée dans
          l'écran Ajouter un nouveau fond d'écran > Photos".
        */}

        <ol className="mt-10 space-y-10">
          {guide.steps.map((step, i) => (
            <li key={i}>
              <h2 className="flex items-start gap-4 text-xl font-display text-ink">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-cool text-sm font-semibold text-ink">
                  {i + 1}
                </span>
                <span className="pt-0.5">{isEn ? step.headingEn : step.headingFr}</span>
              </h2>
              <p className="mt-3 pl-12 text-base text-ink-muted">
                {isEn ? step.en : step.fr}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 border border-line bg-paper-warm p-5 text-sm text-ink-muted">
          {tip}
        </div>

        <p className="mt-8 text-base text-ink-muted">{outro}</p>

        <div className="mt-10 flex justify-center">
          <HeroCtaLink href={galleryHref} label={isEn ? guide.ctaLabelEn : guide.ctaLabelFr} location="guide_steps" />
        </div>

        <div className="mt-16 border-t border-line pt-10">
          <h2 className="text-xl font-display text-ink mb-6">
            {isEn ? 'Frequently asked questions' : 'Questions fréquentes'}
          </h2>
          <div className="space-y-3">
            {guide.faq.map((item, i) => (
              <details key={i} className="group border border-line bg-paper p-4">
                <summary className="cursor-pointer list-none text-base font-medium text-ink marker:content-none">
                  {isEn ? item.qEn : item.qFr}
                </summary>
                <p className="mt-3 text-sm text-ink-muted">{isEn ? item.aEn : item.aFr}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-10">
          <p className="text-lg font-display text-ink mb-4">
            {isEn ? 'Find your next wallpaper' : 'Trouver votre prochain fond d\'écran'}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href={`/${locale}/collection/fonds-decran-mer`} className="text-accent hover:underline">
              {isEn ? 'Sea wallpapers' : "Fonds d'écran mer"}
            </Link>
            <Link href={`/${locale}/collection/fonds-decran-montagne`} className="text-accent hover:underline">
              {isEn ? 'Mountain wallpapers' : "Fonds d'écran montagne"}
            </Link>
            <Link href={`/${locale}/collection/fonds-decran-tropical`} className="text-accent hover:underline">
              {isEn ? 'Tropical wallpapers' : "Fonds d'écran tropicaux"}
            </Link>
            <Link href={`/${locale}/gallery`} className="text-accent hover:underline">
              {isEn ? 'All photos' : 'Toutes les photos'}
            </Link>
          </div>
        </div>
      </Container>
    </article>
  );
}
