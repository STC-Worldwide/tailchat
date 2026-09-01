import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginView } from './LoginView';
import { RegisterView } from './RegisterView';
import { useRecordMeasure } from '@/utils/measure-helper';
import { GuestView } from './GuestView';
import { ForgetPasswordView } from './ForgetPasswordView';
import { Button } from '@/components/ui/official/button';
import { LanguageSelect } from '@/components/LanguageSelect';
import { openModal } from '@/components/Modal';
import { ServiceUrlSettings } from '@/components/modals/ServiceUrlSettings';
import { MessageSquareMoreIcon, Settings2Icon } from 'lucide-react';
import { t, useGlobalConfigStore } from 'tailchat-shared';

const EntryRoute = React.memo(() => {
  useRecordMeasure('appEntryRenderStart');
  const serverName = useGlobalConfigStore((state) => state.serverName);
  const displayServerName = serverName || 'Tailchat';

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <main className="flex w-full shrink-0 flex-col overflow-y-auto border-r border-border/70 bg-background md:w-[34rem]">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-6 sm:px-8 sm:py-8">
          <header className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageSquareMoreIcon className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {displayServerName}
              </div>
              {displayServerName !== 'Tailchat' && (
                <div className="truncate text-xs text-muted-foreground">
                  Tailchat
                </div>
              )}
            </div>
          </header>

          <div className="flex flex-1 items-center py-8 sm:py-12">
            <Routes>
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/guest" element={<GuestView />} />
              <Route path="/forget" element={<ForgetPasswordView />} />
              <Route
                path="/"
                element={<Navigate to="/entry/login" replace={true} />}
              />
            </Routes>
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openModal(<ServiceUrlSettings />)}
            >
              <Settings2Icon />
              {t('服务器地址设置')}
            </Button>
            <LanguageSelect style={{ width: 156 }} />
          </footer>
        </div>
      </main>

      <aside className="tc-background relative hidden min-w-0 flex-1 md:block">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 bg-black/65 px-10 py-8 text-white">
          <h2 className="text-xl font-semibold text-white">
            {displayServerName}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
            {t('可供高度自定义的聊天工具')}
          </p>
        </div>
      </aside>
    </div>
  );
});
EntryRoute.displayName = 'EntryRoute';

export default EntryRoute;
