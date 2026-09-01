import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import {
  createMetaFormSchema,
  metaFormFieldSchema,
  WebMetaForm,
} from 'tailchat-design';
import { registerShadcnMetaForm } from '../../forms/ShadcnMetaForm';
import { getClaimTemporaryUserFields } from '../ClaimTemporaryUser';

jest.mock('tailchat-shared', () => ({
  claimTemporaryUser: jest.fn(),
  getGlobalConfig: () => ({ emailVerification: true }),
  model: {
    user: {
      verifyEmail: jest.fn(),
    },
  },
  showErrorToasts: jest.fn(),
  t: (key: string) => key,
  useAppDispatch: () => jest.fn(),
  useAsyncRequest: (callback: (...args: unknown[]) => unknown) => [
    { loading: false },
    callback,
  ],
  userActions: {
    setUserInfo: jest.fn(),
  },
}));

jest.mock('../../Modal', () => ({
  ModalWrapper: ({ children }: { children: React.ReactNode }) => children,
}));

beforeAll(() => {
  registerShadcnMetaForm();
});

describe('ClaimTemporaryUser OTP field', () => {
  test('associates the custom OTP input with its label and validation error', async () => {
    const schema = createMetaFormSchema({
      emailOTP: metaFormFieldSchema.string().length(6, 'OTP must be 6 digits'),
    });

    render(
      <WebMetaForm
        fields={getClaimTemporaryUserFields().filter(
          (field) => field.name === 'emailOTP'
        )}
        schema={schema}
        initialValues={{ emailOTP: '1' }}
        submitLabel="Continue"
        onSubmit={jest.fn()}
      />
    );

    const input = screen.getByLabelText('邮箱校验码');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    const error = await screen.findByRole('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.textContent).toContain('OTP must be 6 digits');
  });
});
