import { Alert, AlertDescription } from '@/components/ui/official/alert';
import { CircleAlertIcon } from 'lucide-react';
import React, { PropsWithChildren } from 'react';

export const EntryView: React.FC<
  PropsWithChildren<{ title: React.ReactNode; description: React.ReactNode }>
> = ({ title, description, children }) => (
  <section className="w-full space-y-7" data-slot="entry-view">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </header>
    {children}
  </section>
);
EntryView.displayName = 'EntryView';

export const EntryField: React.FC<
  PropsWithChildren<{ id: string; label: React.ReactNode; hint?: React.ReactNode }>
> = ({ id, label, hint, children }) => (
  <div className="space-y-2" data-slot="entry-field">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
    {children}
  </div>
);
EntryField.displayName = 'EntryField';

export const EntryError: React.FC<{ error?: Error | null }> = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
};
EntryError.displayName = 'EntryError';
