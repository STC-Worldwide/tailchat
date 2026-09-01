import React, { useState } from 'react';
import {
  isValidStr,
  model,
  t,
  useAppDispatch,
  useAppSelector,
  useAsyncRequest,
  useCachedUserInfo,
  userActions,
} from 'tailchat-shared';
import { ModalWrapper } from '../Modal';
import { Problem } from '../Problem';
import { SubmitButton } from '../SubmitButton';
import { Button } from '@/components/ui/official/button';
import { Input } from '@/components/ui/official/input';

export const SetFriendNickname: React.FC<{
  userId: string;
  onSuccess?: () => void;
}> = React.memo((props) => {
  const userInfo = useCachedUserInfo(props.userId);
  const friendInfo = useAppSelector((state) =>
    state.user.friends.find((item) => item.id === props.userId)
  );
  const dispatch = useAppDispatch();
  const [nickname, setNickname] = useState(friendInfo?.nickname ?? '');

  const [, handleSetFriendNickname] = useAsyncRequest(async () => {
    await model.friend.setFriendNickname(props.userId, nickname);
    dispatch(
      userActions.setFriendNickname({
        friendId: props.userId,
        nickname,
      })
    );

    props.onSuccess?.();
  }, [props.userId, props.onSuccess, nickname]);

  if (!friendInfo) {
    return <Problem text={t('没有找到该用户信息, 可能出现了一些异常')} />;
  }

  const modalTitle = isValidStr(friendInfo.nickname)
    ? t('更改好友昵称')
    : t('添加好友昵称');

  return (
    <ModalWrapper title={modalTitle}>
      <div className="flex w-full flex-col gap-3">
        <p>{t('使用个人昵称更快地找到好友。仅您自己可见。')}</p>
        <Input
          aria-label={modalTitle}
          placeholder={userInfo.nickname}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button type="button" variant="ghost" onClick={() => setNickname('')}>
          {t('重置好友昵称')}
        </Button>

        <SubmitButton
          className="w-full"
          size="lg"
          onClick={handleSetFriendNickname}
        >
          {t('确认')}
        </SubmitButton>
      </div>
    </ModalWrapper>
  );
});
SetFriendNickname.displayName = 'SetFriendNickname';
