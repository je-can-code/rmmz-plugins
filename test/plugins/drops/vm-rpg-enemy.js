//region plugins/drops/vm-rpg-enemy
import vm from 'node:vm';

/**
 * Builds a J-Base {@link RPG_Enemy} wrapper inside the plugin VM (`class` is not constructible from Node).
 *
 * @param {object} sandbox
 * @param {Record<string, unknown>} overrides Raw database fields merged onto a minimal enemy row.
 * @returns {object}
 */
export function newVmRpgEnemy(sandbox, overrides = {})
{
  const raw = {
    id: 1,
    meta: null,
    name: 'TestEnemy',
    note: '',
    battlerName: '',
    traits: [],
    actions: [],
    dropItems: [],
    exp: 0,
    gold: 0,
    params: [ 100, 0, 10, 10, 10, 10, 10, 10 ],
    battlerHue: 0,
    ...overrides,
  };

  vm.runInContext(
    `globalThis.__jeRpgEnemyTest = new RPG_Enemy(${JSON.stringify(raw)}, 0);`,
    sandbox,
  );

  return sandbox.__jeRpgEnemyTest;
}
//endregion plugins/drops/vm-rpg-enemy
