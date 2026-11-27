//region plugins/abs/core/managers/jabs-fate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';
import { buildFateBattlerStub } from '../../../_base/core/_component/fixtures/install-jabs-fate.js';

const NEGATIVE_STATE_ID = 30;
const CC_STATE_ID = 32;
const NEGATIVE_CC_STATE_ID = 34;

/**
 * Builds a note-source row carrying the given tag string, backed by the real RPG_Skill prototype so its tags parse.
 * @param {string} note The note text.
 * @returns {object}
 */
function buildNoteRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Registers a real RPG_State row whose note carries the given tags.
 * @param {number} stateId The id to register the row under.
 * @param {string} note The note text.
 * @returns {object}
 */
function registerStateRow(stateId, note)
{
  const row = Object.create(globalThis.RPG_State.prototype);
  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a real Game_Battler-backed battler, so its type resistances read real `<stateTypeResist>` tags. Vanilla's
 * State Rate and LUK are not loaded in this realm, so those two are given outright.
 * @param {object} [options]
 * @param {number} [options.luk] The battler's LUK.
 * @param {number} [options.stateRate] What State Rate traits answer for any state.
 * @param {string[]} [options.notes] The notes of every source the battler carries.
 * @returns {object}
 */
function buildRealBattler({ luk = 0, stateRate = 1, notes = [] } = {})
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.luk = luk;
  battler.stateRate = () => stateRate;
  battler.getAllNotes = () => notes.map(note => buildNoteRow(note));
  return battler;
}

/**
 * A recipient resisting every state by half through State Rate and by a quarter through its type, trailing a roller
 * of 110 LUK by 60, and reading every state as harm so that luck gap weighs in: a 40% chance becomes
 * 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16.
 * @param {object} [overrides] Members to replace on the stand-in.
 * @returns {object}
 */
function buildResistantRecipient(overrides = {})
{
  return buildFateBattlerStub({
    luk: 50,
    stateRate: () => 0.5,
    stateTypeResistRate: () => 0.75,
    state: () => ({ isNegativeType: () => true }),
    ...overrides,
  });
}

/**
 * A positive roller that is nothing but the four members the count reads: no LUK, and no lucky or cursed rolls, so
 * anything that reads either from it instead of from the roller shows up in the result.
 * @returns {object}
 */
function buildSubstitutePositiveRoller()
{
  return {
    isVeryLucky: () => true,
    isVeryCursed: () => false,
    isAccumulating: () => false,
    getEncoreRepeats: () => 0,
  };
}

/**
 * Stubs Math.randomInt so the dice land on the given faces, in order. Each face is what the roll reads, from 1 to 100.
 * @param {number[]} faces The faces to land on.
 * @returns {object} The spy, for the test to restore.
 */
function stubDice(faces)
{
  const spy = vi.spyOn(Math, 'randomInt');
  faces.forEach(face => spy.mockReturnValueOnce(face - 1));
  return spy;
}

describe('JABS_Fate (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_Fate.js').default} */
  let JABS_Fate;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    // J-Base's Game_Battler.js lays down the state() accessor a real battler reads its states through.
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // J-ABS's Game_Battler.js lays down stateTypeResistRate and the lucky and cursed roll totals.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // J-ABS's RPG_State.js lays down the isNegativeType classifier the roll reads for harm or help.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: JABS_Fate } = await import('../../../../../src/plugins/abs/core/managers/JABS_Fate.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];

    registerStateRow(NEGATIVE_STATE_ID, '<type:negative>');
    registerStateRow(CC_STATE_ID, '<type:cc>');
    registerStateRow(NEGATIVE_CC_STATE_ID, '<type:negative>\n<type:cc>');
  });

  describe('lukEffectRate', () =>
  {
    it('adds a tenth of a percent for every point of LUK the roller holds over the recipient', () =>
    {
      // Arrange
      const roller = buildFateBattlerStub({ luk: 110 });
      const recipient = buildFateBattlerStub({ luk: 50 });

      // Act
      const rate = JABS_Fate.lukEffectRate(roller, recipient);

      // Assert
      expect(rate).toBe(1.06);
    });

    it('never falls below nothing, however far the roller trails', () =>
    {
      // Arrange- 2000 points behind would be 1 - 2 = -1 without the floor.
      const roller = buildFateBattlerStub({ luk: 0 });
      const recipient = buildFateBattlerStub({ luk: 2000 });

      // Act
      const rate = JABS_Fate.lukEffectRate(roller, recipient);

      // Assert
      expect(rate).toBe(0);
    });
  });

  describe('ownRolls', () =>
  {
    /**
     * A roller whose battler-wide rolls and skill-scoped rolls all differ, so the pair read is never ambiguous.
     * @returns {object}
     */
    function buildRoller()
    {
      return buildFateBattlerStub({
        getPositiveRolls: () => 2,
        getNegativeRolls: () => 1,
        getPositiveRollsForSkill: () => 5,
        getNegativeRollsForSkill: () => 4,
      });
    }

    it('reads the skill\'s own lucky and cursed rolls on top of the battler-wide totals when there is a skill', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const rolls = JABS_Fate.ownRolls(roller, buildNoteRow(''));

      // Assert- the baseline chance plus 5 lucky rolls, then 4 cursed ones.
      expect(rolls).toEqual([ 6, 4 ]);
    });

    it('reads the battler-wide totals alone when there is no skill', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const rolls = JABS_Fate.ownRolls(roller, null);

      // Assert- the baseline chance plus 2 lucky rolls, then 1 cursed one.
      expect(rolls).toEqual([ 3, 1 ]);
    });
  });

  describe('rollsAgainst', () =>
  {
    /**
     * A roller bringing 5 lucky and 4 cursed rolls with its skill, and 1 battler-wide curse of its own.
     * @returns {object}
     */
    function buildRoller()
    {
      return buildFateBattlerStub({
        getNegativeRolls: () => 1,
        getPositiveRollsForSkill: () => 5,
        getNegativeRollsForSkill: () => 4,
      });
    }

    it('brings a battler\'s fate once when it aims at itself', () =>
    {
      // Arrange- aimed as harm, so counting its own curse again as the recipient's would add a chance.
      const roller = buildRoller();

      // Act
      const rolls = JABS_Fate.rollsAgainst(roller, roller, buildNoteRow(''), true);

      // Assert
      expect(rolls).toEqual([ 6, 4 ]);
    });

    it('gives harm aimed at a cursed recipient one more chance to land per curse it carries', () =>
    {
      // Arrange
      const roller = buildRoller();
      const recipient = buildFateBattlerStub({ getNegativeRolls: () => 3 });

      // Act
      const rolls = JABS_Fate.rollsAgainst(roller, recipient, buildNoteRow(''), true);

      // Assert- the recipient's 3 curses join the roller's 6 chances; the roller's own 4 curses stay hurdles.
      expect(rolls).toEqual([ 9, 4 ]);
    });

    it('makes help aimed at a cursed recipient clear every curse it carries', () =>
    {
      // Arrange
      const roller = buildRoller();
      const recipient = buildFateBattlerStub({ getNegativeRolls: () => 3 });

      // Act
      const rolls = JABS_Fate.rollsAgainst(roller, recipient, buildNoteRow(''), false);

      // Assert- the recipient's 3 curses join the roller's own 4 as hurdles.
      expect(rolls).toEqual([ 6, 7 ]);
    });

    it('treats a different battler with the very same rolls as a recipient, not as the roller itself', () =>
    {
      // Arrange- a lookalike of the roller, so only identity tells the two apart.
      const roller = buildRoller();
      const lookalike = buildRoller();

      // Act
      const rolls = JABS_Fate.rollsAgainst(roller, lookalike, buildNoteRow(''), true);

      // Assert- the lookalike's one battler-wide curse counts, which it would not for the roller aiming at itself.
      expect(rolls).toEqual([ 7, 4 ]);
    });
  });

  describe('actionRollsAgainst', () =>
  {
    /**
     * Builds an action whose subject reads luck from one skill alone, so the item it hands over shows in the rolls.
     * @param {boolean} isForOpponent Whether the action is aimed at the subject's opponents.
     * @returns {{action: object, target: object}}
     */
    function buildContext(isForOpponent)
    {
      const skill = buildNoteRow('');
      const subject = buildFateBattlerStub({
        getPositiveRollsForSkill: usedSkill => (usedSkill === skill ? 5 : 0),
        getNegativeRollsForSkill: usedSkill => (usedSkill === skill ? 4 : 0),
      });
      const action = {
        subject: () => subject,
        item: () => skill,
        isForOpponent: () => isForOpponent,
      };
      const target = buildFateBattlerStub({ getNegativeRolls: () => 3 });
      return { action, target };
    }

    it('aims an action at the subject\'s opponents as harm, with the item it is using', () =>
    {
      // Arrange
      const { action, target } = buildContext(true);

      // Act
      const rolls = JABS_Fate.actionRollsAgainst(action, target);

      // Assert
      expect(rolls).toEqual([ 9, 4 ]);
    });

    it('aims an action at anyone else as help, with the item it is using', () =>
    {
      // Arrange
      const { action, target } = buildContext(false);

      // Act
      const rolls = JABS_Fate.actionRollsAgainst(action, target);

      // Assert
      expect(rolls).toEqual([ 6, 7 ]);
    });
  });

  describe('stateLuckRate', () =>
  {
    it('weighs the luck between the two battlers on a state carrying the negative classifier', () =>
    {
      // Arrange
      const roller = buildRealBattler({ luk: 110 });
      const recipient = buildRealBattler({ luk: 50 });

      // Act
      const rate = JABS_Fate.stateLuckRate(roller, recipient, NEGATIVE_STATE_ID);

      // Assert- the roller's 60 points of LUK over the recipient.
      expect(rate).toBeCloseTo(1.06, 10);
    });

    it('weighs no luck at all on a state without the negative classifier, however wide the gap', () =>
    {
      // Arrange- typed, but not negative, with a gap that would take a harmful state's chance to nothing.
      const roller = buildRealBattler({ luk: 0 });
      const recipient = buildRealBattler({ luk: 5000 });

      // Act
      const rate = JABS_Fate.stateLuckRate(roller, recipient, CC_STATE_ID);

      // Assert
      expect(rate).toBe(1);
    });
  });

  describe('stateApplicationD100', () =>
  {
    it('rolls 40% against half State Rate, a quarter type resistance and a LUK gap to an exact whole percent', () =>
    {
      // Arrange- a real <stateTypeResist> tag, beside a sibling for another type that must not weigh in.
      const roller = buildRealBattler({ luk: 110 });
      const recipient = buildRealBattler({
        luk: 50,
        stateRate: 0.5,
        notes: [ '<stateTypeResist:[cc, 25]>', '<stateTypeResist:[poison, 50]>' ],
      });

      // Act
      const d100 = JABS_Fate.stateApplicationD100(roller, recipient, NEGATIVE_CC_STATE_ID, 40);

      // Assert- 40 x 0.5 x 0.75 x 1.06 = 15.9; the poison resistance would make it 5, a lost luck gap 15.
      expect(d100).toBe(16);
    });

    it('rolls a blessing against the same resistances with no luck gap', () =>
    {
      // Arrange- the same battlers and resistances, aimed with a state that is not harm.
      const roller = buildRealBattler({ luk: 110 });
      const recipient = buildRealBattler({
        luk: 50,
        stateRate: 0.5,
        notes: [ '<stateTypeResist:[cc, 25]>' ],
      });

      // Act
      const d100 = JABS_Fate.stateApplicationD100(roller, recipient, CC_STATE_ID, 40);

      // Assert- 40 x 0.5 x 0.75 = 15, with no luck to weigh in.
      expect(d100).toBe(15);
    });
  });

  describe('resolveStateProcCountWithRolls', () =>
  {
    it('counts the landings by the roller when no other positive roller is handed over', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(2);
      const roller = buildFateBattlerStub({ luk: 110 });
      const recipient = buildResistantRecipient();

      // Act
      const procCount = JABS_Fate.resolveStateProcCountWithRolls(roller, recipient, CC_STATE_ID, 40, [ 6, 4 ]);

      // Assert
      expect(procCount).toBe(2);
      expect(procSpy).toHaveBeenCalledWith(roller, 16, 6, 4);
      procSpy.mockRestore();
    });

    it('counts the landings by a substituted positive roller, while the roller still brings its luck', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const roller = buildFateBattlerStub({ luk: 110 });
      const recipient = buildResistantRecipient();
      const positiveRoller = buildSubstitutePositiveRoller();

      // Act
      JABS_Fate.resolveStateProcCountWithRolls(roller, recipient, CC_STATE_ID, 40, [ 6, 4 ], positiveRoller);

      // Assert- 16 is the roller's luck gap at work; reading the substitute's missing LUK would have made it NaN.
      expect(procSpy).toHaveBeenCalledWith(positiveRoller, 16, 6, 4);
      procSpy.mockRestore();
    });
  });

  describe('resolveStateProcCount (no action to aim it)', () =>
  {
    /**
     * A roller bringing 2 battler-wide lucky rolls and 1 curse, and 5 lucky and 4 cursed rolls with a skill.
     * @returns {object}
     */
    function buildRoller()
    {
      return buildFateBattlerStub({
        luk: 110,
        getPositiveRolls: () => 2,
        getNegativeRolls: () => 1,
        getPositiveRollsForSkill: () => 5,
        getNegativeRollsForSkill: () => 4,
      });
    }

    /**
     * A resistant recipient carrying 3 curses, which reads the registered state rows as its own states.
     * @returns {object}
     */
    function buildCursedRecipient()
    {
      return buildResistantRecipient({
        getNegativeRolls: () => 3,
        state: stateId => globalThis.$dataStates[stateId],
      });
    }

    it('aims a state carrying the negative classifier as harm', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const roller = buildRoller();

      // Act
      JABS_Fate.resolveStateProcCount(roller, buildCursedRecipient(), NEGATIVE_STATE_ID, 40);

      // Assert- the recipient's 3 curses are chances for the roll: 3 + 3, then the roller's 1.
      expect(procSpy).toHaveBeenCalledWith(roller, 16, 6, 1);
      procSpy.mockRestore();
    });

    it('aims a state carrying any other classifier as help', () =>
    {
      // Arrange- typed, but not negative.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const roller = buildRoller();

      // Act
      JABS_Fate.resolveStateProcCount(roller, buildCursedRecipient(), CC_STATE_ID, 40);

      // Assert- a blessing meets no luck, so 15; the recipient's 3 curses are hurdles: 3, then 1 + 3.
      expect(procSpy).toHaveBeenCalledWith(roller, 15, 3, 4);
      procSpy.mockRestore();
    });

    it('reads the skill\'s own lucky and cursed rolls when a skill is handed over', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const roller = buildRoller();

      // Act
      JABS_Fate.resolveStateProcCount(roller, buildCursedRecipient(), CC_STATE_ID, 40, buildNoteRow(''));

      // Assert- a blessing meets no luck, so 15; 1 + 5 chances, then the skill's 4 curses and the recipient's 3.
      expect(procSpy).toHaveBeenCalledWith(roller, 15, 6, 7);
      procSpy.mockRestore();
    });

    it('brings a battler\'s fate once when it gives itself a state, against its own resistances and no luck edge', () =>
    {
      // Arrange- aimed as harm, so its own curse counted again as the recipient's would add a chance.
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const holder = buildCursedRecipient();
      holder.luk = 999;

      // Act
      JABS_Fate.resolveStateProcCount(holder, holder, NEGATIVE_STATE_ID, 40);

      // Assert- 40 x 0.5 x 0.75 = 15 with no luck edge over itself, and its fate once: 1 chance, then 3 curses.
      expect(procSpy).toHaveBeenCalledWith(holder, 15, 1, 3);
      procSpy.mockRestore();
    });

    it('lands a state for a very lucky roller even when the recipient resists its chance to nothing', () =>
    {
      // Arrange- the real count, with no dice stubbed: only the fate override can land it.
      const roller = buildFateBattlerStub({ isVeryLucky: () => true });
      const recipient = buildFateBattlerStub({ stateRate: () => 0 });

      // Act
      const procCount = JABS_Fate.resolveStateProcCount(roller, recipient, CC_STATE_ID, 40);

      // Assert
      expect(procCount).toBe(1);
    });
  });

  describe('resolveActionStateProcCount (an action aims it)', () =>
  {
    /**
     * Builds an action whose fate answers only for one target, so a roll aimed at the wrong battler shows as zeros.
     * @param {object} subject The action's subject.
     * @param {object} target The only battler the action's fate answers for.
     * @returns {object}
     */
    function buildAction(subject, target)
    {
      return {
        subject: () => subject,
        fateRollsAgainst: aimedAt => (aimedAt === target ? [ 5, 2 ] : [ 0, 0 ]),
      };
    }

    it('rolls with the action\'s fate against its target, its subject rolling and counting the landings', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(3);
      const subject = buildFateBattlerStub({ luk: 110 });
      const target = buildResistantRecipient();

      // Act
      const procCount = JABS_Fate.resolveActionStateProcCount(buildAction(subject, target), target, CC_STATE_ID, 40);

      // Assert
      expect(procCount).toBe(3);
      expect(procSpy).toHaveBeenCalledWith(subject, 16, 5, 2);
      procSpy.mockRestore();
    });

    it('counts the landings by a substituted positive roller, while the subject still brings its luck', () =>
    {
      // Arrange
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
      const subject = buildFateBattlerStub({ luk: 110 });
      const target = buildResistantRecipient();
      const positiveRoller = buildSubstitutePositiveRoller();

      // Act
      JABS_Fate.resolveActionStateProcCount(buildAction(subject, target), target, CC_STATE_ID, 40, positiveRoller);

      // Assert
      expect(procSpy).toHaveBeenCalledWith(positiveRoller, 16, 5, 2);
      procSpy.mockRestore();
    });
  });

  describe('Accumulate Mode and Encore through the shared roll', () =>
  {
    it('counts every positive roll that lands under Accumulate Mode, then repeats each landing under Encore', () =>
    {
      // Arrange- three chances at 16%: the dice land 10, 40 and 5, so two of them land.
      const diceSpy = stubDice([ 10, 40, 5 ]);
      const roller = buildFateBattlerStub({
        luk: 110,
        getPositiveRolls: () => 2,
        isAccumulating: () => true,
        getEncoreRepeats: () => 1,
      });

      // Act
      const procCount = JABS_Fate.resolveStateProcCount(roller, buildResistantRecipient(), CC_STATE_ID, 40);

      // Assert- 2 landings, each repeated once.
      expect(procCount).toBe(4);
      diceSpy.mockRestore();
    });

    it('stops at the first landing without Accumulate Mode, then repeats it under Encore', () =>
    {
      // Arrange- three chances at 16%: the dice land 40 and then 10, and the roll stops there.
      const diceSpy = stubDice([ 40, 10, 5 ]);
      const roller = buildFateBattlerStub({
        luk: 110,
        getPositiveRolls: () => 2,
        getEncoreRepeats: () => 2,
      });

      // Act
      const procCount = JABS_Fate.resolveStateProcCount(roller, buildResistantRecipient(), CC_STATE_ID, 40);

      // Assert- 1 landing, repeated twice.
      expect(procCount).toBe(3);
      diceSpy.mockRestore();
    });
  });
});
//endregion plugins/abs/core/managers/jabs-fate.test.js
