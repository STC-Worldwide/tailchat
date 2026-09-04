import {
  formatHm,
  parseHours,
} from '../web/plugins/com.stcworldwide.projectops/src/shared';

/**
 * These two live in the web plugin's `shared.ts`, which imports nothing from
 * `@capital/*` and so is importable here directly — unlike the panels.
 */
describe('formatHm', () => {
  test.each<[number, string]>([
    [0, '0:00'],
    [8, '8:00'],
    [8.5, '8:30'],
    [0.25, '0:15'],
    [1 / 3, '0:20'],
    [12.75, '12:45'],
  ])('%p -> %p', (input, output) => {
    expect(formatHm(input)).toBe(output);
  });

  test('rounds the total to minutes, never the halves apart', () => {
    // 7.999h is 479.94 minutes. Flooring the hour to 7 and rounding the
    // remainder on its own gives "7:60"; rounding the total first gives 8:00.
    expect(formatHm(7.999)).toBe('8:00');
    expect(formatHm(7.99)).toBe('7:59');
  });

  test('missing and unusable values read as zero, not NaN', () => {
    expect(formatHm(undefined)).toBe('0:00');
    expect(formatHm(null)).toBe('0:00');
    expect(formatHm(Number.NaN)).toBe('0:00');
  });

  test('a negative total keeps its sign on the hour', () => {
    expect(formatHm(-1.5)).toBe('-1:30');
  });
});

describe('parseHours', () => {
  test.each<[string, number]>([
    ['8', 8],
    ['8.5', 8.5],
    ['0.25', 0.25],
    ['8:30', 8.5],
    ['8:00', 8],
    ['0:45', 0.75],
    [' 8 : 30 ', 8.5],
    ['8:20', 8 + 1 / 3],
  ])('%p -> %p', (input, output) => {
    expect(parseHours(input)).toBeCloseTo(output, 10);
  });

  test('h:mm round-trips through formatHm', () => {
    for (const text of ['8:30', '0:05', '10:20', '7:59']) {
      expect(formatHm(parseHours(text)!)).toBe(text);
    }
  });

  test('numbers pass through', () => {
    expect(parseHours(8.5)).toBe(8.5);
    expect(parseHours(0)).toBe(0);
  });

  test.each<[unknown]>([
    [''],
    ['   '],
    ['abc'],
    // 75 is not a minute count. Accepting it would book 9.25h as 8.75h.
    ['8:75'],
    ['8:5'],
    [':30'],
    ['8:'],
    ['-2'],
    [-2],
    ['8.5h'],
    [Number.NaN],
    [null],
    [undefined],
    [{}],
  ])('%p is rejected', (input) => {
    expect(parseHours(input)).toBeNull();
  });
});
