//region plugins/level/level-regexp.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster J.LEVEL.RegExp (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('Level accepts lv, lvl, and level keys with optional sign', () =>
  {
    const { Level } = sandbox.J.LEVEL.RegExp;

    expect(Level.exec('<level:5>')[1]).toBe('5');
    expect(Level.exec('<lvl:+12>')[1]).toBe('+12');
    expect(Level.exec('<LV:-3>')[1]).toBe('-3');
  });

  it('Learning captures a bracket pair of ids', () =>
  {
    const { Learning } = sandbox.J.LEVEL.RegExp;
    const m = Learning.exec('<learning:[99, 10]>');

    expect(m[1]).toBe('[99, 10]');
  });

  it('MaxLevelBoost captures signed integers', () =>
  {
    const { MaxLevelBoost } = sandbox.J.LEVEL.RegExp;

    expect(MaxLevelBoost.exec('<maxLevelBoost:+25>')[1]).toBe('+25');
    expect(MaxLevelBoost.exec('<maxLevelBoost: -7>')[1]).toBe('-7');
  });

  it('HideLevel matches the tag name only', () =>
  {
    expect(sandbox.J.LEVEL.RegExp.HideLevel.test('<hideLevel>')).toBe(true);
    expect(sandbox.J.LEVEL.RegExp.HideLevel.test('<HideLevel>')).toBe(true);
    expect(sandbox.J.LEVEL.RegExp.HideLevel.test('<level:1>')).toBe(false);
  });
});
//endregion plugins/level/level-regexp.test.js
