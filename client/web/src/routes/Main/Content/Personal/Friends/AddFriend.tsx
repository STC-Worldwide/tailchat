import { Highlight } from '@/components/Highlight';
import {
  addFriendRequest,
  searchUserWithUniqueName,
  showErrorToasts,
  showToasts,
  t,
  Trans,
  useAppSelector,
  useAsyncFn,
  UserBaseInfo,
} from 'tailchat-shared';
import React, { useCallback, useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { Badge } from '@/components/ui/official/badge';
import { Button } from '@/components/ui/official/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Input } from '@/components/ui/official/input';
import { Separator } from '@/components/ui/official/separator';
import copy from 'copy-to-clipboard';
import {
  CopyIcon,
  LoaderCircleIcon,
  SearchIcon,
  UserPlusIcon,
  UserRoundXIcon,
} from 'lucide-react';

const SearchFriendResult: React.FC<{
  result: UserBaseInfo | undefined | null;
}> = React.memo(({ result }) => {
  const [hasSentUserId, setHasSentUserId] = useState(''); // 记录已发送的
  const handleAddFriend = useCallback(async (userId: string) => {
    try {
      await addFriendRequest(userId);
      setHasSentUserId(userId);
      showToasts(t('已发送申请'), 'success');
    } catch (err) {
      showErrorToasts(err);
    }
  }, []);

  if (result === undefined) {
    return null;
  }

  if (result === null) {
    return (
      <Empty className="min-h-52 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRoundXIcon />
          </EmptyMedia>
          <EmptyTitle>{t('没有找到该用户')}</EmptyTitle>
          <EmptyDescription>{t('用户昵称#0000')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const hasSent = hasSentUserId === result._id;

  return (
    <div>
      <Separator className="my-5" />

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-14" size="lg">
            <AvatarImage
              src={result.avatar ?? undefined}
              alt={result.nickname}
            />
            <AvatarFallback>
              {result.nickname?.slice(0, 1).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">
              {result.nickname}
            </div>
            <Badge variant="secondary" className="mt-1 tabular-nums">
              #{result.discriminator}
            </Badge>
          </div>
        </div>

        <Button
          className="h-11 max-sm:w-full md:h-8"
          disabled={hasSent}
          onClick={() => handleAddFriend(result._id)}
        >
          <UserPlusIcon data-icon="inline-start" />
          {hasSent ? t('已申请') : t('申请好友')}
        </Button>
      </div>
    </div>
  );
});
SearchFriendResult.displayName = 'SearchFriendResult';

const SelfIdentify: React.FC = React.memo(() => {
  const userInfo = useAppSelector((state) => state.user.info);
  const uniqueName = `${userInfo?.nickname}#${userInfo?.discriminator}`;

  return (
    <div>
      <Separator className="my-5" />

      <div className="rounded-xl bg-muted/50 p-4 text-center">
        <div className="text-sm text-muted-foreground">
          {t('您的个人唯一标识')}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <code className="select-text text-base font-semibold tabular-nums text-foreground">
            {uniqueName}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t('复制')}
            onClick={() => copy(uniqueName)}
          >
            <CopyIcon data-icon="inline-start" />
            {t('复制')}
          </Button>
        </div>
      </div>
    </div>
  );
});
SelfIdentify.displayName = 'SelfIdentify';

export const AddFriend: React.FC = React.memo(() => {
  const [uniqueName, setUniqueName] = useState('');
  const [{ loading, value }, searchUser] = useAsyncFn(async () => {
    // 搜索用户
    try {
      const data = await searchUserWithUniqueName(uniqueName.trim());

      if (data === null) {
        showToasts(t('没有找到该用户'), 'warning');
      }

      return data;
    } catch (err) {
      showErrorToasts(err);
    }
  }, [uniqueName]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
        <h2 className="text-lg font-semibold">{t('添加好友')}</h2>
        <div className="mt-1 text-sm text-muted-foreground">
          <Trans>
            您可以使用完整的 <Highlight>用户昵称#标识</Highlight> 来添加好友
          </Trans>
        </div>

        <form
          className="mt-5 flex gap-2 max-sm:flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void searchUser();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-11 pl-9 md:h-9"
              placeholder={t('用户昵称#0000')}
              aria-label={t('用户昵称#0000')}
              value={uniqueName}
              onChange={(e) => setUniqueName(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="h-11 max-sm:w-full md:h-9"
            disabled={uniqueName.trim() === '' || loading}
            aria-busy={loading}
          >
            {loading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SearchIcon data-icon="inline-start" />
            )}
            {t('查找好友')}
          </Button>
        </form>

        {value === undefined ? (
          <SelfIdentify />
        ) : (
          <SearchFriendResult result={value} />
        )}
      </div>
    </div>
  );
});
AddFriend.displayName = 'AddFriend';
