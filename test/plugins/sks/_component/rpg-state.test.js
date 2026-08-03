//region plugins/sks/_component/rpg-state.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import RPGManager from '../../../../src/plugins/_base/core/managers/RPGManager.js';

describe('RPG_State (src/plugins/sks/core/database/RPG_State.js)', () =>
{
  /** @type {typeof import('../../../../src/plugins/sks/core/database/RPG_State.js')} */
  let RPG_State;

  beforeAll(async () =>
  {
    // RPG_State.js is a pure prototype-patch file: it references RPG_State, RPGManager, and
    // J.SKS.RegExp.SlotCostModifier as bare (undeclared) globals rather than importing them. Stub
    // those globals before the dynamic import evaluates the module, since a static import would be
    // hoisted ahead of any setup.
    globalThis.RPG_State = class RPG_StateStub
    {
    };

    // use the genuine RPGManager implementation so this test exercises real note-parsing behavior.
    globalThis.RPGManager = RPGManager;

    globalThis.J = {
      SKS: {
        RegExp: {
          SlotCostModifier: /<slotCostModifier:[ ]?(-?\d+)>/i,
        },
      },
    };

    await import('../../../../src/plugins/sks/core/database/RPG_State.js');

    ({ RPG_State } = globalThis);
  });

  afterAll(() =>
  {
    delete globalThis.RPG_State;
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  /**
   * Builds a plain object that behaves like an RPG_State instance for note-tag parsing purposes.
   * @param {object} props Properties to assign onto the state, most importantly `note`.
   * @returns {object}
   */
  function stateData(props)
  {
    return Object.assign(Object.create(RPG_State.prototype), props);
  }

  describe('slotCostModifier', () =>
  {
    it('parses a positive slotCostModifier notetag', () =>
    {
      const state = stateData({ note: '<slotCostModifier:2>' });

      expect(state.slotCostModifier).toBe(2);
    });

    it('parses a negative slotCostModifier notetag', () =>
    {
      const state = stateData({ note: '<slotCostModifier:-1>' });

      expect(state.slotCostModifier).toBe(-1);
    });

    it('defaults to 0 when no slotCostModifier notetag is present', () =>
    {
      const state = stateData({ note: '' });

      expect(state.slotCostModifier).toBe(0);
    });
  });
});
//endregion plugins/sks/_component/rpg-state.test.js
