//region plugins/abs/core/_component/game-battler-on-chance-effects.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * A state typed as crowd control but not as negative: help, resisted by `<stateTypeResist:[cc, PCT]>`.
 * @type {number}
 */
const HELP_STATE_ID = 61;

/**
 * A state typed as both negative and crowd control: harm, resisted by `<stateTypeResist:[cc, PCT]>`.
 * @type {number}
 */
const HARM_STATE_ID = 62;

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  battler.name = () => 'TestBattler';
  return battler;
}

/**
 * Builds a real Game_Battler-backed battler for an evasion's state rolls. Its type resistances and lucky and cursed
 * rolls are the shipped Game_Battler's own, reading the given notes. Vanilla's LUK and State Rate are not loaded in
 * this realm, so both are given outright, and its adds are recorded rather than performed.
 * @param {object} [options] The battler's makeup.
 * @param {string[]} [options.notes] Raw note strings, one per source.
 * @param {number} [options.luk] The battler's LUK.
 * @param {number} [options.stateRate] What its State Rate traits answer for any state.
 * @param {number} [options.positiveRolls] Its battler-wide lucky rolls.
 * @param {number} [options.negativeRolls] Its battler-wide cursed rolls.
 * @returns {object}
 */
function buildRollingBattler(options = {})
{
  const {
    notes = [],
    luk = 0,
    stateRate = 1,
    positiveRolls = 0,
    negativeRolls = 0,
  } = options;

  const battler = buildBattler(notes);
  battler.luk = luk;
  battler.stateRate = () => stateRate;
  battler.setPositiveRolls(positiveRolls);
  battler.setNegativeRolls(negativeRolls);
  battler.addState = vi.fn();

  return battler;
}

/**
 * Registers a real RPG_State row whose note carries the given tags, so its type classifiers parse. A note yields one
 * match of a tag per line, so a row typed twice puts each type on a line of its own.
 * @param {number} stateId The id to register the row under.
 * @param {string} note The note text.
 */
function registerStateRow(stateId, note)
{
  const row = Object.create(globalThis.RPG_State.prototype);
  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only by the constructor, which Object.create() skips.
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;
}

/**
 * Registers the two states an evasion rolls in these tests, and under each of their ids a skill carrying 4 lucky and
 * 5 cursed rolls of its own. An evasion is not a skill the evader uses, so those skills never weigh on its rolls; a
 * roll that read the skill sharing its state's id would show 4 more chances and 5 more hurdles.
 */
function registerEvadeRows()
{
  globalThis.$dataStates = [ null ];
  globalThis.$dataSkills = [ null ];

  registerStateRow(HELP_STATE_ID, '<type:cc>');
  registerStateRow(HARM_STATE_ID, '<type:negative>\n<type:cc>');

  [ HELP_STATE_ID, HARM_STATE_ID ].forEach(stateId =>
  {
    globalThis.$dataSkills[stateId] = {
      id: stateId,
      note: '<thisLuckyRolls:[4]><thisCursedRolls:[5]>',
    };
  });
}

describe('J-ABS Game_Battler on-chance effects (direct src import)', () =>
{
  let JABS_AiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // an evasion's state rolls read each state's type classifiers off a real RPG_State row.
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // J-ABS's RPG_State.js lays down the negative classifier an evasion's state roll reads for harm or help.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    // RPGManager.getOnChanceEffectsFromDatabaseObjects constructs this as a bare global.
    ({ default: globalThis.JABS_OnChanceEffect } = await import('../../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js'));

    // Game_Battler.js's onEvade imports this for real (not via globalThis)- register test
    // doubles directly on its real static `battlers` Map rather than stubbing a global.
    ({ default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('note-driven on-chance effect getters', () =>
  {
    it('retaliationSkills parses <retaliate:[id, chance]> tags into effects', () =>
    {
      // Arrange
      const battler = buildBattler([ '<retaliate:[12, 50]>' ]);

      // Act
      const effects = battler.retaliationSkills();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(12);
      expect(effects[0].chance).toBe(50);
    });

    it('retaliationSkills is empty with no matching tags', () =>
    {
      expect(buildBattler().retaliationSkills()).toEqual([]);
    });

    it('onOwnDefeatSkillIds parses <onOwnDefeat:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onOwnDefeat:[3, 100]>' ]);

      // Act
      const effects = battler.onOwnDefeatSkillIds();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(3);
    });

    it('onTargetDefeatSkillIds parses <onTargetDefeat:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onTargetDefeat:[4, 25]>' ]);

      // Act
      const effects = battler.onTargetDefeatSkillIds();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(4);
    });

    it('onEvadeApplySelfEffects parses <onEvadeApplySelf:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeApplySelf:[5, 10]>' ]);

      // Act
      const effects = battler.onEvadeApplySelfEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(5);
    });

    it('onEvadeApplyAttackerEffects parses <onEvadeApply:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeApply:[6, 20]>' ]);

      // Act
      const effects = battler.onEvadeApplyAttackerEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(6);
    });

    it('onEvadeExecuteEffects parses <onEvadeExecute:[id, chance]> tags', () =>
    {
      // Arrange
      const battler = buildBattler([ '<onEvadeExecute:[7, 30]>' ]);

      // Act
      const effects = battler.onEvadeExecuteEffects();

      // Assert
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(7);
    });
  });

  describe('processOnEvadeStateSelf', () =>
  {
    beforeEach(() =>
    {
      registerEvadeRows();
    });

    it('does nothing when there are no self-targeting evade effects', () =>
    {
      // Arrange
      const battler = buildBattler();
      const addStateSpy = vi.spyOn(battler, 'addState');

      // Act
      battler.processOnEvadeStateSelf();

      // Assert
      expect(addStateSpy).not.toHaveBeenCalled();
      addStateSpy.mockRestore();
    });

    it('rolls each state against the evader\'s own resistances, with no luck edge over itself and its fate once', () =>
    {
      // Arrange- the state is harm, so a curse counted a second time, as the recipient's, would show as 3 more
      // chances; its high LUK would show as an edge if it held one over itself. The skill sharing the state's id is
      // never read.
      const evader = buildRollingBattler({
        notes: [ `<onEvadeApplySelf:[${HARM_STATE_ID}, 40]>`, '<stateTypeResist:[cc, 25]>' ],
        luk: 110,
        stateRate: 0.5,
        positiveRolls: 2,
        negativeRolls: 3,
      });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateSelf();

      // Assert- 40 x 0.5 x 0.75 = 15; 1 + 2 chances of its own, then its own 3 curses, once.
      expect(procSpy).toHaveBeenCalledWith(evader, 15, 3, 3);
      procSpy.mockRestore();
    });

    it('applies the state to self once per landing', () =>
    {
      // Arrange
      const evader = buildRollingBattler({ notes: [ `<onEvadeApplySelf:[${HELP_STATE_ID}, 40]>` ] });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(2);

      // Act
      evader.processOnEvadeStateSelf();

      // Assert- the evader names itself as the source. that argument is what routes the application through JABS
      // rather than vanilla, so pinning the id alone would pass on a state that lands inert and never expires.
      expect(evader.addState.mock.calls).toEqual([
        [ HELP_STATE_ID, evader ],
        [ HELP_STATE_ID, evader ],
      ]);
      procSpy.mockRestore();
    });

    it('applies nothing to self when the roll never lands', () =>
    {
      // Arrange
      const evader = buildRollingBattler({ notes: [ `<onEvadeApplySelf:[${HELP_STATE_ID}, 40]>` ] });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateSelf();

      // Assert
      expect(evader.addState).not.toHaveBeenCalled();
      procSpy.mockRestore();
    });
  });

  describe('processOnEvadeStateAttacker', () =>
  {
    beforeEach(() =>
    {
      registerEvadeRows();
    });

    it('does nothing when there are no attacker-targeting evade effects', () =>
    {
      // Arrange
      const battler = buildBattler();
      const attacker = { addState: vi.fn() };

      // Act
      battler.processOnEvadeStateAttacker(attacker);

      // Assert
      expect(attacker.addState).not.toHaveBeenCalled();
    });

    it('rolls each state against the attacker\'s resistances, with the luck the evader holds over it', () =>
    {
      // Arrange- the attacker trails the evader by 60 LUK and resists by half and by a quarter; the state is harm, so
      // that luck gap weighs in. The evader's own far heavier resistances never weigh on a state it aims at someone
      // else.
      const evader = buildRollingBattler({
        notes: [ `<onEvadeApply:[${HARM_STATE_ID}, 40]>`, '<stateTypeResist:[cc, 90]>' ],
        luk: 110,
        stateRate: 0.1,
      });
      const attacker = buildRollingBattler({
        notes: [ '<stateTypeResist:[cc, 25]>' ],
        luk: 50,
        stateRate: 0.5,
      });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert- 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16, with no fate on either side.
      expect(procSpy).toHaveBeenCalledWith(evader, 16, 1, 0);
      procSpy.mockRestore();
    });

    it('aims a negative state at the attacker as harm', () =>
    {
      // Arrange- the evader brings 2 lucky rolls and 1 curse of its own, and the attacker 3 curses. The skill sharing
      // the state's id is never read.
      const evader = buildRollingBattler({
        notes: [ `<onEvadeApply:[${HARM_STATE_ID}, 40]>` ],
        positiveRolls: 2,
        negativeRolls: 1,
      });
      const attacker = buildRollingBattler({ negativeRolls: 3 });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert- 1 + 2 chances and the attacker's 3 curses as 3 more, then the evader's 1 curse.
      expect(procSpy).toHaveBeenCalledWith(evader, 40, 6, 1);
      procSpy.mockRestore();
    });

    it('aims any other state at the attacker as help', () =>
    {
      // Arrange- typed, but not negative. The evader brings 2 lucky rolls and 1 curse of its own, and the attacker 3
      // curses. The skill sharing the state's id is never read.
      const evader = buildRollingBattler({
        notes: [ `<onEvadeApply:[${HELP_STATE_ID}, 40]>` ],
        positiveRolls: 2,
        negativeRolls: 1,
      });
      const attacker = buildRollingBattler({ negativeRolls: 3 });
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert- 1 + 2 chances, then the evader's 1 curse and the attacker's 3 as hurdles.
      expect(procSpy).toHaveBeenCalledWith(evader, 40, 3, 4);
      procSpy.mockRestore();
    });

    it('applies the state to the attacker once per landing', () =>
    {
      // Arrange
      const evader = buildRollingBattler({ notes: [ `<onEvadeApply:[${HELP_STATE_ID}, 40]>` ] });
      const attacker = buildRollingBattler();
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(3);

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert- the evader is the source of the punishment landing on the attacker, and naming it is what routes the
      // application through JABS rather than vanilla.
      expect(attacker.addState.mock.calls).toEqual([
        [ HELP_STATE_ID, evader ],
        [ HELP_STATE_ID, evader ],
        [ HELP_STATE_ID, evader ],
      ]);
      expect(evader.addState).not.toHaveBeenCalled();
      procSpy.mockRestore();
    });

    it('applies nothing to the attacker when the roll never lands', () =>
    {
      // Arrange
      const evader = buildRollingBattler({ notes: [ `<onEvadeApply:[${HELP_STATE_ID}, 40]>` ] });
      const attacker = buildRollingBattler();
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert
      expect(attacker.addState).not.toHaveBeenCalled();
      procSpy.mockRestore();
    });
  });

  describe('onEvade', () =>
  {
    it('runs both self and attacker evade processing, then no-ops when the evader has no JABS_Battler', () =>
    {
      // Arrange
      const battler = buildBattler();
      const selfSpy = vi.spyOn(battler, 'processOnEvadeStateSelf')
        .mockImplementation(() => {});
      const attackerSpy = vi.spyOn(battler, 'processOnEvadeStateAttacker')
        .mockImplementation(() => {});
      const attacker = { getUuid: () => 'attacker-uuid' };

      // Act & Assert- nothing registered on JABS_AiManager.battlers, so the lookup misses.
      expect(() => battler.onEvade(attacker, {})).not.toThrow();
      expect(selfSpy).toHaveBeenCalledTimes(1);
      expect(attackerSpy).toHaveBeenCalledTimes(1);
      selfSpy.mockRestore();
      attackerSpy.mockRestore();
    });

    it('delegates skill execution to the evader\'s JABS_Battler when one is found on the map', () =>
    {
      // Arrange
      const battler = buildBattler();
      vi.spyOn(battler, 'processOnEvadeStateSelf')
        .mockImplementation(() => {});
      vi.spyOn(battler, 'processOnEvadeStateAttacker')
        .mockImplementation(() => {});
      const attacker = { getUuid: () => 'attacker-uuid' };
      const jabsAttacker = { id: 'attacker-jabs' };
      const jabsEvader = { handleOnEvadeSkills: vi.fn() };
      JABS_AiManager.battlers.set(battler.getUuid(), jabsEvader);
      JABS_AiManager.battlers.set('attacker-uuid', jabsAttacker);

      // Act
      battler.onEvade(attacker, {});

      // Assert
      expect(jabsEvader.handleOnEvadeSkills).toHaveBeenCalledWith(jabsAttacker);
      JABS_AiManager.battlers.clear();
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-on-chance-effects.test.js
