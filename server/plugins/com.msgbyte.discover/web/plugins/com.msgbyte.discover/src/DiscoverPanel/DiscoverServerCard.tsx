import React from 'react';
import {
  postRequest,
  useAsyncRefresh,
  useAsyncRequest,
  useGroupInfo,
  useNavigate,
  useEvent,
} from '@capital/common';
import { Avatar, Skeleton, Button, Empty, Icon } from '@capital/component';
import { Translate } from '../translate';
import { request } from '../request';

interface DiscoverServerCardProps {
  groupId: string;
}

interface GroupBasicInfo {
  avatar?: string | null;
  description?: string | null;
  memberCount: number;
  name: string;
}

export const DiscoverServerCardSkeleton: React.FC = React.memo(() => (
  <article
    aria-label={Translate.loadingGroup}
    className="flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-card"
  >
    <div className="relative h-16 shrink-0 bg-muted/50">
      <Skeleton.Node className="h-full w-full rounded-none" />
      <Skeleton.Avatar
        active={true}
        size={56}
        shape="square"
        className="absolute bottom-0 left-5 translate-y-1/2 rounded-xl ring-4 ring-card"
      />
    </div>
    <div className="space-y-3 px-5 pb-5 pt-10">
      <Skeleton active={true} paragraph={{ rows: 3 }} />
    </div>
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-4">
      <Skeleton.Node className="h-4 w-24" />
      <Skeleton.Button
        active={true}
        size="small"
        className="min-h-11 sm:min-h-8"
      />
    </div>
  </article>
));
DiscoverServerCardSkeleton.displayName = 'DiscoverServerCardSkeleton';

export const DiscoverServerCard: React.FC<DiscoverServerCardProps> = React.memo(
  (props) => {
    const navigate = useNavigate();
    const joinedGroup = useGroupInfo(props.groupId);
    const {
      error,
      loading,
      value: groupBasicInfo,
      refresh,
    } = useAsyncRefresh(async (): Promise<GroupBasicInfo> => {
      const { data } = await postRequest('/group/getGroupBasicInfo', {
        groupId: props.groupId,
      });

      return data;
    }, [props.groupId]);

    const [{ loading: joinLoading }, handleJoin] = useAsyncRequest(async () => {
      await request.post('join', {
        groupId: props.groupId,
      });
    }, [props.groupId]);

    const handleJumpTo = useEvent(() => {
      navigate(`/main/group/${props.groupId}`);
    });

    if (loading) {
      return <DiscoverServerCardSkeleton />;
    }

    if (error || !groupBasicInfo) {
      return (
        <article className="flex min-h-72 items-center overflow-hidden rounded-xl border border-border bg-card p-4">
          <Empty
            className="min-h-0 w-full"
            image={<Icon icon="mdi:account-group-outline" aria-hidden="true" />}
            description={Translate.groupUnavailable}
          >
            <Button
              type="default"
              size="small"
              className="min-h-11 px-4 sm:min-h-8 sm:px-3"
              onClick={refresh}
            >
              {Translate.tryAgain}
            </Button>
          </Empty>
        </article>
      );
    }

    const isJoined = Boolean(joinedGroup);

    return (
      <article className="group flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-primary/40">
        <div className="relative h-16 shrink-0 overflow-visible bg-muted/50">
          <div className="absolute bottom-0 left-5 translate-y-1/2 overflow-hidden rounded-xl ring-4 ring-card">
            <Avatar
              shape="square"
              size={56}
              src={groupBasicInfo.avatar}
              name={groupBasicInfo.name}
            />
          </div>
        </div>
        <div className="px-5 pb-5 pt-10">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {groupBasicInfo.name}
          </h2>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
            {groupBasicInfo.description || Translate.noDescription}
          </p>
        </div>
        <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Icon
              icon="mdi:account-multiple-outline"
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            <span className="truncate tabular-nums">
              {Translate.memberCount.replace(
                '{count}',
                String(groupBasicInfo.memberCount)
              )}
            </span>
          </div>

          {isJoined ? (
            <Button
              size="small"
              type="default"
              className="min-h-11 px-4 sm:min-h-8 sm:px-3"
              onClick={handleJumpTo}
              aria-label={`${Translate.openGroup}: ${groupBasicInfo.name}`}
            >
              {Translate.openGroup}
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              className="min-h-11 px-4 sm:min-h-8 sm:px-3"
              loading={joinLoading}
              onClick={handleJoin}
              aria-label={`${Translate.join}: ${groupBasicInfo.name}`}
            >
              {Translate.join}
            </Button>
          )}
        </footer>
      </article>
    );
  }
);
DiscoverServerCard.displayName = 'DiscoverServerCard';
