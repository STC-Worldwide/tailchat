import {
  isValidStr,
  localTrans,
  loginWithEmail,
  t,
  useAsyncFn,
  useGlobalConfigStore,
} from 'tailchat-shared';
import React, { useEffect, useState } from 'react';
import { string } from 'yup';
import { useLocation, useNavigate } from 'react-router';
import { setUserJWT } from '../../utils/jwt-helper';
import { setGlobalUserLoginInfo, tryAutoLogin } from '../../utils/user-helper';
import { useSearchParam } from '@/hooks/useSearchParam';
import { useNavToView } from './utils';
import { EntryInput } from './components/Input';
import { SecondaryBtn } from './components/SecondaryBtn';
import { PrimaryBtn } from './components/PrimaryBtn';
import { pluginLoginAction } from '@/plugin/common';
import { EntryError, EntryField, EntryView } from './components/Form';
import { Button } from '@/components/ui/official/button';
import { ArrowRightIcon } from 'lucide-react';

/**
 * 登录视图
 */
export const LoginView: React.FC = React.memo(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const navRedirect = useSearchParam('redirect');
  const { pathname } = useLocation();
  const { serverName, disableGuestLogin, disableUserRegister } =
    useGlobalConfigStore((state) => ({
      serverName: state.serverName,
      disableGuestLogin: state.disableGuestLogin,
      disableUserRegister: state.disableUserRegister,
    }));

  useEffect(() => {
    tryAutoLogin()
      .then(() => {
        navigate('/main');
      })
      .catch(() => {});
  }, []);

  const [{ loading, error }, handleLogin] = useAsyncFn(async () => {
    await string()
      .email(t('邮箱格式不正确'))
      .required(t('邮箱不能为空'))
      .validate(email);

    await string()
      .min(6, t('密码不能低于6位'))
      .required(t('密码不能为空'))
      .validate(password);

    const data = await loginWithEmail(email, password);

    setGlobalUserLoginInfo(data);
    await setUserJWT(data.token);

    if (isValidStr(navRedirect) && navRedirect !== pathname) {
      // 增加非当前状态判定避免循环
      navigate(decodeURIComponent(navRedirect));
    } else {
      navigate('/main');
    }
  }, [email, password, navRedirect, pathname, navigate]);

  const navToView = useNavToView();

  return (
    <EntryView
      title={t('登录 {{serverName}}', {
        serverName: serverName || 'Tailchat',
      })}
      description={localTrans({
        'zh-CN': '使用你的邮箱和密码继续。',
        'en-US': 'Use your email and password to continue.',
      })}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleLogin();
        }}
      >
        <EntryField id="login-email" label={t('邮箱')}>
          <EntryInput
            id="login-email"
            name="login-email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </EntryField>

        <EntryField
          id="login-password"
          label={t('密码')}
          hint={
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto px-0"
              onClick={() => navToView('/entry/forget')}
            >
              {t('忘记密码？')}
            </Button>
          }
        >
          <EntryInput
            id="login-password"
            name="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </EntryField>

        {loading === false && <EntryError error={error} />}

        <PrimaryBtn type="submit" loading={loading}>
          {t('登录')}
        </PrimaryBtn>

        <div className="space-y-1 border-t border-border/70 pt-3">
          {!disableUserRegister && (
            <SecondaryBtn
              disabled={loading}
              onClick={() => navToView('/entry/register')}
            >
              {t('注册账号')}
              <ArrowRightIcon />
            </SecondaryBtn>
          )}

          {!disableGuestLogin && (
            <SecondaryBtn
              disabled={loading}
              onClick={() => navToView('/entry/guest')}
            >
              {t('游客访问')}
              <ArrowRightIcon />
            </SecondaryBtn>
          )}

          {pluginLoginAction.map((item) => {
            const { name, component: Component } = item;

            return <Component key={name} />;
          })}
        </div>
      </form>
    </EntryView>
  );
});
LoginView.displayName = 'LoginView';
