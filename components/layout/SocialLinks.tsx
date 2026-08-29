'use client';

import { track } from '@/lib/analytics';

// Les profils vivaient uniquement dans le sameAs du schema, donc lisibles par
// Google et invisibles pour un visiteur. rel="me" complete le sameAs : c'est la
// meme affirmation d'identite, cote lien plutot que cote donnees structurees, et
// Pinterest s'en sert pour rattacher le site au profil.
const RESEAUX = [
  { nom: 'Instagram', url: 'https://www.instagram.com/nicogaray/' },
  { nom: 'Pinterest', url: 'https://www.pinterest.com/garaynicong/' },
] as const;

export function SocialLinks() {
  return (
    <div className="flex items-center gap-x-4">
      {RESEAUX.map((r) => (
        <a
          key={r.nom}
          href={r.url}
          target="_blank"
          rel="me noopener noreferrer"
          className="hover:text-accent transition-colors"
          onClick={() => track.event('reseau_social_clique', { reseau: r.nom.toLowerCase() })}
        >
          {r.nom}
        </a>
      ))}
    </div>
  );
}
