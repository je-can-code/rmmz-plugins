//region plugins/abs/ext/metrics/managers/jabs-metrics-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import {
  captureMetricWrites,
  installJabsButtonStub,
  installMetricsExternalConfig,
  SAMPLE_METRICS_CONFIG,
  setPluginContextToJabsMetrics,
} from '../_component/fixtures/install-abs-metrics-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('JABS_MetricsManager (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js').default} */
  let JABS_MetricsManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Metrics', {});
    installMetricsExternalConfig();
    installJabsButtonStub();

    setPluginContextToJabsMetrics();
    await import('../../../../../../src/plugins/abs/ext/metrics/_metadata/initialization.js');

    // the real metadata is booted above rather than hand-stubbed, so renaming a metadata field
    // without renaming its use here fails these tests rather than passing against a stale stub.
    const module = await import('../../../../../../src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js');
    JABS_MetricsManager = module.default;
  });

  /**
   * Builds the battler a tracking hook inspects, around one action result.
   *
   * Every outcome flag is spelled out rather than defaulted, because these methods branch on several
   * of them in sequence and a fixture that omits one would be asserting against `undefined` while
   * looking like it had made a choice.
   * @param {object} overrides The outcome flags this particular result carries.
   * @returns {object} The JABS battler stand-in.
   */
  function buildTarget(overrides)
  {
    const result = {
      hpDamage: 0,
      critical: false,
      parried: false,
      glancing: false,
      evaded: false,
      ...overrides,
    };

    return {
      getBattler: () => ({ result: () => result }),
    };
  }

  it('refuses to be constructed, because it holds no per-instance state', () =>
  {
    // Arrange & Act & Assert
    expect(() => new JABS_MetricsManager()).toThrow('This is a static class.');
  });

  describe('recordHighWaterMark', () =>
  {
    it('rewrites the record when the candidate beats it', () =>
    {
      // Arrange
      const transcript = captureMetricWrites({ 42: 50 });

      // Act
      JABS_MetricsManager.recordHighWaterMark(42, 120);

      // Assert
      expect(transcript.sets).toEqual([
        {
          variableId: 42,
          value: 120,
        } ]);
    });

    it('leaves the record alone when the candidate falls short', () =>
    {
      // Arrange
      const transcript = captureMetricWrites({ 42: 500 });

      // Act
      JABS_MetricsManager.recordHighWaterMark(42, 120);

      // Assert
      expect(transcript.sets).toEqual([]);
    });

    it('leaves the record alone when the candidate merely ties it', () =>
    {
      // Arrange- a tie is not a new record, and this is the boundary the comparison sits on.
      const transcript = captureMetricWrites({ 42: 120 });

      // Act
      JABS_MetricsManager.recordHighWaterMark(42, 120);

      // Assert
      expect(transcript.sets).toEqual([]);
    });
  });

  describe('trackDefeatedEnemy', () =>
  {
    it('files an inanimate battler under destructibles', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefeatedEnemy({ isInanimate: () => true });

      // Assert- exactly one write, so the enemy tally provably did not also move.
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.destructiblesDestroyed,
          amount: 1,
        } ]);
    });

    it('files an animate battler under enemies defeated', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefeatedEnemy({ isInanimate: () => false });

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.enemiesDefeated,
          amount: 1,
        } ]);
    });
  });

  describe('trackDefeatedAlly', () =>
  {
    it('counts the downed ally against its own tally rather than the player death count', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefeatedAlly();

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.alliesDowned,
          amount: 1,
        } ]);
    });
  });

  describe('trackDefeatedPlayer', () =>
  {
    it('counts the death', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefeatedPlayer();

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfDeaths,
          amount: 1,
        } ]);
    });
  });

  describe('trackAttackData', () =>
  {
    it('counts an enemy evasion and records nothing else about the swing', () =>
    {
      // Arrange- damage is present and non-zero, so the evasion branch is the only thing that can
      // keep it out of the damage tallies below.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackAttackData(buildTarget({
        hpDamage: 120,
        evaded: true,
      }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.attacksEvadedByEnemies,
          amount: 1,
        } ]);
      expect(transcript.sets).toEqual([]);
    });

    it('counts the damage and rewrites the personal best when the hit beats it', () =>
    {
      // Arrange
      const transcript = captureMetricWrites({ [SAMPLE_METRICS_CONFIG.highestDamageDealt]: 50 });

      // Act
      JABS_MetricsManager.trackAttackData(buildTarget({ hpDamage: 120 }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageDealt,
          amount: 120,
        } ]);
      expect(transcript.sets).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.highestDamageDealt,
          value: 120,
        } ]);
    });

    it('counts a critical separately and tracks the biggest one landed', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackAttackData(buildTarget({
        hpDamage: 300,
        critical: true,
      }));

      // Assert- a critical is also an ordinary hit, so both tallies move.
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageDealt,
          amount: 300,
        },
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfCritsDealt,
          amount: 1,
        } ]);
      expect(transcript.sets).toContainEqual({
        variableId: SAMPLE_METRICS_CONFIG.biggestCritDealt,
        value: 300,
      });
    });

    it('records nothing at all for a hit that dealt no hp damage', () =>
    {
      // Arrange- a purely status-inflicting skill is not an attack for records purposes.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackAttackData(buildTarget({ hpDamage: 0 }));

      // Assert
      expect(transcript.mods).toEqual([]);
      expect(transcript.sets).toEqual([]);
    });

    it('records nothing for a heal, which arrives as negative damage', () =>
    {
      // Arrange- healing an enemy is still a hit landing on an enemy, and adding a negative to the
      // running total would silently walk the player's lifetime damage backwards.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackAttackData(buildTarget({ hpDamage: -400 }));

      // Assert
      expect(transcript.mods).toEqual([]);
      expect(transcript.sets).toEqual([]);
    });
  });

  describe('trackDefensiveData', () =>
  {
    it('routes a hit that landed to the damage-taken tallies', () =>
    {
      // Arrange
      const transcript = captureMetricWrites({ [SAMPLE_METRICS_CONFIG.highestDamageTaken]: 10 });

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({ hpDamage: 80 }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageTaken,
          amount: 80,
        } ]);
      expect(transcript.sets).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.highestDamageTaken,
          value: 80,
        } ]);
    });

    it('counts a glancing blow alongside the damage it let through, not instead of it', () =>
    {
      // Arrange- a glancing blow is the partial parry, so unlike the other two outcomes it coexists
      // with damage rather than excluding it.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({
        hpDamage: 40,
        glancing: true,
      }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfGlancingBlows,
          amount: 1,
        },
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageTaken,
          amount: 40,
        } ]);
    });

    it('counts a hit that landed as damage rather than as a parry, even when it was parried', () =>
    {
      // Arrange- a parry that still let damage through is not a parry for records purposes; the two
      // outcomes are exclusive so that the parry count means "fully negated".
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({
        hpDamage: 80,
        parried: true,
      }));

      // Assert- the damage tally proves the branch ran, which is what makes the absence below
      // attributable to the routing rather than to nothing having happened.
      expect(transcript.mods).toContainEqual({
        variableId: SAMPLE_METRICS_CONFIG.totalDamageTaken,
        amount: 80,
      });
      expect(transcript.mods).not.toContainEqual({
        variableId: SAMPLE_METRICS_CONFIG.numberOfParries,
        amount: 1,
      });
    });

    it('counts a parry when nothing landed', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({ parried: true }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfParries,
          amount: 1,
        } ]);
    });

    it('counts a parry rather than an evasion when the hit was both', () =>
    {
      // Arrange- being fully negated on purpose is the more specific claim of the two, and both
      // flags being set is what makes this test able to prove which one wins.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({
        parried: true,
        evaded: true,
      }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfParries,
          amount: 1,
        } ]);
    });

    it('counts an evasion when the attack never connected and was not parried', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({ evaded: true }));

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.attacksEvadedByParty,
          amount: 1,
        } ]);
    });

    it('records nothing for a hit that neither landed, parried, nor was evaded', () =>
    {
      // Arrange- a skill that simply had no hp component against this target.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDefensiveData(buildTarget({}));

      // Assert
      expect(transcript.mods).toEqual([]);
      expect(transcript.sets).toEqual([]);
    });
  });

  describe('trackDamageTaken', () =>
  {
    it('counts a critical taken and tracks the biggest one received', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDamageTaken(200, true);

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageTaken,
          amount: 200,
        },
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfCritsTaken,
          amount: 1,
        } ]);
      expect(transcript.sets).toContainEqual({
        variableId: SAMPLE_METRICS_CONFIG.biggestCritTaken,
        value: 200,
      });
    });

    it('leaves the crit tallies alone for an ordinary hit', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDamageTaken(200, false);

      // Assert- the damage tally proves the method ran at all.
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.totalDamageTaken,
          amount: 200,
        } ]);
    });
  });

  describe('trackPreciseParry', () =>
  {
    it('counts only the precise tally, leaving the combined total to the outcome that already moved it', () =>
    {
      // Arrange- the deliberate parry writes the same `parried` outcome the passive one does, so it
      // is already counted where every negated hit is counted. Adding here too would double it and
      // drive the derived passive count negative.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackPreciseParry();

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfPreciseParries,
          amount: 1,
        } ]);
    });
  });

  describe('trackGuardedHit', () =>
  {
    it('counts the hit that landed on a raised guard', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackGuardedHit();

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.numberOfGuardedHits,
          amount: 1,
        } ]);
    });
  });

  describe('trackDamagePrevented', () =>
  {
    it('records the difference guarding actually saved', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDamagePrevented(100, 30);

      // Assert- 70, not 100 and not 30; the assertion has to distinguish the difference from either
      // operand, which is why the two inputs are unequal and neither equals the answer.
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.damagePreventedByGuarding,
          amount: 70,
        } ]);
    });

    it('records nothing when guarding improved the hit not at all', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDamagePrevented(100, 100);

      // Assert
      expect(transcript.mods).toEqual([]);
    });

    it('records nothing for healing, which runs the same path as negative damage', () =>
    {
      // Arrange- a heal reduced by guarding would produce a "prevented" figure pointing the wrong
      // way, quietly subtracting from a running total that is only supposed to grow.
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackDamagePrevented(-100, -30);

      // Assert
      expect(transcript.mods).toEqual([]);
    });
  });

  describe('trackGuardActivation', () =>
  {
    it('counts the raised guard', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackGuardActivation();

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.guardActivations,
          amount: 1,
        } ]);
    });
  });

  describe('trackItemUsage', () =>
  {
    it('counts a tool against the tool tally', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackItemUsage(globalThis.JABS_Button.Tool);

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.toolUsage,
          amount: 1,
        } ]);
    });

    it('counts a usable item against the usable item tally', () =>
    {
      // Arrange
      const transcript = captureMetricWrites();

      // Act
      JABS_MetricsManager.trackItemUsage(globalThis.JABS_Button.UsableItem);

      // Assert
      expect(transcript.mods).toEqual([
        {
          variableId: SAMPLE_METRICS_CONFIG.usableItemUsage,
          amount: 1,
        } ]);
    });
  });

  describe('trackActionData', () =>
  {
    [
      [ 'Mainhand', 'mainhandSkillUsage' ],
      [ 'Offhand', 'offhandSkillUsage' ],
      [ 'Dodge', 'dodgeSkillUsage' ],
      [ 'CombatSkill1', 'assignedSkillUsage' ],
      [ 'CombatSkill4', 'assignedSkillUsage' ],
    ].forEach(([ cooldownType, configKey ]) =>
    {
      it(`counts a ${cooldownType} action against its own tally`, () =>
      {
        // Arrange- the records board shows these separately, so a slot counted against the wrong
        // tally is a number the player can watch being wrong.
        const transcript = captureMetricWrites();

        // Act
        JABS_MetricsManager.trackActionData({ getCooldownType: () => globalThis.JABS_Button[cooldownType] });

        // Assert
        expect(transcript.mods).toEqual([
          {
            variableId: SAMPLE_METRICS_CONFIG[configKey],
            amount: 1,
          } ]);
      });
    });

    [ 'Tool', 'UsableItem' ].forEach(cooldownType =>
    {
      it(`counts nothing for the action a ${cooldownType} spawned, since the item itself was counted`, () =>
      {
        // Arrange- an item that carries a skill id reaches here in addition to being consumed, so
        // without an explicit case it would fall to the default arm and be double counted as an
        // equipped skill on top of its own tally.
        const transcript = captureMetricWrites();

        // Act
        JABS_MetricsManager.trackActionData({ getCooldownType: () => globalThis.JABS_Button[cooldownType] });

        // Assert
        expect(transcript.mods).toEqual([]);
      });
    });
  });
});
//endregion plugins/abs/ext/metrics/managers/jabs-metrics-manager.test.js