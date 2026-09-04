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
import { partsRequest } from '../request';
import { PART_STATUSES } from '../shared';

const schema = createFastFormSchema({
  description: fieldSchema.string().required(Translate.descriptionRequired),
  manufacturer: fieldSchema.string(),
  partNumber: fieldSchema.string(),
  // fieldSchema has no number() — see AddTimesheetModal.
  quantity: fieldSchema.mixed(),
  status: fieldSchema.string(),
  supplier: fieldSchema.string(),
  poNumber: fieldSchema.string(),
  unitCost: fieldSchema.mixed(),
  deviceName: fieldSchema.string(),
});

const fields = [
  { type: 'text', name: 'description', label: Translate.description },
  { type: 'text', name: 'manufacturer', label: Translate.manufacturer },
  { type: 'text', name: 'partNumber', label: Translate.partNumber },
  { type: 'number', name: 'quantity', label: Translate.quantity },
  {
    type: 'select',
    name: 'status',
    label: Translate.status,
    options: PART_STATUSES.map((value) => ({ label: value, value })),
  },
  { type: 'text', name: 'supplier', label: 'Supplier' },
  { type: 'text', name: 'poNumber', label: Translate.poNumber },
  { type: 'number', name: 'unitCost', label: 'Unit cost' },
  { type: 'text', name: 'deviceName', label: Translate.destination },
];

export const AddPartModal: React.FC<{
  groupId: string;
  onSuccess?: () => void;
}> = React.memo((props) => {
  const handleSubmit = async (values: any) => {
    try {
      await partsRequest.post('add', {
        ...values,
        quantity: values.quantity ? Number(values.quantity) : 1,
        unitCost: values.unitCost ? Number(values.unitCost) : undefined,
        groupId: props.groupId,
      });

      showToasts(Translate.saved, 'success');
      props.onSuccess?.();
    } catch (err) {
      showErrorToasts(err);
    }
  };

  return (
    <ModalWrapper title={Translate.addPart}>
      <WebFastForm
        schema={schema}
        fields={fields}
        initialValues={{ status: 'needed', quantity: 1 }}
        onSubmit={handleSubmit}
      />
    </ModalWrapper>
  );
});
AddPartModal.displayName = 'AddPartModal';
