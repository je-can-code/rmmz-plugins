//region plugins/drops/rpg-enemy.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadDropsControlPluginVm, resetDropsControlPluginSandbox } from './drops-vm.js';
import { newVmRpgEnemy } from './vm-rpg-enemy.js';

describe('J-DropsControl RPG_Enemy (out/J-DropsControl.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDropsControlPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetDropsControlPluginSandbox(sandbox);
  });

  it('appends drops parsed from note tags onto dropItems during initMembers', () =>
  {
    const rpg = newVmRpgEnemy(sandbox, {
      note: '<drops:[i,3,40]>',
    });

    expect(rpg.dropItems.length).toBe(1);
    expect(rpg.dropItems[0].kind).toBe(sandbox.RPG_DropItem.Types.Item);
    expect(rpg.dropItems[0].dataId).toBe(3);
    expect(rpg.dropItems[0].denominator).toBe(40);
  });
});
//endregion plugins/drops/rpg-enemy.test.js
