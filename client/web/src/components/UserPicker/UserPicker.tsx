import React, { useCallback, useId, useMemo, useState } from 'react';
import { localTrans, t, useUserInfoList } from 'tailchat-shared';
import _take from 'lodash/take';
import _without from 'lodash/without';
import { SearchIcon, SearchXIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { Badge } from '@/components/ui/official/badge';
import { Checkbox } from '@/components/ui/official/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Input } from '@/components/ui/official/input';
import { Label } from '@/components/ui/official/label';

interface UserPickerProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  withSearch?: boolean;
  allUserIds: string[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export const UserPicker: React.FC<UserPickerProps> = React.memo((props) => {
  const {
    withSearch = true,
    selectedIds,
    onChange,
    allUserIds,
    emptyTitle,
    emptyDescription,
  } = props;
  const [searchValue, setSearchValue] = useState('');
  const searchId = useId();
  const userInfoList = useUserInfoList(allUserIds);

  const handleSelectUser = useCallback(
    (userId: string, isSelected: boolean) => {
      if (isSelected) {
        if (!selectedIds.includes(userId)) {
          onChange([...selectedIds, userId]);
        }
        return;
      }

      onChange(_without(selectedIds, userId));
    },
    [selectedIds, onChange]
  );

  const normalizedSearch = searchValue.trim().toLocaleLowerCase();
  const matchedList = useMemo(
    () =>
      _take(
        userInfoList.filter((info) =>
          info.nickname.toLocaleLowerCase().includes(normalizedSearch)
        ),
        10
      ),
    [normalizedSearch, userInfoList]
  );

  return (
    <div>
      {withSearch && (
        <div className="mb-3 space-y-2">
          <Label htmlFor={searchId} className="sr-only">
            {t('搜索用户')}
          </Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              placeholder={t('搜索用户')}
              className="pl-8"
              autoFocus={true}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          {localTrans({ 'zh-CN': '选择用户', 'en-US': 'Select users' })}
        </span>
        <Badge variant="secondary" className="tabular-nums">
          {t('已选择 {{num}} 项', { num: selectedIds.length })}
        </Badge>
      </div>

      <div
        className="max-h-72 overflow-y-auto rounded-xl border border-border/70 bg-background"
        role="list"
        aria-label={localTrans({
          'zh-CN': '可选择的用户',
          'en-US': 'Available users',
        })}
      >
        {matchedList.length > 0 ? (
          matchedList.map((info) => {
            const selected = selectedIds.includes(info._id);

            return (
              <Label
                key={info._id}
                data-selected={selected}
                className="flex min-h-14 w-full cursor-pointer gap-3 border-b border-border/70 px-3 py-2.5 last:border-b-0 hover:bg-muted/60 data-[selected=true]:bg-primary/10"
                role="listitem"
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    handleSelectUser(info._id, checked)
                  }
                />
                <Avatar className="size-8" aria-hidden="true">
                  <AvatarImage src={info.avatar ?? undefined} alt="" />
                  <AvatarFallback>
                    {info.nickname.slice(0, 1).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {info.nickname}
                </span>
              </Label>
            );
          })
        ) : (
          <Empty className="min-h-40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {normalizedSearch
                  ? localTrans({
                      'zh-CN': '未找到匹配用户',
                      'en-US': 'No matching users',
                    })
                  : localTrans({
                      'zh-CN': emptyTitle ?? '没有可选择的用户',
                      'en-US': emptyTitle ?? 'No users available',
                    })}
              </EmptyTitle>
              <EmptyDescription>
                {normalizedSearch
                  ? localTrans({
                      'zh-CN': '尝试使用其他名称搜索。',
                      'en-US': 'Try searching for another name.',
                    })
                  : localTrans({
                      'zh-CN': emptyDescription ?? '当前列表中没有其他用户。',
                      'en-US':
                        emptyDescription ??
                        'There are no other users in this list.',
                    })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
});
UserPicker.displayName = 'UserPicker';
