//region plugins/omni/ext/monster/database/_component/rpg-enemy.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * RPG_Enemy.js patches the bare-global RPG_Enemy.prototype with three getters, each of which is a thin
 * pass-through to a distinct RPGManager note-parsing method keyed by a J.OMNI.EXT.MONSTER.RegExp entry.
 * Following the convention used elsewhere for bare-global database patches: install a placeholder
 * RPG_Enemy constructor, a distinguishable RegExp namespace, and a spyable RPGManager, then import the
 * file under test directly so it patches the real (test-realm) RPG_Enemy.prototype.
 */
describe('RPG_Enemy (omni ext/monster database, direct src import)', () =>
{
  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't re-throw on prototype redefinition.
    vi.resetModules();

    // a bare placeholder constructor standing in for the RMMZ-provided RPG_Enemy global.
    function RPG_Enemy()
    {
    }

    globalThis.RPG_Enemy = RPG_Enemy;

    // one distinct placeholder object per regex so the mocked RPGManager can identify which
    // tag lookup is in flight by object identity, same technique as HealEventManager's suite.
    globalThis.J = {
      OMNI: {
        EXT: {
          MONSTER: {
            RegExp: {
              HideFromMonsterpedia: {},
              MonsterpediaFamilyIcon: {},
              MonsterpediaDescription: {},
            },
          },
        },
      },
    };

    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: vi.fn(),
      getNumberFromNoteByRegex: vi.fn(),
      getStringsFromNoteByRegex: vi.fn(),
    };

    // the file under test- patches globalThis.RPG_Enemy.prototype directly, no vm involved.
    await import('../../../../../../../src/plugins/omni/ext/monster/database/RPG_Enemy.js');
  });

  afterAll(() =>
  {
    delete globalThis.RPG_Enemy;
    delete globalThis.J;
    delete globalThis.RPGManager;
  });

  it('hideFromMonsterpedia delegates to RPGManager.checkForBooleanFromNoteByRegex with the HideFromMonsterpedia tag', () =>
  {
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

    const enemy = new globalThis.RPG_Enemy();

    expect(enemy.hideFromMonsterpedia).toBe(true);
    expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex).toHaveBeenCalledWith(
      enemy,
      globalThis.J.OMNI.EXT.MONSTER.RegExp.HideFromMonsterpedia);
  });

  it('monsterFamilyIcon delegates to RPGManager.getNumberFromNoteByRegex with the MonsterpediaFamilyIcon tag', () =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(42);

    const enemy = new globalThis.RPG_Enemy();

    expect(enemy.monsterFamilyIcon).toBe(42);
    expect(globalThis.RPGManager.getNumberFromNoteByRegex).toHaveBeenCalledWith(
      enemy,
      globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaFamilyIcon);
  });

  it('monsterpediaDescription delegates to RPGManager.getStringsFromNoteByRegex with the MonsterpediaDescription tag', () =>
  {
    globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue([ 'line1', 'line2' ]);

    const enemy = new globalThis.RPG_Enemy();

    expect(enemy.monsterpediaDescription).toEqual([ 'line1', 'line2' ]);
    expect(globalThis.RPGManager.getStringsFromNoteByRegex).toHaveBeenCalledWith(
      enemy,
      globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription);
  });
});
//endregion plugins/omni/ext/monster/database/_component/rpg-enemy.test.js
