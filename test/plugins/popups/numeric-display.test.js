//region plugins/popups/numeric-display.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('PopupNumericDisplay.formatNumericPopupDisplayString (out/popups/J-Popups.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPopupsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('rounds float dust on plain decimals', () =>
  {
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('12.000000000000001')).toBe('12');
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString(11.9999999999998)).toBe('12');
  });

  it('preserves letter-bearing labels', () =>
  {
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('PARRY x3')).toBe('PARRY x3');
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('Missed')).toBe('Missed');
  });

  it('normalizes signed integers', () =>
  {
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('-9')).toBe('-9');
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('-9.000000000000002')).toBe('-9');
  });

  it('shows healing/regen as +magnitude when flagged', () =>
  {
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('-9', true)).toBe('+9');
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('9', true)).toBe('+9');
    expect(sandbox.PopupNumericDisplay.formatNumericPopupDisplayString('-9.000000000000002', true)).toBe('+9');
  });
});
//endregion plugins/popups/numeric-display.test.js