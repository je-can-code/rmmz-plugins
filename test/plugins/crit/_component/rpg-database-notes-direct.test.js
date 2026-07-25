//region plugins/crit/_component/rpg-database-notes-direct.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * RPG_BaseItem.js and RPG_Skill.js only ever reach for `this` (as a note-source with a `.note`)
 * plus the bare `RPGManager`/`J.CRIT.RegExp` globals- a plain function stand-in receiving the
 * patched getters is sufficient, matching the RPG_Skill stand-in used by
 * test/plugins/abs/core/proximity-knockback.test.js's buildNoteSource() helper.
 */
describe('J-CriticalFactors RPG_BaseItem / RPG_Skill note getters (direct src import)', () =>
{
  /** @type {import('vitest').Mock} */
  let getArraysFromNotesByRegexMock;

  /** @type {import('vitest').Mock} */
  let getStringsFromNoteByRegexMock;

  beforeAll(async () =>
  {
    function RPG_BaseItem() {}
    globalThis.RPG_BaseItem = RPG_BaseItem;

    function RPG_Skill() {}
    globalThis.RPG_Skill = RPG_Skill;

    globalThis.J = { CRIT: { RegExp: {
      CritChanceIfState: /critChanceIfState/,
      CritChanceIfStateType: /critChanceIfStateType/,
      CritAlwaysIfState: /critAlwaysIfState/,
      CritAlwaysIfStateType: /critAlwaysIfStateType/,
      ThisCritChanceIfState: /thisCritChanceIfState/,
      ThisCritChanceIfStateType: /thisCritChanceIfStateType/,
      ThisCritsAlwaysIfState: /thisCritsAlwaysIfState/,
      ThisCritsAlwaysIfStateType: /thisCritsAlwaysIfStateType/,
    } } };

    await import('../../../../src/plugins/crit/core/database/RPG_BaseItem.js');
    await import('../../../../src/plugins/crit/core/database/RPG_Skill.js');
  });

  afterAll(() =>
  {
    delete globalThis.RPG_BaseItem;
    delete globalThis.RPG_Skill;
    delete globalThis.J;
  });

  beforeEach(() =>
  {
    getArraysFromNotesByRegexMock = vi.fn(() => []);
    getStringsFromNoteByRegexMock = vi.fn(() => []);
    globalThis.RPGManager = {
      getArraysFromNotesByRegex: getArraysFromNotesByRegexMock,
      getStringsFromNoteByRegex: getStringsFromNoteByRegexMock,
    };
  });

  afterEach(() =>
  {
    delete globalThis.RPGManager;
  });

  describe('RPG_BaseItem', () =>
  {
    it('critChanceIfStates delegates to RPGManager.getArraysFromNotesByRegex with CritChanceIfState', () =>
    {
      const item = new globalThis.RPG_BaseItem();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 4, 10 ] ]);

      expect(item.critChanceIfStates).toEqual([ [ 4, 10 ] ]);
      expect(getArraysFromNotesByRegexMock).toHaveBeenCalledWith(item, globalThis.J.CRIT.RegExp.CritChanceIfState);
    });

    it('critChanceIfStateTypes delegates to RPGManager.getArraysFromNotesByRegex with CritChanceIfStateType', () =>
    {
      const item = new globalThis.RPG_BaseItem();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 'poison', 15 ] ]);

      expect(item.critChanceIfStateTypes).toEqual([ [ 'poison', 15 ] ]);
      expect(getArraysFromNotesByRegexMock)
        .toHaveBeenCalledWith(item, globalThis.J.CRIT.RegExp.CritChanceIfStateType);
    });

    it('critAlwaysIfStates flattens the parsed [ids] arrays into a single state id list', () =>
    {
      const item = new globalThis.RPG_BaseItem();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 4, 5 ], [ 6 ] ]);

      expect(item.critAlwaysIfStates).toEqual([ 4, 5, 6 ]);
    });

    it('critAlwaysIfStateTypes delegates to RPGManager.getStringsFromNoteByRegex with CritAlwaysIfStateType', () =>
    {
      const item = new globalThis.RPG_BaseItem();
      getStringsFromNoteByRegexMock.mockReturnValue([ 'burn' ]);

      expect(item.critAlwaysIfStateTypes).toEqual([ 'burn' ]);
      expect(getStringsFromNoteByRegexMock)
        .toHaveBeenCalledWith(item, globalThis.J.CRIT.RegExp.CritAlwaysIfStateType);
    });
  });

  describe('RPG_Skill', () =>
  {
    it('thisCritChanceIfStates delegates to RPGManager.getArraysFromNotesByRegex with ThisCritChanceIfState', () =>
    {
      const skill = new globalThis.RPG_Skill();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 4, 10 ] ]);

      expect(skill.thisCritChanceIfStates).toEqual([ [ 4, 10 ] ]);
      expect(getArraysFromNotesByRegexMock)
        .toHaveBeenCalledWith(skill, globalThis.J.CRIT.RegExp.ThisCritChanceIfState);
    });

    it('thisCritChanceIfStateTypes delegates to RPGManager.getArraysFromNotesByRegex with ThisCritChanceIfStateType', () =>
    {
      const skill = new globalThis.RPG_Skill();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 'poison', 15 ] ]);

      expect(skill.thisCritChanceIfStateTypes).toEqual([ [ 'poison', 15 ] ]);
      expect(getArraysFromNotesByRegexMock)
        .toHaveBeenCalledWith(skill, globalThis.J.CRIT.RegExp.ThisCritChanceIfStateType);
    });

    it('thisCritsAlwaysIfStates flattens the parsed [ids] arrays into a single state id list', () =>
    {
      const skill = new globalThis.RPG_Skill();
      getArraysFromNotesByRegexMock.mockReturnValue([ [ 1 ], [ 2, 3 ] ]);

      expect(skill.thisCritsAlwaysIfStates).toEqual([ 1, 2, 3 ]);
    });

    it('thisCritsAlwaysIfStateTypes delegates to RPGManager.getStringsFromNoteByRegex with ThisCritsAlwaysIfStateType', () =>
    {
      const skill = new globalThis.RPG_Skill();
      getStringsFromNoteByRegexMock.mockReturnValue([ 'frost' ]);

      expect(skill.thisCritsAlwaysIfStateTypes).toEqual([ 'frost' ]);
      expect(getStringsFromNoteByRegexMock)
        .toHaveBeenCalledWith(skill, globalThis.J.CRIT.RegExp.ThisCritsAlwaysIfStateType);
    });
  });
});
//endregion plugins/crit/_component/rpg-database-notes-direct.test.js
