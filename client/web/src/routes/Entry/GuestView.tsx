import { useSearchParam } from '@/hooks/useSearchParam';
import { setUserJWT } from '@/utils/jwt-helper';
import { setGlobalUserLoginInfo } from '@/utils/user-helper';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  createTemporaryUser,
  isValidStr,
  localTrans,
  t,
  useAsyncFn,
} from 'tailchat-shared';
import { string } from 'yup';
import { useNavToView } from './utils';
import { EntryInput } from './components/Input';
import { PrimaryBtn } from './components/PrimaryBtn';
import { SecondaryBtn } from './components/SecondaryBtn';
import { EntryError, EntryField, EntryView } from './components/Form';
import { ArrowLeftIcon } from 'lucide-react';

export const GuestView: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const navToView = useNavToView();
  const navRedirect = useSearchParam('redirect');
  const [nickname, setNickname] = useState('');

  const [{ loading, error }, handleCreateTemporaryUser] = useAsyncFn(
    async () => {
      await string().required(t('昵称不能为空')).max(16).validate(nickname);

      const data = await createTemporaryUser(nickname);

      setGlobalUserLoginInfo(data);
      await setUserJWT(data.token);

      if (isValidStr(navRedirect)) {
        navigate(decodeURIComponent(navRedirect));
      } else {
        navigate('/main');
      }
    },
    [nickname, navigate, navRedirect]
  );

  return (
    <EntryView
      title={t('创建访客')}
      description={localTrans({
        'zh-CN': '选择一个昵称，无需注册即可临时进入。',
        'en-US': 'Choose a nickname to enter temporarily without registering.',
      })}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreateTemporaryUser();
        }}
      >
        <EntryField id="guest-nickname" label={t('昵称')}>
          <EntryInput
            id="guest-nickname"
            name="guest-nickname"
            placeholder={t('想要让大家如何称呼你')}
            type="text"
            autoComplete="nickname"
            maxLength={16}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </EntryField>

        <EntryError error={error} />

        <PrimaryBtn type="submit" loading={loading}>
          {t('立即进入')}
        </PrimaryBtn>

        <SecondaryBtn
          disabled={loading}
          onClick={() => navToView('/entry/login')}
        >
          <ArrowLeftIcon />
          {t('返回登录')}
        </SecondaryBtn>
      </form>
    </EntryView>
  );
});
GuestView.displayName = 'GuestView';
