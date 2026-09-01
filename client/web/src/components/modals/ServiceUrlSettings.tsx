import React, { useState } from 'react';
import { t } from 'tailchat-shared';
import { ModalWrapper } from '../Modal';
import { Button } from '@/components/ui/official/button';
import { Input } from '@/components/ui/official/input';

export const ServiceUrlSettings: React.FC = React.memo(() => {
  const [url, setUrl] = useState(
    window.localStorage.getItem('serviceUrl') ?? ''
  );

  return (
    <ModalWrapper title={t('服务端地址')}>
      <Input
        aria-label={t('服务端地址')}
        placeholder={t('请输入服务器地址(示例: http://127.0.0.1:11000)')}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="space-x-2 text-right mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            window.localStorage.removeItem('serviceUrl');
            window.location.reload();
          }}
        >
          {t('重置为默认地址')}
        </Button>
        <Button
          type="button"
          disabled={!url}
          onClick={() => {
            window.localStorage.setItem('serviceUrl', url);
            window.location.reload();
          }}
        >
          {t('确认修改并刷新页面')}
        </Button>
      </div>
    </ModalWrapper>
  );
});
ServiceUrlSettings.displayName = 'ServiceUrlSettings';
