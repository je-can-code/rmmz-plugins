//region plugins/passive/ext/conditional/helpers/passive-rule-jabs-access.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveRuleJabsAccess (direct src import)', () =>
{
  let PassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { CONDITIONAL: { Metadata: { defaultProximityTiles: 4 } } } } };
    globalThis.JABS_AiManager = {
      getBattlerByUuid: vi.fn(uuid => ({ getUuid: () => uuid })),
      getOpposingBattlers: vi.fn(() => []),
      getAlliedBattlersWithinRange: vi.fn(() => []),
      getOpposingBattlersWithinRange: vi.fn(() => []),
      getAlliedBattlers: vi.fn(() => []),
    };
    globalThis.JABS_Button = {
      Mainhand: 'Main', Offhand: 'Offhand', Tool: 'Tool', Dodge: 'Dodge',
      CombatSkill1: 'CombatSkill1', CombatSkill2: 'CombatSkill2',
      CombatSkill3: 'CombatSkill3', CombatSkill4: 'CombatSkill4',
    };

    ({ default: PassiveRuleJabsAccess } = await import('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds a minimal Game_Battler-shaped stub with a resolvable map-side JABS wrapper.
   * @param {string} uuid
   * @returns {object}
   */
  function buildBattler(uuid)
  {
    return { getUuid: () => uuid };
  }

  it('returns an empty array when the battler has no map-side JABS wrapper', () =>
  {
    // Arrange- the ai manager is stocked with an enemy that IS targeting this uuid, so the
    // off-map guard is the only thing standing between the caller and a populated result.
    const battler = { getUuid: undefined };
    const engagedEnemy = {
      getUuid: () => 'enemy-1',
      getTarget: () => ({ getUuid: () => 'self-uuid' }),
    };
    globalThis.JABS_AiManager.getOpposingBattlers.mockReturnValueOnce([ engagedEnemy ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns an empty array when no opposing battlers exist', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => []);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('excludes an opposing battler with no current target at all', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const disengaged = { getUuid: () => 'enemy-1', getTarget: () => null };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ disengaged ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('excludes an opposing battler currently targeting someone else', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const targetingSomeoneElse = {
      getUuid: () => 'enemy-1',
      getTarget: () => ({ getUuid: () => 'someone-else-uuid' }),
    };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ targetingSomeoneElse ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([]);
  });

  it('includes an opposing battler currently targeting this battler', () =>
  {
    // Arrange
    const battler = buildBattler('self-uuid');
    const targetingMe = {
      getUuid: () => 'enemy-1',
      getTarget: () => ({ getUuid: () => 'self-uuid' }),
    };
    globalThis.JABS_AiManager.getOpposingBattlers = vi.fn(() => [ targetingMe ]);

    // Act
    const result = PassiveRuleJabsAccess.enemiesTargetingMe(battler);

    // Assert
    expect(result).toEqual([ targetingMe ]);
  });

  describe('getJabsBattler', () =>
  {
    it('returns null for a falsy battler', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.getJabsBattler(null)).toBe(null);
    });

    it('returns null for a battler with no getUuid method', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.getJabsBattler({})).toBe(null);
    });

    it('returns null when the ai manager has no wrapper for this uuid', () =>
    {
      // Arrange- mockReturnValueOnce so the shared mock's default implementation is restored
      // automatically for every later test in this file.
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValueOnce(undefined);

      // Act & Assert
      expect(PassiveRuleJabsAccess.getJabsBattler(buildBattler('x'))).toBe(null);
    });

    it('returns the resolved jabs battler wrapper', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.getJabsBattler(buildBattler('self-uuid'))).toEqual({ getUuid: expect.any(Function) });
    });
  });

  describe('defaultProximity', () =>
  {
    it('reads the plugin metadata default proximity', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.defaultProximity()).toBe(4);
    });
  });

  describe('nearbyAlliesExcludingSelf', () =>
  {
    it('returns an empty array when off-map', () =>
    {
      // Arrange- the ai manager would happily hand back an ally here, so the off-map guard is the
      // only reason the result comes back empty.
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValueOnce([ { getUuid: () => 'ally-uuid' } ]);

      // Act & Assert
      expect(PassiveRuleJabsAccess.nearbyAlliesExcludingSelf({ getUuid: undefined })).toEqual([]);
    });

    it('excludes self from the allied battlers in range, using the default proximity when omitted', () =>
    {
      // Arrange
      const self = { getUuid: () => 'self-uuid' };
      const ally = { getUuid: () => 'ally-uuid' };
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [ self, ally ]);
      const battler = buildBattler('self-uuid');

      // Act
      const result = PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler);

      // Assert
      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 4);
      expect(result).toEqual([ ally ]);
    });

    it('forwards an explicit proximity radius instead of the default', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => []);
      const battler = buildBattler('self-uuid');

      // Act
      PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler, 9);

      // Assert
      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 9);
    });
  });

  describe('nearbyEnemies', () =>
  {
    it('returns an empty array when off-map', () =>
    {
      // Arrange- an enemy is in range as far as the ai manager is concerned; only the off-map
      // guard keeps it out of the result.
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange.mockReturnValueOnce([ { getUuid: () => 'enemy-uuid' } ]);

      // Act & Assert
      expect(PassiveRuleJabsAccess.nearbyEnemies({ getUuid: undefined })).toEqual([]);
    });

    it('queries opposing battlers within the default proximity when omitted', () =>
    {
      // Arrange
      const enemy = { getUuid: () => 'enemy-uuid' };
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange = vi.fn(() => [ enemy ]);
      const battler = buildBattler('self-uuid');

      // Act
      const result = PassiveRuleJabsAccess.nearbyEnemies(battler);

      // Assert
      expect(globalThis.JABS_AiManager.getOpposingBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 4);
      expect(result).toEqual([ enemy ]);
    });

    it('forwards an explicit proximity radius instead of the default', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange = vi.fn(() => []);
      const battler = buildBattler('self-uuid');

      // Act
      PassiveRuleJabsAccess.nearbyEnemies(battler, 7);

      // Assert
      expect(globalThis.JABS_AiManager.getOpposingBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 7);
    });
  });

  describe('allAlliedBattlersIncludingSelf', () =>
  {
    it('returns just self when off-map', () =>
    {
      // Arrange- a party ally exists on the map side, so a battler with no wrapper of its own
      // must still resolve to a set of exactly one: itself.
      const battler = { getUuid: undefined };
      const partyAlly = { name: 'party-ally' };
      globalThis.JABS_AiManager.getAlliedBattlers.mockReturnValueOnce([ { getBattler: () => partyAlly } ]);

      // Act & Assert
      expect(PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(battler)).toEqual([ battler ]);
    });

    it('includes self alongside allies when self is not already among them', () =>
    {
      // Arrange
      const selfBattler = buildBattler('self-uuid');
      const allyBattler = { name: 'ally' };
      globalThis.JABS_AiManager.getAlliedBattlers = vi.fn(() => [ { getBattler: () => allyBattler } ]);

      // Act
      const result = PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(selfBattler);

      // Assert
      expect(result).toEqual([ allyBattler, selfBattler ]);
    });

    it('filters out an allied jabs battler with no resolvable Game_Battler', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getAlliedBattlers = vi.fn(() => [ { getBattler: () => null } ]);
      const selfBattler = buildBattler('self-uuid');

      // Act
      const result = PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(selfBattler);

      // Assert
      expect(result).toEqual([ selfBattler ]);
    });

    it('does not duplicate self when it is already among the allies', () =>
    {
      // Arrange
      const selfBattler = buildBattler('self-uuid');
      globalThis.JABS_AiManager.getAlliedBattlers = vi.fn(() => [ { getBattler: () => selfBattler } ]);

      // Act
      const result = PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(selfBattler);

      // Assert
      expect(result).toEqual([ selfBattler ]);
    });
  });

  describe('alliedBattlersWithinRange', () =>
  {
    it('returns an empty array when off-map', () =>
    {
      // Arrange- an ally sits inside the requested radius; only the off-map guard suppresses it.
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValueOnce([ { getUuid: () => 'ally-uuid' } ]);

      // Act & Assert
      expect(PassiveRuleJabsAccess.alliedBattlersWithinRange({ getUuid: undefined }, 5)).toEqual([]);
    });

    it('excludes self from allies within the given range', () =>
    {
      // Arrange
      const self = { getUuid: () => 'self-uuid' };
      const ally = { getUuid: () => 'ally-uuid' };
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange = vi.fn(() => [ self, ally ]);
      const battler = buildBattler('self-uuid');

      // Act
      const result = PassiveRuleJabsAccess.alliedBattlersWithinRange(battler, 5);

      // Assert
      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 5);
      expect(result).toEqual([ ally ]);
    });
  });

  describe('opposingBattlersWithinRange', () =>
  {
    it('returns an empty array when off-map', () =>
    {
      // Arrange- an enemy sits inside the requested radius; only the off-map guard suppresses it.
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange.mockReturnValueOnce([ { getUuid: () => 'enemy-uuid' } ]);

      // Act & Assert
      expect(PassiveRuleJabsAccess.opposingBattlersWithinRange({ getUuid: undefined }, 5)).toEqual([]);
    });

    it('queries opposing battlers within the given range', () =>
    {
      // Arrange
      const enemy = { getUuid: () => 'enemy-uuid' };
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange = vi.fn(() => [ enemy ]);
      const battler = buildBattler('self-uuid');

      // Act
      const result = PassiveRuleJabsAccess.opposingBattlersWithinRange(battler, 6);

      // Assert
      expect(globalThis.JABS_AiManager.getOpposingBattlersWithinRange).toHaveBeenCalledWith(expect.anything(), 6);
      expect(result).toEqual([ enemy ]);
    });
  });

  describe('resolveSlotKey', () =>
  {
    it.each([
      [ 'main', 'Mainhand' ], [ 'mainhand', 'Mainhand' ], [ 'offhand', 'Offhand' ], [ 'tool', 'Tool' ], [ 'dodge', 'Dodge' ],
      [ 'combatskill1', 'CombatSkill1' ], [ 'skill1', 'CombatSkill1' ],
      [ 'combatskill2', 'CombatSkill2' ], [ 'skill2', 'CombatSkill2' ],
      [ 'combatskill3', 'CombatSkill3' ], [ 'skill3', 'CombatSkill3' ],
      [ 'combatskill4', 'CombatSkill4' ], [ 'skill4', 'CombatSkill4' ],
    ])('resolves author shorthand "%s" to JABS_Button.%s', (slotParam, expectedKey) =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.resolveSlotKey(slotParam)).toBe(globalThis.JABS_Button[expectedKey]);
    });

    it('is case-insensitive', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.resolveSlotKey('MAINHAND')).toBe(globalThis.JABS_Button.Mainhand);
    });

    it('passes through an unrecognized raw slot key unchanged', () =>
    {
      // Act & Assert
      expect(PassiveRuleJabsAccess.resolveSlotKey('SomeRawButtonKey')).toBe('SomeRawButtonKey');
    });
  });
});
//endregion plugins/passive/ext/conditional/helpers/passive-rule-jabs-access.test.js
