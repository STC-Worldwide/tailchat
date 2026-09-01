import { render, screen } from '@testing-library/react';
import React from 'react';
import { SettingsPerformance } from '../Performance';

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
}));

jest.mock('@/utils/measure-helper', () => ({
  measure: {
    getVitals: () => ({ FCP: 12.345, clsRatio: 0.425 }),
    getRecord: () => ({ boot: 124.6 }),
    getTimeUsage: () => ({ phase: 'pending' }),
  },
}));

describe('SettingsPerformance', () => {
  test('formats timing, ratio, and non-numeric metrics for scanning', () => {
    render(<SettingsPerformance />);

    expect(screen.getByText('12.3 ms')).toBeTruthy();
    expect(screen.getByText('42.5%')).toBeTruthy();
    expect(screen.getByText('125 ms')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();
  });
});
