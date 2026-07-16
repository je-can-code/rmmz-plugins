//region plugins/abs/core/models/jabs-battler-core-data-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_BattlerCoreDataBuilder.js imports JABS_EnemyAI/JABS_BattlerRole/JABS_AI only to construct
 * default field values (never inspected beyond identity), JABS_Battler for its static team-id
 * helpers, and JABS_BattlerCoreData as the real object under construction- mocked with a
 * behavior-preserving stub that captures its constructor payload, per the unit-tier convention.
 */
describe('JABS_BattlerCoreDataBuilder (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreDataBuilder.js').default} */
  let JABS_BattlerCoreDataBuilder;
  let JABS_BattlerCoreData_mock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Metadata: {
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
        EXT: { DANGER: null },
      },
    };

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_AI.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static enemyTeamId() { return 1; }
        static allyTeamId() { return 0; }
      },
    }));

    JABS_BattlerCoreData_mock = vi.fn(function(payload)
    {
      Object.assign(this, payload);
      this.setDangerIndicator = vi.fn();
    });
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreData.js', () => ({ default: JABS_BattlerCoreData_mock }));

    ({ default: JABS_BattlerCoreDataBuilder } =
      await import('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreDataBuilder.js'));
  });

  beforeEach(() =>
  {
    JABS_BattlerCoreData_mock.mockClear();
    globalThis.J.ABS.EXT.DANGER = null;
  });

  //region build
  describe('build', () =>
  {
    it('builds core data seeded with the enemy team id and the default enemy metadata', () =>
    {
      // Arrange
      const builder = new JABS_BattlerCoreDataBuilder(7);

      // Act
      const built = builder.build();

      // Assert
      expect(built.battlerId).toEqual(7);
      expect(built.teamId).toEqual(1);
      expect(built.sightRange).toEqual(4);
      expect(built.alertedSightBoost).toEqual(2);
      expect(built.pursuitRange).toEqual(6);
      expect(built.alertedPursuitBoost).toEqual(3);
      expect(built.alertDuration).toEqual(300);
      expect(built.guardRange).toBeNull();
      expect(built.canIdle).toEqual(true);
      expect(built.showHpBar).toEqual(true);
      expect(built.showStates).toEqual(true);
      expect(built.showBattlerName).toEqual(true);
      expect(built.isInvincible).toEqual(false);
      expect(built.isInanimate).toEqual(false);
    });

    it('does not set a danger indicator when the danger extension is not present', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.DANGER = null;
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const built = builder.build();

      // Assert
      expect(built.setDangerIndicator).not.toHaveBeenCalled();
    });

    it('sets the danger indicator using the danger extension default when present', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.DANGER = { Metadata: { DefaultEnemyShowDangerIndicator: true } };
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const built = builder.build();

      // Assert
      expect(built.setDangerIndicator).toHaveBeenCalledWith(true);
    });
  });
  //endregion build

  //region setBattler
  describe('setBattler', () =>
  {
    it('copies every readable property off the provided battler', () =>
    {
      // Arrange
      const battler = {
        battlerId: vi.fn(() => 55),
        teamId: vi.fn(() => 2),
        ai: vi.fn(() => 'ai'),
        sightRange: vi.fn(() => 9),
        alertedSightBoost: vi.fn(() => 8),
        pursuitRange: vi.fn(() => 7),
        alertedPursuitBoost: vi.fn(() => 6),
        alertDuration: vi.fn(() => 5),
        canIdle: vi.fn(() => false),
        showHpBar: vi.fn(() => false),
        showStates: vi.fn(() => false),
        showDangerIndicator: vi.fn(() => true),
        showBattlerName: vi.fn(() => false),
        isInvincible: vi.fn(() => true),
        isInanimate: vi.fn(() => true),
      };
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const result = builder.setBattler(battler);
      const built = builder.build();

      // Assert
      expect(built.battlerId).toEqual(55);
      expect(built.teamId).toEqual(2);
      expect(built.battlerAI).toEqual('ai');
      expect(built.sightRange).toEqual(9);
      expect(built.alertedSightBoost).toEqual(8);
      expect(built.pursuitRange).toEqual(7);
      expect(built.alertedPursuitBoost).toEqual(6);
      expect(built.alertDuration).toEqual(5);
      expect(built.canIdle).toEqual(false);
      expect(built.showHpBar).toEqual(false);
      expect(built.showStates).toEqual(false);
      expect(built.showBattlerName).toEqual(false);
      expect(built.isInvincible).toEqual(true);
      expect(built.isInanimate).toEqual(true);
      expect(result).toBe(builder);
    });
  });
  //endregion setBattler

  //region isPlayer
  describe('isPlayer', () =>
  {
    it('zeroes all ranges and flags all booleans false, using the ally team id', () =>
    {
      // Arrange
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const result = builder.isPlayer();
      const built = builder.build();

      // Assert
      expect(built.teamId).toEqual(0);
      expect(built.sightRange).toEqual(0);
      expect(built.alertedSightBoost).toEqual(0);
      expect(built.pursuitRange).toEqual(0);
      expect(built.alertedPursuitBoost).toEqual(0);
      expect(built.alertDuration).toEqual(0);
      expect(built.canIdle).toEqual(false);
      expect(built.showHpBar).toEqual(false);
      expect(built.showBattlerName).toEqual(false);
      expect(built.isInvincible).toEqual(false);
      expect(built.isInanimate).toEqual(false);
      expect(result).toBe(builder);
    });
  });
  //endregion isPlayer

  //region isDummy
  describe('isDummy', () =>
  {
    it('defaults to the enemy team id when not friendly', () =>
    {
      // Arrange
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const result = builder.isDummy();
      const built = builder.build();

      // Assert
      expect(built.teamId).toEqual(1);
      expect(result).toBe(builder);
    });

    it('uses the ally team id when explicitly friendly', () =>
    {
      // Arrange
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      builder.isDummy(true);
      const built = builder.build();

      // Assert
      expect(built.teamId).toEqual(0);
    });
  });
  //endregion isDummy

  //region individual fluent setters
  describe.each([
    [ 'setBattlerId', 'battlerId', 42 ],
    [ 'setTeamId', 'teamId', 9 ],
    [ 'setSightRange', 'sightRange', 11 ],
    [ 'setAlertedSightBoost', 'alertedSightBoost', 12 ],
    [ 'setPursuitRange', 'pursuitRange', 13 ],
    [ 'setAlertedPursuitBoost', 'alertedPursuitBoost', 14 ],
    [ 'setAlertDuration', 'alertDuration', 15 ],
    [ 'setGuardRange', 'guardRange', 16 ],
    [ 'setCanIdle', 'canIdle', false ],
    [ 'setShowHpBar', 'showHpBar', false ],
    [ 'setShowStates', 'showStates', false ],
    [ 'setShowBattlerName', 'showBattlerName', false ],
    [ 'setIsInvincible', 'isInvincible', true ],
    [ 'setIsInanimate', 'isInanimate', true ],
  ])('%s', (setterName, builtKey, value) =>
  {
    it(`sets ${builtKey} and returns the builder for fluent chaining`, () =>
    {
      // Arrange
      const builder = new JABS_BattlerCoreDataBuilder(1);

      // Act
      const result = builder[setterName](value);
      const built = builder.build();

      // Assert
      expect(built[builtKey]).toEqual(value);
      expect(result).toBe(builder);
    });
  });

  it('setBattlerAi sets the AI passed through to the built core data', () =>
  {
    // Arrange
    const builder = new JABS_BattlerCoreDataBuilder(1);
    const ai = { custom: true };

    // Act
    const result = builder.setBattlerAi(ai);
    const built = builder.build();

    // Assert
    expect(built.battlerAI).toBe(ai);
    expect(result).toBe(builder);
  });

  it('setBattlerRole sets the role passed through to the built core data', () =>
  {
    // Arrange
    const builder = new JABS_BattlerCoreDataBuilder(1);
    const role = { custom: true };

    // Act
    const result = builder.setBattlerRole(role);
    const built = builder.build();

    // Assert
    expect(built.battlerRole).toBe(role);
    expect(result).toBe(builder);
  });

  it('setShowDangerIndicator sets the flag passed to setDangerIndicator when the danger extension is present', () =>
  {
    // Arrange
    globalThis.J.ABS.EXT.DANGER = { Metadata: { DefaultEnemyShowDangerIndicator: false } };
    const builder = new JABS_BattlerCoreDataBuilder(1);

    // Act
    const result = builder.setShowDangerIndicator(true);
    const built = builder.build();

    // Assert
    expect(built.setDangerIndicator).toHaveBeenCalledWith(true);
    expect(result).toBe(builder);
  });
  //endregion individual fluent setters
});
//endregion plugins/abs/core/models/jabs-battler-core-data-builder.test.js
