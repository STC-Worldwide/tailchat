import React, { FormEvent, useState } from 'react';
import { LoaderCircleIcon, SaveIcon } from 'lucide-react';
import {
  datetimeFromNow,
  localTrans,
  model,
  t,
  useAsyncRequest,
} from 'tailchat-shared';
import { closeModal, ModalWrapper } from '../../Modal';
import { Button } from '@/components/ui/official/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/official/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';

const expirationOptions = [
  { label: t('30分钟'), value: 30 * 60 },
  { label: t('1小时'), value: 60 * 60 },
  { label: t('6小时'), value: 6 * 60 * 60 },
  { label: t('12小时'), value: 12 * 60 * 60 },
  { label: t('1天'), value: 24 * 60 * 60 },
  { label: t('7天'), value: 7 * 24 * 60 * 60 },
  { label: t('永不'), value: -1 },
];

const usageOptions = [
  { label: t('无限制'), value: -1 },
  { label: t('1次使用'), value: 1 },
  { label: t('5次使用'), value: 5 },
  { label: t('10次使用'), value: 10 },
  { label: t('25次使用'), value: 25 },
  { label: t('50次使用'), value: 50 },
  { label: t('100次使用'), value: 100 },
];

interface EditGroupInviteProps {
  groupId: string;
  code: string;
  expiredAt?: string;
  usageLimit?: number;
  onEditSuccess: (info: {
    expiredAt: number | undefined;
    usageLimit: number | undefined;
  }) => void;
}

export const EditGroupInvite: React.FC<EditGroupInviteProps> = React.memo(
  (props) => {
    const currentExpiredAt = props.expiredAt
      ? new Date(props.expiredAt).valueOf()
      : undefined;
    const hasCurrentExpiration = Number.isFinite(currentExpiredAt);
    const [expiration, setExpiration] = useState(() =>
      hasCurrentExpiration ? 'current' : '-1'
    );
    const [usageLimitValue, setUsageLimitValue] = useState(() =>
      String(props.usageLimit ?? -1)
    );
    const expirationSelectOptions = hasCurrentExpiration
      ? [
          {
            label: localTrans({
              'zh-CN': `当前设置 · ${datetimeFromNow(props.expiredAt!)}`,
              'en-US': `Current setting · ${datetimeFromNow(props.expiredAt!)}`,
            }),
            value: 'current',
          },
          ...expirationOptions.map((option) => ({
            label: option.label,
            value: String(option.value),
          })),
        ]
      : expirationOptions.map((option) => ({
          label: option.label,
          value: String(option.value),
        }));
    const hasCustomUsageLimit =
      props.usageLimit !== undefined &&
      !usageOptions.some((option) => option.value === props.usageLimit);
    const usageSelectOptions = hasCustomUsageLimit
      ? [
          {
            label: localTrans({
              'zh-CN': `当前设置 · ${props.usageLimit}次使用`,
              'en-US': `Current setting · ${props.usageLimit} uses`,
            }),
            value: String(props.usageLimit),
          },
          ...usageOptions.map((option) => ({
            label: option.label,
            value: String(option.value),
          })),
        ]
      : usageOptions.map((option) => ({
          label: option.label,
          value: String(option.value),
        }));
    const [{ loading }, saveInvite] = useAsyncRequest(async () => {
      const expirationSeconds = Number(expiration);
      const usageLimitNumber = Number(usageLimitValue);
      const expiredAt =
        expiration === 'current'
          ? currentExpiredAt
          : expirationSeconds === -1
          ? undefined
          : Date.now() + expirationSeconds * 1000;
      const usageLimit = usageLimitNumber === -1 ? undefined : usageLimitNumber;

      await model.group.editGroupInvite(
        props.groupId,
        props.code,
        expiredAt,
        usageLimit
      );
      props.onEditSuccess({ expiredAt, usageLimit });
    }, [
      currentExpiredAt,
      expiration,
      props.code,
      props.groupId,
      props.onEditSuccess,
      usageLimitValue,
    ]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      saveInvite();
    };

    return (
      <ModalWrapper
        className="w-[min(26rem,calc(100vw-2rem))]"
        style={{ maxWidth: 416 }}
        title={t('编辑邀请链接')}
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-expiration">
                {t('过期时间')}
              </FieldLabel>
              <Select
                value={expiration}
                onValueChange={(value) => setExpiration(String(value))}
                items={expirationSelectOptions}
              >
                <SelectTrigger id="invite-expiration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {expirationSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {localTrans({
                  'zh-CN': '到期后，此链接将不能再用于加入群组。',
                  'en-US':
                    'After this time, the link can no longer be used to join.',
                })}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="invite-usage-limit">
                {t('最大使用次数')}
              </FieldLabel>
              <Select
                value={usageLimitValue}
                onValueChange={(value) => setUsageLimitValue(String(value))}
                items={usageSelectOptions}
              >
                <SelectTrigger id="invite-usage-limit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {usageSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {localTrans({
                  'zh-CN': '达到限制后，邀请链接会自动停止接受新成员。',
                  'en-US':
                    'The invite stops accepting new members after this limit.',
                })}
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => closeModal()}
            >
              {t('取消')}
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {loading
                ? localTrans({ 'zh-CN': '正在保存', 'en-US': 'Saving' })
                : localTrans({
                    'zh-CN': '保存更改',
                    'en-US': 'Save changes',
                  })}
            </Button>
          </div>
        </form>
      </ModalWrapper>
    );
  }
);
EditGroupInvite.displayName = 'EditGroupInvite';
