import React, { useCallback } from 'react';
import {
  isValidStr,
  localTrans,
  parseUrlStr,
  type PluginManifest,
  t,
} from 'tailchat-shared';
import { BookOpenIcon, PackageCheckIcon } from 'lucide-react';
import { ModalWrapper, openModal } from '../common';
import { DocumentView } from './DocumentView';
import { getManifestFieldWithI18N } from '../utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { Badge } from '@/components/ui/official/badge';
import { Button } from '@/components/ui/official/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/official/card';

/**
 * One installed plugin, for reading.
 *
 * There is deliberately no install or uninstall control: what this client
 * loads is decided by the server, so the card exists to answer "what is this
 * and what version am I on", which is what support actually needs.
 */
export const InstalledPluginItem: React.FC<{
  manifest: PluginManifest;
  builtin?: boolean;
}> = React.memo((props) => {
  const { manifest, builtin = false } = props;

  const label = getManifestFieldWithI18N(manifest, 'label');
  const description = getManifestFieldWithI18N(manifest, 'description');
  const titleId = `plugin-${manifest.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const hasDocument = isValidStr(manifest.documentUrl);

  const handleShowDocument = useCallback(() => {
    if (!isValidStr(manifest.documentUrl)) {
      return;
    }

    openModal(
      <ModalWrapper title={label}>
        <DocumentView documentUrl={parseUrlStr(manifest.documentUrl)} />
      </ModalWrapper>
    );
  }, [label, manifest.documentUrl]);

  return (
    <Card
      size="sm"
      className="h-full bg-card/75 transition-colors hover:bg-card"
      role="article"
      aria-labelledby={titleId}
    >
      <CardHeader className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <Avatar
          className="row-span-3 size-11 rounded-lg after:rounded-lg"
          aria-hidden="true"
        >
          <AvatarImage
            src={manifest.icon || undefined}
            alt=""
            className="rounded-lg"
          />
          <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">
            {label.slice(0, 1).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <CardTitle id={titleId} className="line-clamp-2 min-w-0">
            {label}
          </CardTitle>
          {builtin && (
            <Badge variant="secondary" className="shrink-0">
              <PackageCheckIcon data-icon="inline-start" />
              {localTrans({ 'zh-CN': '内置', 'en-US': 'Built in' })}
            </Badge>
          )}
        </div>
        <code className="block truncate rounded-none border-0! bg-transparent! p-0! text-xs text-muted-foreground ring-0! shadow-none!">
          {manifest.name}
        </code>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {description ||
            localTrans({
              'zh-CN': '该插件没有提供描述。',
              'en-US': 'No description was provided for this plugin.',
            })}
        </p>
      </CardContent>

      {hasDocument && (
        <CardFooter className="min-h-14 justify-end gap-2 border-border/70 px-3 py-2.5">
          <Button variant="ghost" size="sm" onClick={handleShowDocument}>
            <BookOpenIcon data-icon="inline-start" />
            {t('文档')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
});
InstalledPluginItem.displayName = 'InstalledPluginItem';
