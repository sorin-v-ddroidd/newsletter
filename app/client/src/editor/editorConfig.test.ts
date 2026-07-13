import { describe, expect, it } from 'vitest';
import { composePaddingShorthand } from './editorConfig';

describe('composePaddingShorthand', () => {
  it('collapses to 1 value when all sides are equal', () => {
    expect(composePaddingShorthand('10px', '10px', '10px', '10px')).toBe('10px');
  });

  it('collapses to 2 values when top==bottom and right==left', () => {
    expect(composePaddingShorthand('10px', '25px', '10px', '25px')).toBe('10px 25px');
  });

  it('collapses to 3 values when right==left but top!=bottom', () => {
    expect(composePaddingShorthand('10px', '25px', '30px', '25px')).toBe('10px 25px 30px');
  });

  it('keeps all 4 values when all sides are distinct', () => {
    expect(composePaddingShorthand('1px', '2px', '3px', '4px')).toBe('1px 2px 3px 4px');
  });
});
