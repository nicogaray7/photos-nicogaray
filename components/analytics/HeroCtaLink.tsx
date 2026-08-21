'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { track } from '@/lib/analytics';

/** CTA générique avec suivi GA4 clic_cta (utilisé sur le hero et les pages guide). */
export function HeroCtaLink({
  href,
  label,
  location = 'hero',
}: {
  href: string;
  label: string;
  location?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        track.event('clic_cta', {
          cta_label: label,
          cta_location: location,
          cta_url: href,
        })
      }
      className="inline-flex items-center gap-2 px-6 py-3 bg-paper text-ink text-xs tracking-[0.18em] uppercase hover:bg-accent hover:text-paper transition-colors"
    >
      {label}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}
