'use client';
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from './actions';

export function CheckoutForm({ photoId, locale }: { photoId: string; locale: string }) {
  const t = useTranslations('checkout');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);
    const result = await createCheckoutSession({ photoId, locale });
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    if (result.url) window.location.href = result.url;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-xs text-red-700">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '…' : t('submit')}
      </Button>
    </form>
  );
}
