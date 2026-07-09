//region plugins/crit/icon-text-managers-direct.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('TextManager / IconManager crit additions (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // both files patch onto the bare `TextManager`/`IconManager` globals RMMZ provides ambiently;
    // stub them as plain objects before importing the patch files.
    globalThis.TextManager = {};
    globalThis.IconManager = {};

    await import('../../../src/plugins/crit/core/managers/TextManager.js');
    await import('../../../src/plugins/crit/core/managers/IconManager.js');
  });

  afterAll(() =>
  {
    delete globalThis.TextManager;
    delete globalThis.IconManager;
  });

  describe('TextManager.critParam', () =>
  {
    it('returns "Crit Amp" for paramId 0 (cdm)', () =>
    {
      expect(globalThis.TextManager.critParam(0)).toBe('Crit Amp');
    });

    it('returns "Crit Block" for paramId 1 (ctr)', () =>
    {
      expect(globalThis.TextManager.critParam(1)).toBe('Crit Block');
    });
  });

  describe('TextManager.critParamDescription', () =>
  {
    it('returns a two-line description for paramId 0 (cdm)', () =>
    {
      expect(globalThis.TextManager.critParamDescription(0)).toEqual([
        'The numeric value to the intensity of one\'s critical hits.',
        'Higher amounts of this yield bigger critical hits.',
      ]);
    });

    it('returns a two-line description for paramId 1 (ctr)', () =>
    {
      expect(globalThis.TextManager.critParamDescription(1)).toEqual([
        'The numeric value to one\'s percent reduction of critical damage.',
        'Enemy critical amp is directly reduced by this amount.',
      ]);
    });
  });

  describe('IconManager.critParam', () =>
  {
    it('returns icon 976 for paramId 0 (cdm)', () =>
    {
      expect(globalThis.IconManager.critParam(0)).toBe(976);
    });

    it('returns icon 977 for paramId 1 (ctr)', () =>
    {
      expect(globalThis.IconManager.critParam(1)).toBe(977);
    });
  });
});
//endregion plugins/crit/icon-text-managers-direct.test.js
