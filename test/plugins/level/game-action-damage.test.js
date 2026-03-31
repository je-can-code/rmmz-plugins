//region plugins/level/game-action-damage.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster Game_Action.makeDamageValue (out/J-LevelMaster.js)', () =>
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

  it('multiplies base damage by LevelScaling for subject vs target levels', () =>
  {
    sandbox.$gameSystem = new sandbox.Game_System();
    sandbox.$gameSystem.initialize();

    const action = new sandbox.Game_Action();
    action.__subject = { level: 20 };

    const target = { level: 10 };
    const scaled = action.makeDamageValue(target, false);

    expect(scaled).toBe(190);
  });
});
//endregion plugins/level/game-action-damage.test.js
