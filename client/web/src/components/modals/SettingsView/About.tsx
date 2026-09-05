import React from 'react';
import { BRAND, t, version } from 'tailchat-shared';
import logoUrl from '@assets/images/logo.svg';
import { Button } from '@/components/ui/official/button';
import { Badge } from '@/components/ui/official/badge';
import { SettingsPage, SettingsSection } from './Layout';
import { CheckCircle2Icon, ExternalLinkIcon } from 'lucide-react';

const projectLinks = [
  ['GitHub', 'https://github.com/STC-Worldwide/tailchat'],
  ['Tailchat (upstream)', 'https://github.com/msgbyte/tailchat'],
  ['Open Source', 'https://en.wikipedia.org/wiki/Open_source'],
  ['Docker', 'https://www.docker.com/'],
  ['MiniStar', 'https://ministar.moonrailgun.com/'],
  ['Tushan', 'https://tushan.msgbyte.com/'],
  ['React', 'https://react.dev/'],
  ['Redux', 'https://redux.js.org/'],
  ['TypeScript', 'https://www.typescriptlang.org/'],
] as const;

export const SettingsAbout: React.FC = React.memo(() => {
  return (
    <SettingsPage
      title={t('关于')}
      description={t('Anchor Chat 的版本、项目能力和开源生态。')}
    >
      <SettingsSection title={BRAND.product}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            className="size-20 shrink-0 select-none rounded-2xl bg-muted p-3"
            width={80}
            height={80}
            src={logoUrl}
            alt="Anchor Chat"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                Anchor Chat
              </h2>
              <Badge variant="secondary">v{version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{BRAND.byline}</p>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t('属于所有人的开源聊天工具')} ·{' '}
              {t('完全独属于私人团队的沟通平台')}
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('特性(亮点)')}
        description={t('Anchor Chat 的核心架构能力。')}
      >
        <ul className="space-y-3 text-sm">
          {[
            t('基于面板的群组空间, 可高度自定义化'),
            t('基于微内核的前端插件支撑, 私人定制化'),
            t('分布式部署可供任意规模的使用需求'),
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="leading-6 text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection
        title={t('开源生态')}
        description={t('访问 Anchor Chat 使用和依赖的项目。')}
      >
        <div className="flex flex-wrap gap-2">
          {projectLinks.map(([label, href]) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              render={<a href={href} target="_blank" rel="noreferrer" />}
            >
              {label}
              <ExternalLinkIcon />
            </Button>
          ))}
        </div>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsAbout.displayName = 'SettingsAbout';
