import React, { useCallback, useMemo, useState } from 'react';
import { useGroupInfo } from '@capital/common';
import {
  Button,
  Checkbox,
  Input,
  ModalWrapper,
  UserName,
  closeModal,
  openModal,
} from '@capital/component';
import { Translate } from '../translate';

export interface ApprovalStage {
  id: string;
  name: string;
  roleIds: string[];
  userIds: string[];
}

/** Enough uniqueness for a list key; the server re-derives ids it does not get. */
function newStageId(): string {
  return `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

function parseStages(value: unknown): ApprovalStage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, any> => Boolean(item))
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `stage-${index}`,
      name: typeof item.name === 'string' ? item.name : '',
      roleIds: Array.isArray(item.roleIds) ? item.roleIds : [],
      userIds: Array.isArray(item.userIds) ? item.userIds : [],
    }));
}

/**
 * The approval chain editor.
 *
 * Stages are ordered and an entry walks them one at a time, so the editor is a
 * list with move controls rather than a set of checkboxes — the order is the
 * setting, as much as the membership is.
 */
const ApprovalChainEditor: React.FC<{
  groupId: string;
  initial: ApprovalStage[];
  onSave: (stages: ApprovalStage[]) => void;
}> = React.memo(({ groupId, initial, onSave }) => {
  // groupId is threaded through as a prop: group settings render outside
  // GroupIdContext, and openModal portals this editor out of the tree anyway.
  const groupInfo = useGroupInfo(groupId);
  const [stages, setStages] = useState<ApprovalStage[]>(initial);

  const roles = groupInfo?.roles ?? [];
  const members = groupInfo?.members ?? [];

  const update = useCallback(
    (id: string, patch: Partial<ApprovalStage>) =>
      setStages((current) =>
        current.map((stage) =>
          stage.id === id ? { ...stage, ...patch } : stage
        )
      ),
    []
  );

  const toggle = useCallback(
    (stage: ApprovalStage, field: 'roleIds' | 'userIds', value: string) => {
      const list = stage[field];
      update(stage.id, {
        [field]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value],
      } as Partial<ApprovalStage>);
    },
    [update]
  );

  const move = useCallback((index: number, delta: number) => {
    setStages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // A stage with no name would be dropped by the server, so saying so here is
  // better than saving something that silently disappears.
  const unnamed = useMemo(
    () => stages.some((stage) => stage.name.trim() === ''),
    [stages]
  );

  return (
    <div style={{ padding: 16, minWidth: 460, maxWidth: 620 }}>
      <p style={{ opacity: 0.7, fontSize: 13, marginTop: 0 }}>
        {Translate.approvalChainHelp}
      </p>

      {stages.length === 0 && (
        <div
          style={{
            padding: '18px 12px',
            marginBottom: 12,
            textAlign: 'center',
            fontSize: 13,
            opacity: 0.7,
            border: '1px dashed rgba(127,127,127,.35)',
            borderRadius: 8,
          }}
        >
          {Translate.approvalOff}
        </div>
      )}

      {stages.map((stage, index) => (
        <div
          key={stage.id}
          style={{
            border: '1px solid rgba(127,127,127,.25)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ opacity: 0.55, fontSize: 12, minWidth: 18 }}>
              {index + 1}
            </span>
            <Input
              value={stage.name}
              placeholder={Translate.stageNamePlaceholder}
              onChange={(e: any) =>
                update(stage.id, { name: e?.target?.value ?? '' })
              }
            />
            <Button
              size="small"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              size="small"
              disabled={index === stages.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
            <Button
              size="small"
              danger
              onClick={() =>
                setStages((current) =>
                  current.filter((item) => item.id !== stage.id)
                )
              }
            >
              {Translate.removeStage}
            </Button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
            {Translate.approverRoles}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 8,
            }}
          >
            {roles.length === 0 ? (
              <span style={{ fontSize: 12, opacity: 0.55 }}>
                {Translate.noRoles}
              </span>
            ) : (
              roles.map((role: any) => (
                <Checkbox
                  key={role._id}
                  checked={stage.roleIds.includes(String(role._id))}
                  onChange={() => toggle(stage, 'roleIds', String(role._id))}
                >
                  <span style={{ fontSize: 13 }}>{role.name}</span>
                </Checkbox>
              ))
            )}
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
            {Translate.approverUsers}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {members.map((member: any) => (
              <Checkbox
                key={member.userId}
                checked={stage.userIds.includes(String(member.userId))}
                onChange={() => toggle(stage, 'userIds', String(member.userId))}
              >
                <span style={{ fontSize: 13 }}>
                  <UserName userId={String(member.userId)} />
                </span>
              </Checkbox>
            ))}
          </div>

          {stage.roleIds.length === 0 && stage.userIds.length === 0 && (
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
              {Translate.stageOpenToAnyone}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button
          onClick={() =>
            setStages((current) => [
              ...current,
              { id: newStageId(), name: '', roleIds: [], userIds: [] },
            ])
          }
        >
          {Translate.addStage}
        </Button>
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          disabled={unnamed}
          onClick={() => onSave(stages)}
        >
          {unnamed ? Translate.stageNeedsName : Translate.save}
        </Button>
      </div>
    </div>
  );
});
ApprovalChainEditor.displayName = 'ApprovalChainEditor';

/**
 * The row Tailchat renders in Group Settings. It summarises the chain and
 * opens the editor, because a multi-stage list does not fit in a settings row.
 */
export const ApprovalChainField: React.FC<{
  value: any;
  onChange: (value: unknown) => void;
  loading: boolean;
  groupId: string;
}> = React.memo(({ value, onChange, loading, groupId }) => {
  const stages = useMemo(() => parseStages(value), [value]);

  const summary =
    stages.length === 0
      ? Translate.approvalOff
      : stages.map((stage) => stage.name).join(' → ');

  const handleOpen = useCallback(() => {
    const key = openModal(
      <ModalWrapper title={Translate.timesheetApproval}>
        <ApprovalChainEditor
          groupId={groupId}
          initial={stages}
          onSave={(next) => {
            onChange(
              next.map((stage) => ({
                id: stage.id,
                name: stage.name.trim(),
                roleIds: stage.roleIds,
                userIds: stage.userIds,
              }))
            );
            closeModal(key);
          }}
        />
      </ModalWrapper>
    );
  }, [stages, onChange, groupId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 13, opacity: stages.length ? 1 : 0.6 }}>
        {summary}
      </span>
      <Button size="small" disabled={loading} onClick={handleOpen}>
        {Translate.edit}
      </Button>
    </div>
  );
});
ApprovalChainField.displayName = 'ApprovalChainField';
