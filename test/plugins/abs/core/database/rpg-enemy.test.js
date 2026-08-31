//region plugins/abs/core/database/rpg-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * RPG_Enemy.js (despite the filename, it patches `RPG_BaseBattler.prototype` so both actors and
 * enemies inherit these getters) is a prototype-patch file with zero ES imports of its own for the
 * bare `RPG_BaseBattler`/`RPGManager` globals it reads- only `JABS_EnemyAI`/`JABS_BattlerRole` are
 * real imports, mocked per the unit-tier convention. Nearly every property here is a mechanical
 * `RPGManager.<checker>(this, J.ABS.RegExp.<Key>, true)` delegation, so most of this file is
 * covered via one data-driven describe.each table rather than 30+ hand-written near-duplicates.
 */
describe('J-ABS RPG_BaseBattler jabs* properties (unit, all downstream dependencies mocked)', () =>
{
  let JABS_EnemyAI_ctor;
  let JABS_BattlerRole_ctor;
  let battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    // every regex value just needs to be a distinct, identifiable token- RPGManager itself is
    // mocked, so the getters never actually run a real regex against a real note string.
    const regexKeys = [
      'TeamId', 'PrepareTime', 'Sight', 'Pursuit', 'GuardRange', 'GuardSkillId', 'AlertDuration', 'AlertedSightBoost',
      'AlertedPursuitBoost', 'AiTraitCareful', 'AiTraitExecutor', 'AiTraitReckless', 'AiTraitHealer',
      'AiTraitFollower', 'AiTraitLeader', 'AiTraitCleanser', 'AiTraitBuffer', 'AiTraitTactical',
      'AiTraitBerserker', 'AiRoleLeader', 'AiRoleFollower', 'AiRoleGuardian', 'AiRoleWard', 'AiRoleSolo',
      'AiRoleSentinel', 'ConfigCanIdle', 'ConfigNoIdle', 'ConfigShowHpBar', 'ConfigShowStates',
      'ConfigHideStates', 'ConfigNoHpBar', 'ConfigShowName', 'ConfigNoName', 'ConfigInvincible',
      'ConfigNotInvincible', 'ConfigInanimate', 'ConfigNotInanimate', 'Respawn', 'NoRespawn',
      'RespawnAnimation',
    ];
    const RegExp_ = {};
    regexKeys.forEach(key => { RegExp_[key] = new globalThis.RegExp(key); });
    globalThis.J = { ABS: { RegExp: RegExp_ } };

    function RPG_BaseBattler()
    {
    }
    globalThis.RPG_BaseBattler = RPG_BaseBattler;

    globalThis.RPGManager = {
      getNumberFromNoteByRegex: vi.fn(),
      checkForBooleanFromNoteByRegex: vi.fn(),
      getArrayFromNotesByRegex: vi.fn(),
    };

    JABS_EnemyAI_ctor = vi.fn(function(...args) { this.args = args; });
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: JABS_EnemyAI_ctor }));
    JABS_BattlerRole_ctor = vi.fn(function(...args) { this.args = args; });
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js', () => ({ default: JABS_BattlerRole_ctor }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: class {} }));

    await import('../../../../../src/plugins/abs/core/database/RPG_Enemy.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(null);
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset().mockReturnValue(null);
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset().mockReturnValue(null);
    JABS_EnemyAI_ctor.mockClear();
    JABS_BattlerRole_ctor.mockClear();
    battler = Object.create(globalThis.RPG_BaseBattler.prototype);
  });

  //region numeric note-value properties
  describe.each([
    [ 'jabsTeamId', 'TeamId' ],
    [ 'jabsPrepareTime', 'PrepareTime' ],
    [ 'jabsSightRange', 'Sight' ],
    [ 'jabsPursuitRange', 'Pursuit' ],
    [ 'jabsGuardRange', 'GuardRange' ],
    [ 'jabsGuardSkillId', 'GuardSkillId' ],
    [ 'jabsAlertDuration', 'AlertDuration' ],
    [ 'jabsAlertedSightBoost', 'AlertedSightBoost' ],
    [ 'jabsAlertedPursuitBoost', 'AlertedPursuitBoost' ],
    [ 'jabsRespawnAnimationId', 'RespawnAnimation' ],
  ])('%s', (propName, regexKey) =>
  {
    it(`delegates to RPGManager.getNumberFromNoteByRegex with J.ABS.RegExp.${regexKey} and nullIfEmpty:true`, () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(42);

      expect(battler[propName]).toEqual(42);
      expect(globalThis.RPGManager.getNumberFromNoteByRegex)
        .toHaveBeenCalledWith(battler, globalThis.J.ABS.RegExp[regexKey], true);
    });

    it('returns null when the note tag is absent', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);

      expect(battler[propName]).toBeNull();
    });
  });
  //endregion numeric note-value properties

  describe('jabsRespawnData', () =>
  {
    it('delegates to RPGManager.getArrayFromNotesByRegex with J.ABS.RegExp.Respawn and nullIfEmpty:true', () =>
    {
      // Arrange
      const taggedPair = [ 'seconds', 90 ];
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(taggedPair);

      // Act
      const result = battler.jabsRespawnData;

      // Assert
      expect(result).toBe(taggedPair);
      expect(globalThis.RPGManager.getArrayFromNotesByRegex)
        .toHaveBeenCalledWith(battler, globalThis.J.ABS.RegExp.Respawn, true);
    });

    it('returns null when the note tag is absent', () =>
    {
      // Arrange
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue(null);

      // Act
      const result = battler.jabsRespawnData;

      // Assert
      expect(result).toBeNull();
    });
  });

  //region boolean note-flag properties
  describe.each([
    [ 'jabsAiTraitCareful', 'AiTraitCareful' ],
    [ 'jabsAiTraitExecutor', 'AiTraitExecutor' ],
    [ 'jabsAiTraitReckless', 'AiTraitReckless' ],
    [ 'jabsAiTraitHealer', 'AiTraitHealer' ],
    [ 'jabsAiTraitFollower', 'AiTraitFollower' ],
    [ 'jabsAiTraitLeader', 'AiTraitLeader' ],
    [ 'jabsAiTraitCleanser', 'AiTraitCleanser' ],
    [ 'jabsAiTraitBuffer', 'AiTraitBuffer' ],
    [ 'jabsAiTraitTactical', 'AiTraitTactical' ],
    [ 'jabsAiTraitBerserker', 'AiTraitBerserker' ],
    [ 'jabsAiRoleLeader', 'AiRoleLeader' ],
    [ 'jabsAiRoleFollower', 'AiRoleFollower' ],
    [ 'jabsAiRoleGuardian', 'AiRoleGuardian' ],
    [ 'jabsAiRoleWard', 'AiRoleWard' ],
    [ 'jabsAiRoleSolo', 'AiRoleSolo' ],
    [ 'jabsAiRoleSentinel', 'AiRoleSentinel' ],
    [ 'jabsConfigCanIdle', 'ConfigCanIdle' ],
    [ 'jabsConfigNoIdle', 'ConfigNoIdle' ],
    [ 'jabsConfigShowHpBar', 'ConfigShowHpBar' ],
    [ 'jabsConfigShowStates', 'ConfigShowStates' ],
    [ 'jabsConfigHideStates', 'ConfigHideStates' ],
    [ 'jabsConfigNoHpBar', 'ConfigNoHpBar' ],
    [ 'jabsConfigShowName', 'ConfigShowName' ],
    [ 'jabsConfigNoName', 'ConfigNoName' ],
    [ 'jabsConfigInvincible', 'ConfigInvincible' ],
    [ 'jabsConfigNotInvincible', 'ConfigNotInvincible' ],
    [ 'jabsConfigInanimate', 'ConfigInanimate' ],
    [ 'jabsConfigNotInanimate', 'ConfigNotInanimate' ],
    [ 'jabsNoRespawn', 'NoRespawn' ],
  ])('%s', (propName, regexKey) =>
  {
    it(`delegates to RPGManager.checkForBooleanFromNoteByRegex with J.ABS.RegExp.${regexKey} and nullIfEmpty:true`, () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

      expect(battler[propName]).toEqual(true);
      expect(globalThis.RPGManager.checkForBooleanFromNoteByRegex)
        .toHaveBeenCalledWith(battler, globalThis.J.ABS.RegExp[regexKey], true);
    });

    it('returns null when the note tag is absent', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(null);

      expect(battler[propName]).toBeNull();
    });
  });
  //endregion boolean note-flag properties

  //region composite properties
  describe('jabsBattlerAi', () =>
  {
    it('constructs a JABS_EnemyAI from all eight ai-trait properties', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_obj, regex) => regex === globalThis.J.ABS.RegExp.AiTraitCareful);

      const ai = battler.jabsBattlerAi;

      expect(JABS_EnemyAI_ctor).toHaveBeenCalledWith(true, false, false, false, false, false, false, false);
      expect(ai).toBeInstanceOf(JABS_EnemyAI_ctor);
    });
  });

  describe('jabsBattlerRole', () =>
  {
    it('constructs a JABS_BattlerRole from the six role/legacy-alias properties', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_obj, regex) => regex === globalThis.J.ABS.RegExp.AiRoleGuardian);

      battler.jabsBattlerRole;

      expect(JABS_BattlerRole_ctor).toHaveBeenCalledWith(false, false, true, false, false, false);
    });

    it('honors the legacy aiTrait:leader alias when the aiRole:leader tag is absent', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_obj, regex) => regex === globalThis.J.ABS.RegExp.AiTraitLeader);

      battler.jabsBattlerRole;

      const [ leader ] = JABS_BattlerRole_ctor.mock.calls.at(-1);
      expect(leader).toEqual(true);
    });

    it('honors the legacy aiTrait:follower alias when the aiRole:follower tag is absent', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockImplementation((_obj, regex) => regex === globalThis.J.ABS.RegExp.AiTraitFollower);

      battler.jabsBattlerRole;

      const [ , follower ] = JABS_BattlerRole_ctor.mock.calls.at(-1);
      expect(follower).toEqual(true);
    });

    it('prefers the aiRole:leader tag over the legacy alias when both are present', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

      battler.jabsBattlerRole;

      const [ leader ] = JABS_BattlerRole_ctor.mock.calls.at(-1);
      expect(leader).toEqual(true);
    });
  });
  //endregion composite properties
});
//endregion plugins/abs/core/database/rpg-enemy.test.js
