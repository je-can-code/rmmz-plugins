//region plugins/sdp/vm-rpg-rows
import vm from 'node:vm';

import { newVmRpgEnemy } from '../drops/vm-rpg-enemy.js';

/**
 * Builds a J-Base {@link RPG_Item} wrapper inside the plugin VM.
 *
 * @param {object} sandbox
 * @param {Record<string, unknown>} overrides Raw database fields merged onto a minimal item row.
 * @returns {object}
 */
export function newVmRpgItem(sandbox, overrides = {})
{
  const raw = {
    id: 1,
    meta: null,
    name: 'TestItem',
    note: '',
    animationId: 0,
    consumable: true,
    damage: {
      type: 1,
      elementId: 0,
      formula: '0',
      variance: 20,
      critical: false,
    },
    effects: [],
    hitType: 0,
    iconIndex: 0,
    itypeId: 1,
    occasion: 0,
    price: 0,
    repeats: 1,
    scope: 0,
    speed: 0,
    successRate: 100,
    tpGain: 0,
    ...overrides,
  };

  vm.runInContext(
    `globalThis.__jeRpgItemTest = new RPG_Item(${JSON.stringify(raw)}, 0);`,
    sandbox,
  );

  return sandbox.__jeRpgItemTest;
}

export { newVmRpgEnemy };
//endregion plugins/sdp/vm-rpg-rows
