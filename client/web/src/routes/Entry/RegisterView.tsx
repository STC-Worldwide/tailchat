import {
  isValidStr,
  model,
  registerWithEmail,
  showSuccessToasts,
  t,
  useAsyncFn,
  getGlobalConfig,
  localTrans,
  useWatch,
} from 'tailchat-shared';
import React, { useState } from 'react';
import { string } from 'yup';
import { useNavigate } from 'react-router';
import { setUserJWT } from '../../utils/jwt-helper';
import { setGlobalUserLoginInfo } from '../../utils/user-helper';
import { useSearchParam } from '@/hooks/useSearchParam';
import { useNavToView } from './utils';
import { EntryInput } from './components/Input';
import { SecondaryBtn } from './components/SecondaryBtn';
import { PrimaryBtn } from './components/PrimaryBtn';
import { TipIcon } from '@/components/TipIcon';
import { EntryError, EntryField, EntryView } from './components/Form';
import { Button } from '@/components/ui/official/button';
import { ArrowLeftIcon, PencilIcon, PencilOffIcon } from 'lucide-react';

/**
 * 注册视图
 */
export const RegisterView: React.FC = React.memo(() => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [sendedEmail, setSendedEmail] = useState(false);
  const [customNickname, setCustomNickname] = useState(false);
  const navigate = useNavigate();
  const navRedirect = useSearchParam('redirect');

  const [{ loading, error }, handleRegister] = useAsyncFn(async () => {
    await string()
      .email(t('邮箱格式不正确'))
      .required(t('邮箱不能为空'))
      .max(40, t('邮箱最长限制40个字符'))
      .validate(email);

    await string()
      .min(6, t('密码不能低于6位'))
      .required(t('密码不能为空'))
      .max(40, t('密码最长限制40个字符'))
      .validate(password);

    const data = await registerWithEmail({
      email,
      password,
      nickname,
      emailOTP,
    });

    setGlobalUserLoginInfo(data);
    await setUserJWT(data.token);

    if (isValidStr(navRedirect)) {
      navigate(decodeURIComponent(navRedirect));
    } else {
      navigate('/main');
    }
  }, [email, nickname, password, emailOTP, navRedirect]);

  const [
    { loading: sendEmailLoading, error: sendEmailError },
    handleSendEmail,
  ] = useAsyncFn(async () => {
      await string()
        .email(t('邮箱格式不正确'))
        .required(t('邮箱不能为空'))
        .max(40, t('邮箱最长限制40个字符'))
        .validate(email);

      await model.user.verifyEmail(email);
      showSuccessToasts(t('发送成功, 请检查你的邮箱。'));
      setSendedEmail(true);
  }, [email]);

  useWatch([email, customNickname], () => {
    if (!customNickname) {
      setNickname(getEmailAddress(email));
    }
  });

  const navToView = useNavToView();
  const emailVerification = getGlobalConfig().emailVerification;

  return (
    <EntryView
      title={t('注册账号')}
      description={localTrans({
        'zh-CN': '创建账号并加入这个 Tailchat 服务器。',
        'en-US': 'Create an account for this Tailchat server.',
      })}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleRegister();
        }}
      >
        <EntryField id="reg-email" label={t('邮箱')}>
          <EntryInput
            id="reg-email"
            name="reg-email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            disabled={sendedEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </EntryField>

        {emailVerification && !sendedEmail && (
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
            <p className="mb-3 text-sm leading-5 text-muted-foreground">
              {localTrans({
                'zh-CN': '先发送校验码，再完成账号资料。',
                'en-US': 'Send a verification code before completing your account.',
              })}
            </p>
            <PrimaryBtn
              type="button"
              loading={sendEmailLoading}
              onClick={handleSendEmail}
            >
              {t('向邮箱发送校验码')}
            </PrimaryBtn>
          </div>
        )}

        {emailVerification && sendedEmail && (
          <EntryField id="reg-email-otp" label={t('邮箱校验码')}>
            <EntryInput
              id="reg-email-otp"
              name="reg-email-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t('6位校验码')}
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
            />
          </EntryField>
        )}

        <EntryField
          id="reg-nickname"
          label={t('昵称')}
          hint={<TipIcon content={t('后续在用户设置中可以随时修改')} />}
        >
          <div className="relative">
            <EntryInput
              id="reg-nickname"
              name="reg-nickname"
              type="text"
              autoComplete="nickname"
              disabled={!customNickname}
              className="pr-11"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-pressed={customNickname}
              aria-label={
                customNickname
                  ? localTrans({
                      'zh-CN': '使用邮箱生成昵称',
                      'en-US': 'Use nickname generated from email',
                    })
                  : localTrans({
                      'zh-CN': '自定义昵称',
                      'en-US': 'Customize nickname',
                    })
              }
              className="absolute right-1.5 top-1.5"
              onClick={() => setCustomNickname((current) => !current)}
            >
              {customNickname ? <PencilOffIcon /> : <PencilIcon />}
            </Button>
          </div>
        </EntryField>

        <EntryField id="reg-password" label={t('密码')}>
          <EntryInput
            id="reg-password"
            name="reg-password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </EntryField>

        <EntryError error={error ?? sendEmailError} />

        <PrimaryBtn
          type="submit"
          loading={loading}
          disabled={emailVerification && !sendedEmail}
        >
          {t('注册账号')}
        </PrimaryBtn>

        <SecondaryBtn
          disabled={loading || sendEmailLoading}
          onClick={() => navToView('/entry/login')}
        >
          <ArrowLeftIcon />
          {t('返回登录')}
        </SecondaryBtn>
      </form>
    </EntryView>
  );
});
RegisterView.displayName = 'RegisterView';

function getEmailAddress(email: string) {
  return email.split('@')[0];
}
