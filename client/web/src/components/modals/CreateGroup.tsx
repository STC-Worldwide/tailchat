import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  applyDefaultFallbackGroupPermission,
  createGroup,
  groupActions,
  GroupPanelType,
  localTrans,
  t,
  useAppDispatch,
  useAsyncRequest,
} from 'tailchat-shared';
import type { GroupPanel } from 'tailchat-shared';
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  MessagesSquareIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { closeModal, ModalWrapper } from '../Modal';
import { Avatar, AvatarFallback } from '@/components/ui/official/avatar';
import { Badge } from '@/components/ui/official/badge';
import { Button } from '@/components/ui/official/button';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/official/dialog';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/official/field';
import { Input } from '@/components/ui/official/input';

interface GroupTemplate {
  key: string;
  label: string;
  description: string;
  panels: GroupPanel[];
}

const panelTemplate: GroupTemplate[] = [
  {
    key: 'default',
    label: t('默认群组'),
    description: localTrans({
      'zh-CN': '从一个分类和大厅文字频道开始。',
      'en-US': 'Start with one category and a general text channel.',
    }),
    panels: [
      {
        id: '00',
        name: t('文字频道'),
        type: GroupPanelType.GROUP,
      },
      {
        id: '01',
        name: t('大厅'),
        parentId: '00',
        type: GroupPanelType.TEXT,
      },
    ],
  },
  {
    key: 'work',
    label: t('工作协同'),
    description: localTrans({
      'zh-CN': '为全员讨论和临时会议预设频道。',
      'en-US': 'Organize company-wide discussion and temporary meetings.',
    }),
    panels: [
      {
        id: '00',
        name: t('公共'),
        type: GroupPanelType.GROUP,
      },
      {
        id: '01',
        name: t('全员'),
        parentId: '00',
        type: GroupPanelType.TEXT,
      },
      {
        id: '10',
        name: t('临时会议'),
        type: GroupPanelType.GROUP,
      },
      {
        id: '11',
        name: t('会议室') + '1',
        parentId: '10',
        type: GroupPanelType.TEXT,
      },
      {
        id: '12',
        name: t('会议室') + '2',
        parentId: '10',
        type: GroupPanelType.TEXT,
      },
    ],
  },
];

type CreateGroupStep = 'template' | 'details';

export const ModalCreateGroup: React.FC = React.memo(() => {
  const [step, setStep] = useState<CreateGroupStep>('template');
  const [selectedTemplate, setSelectedTemplate] =
    useState<GroupTemplate | null>(null);
  const [name, setName] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const normalizedName = name.trim();

  const handleSelectTemplate = useCallback((template: GroupTemplate) => {
    setSelectedTemplate(template);
    setStep('details');
  }, []);

  const handleBack = useCallback(() => {
    setStep('template');
  }, []);

  const [{ loading }, handleCreate] = useAsyncRequest(async () => {
    if (!selectedTemplate || normalizedName.length === 0) {
      return;
    }

    const data = await createGroup(normalizedName, selectedTemplate.panels);
    dispatch(groupActions.appendGroups([data]));
    navigate(`/main/group/${data._id}`);
    await applyDefaultFallbackGroupPermission(String(data._id));
    closeModal();
  }, [dispatch, navigate, normalizedName, selectedTemplate]);

  const stepLabel = localTrans({
    'zh-CN': step === 'template' ? '第 1 步，共 2 步' : '第 2 步，共 2 步',
    'en-US': step === 'template' ? 'Step 1 of 2' : 'Step 2 of 2',
  });

  return (
    <ModalWrapper
      className="w-[min(32rem,calc(100vw-2rem))]"
      style={{ maxWidth: 512 }}
    >
      {step === 'template' ? (
        <div>
          <DialogHeader className="mb-5 gap-2 text-left">
            <div className="flex items-center justify-between gap-4 pr-8">
              <DialogTitle className="text-lg font-semibold">
                {t('创建群组')}
              </DialogTitle>
              <Badge variant="secondary" className="shrink-0">
                {stepLabel}
              </Badge>
            </div>
            <DialogDescription>
              {localTrans({
                'zh-CN': '选择一个起始布局，之后可以随时重新组织频道。',
                'en-US':
                  'Choose a starting layout. You can reorganize channels at any time.',
              })}
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2">
            {panelTemplate.map((template) => {
              const TemplateIcon =
                template.key === 'work'
                  ? BriefcaseBusinessIcon
                  : MessagesSquareIcon;

              return (
                <li key={template.key}>
                  <Button
                    type="button"
                    variant="outline"
                    className="group h-auto w-full justify-start gap-3 px-3 py-3 text-left whitespace-normal"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TemplateIcon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">
                        {template.label}
                      </span>
                      <span className="mt-0.5 block text-sm leading-5 font-normal text-muted-foreground">
                        {template.description}
                      </span>
                    </span>
                    <ChevronRightIcon
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading && normalizedName.length > 0) {
              void handleCreate();
            }
          }}
        >
          <DialogHeader className="mb-5 gap-2 text-left">
            <div className="flex items-center justify-between gap-4 pr-8">
              <DialogTitle className="text-lg font-semibold">
                {t('自定义你的群组')}
              </DialogTitle>
              <Badge variant="secondary" className="shrink-0">
                {stepLabel}
              </Badge>
            </div>
            <DialogDescription>
              {localTrans({
                'zh-CN': '为群组命名，之后仍可随时修改。',
                'en-US': 'Give this group a name. You can change it later.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-5 flex flex-col items-center">
            <Avatar className="size-20 rounded-2xl">
              <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                {normalizedName ? (
                  normalizedName.slice(0, 1).toUpperCase()
                ) : (
                  <UsersRoundIcon className="size-8" aria-hidden="true" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="mt-2 text-xs text-muted-foreground">
              {selectedTemplate?.label}
            </span>
          </div>

          <Field>
            <FieldLabel htmlFor="create-group-name">{t('群组名称')}</FieldLabel>
            <Input
              id="create-group-name"
              maxLength={100}
              autoFocus={true}
              value={name}
              aria-describedby="create-group-name-help"
              onChange={(event) => setName(event.target.value)}
            />
            <FieldDescription
              id="create-group-name-help"
              className="flex items-center justify-between gap-4"
            >
              <span>
                {localTrans({
                  'zh-CN': '使用一个容易识别的名称。',
                  'en-US': 'Use a name your members will recognize.',
                })}
              </span>
              <span className="shrink-0 tabular-nums">{name.length}/100</span>
            </FieldDescription>
          </Field>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Button type="button" variant="ghost" onClick={handleBack}>
              <ArrowLeftIcon data-icon="inline-start" />
              {t('返回')}
            </Button>
            <Button
              type="submit"
              aria-busy={loading}
              disabled={loading || normalizedName.length === 0}
            >
              {loading && (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              {loading
                ? localTrans({
                    'zh-CN': '正在创建',
                    'en-US': 'Creating group',
                  })
                : localTrans({
                    'zh-CN': '创建群组',
                    'en-US': 'Create group',
                  })}
            </Button>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
});
ModalCreateGroup.displayName = 'ModalCreateGroup';
