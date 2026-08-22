//region plugins/__ca-mods/_component/jabs-engine-tracking.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installCamodsHostGlobals, setPluginContextToJBase, setPluginContextToJCamods } from './fixtures/install-camods-host-globals.js';

describe('J-CA-Mods JABS_Engine tracking hooks (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCamodsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJCamods();
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // patches globalThis.JABS_Engine.prototype directly, no vm involved.
    await import('../../../../src/plugins/__ca-mods/core/managers/JABS_Engine.js');
  });

  it('handleDefeatedEnemy tracks inanimate vs animate as different variables', () =>
  {
    // Arrange
    const calls = [];
    globalThis.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };
    const engine = new globalThis.JABS_Engine();

    // Act
    engine.handleDefeatedEnemy({ isInanimate: () => true }, null);
    engine.handleDefeatedEnemy({ isInanimate: () => false }, null);

    // Assert
    expect(calls).toEqual([
      { variableId: globalThis.J.CAMods.Tracking.DestructiblesDestroyed, amount: 1 },
      { variableId: globalThis.J.CAMods.Tracking.EnemiesDefeated, amount: 1 },
    ]);
  });

  it('handleDefeatedPlayer increments deaths variable', () =>
  {
    // Arrange
    const calls = [];
    globalThis.J.BASE.Helpers.modVariable = function(variableId, amount)
    {
      calls.push({ variableId, amount });
    };
    const engine = new globalThis.JABS_Engine();

    // Act
    engine.handleDefeatedPlayer();

    // Assert
    expect(calls).toEqual([
      { variableId: globalThis.J.CAMods.Tracking.NumberOfDeaths, amount: 1 },
    ]);
  });

  //region the running tally behind the records board
  /**
   * Captures every variable the tracking hooks touch, both increments and outright sets.
   *
   * The two are different statements: a count accumulates forever, while a personal best only moves
   * when it is actually beaten. Recording them separately is what lets a test tell "the hit was
   * counted" apart from "the record was rewritten".
   * @param {Record<number, number>} startingValues What each variable already reads.
   * @returns {{mods: object[], sets: object[]}} The transcript.
   */
  function captureTracking(startingValues = {})
  {
    const transcript = {
      mods: [],
      sets: [],
    };

    globalThis.J.BASE.Helpers.modVariable = (variableId, amount) => transcript.mods.push({
      variableId,
      amount,
    });

    globalThis.$gameVariables = {
      value: variableId => startingValues[variableId] ?? 0,
      setValue: (variableId, value) => transcript.sets.push({
        variableId,
        value,
      }),
    };

    return transcript;
  }

  /**
   * Builds the target a tracking hook inspects, around one action result.
   * @param {object} result The action result the target reports.
   * @param {object=} overrides Which side of the fight the target is on.
   * @returns {object} The JABS battler stand-in.
   */
  function buildTarget(result, overrides = {})
  {
    return {
      isEnemy: () => true,
      isActor: () => false,
      getBattler: () => ({ result: () => result }),
      ...overrides,
    };
  }

  describe('trackAttackData', () =>
  {
    it('counts damage dealt and rewrites the personal best when the hit beats it', () =>
    {
      // Arrange
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.HighestDamageDealt]: 50 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackAttackData(buildTarget({ hpDamage: 120, critical: false }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.TotalDamageDealt,
        amount: 120,
      });
      expect(transcript.sets).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.HighestDamageDealt,
        value: 120,
      });
    });

    it('leaves the personal best alone for a hit that does not beat it', () =>
    {
      // Arrange- the total still climbs; only the record holds.
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.HighestDamageDealt]: 500 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackAttackData(buildTarget({ hpDamage: 120, critical: false }));

      // Assert
      expect(transcript.sets).toEqual([]);
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.TotalDamageDealt,
        amount: 120,
      });
    });

    it('counts a critical separately and tracks the biggest one landed', () =>
    {
      // Arrange
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackAttackData(buildTarget({ hpDamage: 300, critical: true }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfCritsDealt,
        amount: 1,
      });
      expect(transcript.sets).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.BiggestCritDealt,
        value: 300,
      });
    });

    it('leaves the biggest-crit record alone for a smaller critical', () =>
    {
      // Arrange
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.BiggestCritDealt]: 900 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackAttackData(buildTarget({ hpDamage: 300, critical: true }));

      // Assert
      expect(transcript.sets)
        .not.toContainEqual({
          variableId: globalThis.J.CAMods.Tracking.BiggestCritDealt,
          value: 300,
        });
    });

    it('records nothing for a hit that dealt no hp damage at all', () =>
    {
      // Arrange- a purely status-inflicting skill is not an attack for records purposes.
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackAttackData(buildTarget({ hpDamage: 0, critical: false }));

      // Assert
      expect(transcript.mods).toEqual([]);
      expect(transcript.sets).toEqual([]);
    });
  });

  describe('trackDefensiveData', () =>
  {
    it('counts damage taken and rewrites the worst hit when this one beats it', () =>
    {
      // Arrange
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.HighestDamageTaken]: 10 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 80, critical: false, parried: false, preciseParried: false }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.TotalDamageTaken,
        amount: 80,
      });
      expect(transcript.sets).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.HighestDamageTaken,
        value: 80,
      });
    });

    it('leaves the worst-hit record alone for a lesser hit', () =>
    {
      // Arrange
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.HighestDamageTaken]: 800 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 80, critical: false, parried: false, preciseParried: false }));

      // Assert
      expect(transcript.sets).toEqual([]);
    });

    it('counts a critical taken and tracks the biggest one received', () =>
    {
      // Arrange
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 200, critical: true, parried: false, preciseParried: false }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfCritsTaken,
        amount: 1,
      });
      expect(transcript.sets).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.BiggestCritTaken,
        value: 200,
      });
    });

    it('leaves the biggest-crit-taken record alone for a smaller one', () =>
    {
      // Arrange
      const transcript = captureTracking({ [globalThis.J.CAMods.Tracking.BiggestCritTaken]: 900 });
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 200, critical: true, parried: false, preciseParried: false }));

      // Assert
      expect(transcript.sets)
        .not.toContainEqual({
          variableId: globalThis.J.CAMods.Tracking.BiggestCritTaken,
          value: 200,
        });
    });

    it('counts a parry only when the hit dealt no damage', () =>
    {
      // Arrange- a parry that still let damage through is recorded as damage taken, not as a parry;
      // the two are deliberately exclusive so the parry count means "fully negated".
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 0, critical: false, parried: true, preciseParried: false }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfParries,
        amount: 1,
      });

      // an ordinary parry must not also be counted as a precise one. The assertion above is what
      // makes this safe to state negatively: it proves the parry branch ran at all, so a silent
      // failure to enter it cannot be what produces the absence below.
      expect(transcript.mods).not.toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfPreciseParries,
        amount: 1,
      });
    });

    it('counts a precise parry on top of the ordinary parry it also is', () =>
    {
      // Arrange
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 0, critical: false, parried: true, preciseParried: true }));

      // Assert
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfPreciseParries,
        amount: 1,
      });
      expect(transcript.mods).toContainEqual({
        variableId: globalThis.J.CAMods.Tracking.NumberOfParries,
        amount: 1,
      });
    });

    it('records nothing for a hit that neither landed nor was parried', () =>
    {
      // Arrange
      const transcript = captureTracking();
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.trackDefensiveData(buildTarget({ hpDamage: 0, critical: false, parried: false, preciseParried: false }));

      // Assert
      expect(transcript.mods).toEqual([]);
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    it('tracks a hit on an enemy as attack data', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(engine, 'trackAttackData').mockImplementation(() => {});

      // Act
      engine.postExecuteSkillEffects({ getCooldownType: () => 'mainhand' }, buildTarget({}));

      // Assert
      expect(trackAttackData).toHaveBeenCalled();

      trackAttackData.mockRestore();
    });

    it('tracks a hit on an actor as defensive data', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackDefensiveData = vi.spyOn(engine, 'trackDefensiveData').mockImplementation(() => {});
      const target = buildTarget({}, { isEnemy: () => false, isActor: () => true });

      // Act
      engine.postExecuteSkillEffects({ getCooldownType: () => 'mainhand' }, target);

      // Assert
      expect(trackDefensiveData).toHaveBeenCalled();

      trackDefensiveData.mockRestore();
    });

    it('tracks nothing against a target that is neither an enemy nor an actor', () =>
    {
      // Arrange- the records board only knows those two sides, so anything else on the map falls
      // through both arms rather than being counted as one of them by default.
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(engine, 'trackAttackData').mockImplementation(() => {});
      const trackDefensiveData = vi.spyOn(engine, 'trackDefensiveData').mockImplementation(() => {});
      const target = buildTarget({}, { isEnemy: () => false, isActor: () => false });

      // Act
      engine.postExecuteSkillEffects({ getCooldownType: () => 'mainhand' }, target);

      // Assert
      expect(trackAttackData).not.toHaveBeenCalled();
      expect(trackDefensiveData).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('tracks nothing for a tool, which is neither an attack nor a defense', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackAttackData = vi.spyOn(engine, 'trackAttackData').mockImplementation(() => {});

      // Act
      engine.postExecuteSkillEffects({ getCooldownType: () => globalThis.JABS_Button.Tool }, buildTarget({}));

      // Assert
      expect(trackAttackData).not.toHaveBeenCalled();

      trackAttackData.mockRestore();
    });
  });

  describe('trackActionData', () =>
  {
    [
      [ 'mainhand', 'MainhandSkillUsage' ],
      [ 'offhand', 'OffhandSkillUsage' ],
      [ 'combat-skill-1', 'AssignedSkillUsage' ],
    ].forEach(([ cooldownType, trackingKey ]) =>
    {
      it(`counts a ${cooldownType} action against its own tally`, () =>
      {
        // Arrange- the records board shows these three separately, so a slot counted against the
        // wrong tally is a number the player can watch being wrong.
        const transcript = captureTracking();
        const engine = new globalThis.JABS_Engine();

        // Act
        engine.trackActionData({ getCooldownType: () => cooldownType });

        // Assert
        expect(transcript.mods).toContainEqual({
          variableId: globalThis.J.CAMods.Tracking[trackingKey],
          amount: 1,
        });
      });
    });
  });

  describe('executeMapAction', () =>
  {
    it('tracks only what the player themselves did', () =>
    {
      // Arrange- an ally or an enemy swinging a mainhand must not land on the player's own tally.
      const engine = new globalThis.JABS_Engine();
      const trackActionData = vi.spyOn(engine, 'trackActionData').mockImplementation(() => {});

      // Act
      engine.executeMapAction({ isPlayer: () => false }, {}, 0, 0);

      // Assert
      expect(trackActionData).not.toHaveBeenCalled();

      trackActionData.mockRestore();
    });

    it('tracks the action when the player is the one casting', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const trackActionData = vi.spyOn(engine, 'trackActionData').mockImplementation(() => {});

      // Act
      engine.executeMapAction({ isPlayer: () => true }, {}, 0, 0);

      // Assert
      expect(trackActionData).toHaveBeenCalled();

      trackActionData.mockRestore();
    });
  });
  //endregion the running tally behind the records board
});
//endregion plugins/__ca-mods/_component/jabs-engine-tracking.test.js
