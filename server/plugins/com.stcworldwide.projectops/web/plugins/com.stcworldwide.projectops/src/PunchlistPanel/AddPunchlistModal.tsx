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
import { punchlistRequest } from '../request';
import { PUNCH_PRIORITIES } from '../shared';

const schema = createFastFormSchema({
  title: fieldSchema.string().required(Translate.titleRequired),
  description: fieldSchema.string(),
  priority: fieldSchema.string(),
  deviceName: fieldSchema.string(),
  systemName: fieldSchema.string(),
  pointName: fieldSchema.string(),
});

/**
 * Asset fields are free text rather than pickers.
 *
 * Field naming drifts — a box is 'N-TB-0118' on the sheet, 'NTB0118' in a
 * message — and a form that rejects the second spelling just moves the
 * deficiency into someone's notebook.
 */
const fields = [
  { type: 'text', name: 'title', label: Translate.title },
  { type: 'textarea', name: 'description', label: Translate.description },
  {
    type: 'select',
    name: 'priority',
    label: Translate.priority,
    options: PUNCH_PRIORITIES.map((value) => ({ label: value, value })),
  },
  { type: 'text', name: 'deviceName', label: Translate.device },
  { type: 'text', name: 'systemName', label: Translate.system },
  { type: 'text', name: 'pointName', label: 'Point' },
];

export const AddPunchlistModal: React.FC<{
  groupId: string;
  onSuccess?: () => void;
}> = React.memo((props) => {
  const handleSubmit = async (values: any) => {
    try {
      await punchlistRequest.post('add', {
        ...values,
        groupId: props.groupId,
      });

      showToasts(Translate.saved, 'success');
      props.onSuccess?.();
    } catch (err) {
      showErrorToasts(err);
    }
  };

  return (
    <ModalWrapper title={Translate.newItem}>
      <WebFastForm
        schema={schema}
        fields={fields}
        initialValues={{ priority: 'normal' }}
        onSubmit={handleSubmit}
      />
    </ModalWrapper>
  );
});
AddPunchlistModal.displayName = 'AddPunchlistModal';
