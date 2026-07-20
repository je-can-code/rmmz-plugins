//region plugins/abs/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Enemy.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Enemy.prototype`), so this file direct-imports it against bare placeholder engine
 * globals rather than nesting a vm context. Every sibling model it imports is mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention (both are unused as
 * values here- JSDoc typing only- so they get trivial empty stubs).
 */
describe('J-ABS Game_Enemy (unit, all downstream dependencies mocked)', () =>
{
  let originalSetup;
  let originalOnBattlerDataChange;
  let originalLearnSkill;
  let originalBasicAttackSkillId;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { Game_Enemy: new Map() },
        Metadata: {
          DefaultEnemyAttackSkillId: 1,
          DefaultEnemyPrepareTime: 60,
          DefaultEnemySightRange: 4,
          DefaultEnemyAlertedSightBoost: 2,
          DefaultEnemyPursuitRange: 6,
          DefaultEnemyAlertedPursuitBoost: 3,
          DefaultEnemyAlertDuration: 300,
          DefaultEnemyCanIdle: true,
          DefaultEnemyShowHpBar: true,
          DefaultEnemyShowBattlerName: true,
          DefaultEnemyIsInvincible: false,
          DefaultEnemyIsInanimate: false,
        },
      },
      BASE: { Traits: { ATTACK_SPEED: 99 } },
    };

    function Game_Enemy()
    {
    }
    originalSetup = vi.fn();
    originalOnBattlerDataChange = vi.fn();
    originalLearnSkill = vi.fn(() => true);
    originalBasicAttackSkillId = vi.fn(() => 0);
    Game_Enemy.prototype.setup = originalSetup;
    Game_Enemy.prototype.onBattlerDataChange = originalOnBattlerDataChange;
    Game_Enemy.prototype.learnSkill = originalLearnSkill;
    Game_Enemy.prototype.basicAttackSkillId = originalBasicAttackSkillId;
    globalThis.Game_Enemy = Game_Enemy;

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static enemyTeamId()
        {
          return 1;
        }
      },
    }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    originalSetup.mockClear();
    originalOnBattlerDataChange.mockClear();
    originalLearnSkill.mockClear().mockReturnValue(true);
    originalBasicAttackSkillId.mockClear().mockReturnValue(0);
  });

  /**
   * Builds a real Game_Enemy-prototype-backed instance with sane, overridable stubs.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object} A stubbed Game_Enemy instance.
   */
  function buildEnemy(overrides = {})
  {
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    Object.assign(enemy, {
      databaseData: () => buildReferenceData(),
      getSkillSlotManager: () => ({ setupSlots: vi.fn() }),
      refreshBonusHits: vi.fn(),
      refreshCdr: vi.fn(),
      refreshPer: vi.fn(),
      refreshPositiveRolls: vi.fn(),
      refreshNegativeRolls: vi.fn(),
      refreshEncoreRepeats: vi.fn(),
      setCachedProjectileDurationModifier: vi.fn(),
      allStates: () => [],
      ...overrides,
    });
    return enemy;
  }

  /**
   * Builds a fake reference database row with every jabs* field defaulted to null.
   * @param {object} [overrides] Field overrides.
   * @returns {object} A fake reference data row.
   */
  function buildReferenceData(overrides = {})
  {
    return {
      traits: [],
      jabsPrepareTime: null,
      jabsTeamId: null,
      jabsBattlerAi: null,
      jabsSightRange: null,
      jabsAlertedSightBoost: null,
      jabsPursuitRange: null,
      jabsGuardRange: null,
      jabsAlertedPursuitBoost: null,
      jabsAlertDuration: null,
      jabsConfigCanIdle: null,
      jabsConfigNoIdle: null,
      jabsConfigShowHpBar: null,
      jabsConfigNoHpBar: null,
      jabsConfigShowStates: null,
      jabsConfigHideStates: null,
      jabsConfigShowName: null,
      jabsConfigNoName: null,
      jabsConfigInvincible: null,
      jabsConfigNotInvincible: null,
      jabsConfigInanimate: null,
      jabsConfigNotInanimate: null,
      ...overrides,
    };
  }

  describe('setup()', () =>
  {
    it('performs original logic then initializes abs skills and refreshes jabs', () =>
    {
      const enemy = buildEnemy();
      const initSpy = vi.spyOn(enemy, 'initAbsSkills');
      const refreshSpy = vi.spyOn(enemy, 'jabsRefresh');

      enemy.setup(1, 0, 0);

      expect(originalSetup).toHaveBeenCalledWith(1, 0, 0);
      expect(initSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('initAbsSkills()', () =>
  {
    it('sets up the skill slot manager', () =>
    {
      const slotManager = { setupSlots: vi.fn() };
      const enemy = buildEnemy({ getSkillSlotManager: () => slotManager });

      enemy.initAbsSkills();

      expect(slotManager.setupSlots).toHaveBeenCalledWith(enemy);
    });
  });

  describe('onBattlerDataChange()', () =>
  {
    it('performs the original logic and refreshes every cached derived stat', () =>
    {
      const enemy = buildEnemy();

      enemy.onBattlerDataChange();

      expect(originalOnBattlerDataChange).toHaveBeenCalled();
      expect(enemy.refreshBonusHits).toHaveBeenCalled();
      expect(enemy.refreshCdr).toHaveBeenCalled();
      expect(enemy.refreshPer).toHaveBeenCalled();
      expect(enemy.refreshPositiveRolls).toHaveBeenCalled();
      expect(enemy.refreshNegativeRolls).toHaveBeenCalled();
      expect(enemy.refreshEncoreRepeats).toHaveBeenCalled();
      expect(enemy.setCachedProjectileDurationModifier).toHaveBeenCalledWith(null);
    });
  });

  describe('onLearnNewSkill()', () =>
  {
    it('flags the battler for a data update', () =>
    {
      const enemy = buildEnemy();
      const changeSpy = vi.spyOn(enemy, 'onBattlerDataChange').mockImplementation(() => {});

      enemy.onLearnNewSkill(5);

      expect(changeSpy).toHaveBeenCalled();
    });
  });

  describe('learnSkill()', () =>
  {
    it('does nothing further when no new skill was learned', () =>
    {
      originalLearnSkill.mockReturnValue(false);
      const enemy = buildEnemy();
      const onLearnSpy = vi.spyOn(enemy, 'onLearnNewSkill');

      enemy.learnSkill(5);

      expect(onLearnSpy).not.toHaveBeenCalled();
    });

    it('triggers learn effects and re-initializes skill slots when a new skill was learned', () =>
    {
      originalLearnSkill.mockReturnValue(true);
      const enemy = buildEnemy();
      const onLearnSpy = vi.spyOn(enemy, 'onLearnNewSkill').mockImplementation(() => {});
      const initSpy = vi.spyOn(enemy, 'initAbsSkills').mockImplementation(() => {});

      enemy.learnSkill(5);

      expect(onLearnSpy).toHaveBeenCalledWith(5);
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('basicAttackSkillId()', () =>
  {
    it('returns the original resolved skill id when present', () =>
    {
      originalBasicAttackSkillId.mockReturnValue(7);
      const enemy = buildEnemy();

      expect(enemy.basicAttackSkillId()).toEqual(7);
    });

    it('falls back to the default when the original resolves null/undefined', () =>
    {
      // uses `??`, not a falsy check- 0 is a real (non-fallback) resolved value; only
      // null/undefined trigger the default.
      originalBasicAttackSkillId.mockReturnValue(null);
      const enemy = buildEnemy();

      expect(enemy.basicAttackSkillId()).toEqual(1);
    });

    it('does NOT fall back to the default for a resolved 0 (not nullish)', () =>
    {
      originalBasicAttackSkillId.mockReturnValue(0);
      const enemy = buildEnemy();

      expect(enemy.basicAttackSkillId()).toEqual(0);
    });
  });

  describe('prepareTime()', () =>
  {
    it('prefers the ATTACK_SPEED trait when present', () =>
    {
      const enemy = buildEnemy({
        databaseData: () => buildReferenceData({ traits: [ { code: 99, value: 42 } ] }),
      });

      expect(enemy.prepareTime()).toEqual(42);
    });

    it('falls back to the notes value when no trait is present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsPrepareTime: 30 }) });

      expect(enemy.prepareTime()).toEqual(30);
    });

    it('falls back to the default when neither trait nor note is present', () =>
    {
      const enemy = buildEnemy();

      expect(enemy.prepareTime()).toEqual(60);
    });
  });

  describe('teamId()', () =>
  {
    it('falls back to the enemy team id when no tag is present', () =>
    {
      const enemy = buildEnemy();

      expect(enemy.teamId()).toEqual(1);
    });

    it('returns the tagged team id when present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsTeamId: 5 }) });

      expect(enemy.teamId()).toEqual(5);
    });
  });

  describe('ai()', () =>
  {
    it('returns the tagged battler ai', () =>
    {
      const ai = { tag: 'ai' };
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsBattlerAi: ai }) });

      expect(enemy.ai()).toEqual(ai);
    });
  });

  // table-driven coverage for the repeated "note value present -> use it, else default" getters.
  describe.each([
    [ 'sightRange', 'jabsSightRange', 10, 4 ],
    [ 'alertedSightBoost', 'jabsAlertedSightBoost', 5, 2 ],
    [ 'pursuitRange', 'jabsPursuitRange', 12, 6 ],
    [ 'alertedPursuitBoost', 'jabsAlertedPursuitBoost', 7, 3 ],
    [ 'alertDuration', 'jabsAlertDuration', 500, 300 ],
  ])('%s()', (method, field, taggedValue, defaultValue) =>
  {
    it('returns the tagged value when present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ [ field ]: taggedValue }) });

      expect(enemy[method]()).toEqual(taggedValue);
    });

    it('falls back to the default when no tag is present', () =>
    {
      const enemy = buildEnemy();

      expect(enemy[method]()).toEqual(defaultValue);
    });
  });

  describe('guardRange()', () =>
  {
    it('returns null when untagged', () =>
    {
      const enemy = buildEnemy();

      expect(enemy.guardRange()).toBeNull();
    });

    it('returns the tagged guard range', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsGuardRange: 8 }) });

      expect(enemy.guardRange()).toEqual(8);
    });
  });

  // table-driven coverage for the repeated "positive tag -> true, negative tag -> false (inverted),
  // else inanimate-aware default" boolean getters.
  describe.each([
    [ 'canIdle', 'jabsConfigCanIdle', 'jabsConfigNoIdle', true ],
    [ 'showHpBar', 'jabsConfigShowHpBar', 'jabsConfigNoHpBar', true ],
    [ 'showBattlerName', 'jabsConfigShowName', 'jabsConfigNoName', true ],
    [ 'isInvincible', 'jabsConfigInvincible', 'jabsConfigNotInvincible', false ],
    [ 'isInanimate', 'jabsConfigInanimate', 'jabsConfigNotInanimate', false ],
  ])('%s()', (method, positiveField, negativeField, defaultValue) =>
  {
    it('returns true when the positive tag is present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ [ positiveField ]: true }) });

      expect(enemy[method]()).toEqual(true);
    });

    it('returns false when the positive tag is explicitly false', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ [ positiveField ]: false }) });

      expect(enemy[method]()).toEqual(false);
    });

    it('inverts the negative/prohibition tag when present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ [ negativeField ]: true }) });

      expect(enemy[method]()).toEqual(false);
    });

    it(`falls back to the default (${defaultValue}) when untagged and animate`, () =>
    {
      const enemy = buildEnemy({ isInanimate: () => false });

      expect(enemy[method]()).toEqual(defaultValue);
    });
  });

  // isInanimate() itself, called through the real prototype (not the `buildEnemy({ isInanimate })`
  // override the generic table above uses for every OTHER method's animate-default case), so its
  // own untagged fallback to J.ABS.Metadata.DefaultEnemyIsInanimate actually executes.
  it('isInanimate() falls back to the configured default when untagged', () =>
  {
    const enemy = buildEnemy({ databaseData: () => buildReferenceData({}) });

    expect(enemy.isInanimate()).toEqual(false);
  });

  // isInanimate() itself can't consult isInanimate() as an override source (that would be
  // circular), so the "inanimate battlers default to false" branch only applies to the other
  // four boolean getters- verified separately here.
  describe.each([
    [ 'canIdle' ], [ 'showHpBar' ], [ 'showBattlerName' ],
  ])('%s() inanimate default override', (method) =>
  {
    it('defaults to false for an untagged inanimate battler', () =>
    {
      const enemy = buildEnemy({ isInanimate: () => true });

      expect(enemy[method]()).toEqual(false);
    });
  });

  describe('showStates()', () =>
  {
    it('returns the tagged show-states value when present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsConfigShowStates: false }) });

      expect(enemy.showStates()).toEqual(false);
    });

    it('inverts the hide-states tag when present', () =>
    {
      const enemy = buildEnemy({ databaseData: () => buildReferenceData({ jabsConfigHideStates: true }) });

      expect(enemy.showStates()).toEqual(false);
    });

    it('defaults to true when untagged', () =>
    {
      const enemy = buildEnemy();

      expect(enemy.showStates()).toEqual(true);
    });
  });

  describe('getBonusHitsSources()', () =>
  {
    it('collects allStates and the enemy database row', () =>
    {
      const allStates = [ 'state' ];
      const referenceData = buildReferenceData();
      const enemy = buildEnemy({ allStates: () => allStates, databaseData: () => referenceData });

      expect(enemy.getBonusHitsSources()).toEqual([ allStates, [ referenceData ] ]);
    });
  });
});
//endregion plugins/abs/core/objects/game-enemy.test.js
