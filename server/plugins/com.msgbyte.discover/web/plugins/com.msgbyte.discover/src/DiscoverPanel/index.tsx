import React from 'react';
import { useAsyncRefresh } from '@capital/common';
import { Button, Empty, Icon } from '@capital/component';
import { request } from '../request';
import {
  DiscoverServerCard,
  DiscoverServerCardSkeleton,
} from './DiscoverServerCard';
import { Translate } from '../translate';

interface DiscoverServerItem {
  groupId: string;
  order: number;
  active: boolean;
}

export const DiscoverPanel: React.FC = React.memo(() => {
  const {
    error,
    loading,
    value: list = [],
    refresh,
  } = useAsyncRefresh(async (): Promise<DiscoverServerItem[]> => {
    const { data } = await request.get('all');

    return data.list ?? [];
  }, []);

  return (
    <section
      aria-labelledby="discover-title"
      className="relative z-10 min-h-full w-full overflow-auto"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="max-w-2xl">
          <h1
            id="discover-title"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            {Translate.discover}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {Translate.discoverHeader}
          </p>
        </header>

        {loading ? (
          <div
            aria-label={Translate.loadingGroups}
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <DiscoverServerCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <Empty
            className="mt-8 min-h-64 rounded-xl border border-border bg-card/70"
            image={<Icon icon="mdi:alert-circle-outline" aria-hidden="true" />}
            description={
              <div className="max-w-md space-y-1 text-center">
                <p className="font-medium text-foreground">
                  {Translate.loadFailed}
                </p>
                <p className="text-sm text-muted-foreground">
                  {String(error.message ?? error)}
                </p>
              </div>
            }
          >
            <Button
              type="default"
              className="min-h-11 sm:min-h-8"
              onClick={refresh}
            >
              {Translate.tryAgain}
            </Button>
          </Empty>
        ) : Array.isArray(list) && list.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <DiscoverServerCard key={item.groupId} groupId={item.groupId} />
            ))}
          </div>
        ) : (
          <Empty
            className="mt-8 min-h-64 rounded-xl border border-dashed border-border bg-card/60"
            image={<Icon icon="mdi:compass-off-outline" aria-hidden="true" />}
            description={
              <div className="max-w-md space-y-1 text-center">
                <p className="font-medium text-foreground">
                  {Translate.emptyTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Translate.emptyDescription}
                </p>
              </div>
            }
          />
        )}
      </div>
    </section>
  );
});
DiscoverPanel.displayName = 'DiscoverPanel';
