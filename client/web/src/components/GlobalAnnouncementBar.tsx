import { useLocalStorageState } from '@/hooks/useLocalStorage';
import React from 'react';
import { t, useGlobalConfigStore } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { XIcon } from 'lucide-react';

export const GlobalAnnouncementBar: React.FC = React.memo(() => {
  const announcementInfo = useGlobalConfigStore((state) => state.announcement);
  const [ackId, setAckId] = useLocalStorageState('ackGlobalAnnouncement');

  if (!announcementInfo) {
    return null;
  }

  if (ackId === announcementInfo.id) {
    // 如果该公告已读，也不展示
    return null;
  }

  return (
    <div className="relative flex min-h-8 items-center justify-center gap-1 bg-primary px-10 text-center text-sm text-primary-foreground">
      <span className="select-text">{announcementInfo.text}</span>

      {announcementInfo.link && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-7 px-1 font-semibold text-primary-foreground hover:text-primary-foreground"
          onClick={() => window.open(announcementInfo.link)}
        >
          {t('了解更多')}
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        aria-label={t('关闭')}
        onClick={() => setAckId(announcementInfo.id)}
      >
        <XIcon />
      </Button>
    </div>
  );
});
GlobalAnnouncementBar.displayName = 'GlobalAnnouncementBar';
