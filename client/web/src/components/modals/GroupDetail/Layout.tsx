import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/official/separator';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@/components/ui/official/field';

export const GroupDetailPage: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    contentClassName?: string;
  }>
> = ({ title, description, action, className, contentClassName, children }) => (
  <div
    className={cn('mx-auto w-full max-w-4xl pb-12', className)}
    data-slot="group-detail-page"
  >
    <header className="flex flex-col gap-4 pr-12 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 max-sm:w-full [&>*]:max-sm:w-full">
          {action}
        </div>
      )}
    </header>
    <Separator className="my-6" />
    <div className={cn('space-y-9', contentClassName)}>{children}</div>
  </div>
);
GroupDetailPage.displayName = 'GroupDetailPage';

export const GroupDetailSection: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
  }>
> = ({ title, description, action, className, children }) => (
  <section
    className={cn('space-y-5', className)}
    data-slot="group-detail-section"
  >
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 max-sm:w-full [&>*]:max-sm:w-full">
          {action}
        </div>
      )}
    </header>
    <div>{children}</div>
  </section>
);
GroupDetailSection.displayName = 'GroupDetailSection';

export const GroupDetailFieldGroup: React.FC<
  PropsWithChildren<{ className?: string }>
> = ({ className, children }) => (
  <FieldGroup
    className={cn(
      'gap-0 divide-y divide-border rounded-lg border border-border',
      className
    )}
  >
    {children}
  </FieldGroup>
);
GroupDetailFieldGroup.displayName = 'GroupDetailFieldGroup';

export const GroupDetailRow: React.FC<
  PropsWithChildren<{
    title: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
  }>
> = ({ title, description, className, children }) => (
  <Field
    orientation="responsive"
    className={cn(
      'min-h-16 gap-4 px-4 py-3.5 @md/field-group:items-center',
      className
    )}
  >
    <FieldContent>
      <FieldTitle>{title}</FieldTitle>
      {description && <FieldDescription>{description}</FieldDescription>}
    </FieldContent>
    <div className="flex min-w-0 shrink-0 items-center">{children}</div>
  </Field>
);
GroupDetailRow.displayName = 'GroupDetailRow';
