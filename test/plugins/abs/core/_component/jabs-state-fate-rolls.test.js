//region plugins/abs/core/_component/jabs-state-fate-rolls.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * The tracked state that expires into a follow-up.
 * @type {number}
 */
const EXPIRING_STATE_ID = 60;

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
 * The tracked state that spreads to the battlers around its carrier.
 * @type {number}
 */
const SPREAD_STATE_ID = 63;

/**
 * A state carrying `<immuneToFate>`: rolled once and plainly, with no battler's fate weighing in.
 * @type {number}
 */
const FATE_IMMUNE_STATE_ID = 64;

/**
 * Registers a real RPG_State row whose note carries the given tags, so its type classifiers and its spread and expiry
 * tags all parse. A note yields one match of a tag per line, so a row typed twice puts each type on a line of its own.
 * @param {number} stateId The id to register the row under.
 * @param {string} note The note text.
 * @returns {object}
 */
function registerStateRow(stateId, note)
{
  const row = buildStateRow(stateId, note);

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a real RPG_State row whose note carries the given tags, without registering it in the database: the shape a
 * battler's own view of a state takes when something is layered onto it.
 * @param {number} stateId The id the row answers to.
 * @param {string} note The note text.
 * @returns {object}
 */
function buildStateRow(stateId, note)
{
  const row = Object.create(globalThis.RPG_State.prototype);

  row.id = stateId;
  row.note = note;
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;

  // RPG_Base#original is a private field set only by the constructor, which Object.create() skips.
  row._original = function() { return this; };

  return row;
}

/**
 * Builds a real Game_Battler-backed battler for a state roll. Its type resistances, lucky and cursed rolls, Accumulate
 * Mode and fate overrides are the shipped Game_Battler's own, reading the given notes. Vanilla's LUK and State Rate
 * are not loaded in this realm, so both are given outright; every state is addable to it, and its adds are recorded
 * rather than performed.
 * @param {object} [options] The battler's makeup.
 * @param {string} [options.uuid] The uuid a spread looks its carrier up by.
 * @param {number} [options.luk] The battler's LUK.
 * @param {number} [options.stateRate] What its State Rate traits answer for any state.
 * @param {string[]} [options.notes] The notes of every source the battler carries.
 * @param {number} [options.positiveRolls] Its battler-wide lucky rolls.
 * @param {number} [options.negativeRolls] Its battler-wide cursed rolls.
 * @returns {object}
 */
function buildBattler(options = {})
{
  const {
    uuid = 'battler',
    luk = 0,
    stateRate = 1,
    notes = [],
    positiveRolls = 0,
    negativeRolls = 0,
  } = options;

  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.getUuid = () => uuid;
  battler.luk = luk;
  battler.stateRate = () => stateRate;
  battler.__testNoteSources = notes.map(note => ({ note }));
  battler.setPositiveRolls(positiveRolls);
  battler.setNegativeRolls(negativeRolls);
  battler.isStateAddable = () => true;
  battler.addState = vi.fn();

  return battler;
}

/**
 * The skill a tracked state was applied with, bringing 4 lucky and 5 cursed rolls of its own.
 * @returns {object}
 */
function buildSourceSkill()
{
  return {
    id: 9,
    note: '<thisLuckyRolls:[4]><thisCursedRolls:[5]>',
  };
}

/**
 * Lays out the map a spread pulse reads: the carrier's map battler, and the allied candidates in range of it, each a
 * step further away than the one before it.
 * @param {object} carrier The battler carrying the spreading state.
 * @param {object[]} candidates The battlers in range of the carrier, nearest first.
 */
function arrangeSpreadMap(carrier, candidates)
{
  const carrierJabs = {
    getBattler: () => carrier,
    distanceToDesignatedTarget: other => other.__distance,
  };
  const candidateJabs = candidates.map((battler, index) => ({
    getBattler: () => battler,
    __distance: index + 1,
  }));

  globalThis.JABS_AiManager.getBattlerByUuid = vi.fn(() => carrierJabs);
  globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => candidateJabs);
}

describe('J-ABS JABS_State fate rolls (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    // J-Base's Game_Battler.js lays down the state() accessor a battler reads its states through.
    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // J-ABS's Game_Battler.js lays down stateTypeResistRate and the lucky and cursed roll totals.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // J-ABS's RPG_State.js lays down the spread and expiry tags, and the negative classifier the roll reads.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: globalThis.JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_State } = await import('../../../../../src/plugins/abs/core/models/JABS_State.js'));
  });

  afterAll(() =>
  {
    delete globalThis.$jabsEngine;
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];
    globalThis.$jabsEngine = {
      absEnabled: true,
      getJabsStatesByUuid: () => new Map(),
    };
  });

  describe('handleApplyStateOnExpire', () =>
  {
    it('rolls the follow-up for the source against the afflicted battler\'s resistances, to an exact percent', () =>
    {
      // Arrange- the afflicted battler trails its source by 60 LUK, and resists the follow-up by half through State
      // Rate and by a quarter through its type. The follow-up is harm, so that luck gap weighs in.
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HARM_STATE_ID}, 40]>`);
      registerStateRow(HARM_STATE_ID, '<type:negative>\n<type:cc>');
      const bearer = buildBattler({
        luk: 50,
        stateRate: 0.5,
        notes: [ '<stateTypeResist:[cc, 25]>' ],
      });
      const source = buildBattler({ luk: 110 });
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16, with no fate on either side.
      expect(procSpy).toHaveBeenCalledWith(source, 16, 1, 0);
      procSpy.mockRestore();
    });

    it('rolls with the source\'s own fate and the skill it applied the state with', () =>
    {
      // Arrange- the source brings 2 lucky rolls and 1 curse, and its skill 4 and 5 more. The afflicted battler's own 8
      // lucky rolls are its own, and never weigh on a roll aimed at it.
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HELP_STATE_ID}, 40]>`);
      registerStateRow(HELP_STATE_ID, '<type:cc>');
      const bearer = buildBattler({ positiveRolls: 8 });
      const source = buildBattler({
        positiveRolls: 2,
        negativeRolls: 1,
      });
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source, buildSourceSkill());
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- 1 + 2 + 4 chances, then 1 + 5 hurdles.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 7, 6);
      procSpy.mockRestore();
    });

    it('aims a negative follow-up at the afflicted battler as harm, even out of a state that is not negative', () =>
    {
      // Arrange- the expiring state is typed but not negative, so only the follow-up's own classifier makes this harm.
      registerStateRow(EXPIRING_STATE_ID, `<type:cc><applyStateOnExpire:[${HARM_STATE_ID}, 40]>`);
      registerStateRow(HARM_STATE_ID, '<type:negative>\n<type:cc>');
      const bearer = buildBattler({ negativeRolls: 3 });
      const source = buildBattler();
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- the afflicted battler's 3 curses are 3 more chances for the harm to land.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 4, 0);
      procSpy.mockRestore();
    });

    it('aims any other follow-up at the afflicted battler as help, even out of a negative state', () =>
    {
      // Arrange- the expiring state is negative, so only the follow-up's own classifier makes this help.
      registerStateRow(EXPIRING_STATE_ID, `<type:negative><applyStateOnExpire:[${HELP_STATE_ID}, 40]>`);
      registerStateRow(HELP_STATE_ID, '<type:cc>');
      const bearer = buildBattler({ negativeRolls: 3 });
      const source = buildBattler();
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- the afflicted battler's 3 curses are 3 more hurdles for the help to clear.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 1, 3);
      procSpy.mockRestore();
    });

    it('rolls a follow-up the bearer gave itself against its own resistances, with no luck edge and its fate once', () =>
    {
      // Arrange- no source is named, so the bearer is its own. The follow-up is harm, so a curse counted a second
      // time, as the recipient's, would show as 3 more chances.
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HARM_STATE_ID}, 40]>`);
      registerStateRow(HARM_STATE_ID, '<type:negative>\n<type:cc>');
      const bearer = buildBattler({
        luk: 110,
        stateRate: 0.5,
        notes: [ '<stateTypeResist:[cc, 25]>' ],
        positiveRolls: 2,
        negativeRolls: 3,
      });
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- 40 x 0.5 x 0.75 = 15 with no edge over itself; 1 + 2 chances, then its own 3 curses, once.
      expect(procSpy).toHaveBeenCalledWith(bearer, 15, 3, 3);
      procSpy.mockRestore();
    });

    it('reads the follow-up off the expiring state as the afflicted battler sees it, not the table or the source', () =>
    {
      // Arrange- three views of the expiring state, each naming a different follow-up: the database row, the source's
      // view and the afflicted battler's own view. Only the afflicted battler's view, with whatever it layers onto the
      // state, names the follow-up that should land; every follow-up is otherwise registered and lands at 100%.
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HELP_STATE_ID}, 100]>`);
      registerStateRow(HELP_STATE_ID, '');
      registerStateRow(HARM_STATE_ID, '');
      registerStateRow(SPREAD_STATE_ID, '');
      const bearerView = buildStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HARM_STATE_ID}, 100]>`);
      const sourceView = buildStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${SPREAD_STATE_ID}, 100]>`);
      const bearer = buildBattler();
      bearer.state = stateId => (stateId === EXPIRING_STATE_ID ? bearerView : globalThis.$dataStates[stateId]);
      const source = buildBattler();
      source.state = stateId => (stateId === EXPIRING_STATE_ID ? sourceView : globalThis.$dataStates[stateId]);
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- the real roll: 100% against no resistance lands exactly once.
      expect(bearer.addState.mock.calls).toEqual([ [ HARM_STATE_ID, source, null ] ]);
    });

    it('adds the follow-up once for every time it lands, each add naming the source and its skill', () =>
    {
      // Arrange
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${HELP_STATE_ID}, 40]>`);
      registerStateRow(HELP_STATE_ID, '<type:cc>');
      const bearer = buildBattler();
      const source = buildBattler();
      const sourceSkill = buildSourceSkill();
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source, sourceSkill);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(2);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert
      expect(bearer.addState.mock.calls).toEqual([
        [ HELP_STATE_ID, source, sourceSkill ],
        [ HELP_STATE_ID, source, sourceSkill ],
      ]);
      procSpy.mockRestore();
    });

    it('lands a follow-up immune to fate once on one plain roll, against the bearer\'s resistances and none of the source\'s fate', () =>
    {
      // Arrange- the source brings three lucky rolls, Accumulate Mode and two Encore repeats, any of which would land
      // the follow-up more than once; the bearer halves it through State Rate, and the die lands right on the 50 left.
      registerStateRow(EXPIRING_STATE_ID, `<applyStateOnExpire:[${FATE_IMMUNE_STATE_ID}, 100]>`);
      registerStateRow(FATE_IMMUNE_STATE_ID, '<immuneToFate>');
      const bearer = buildBattler({ stateRate: 0.5 });
      const source = buildBattler({ positiveRolls: 3, notes: [ '<accumulate>', '<encoreRepeats:[2]>' ] });
      const jabsState = new globalThis.JABS_State(bearer, EXPIRING_STATE_ID, 0, 50, 1, source);
      const diceSpy = vi.spyOn(Math, 'randomInt')
        .mockReturnValue(49);

      // Act
      jabsState.handleApplyStateOnExpire();

      // Assert- one landing from one roll at 50.
      expect(bearer.addState.mock.calls).toEqual([ [ FATE_IMMUNE_STATE_ID, source, null ] ]);
      expect(diceSpy).toHaveBeenCalledTimes(1);
      expect(diceSpy).toHaveBeenCalledWith(100);
      diceSpy.mockRestore();
    });
  });

  describe('handleSpreading', () =>
  {
    it('rolls the spread for the source against the candidate\'s resistances, to an exact percent', () =>
    {
      // Arrange- the candidate trails the source by 60 LUK and resists by half and by a quarter; the state is harm, so
      // that luck gap weighs in. The carrier outlucks everyone and resists far more, so a roll made by the carrier or
      // aimed at it would come out differently.
      registerStateRow(SPREAD_STATE_ID, '<spread:[40, 5]><type:cc>\n<type:negative>');
      const carrier = buildBattler({
        uuid: 'carrier',
        luk: 999,
        stateRate: 0.1,
      });
      const source = buildBattler({
        uuid: 'source',
        luk: 110,
      });
      const candidate = buildBattler({
        uuid: 'candidate',
        luk: 50,
        stateRate: 0.5,
        notes: [ '<stateTypeResist:[cc, 25]>' ],
      });
      arrangeSpreadMap(carrier, [ candidate ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleSpreading();

      // Assert- 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16, with no fate on either side.
      expect(procSpy).toHaveBeenCalledWith(source, 16, 1, 0);
      procSpy.mockRestore();
    });

    it('rolls with the source\'s own fate and the skill it applied the state with', () =>
    {
      // Arrange- the source brings 2 lucky rolls and 1 curse, and its skill 4 and 5 more. The carrier's 8 lucky rolls
      // are its own, and never weigh on a spread it carries.
      registerStateRow(SPREAD_STATE_ID, '<spread:[40, 5]><type:cc>');
      const carrier = buildBattler({
        uuid: 'carrier',
        positiveRolls: 8,
      });
      const source = buildBattler({
        uuid: 'source',
        positiveRolls: 2,
        negativeRolls: 1,
      });
      const candidate = buildBattler({ uuid: 'candidate' });
      arrangeSpreadMap(carrier, [ candidate ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source, buildSourceSkill());
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleSpreading();

      // Assert- 1 + 2 + 4 chances, then 1 + 5 hurdles.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 7, 6);
      procSpy.mockRestore();
    });

    it('spreads a negative state onto a candidate as harm', () =>
    {
      // Arrange
      registerStateRow(SPREAD_STATE_ID, '<spread:[40, 5]><type:negative>');
      const carrier = buildBattler({ uuid: 'carrier' });
      const source = buildBattler({ uuid: 'source' });
      const candidate = buildBattler({
        uuid: 'candidate',
        negativeRolls: 3,
      });
      arrangeSpreadMap(carrier, [ candidate ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleSpreading();

      // Assert- the candidate's 3 curses are 3 more chances for the harm to land.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 4, 0);
      procSpy.mockRestore();
    });

    it('spreads any other state onto a candidate as help', () =>
    {
      // Arrange- typed, but not negative.
      registerStateRow(SPREAD_STATE_ID, '<spread:[40, 5]><type:cc>');
      const carrier = buildBattler({ uuid: 'carrier' });
      const source = buildBattler({ uuid: 'source' });
      const candidate = buildBattler({
        uuid: 'candidate',
        negativeRolls: 3,
      });
      arrangeSpreadMap(carrier, [ candidate ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);
      const procSpy = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(0);

      // Act
      jabsState.handleSpreading();

      // Assert- the candidate's 3 curses are 3 more hurdles for the help to clear.
      expect(procSpy).toHaveBeenCalledWith(source, 40, 1, 3);
      procSpy.mockRestore();
    });

    it('counts a candidate the spread lands on more than once as one spread toward the per-pulse cap', () =>
    {
      // Arrange- the real roll. The source rolls twice at 100% and Accumulate Mode counts both, so every candidate it
      // reaches takes the state twice. With a cap of two, counting each landing would spend the whole cap on the
      // first candidate and the second would get nothing.
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadPerTick:2>');
      const carrier = buildBattler({ uuid: 'carrier' });
      const source = buildBattler({
        uuid: 'source',
        notes: [ '<accumulate>' ],
        positiveRolls: 1,
      });
      const first = buildBattler({ uuid: 'first' });
      const second = buildBattler({ uuid: 'second' });
      const third = buildBattler({ uuid: 'third' });
      arrangeSpreadMap(carrier, [ first, second, third ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);

      // Act
      jabsState.handleSpreading();

      // Assert- two landings each on the two nearest, which spends the cap before the third is reached.
      expect(first.addState).toHaveBeenCalledTimes(2);
      expect(second.addState).toHaveBeenCalledTimes(2);
      expect(third.addState).not.toHaveBeenCalled();
    });

    it('leaves the per-pulse cap to the next candidate when the spread misses one', () =>
    {
      // Arrange- the real roll. The nearer candidate resists the state entirely through State Rate, so even at 100%
      // its roll never lands; had that miss counted, a cap of one would be spent before the farther one was reached.
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadPerTick:1>');
      const carrier = buildBattler({ uuid: 'carrier' });
      const source = buildBattler({ uuid: 'source' });
      const resistant = buildBattler({
        uuid: 'resistant',
        stateRate: 0,
      });
      const open = buildBattler({ uuid: 'open' });
      arrangeSpreadMap(carrier, [ resistant, open ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(resistant.addState).not.toHaveBeenCalled();
      expect(open.addState.mock.calls).toEqual([ [ SPREAD_STATE_ID, source, null ] ]);
    });

    it('never rolls for a candidate the spreading state cannot be added to', () =>
    {
      // Arrange- the real roll. The nearer candidate cannot take this state, though it could take any other; rolled
      // for at 100%, it would take the state and spend the cap of one before the farther candidate was reached.
      registerStateRow(SPREAD_STATE_ID, '<spread:[100, 5]><spreadPerTick:1>');
      const carrier = buildBattler({ uuid: 'carrier' });
      const source = buildBattler({ uuid: 'source' });
      const immune = buildBattler({ uuid: 'immune' });
      immune.isStateAddable = stateId => stateId !== SPREAD_STATE_ID;
      const open = buildBattler({ uuid: 'open' });
      arrangeSpreadMap(carrier, [ immune, open ]);
      const jabsState = new globalThis.JABS_State(carrier, SPREAD_STATE_ID, 0, 600, 1, source);

      // Act
      jabsState.handleSpreading();

      // Assert
      expect(immune.addState).not.toHaveBeenCalled();
      expect(open.addState.mock.calls).toEqual([ [ SPREAD_STATE_ID, source, null ] ]);
    });
  });
});
//endregion plugins/abs/core/_component/jabs-state-fate-rolls.test.js
