import React from 'react';
import {
  createFastFormSchema,
  fieldSchema,
  ModalWrapper,
  showToasts,
  showErrorToasts,
} from '@capital/common';
import { WebFastForm } from '@capital/component';
import { Translate } from '../translate';
import { timesheetRequest } from '../request';
import { AREAS, HOUR_TYPES, TASK_TYPES } from '../shared';

const schema = createFastFormSchema({
  workDate: fieldSchema.string().required(),
  // fieldSchema exposes only string/ref/mixed — there is no number(), and
  // calling one throws while the schema is built at module load, which takes
  // the whole panel down. Values are coerced with Number() on submit.
  hours: fieldSchema.mixed().required(Translate.hoursRequired),
  area: fieldSchema.string(),
  taskType: fieldSchema.string(),
  hourType: fieldSchema.string(),
  description: fieldSchema.string(),
});

const fields = [
  { type: 'text', name: 'workDate', label: Translate.date },
  // 'number' is not a registered field type — only text/textarea/password/
  // select/checkbox/custom are, and an unregistered type renders nothing at
  // all, so the field silently vanishes. Coerced with Number() on submit.
  { type: 'text', name: 'hours', label: Translate.hours },
  {
    type: 'select',
    name: 'area',
    label: Translate.area,
    options: AREAS.map((value) => ({ label: value, value })),
  },
  {
    type: 'select',
    name: 'taskType',
    label: Translate.taskType,
    options: TASK_TYPES.map((value) => ({ label: value, value })),
  },
  {
    type: 'select',
    name: 'hourType',
    label: Translate.hourType,
    options: HOUR_TYPES.map((value) => ({ label: value, value })),
  },
  { type: 'textarea', name: 'description', label: Translate.work },
];

/** Today, as yyyy-mm-dd in local time — not toISOString, which is UTC. */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
}

export const AddTimesheetModal: React.FC<{
  groupId: string;
  onSuccess?: () => void;
}> = React.memo((props) => {
  const handleSubmit = async (values: any) => {
    try {
      await timesheetRequest.post('add', {
        ...values,
        hours: Number(values.hours),
        groupId: props.groupId,
      });

      showToasts(Translate.saved, 'success');
      props.onSuccess?.();
    } catch (err) {
      showErrorToasts(err);
    }
  };

  return (
    <ModalWrapper title={Translate.logHours}>
      <WebFastForm
        schema={schema}
        fields={fields}
        initialValues={{
          workDate: today(),
          hourType: 'regular',
          taskType: 'Checkout',
        }}
        onSubmit={handleSubmit}
      />
    </ModalWrapper>
  );
});
AddTimesheetModal.displayName = 'AddTimesheetModal';
