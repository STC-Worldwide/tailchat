import React, { PropsWithChildren } from 'react';
import { Separator } from '@/components/ui/official/separator';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@/components/ui/official/field';

export const SettingsPage: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
  }>
> = ({ title, description, children }) => (
  <div className="mx-auto w-full max-w-3xl pb-12" data-slot="settings-page">
    <header className="space-y-1.5 pr-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </header>
    <Separator className="my-6" />
    <div className="space-y-9">{children}</div>
  </div>
);
SettingsPage.displayName = 'SettingsPage';

export const SettingsSection: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
  }>
> = ({ title, description, action, children }) => (
  <section className="space-y-5" data-slot="settings-section">
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div>{children}</div>
  </section>
);
SettingsSection.displayName = 'SettingsSection';

export const SettingsFieldGroup: React.FC<PropsWithChildren> = ({
  children,
}) => (
  <FieldGroup className="gap-0 divide-y divide-border rounded-lg border border-border">
    {children}
  </FieldGroup>
);
SettingsFieldGroup.displayName = 'SettingsFieldGroup';

export const SettingsRow: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
  }>
> = ({ title, description, children }) => (
  <Field
    orientation="responsive"
    className="min-h-16 gap-4 px-4 py-3.5 @md/field-group:items-center"
  >
    <FieldContent>
      <FieldTitle>{title}</FieldTitle>
      {description && <FieldDescription>{description}</FieldDescription>}
    </FieldContent>
    <div className="flex min-w-0 shrink-0 items-center">{children}</div>
  </Field>
);
SettingsRow.displayName = 'SettingsRow';
