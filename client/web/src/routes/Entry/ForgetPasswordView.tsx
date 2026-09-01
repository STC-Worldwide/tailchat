import {
  forgetPassword,
  localTrans,
  resetPassword,
  showToasts,
  t,
  useAsyncFn,
} from 'tailchat-shared';
import React, { useState } from 'react';
import { string } from 'yup';
import { useNavToView } from './utils';
import { EntryInput } from './components/Input';
import { SecondaryBtn } from './components/SecondaryBtn';
import { PrimaryBtn } from './components/PrimaryBtn';
import { EntryError, EntryField, EntryView } from './components/Form';
import { ArrowLeftIcon } from 'lucide-react';

/**
 * 登录视图
 */
export const ForgetPasswordView: React.FC = React.memo(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sendedEmail, setSendedEmail] = useState(false);

  const navToView = useNavToView();

  const [
    { loading: sendEmailLoading, error: sendEmailError },
    handleSendEmail,
  ] = useAsyncFn(async () => {
      await string()
        .email(t('邮箱格式不正确'))
        .required(t('邮箱不能为空'))
        .validate(email);

      await forgetPassword(email);
      setSendedEmail(true);
      showToasts(t('已发送邮件到 {{email}}', { email }), 'success');
  }, [email]);

  const [{ loading, error }, handleResetPassword] = useAsyncFn(
    async () => {
      await string()
        .email(t('邮箱格式不正确'))
        .required(t('邮箱不能为空'))
        .validate(email);

      await string()
        .min(6, t('密码不能低于6位'))
        .required(t('密码不能为空'))
        .validate(password);

      await string().length(6, t('OTP为6位数字')).validate(otp);

      await resetPassword(email, password, otp);

      showToasts(t('密码重置成功，现在回到登录页'), 'success');
      navToView('/entry/login');
    },
    [email, password, otp, navToView]
  );

  return (
    <EntryView
      title={t('忘记密码')}
      description={localTrans({
        'zh-CN': '我们会向你的邮箱发送一次性校验码。',
        'en-US': 'We will send a one-time verification code to your email.',
      })}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (sendedEmail) {
            handleResetPassword();
          } else {
            handleSendEmail();
          }
        }}
      >
        <EntryField id="forget-email" label={t('邮箱')}>
          <EntryInput
            id="forget-email"
            name="forget-email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            disabled={sendedEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </EntryField>

        {!sendedEmail && (
          <PrimaryBtn type="submit" loading={sendEmailLoading}>
            {t('向邮箱发送OTP')}
          </PrimaryBtn>
        )}

        {sendedEmail && (
          <>
            <EntryField id="forget-otp" label={t('OTP')}>
              <EntryInput
                id="forget-otp"
                name="forget-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder={t('6位校验码')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </EntryField>

            <EntryField id="forget-password" label={t('新密码')}>
              <EntryInput
                id="forget-password"
                name="forget-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </EntryField>

            <PrimaryBtn type="submit" loading={loading}>
              {t('重设密码')}
            </PrimaryBtn>
          </>
        )}

        <EntryError error={error ?? sendEmailError} />

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
ForgetPasswordView.displayName = 'ForgetPasswordView';
