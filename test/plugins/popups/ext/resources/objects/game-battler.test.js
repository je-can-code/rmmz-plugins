//region plugins/popups/ext/resources/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Battler ext/resources augments (direct src import)', () =>
{
  let Game_Battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { POPUPS: { EXT: { RESOURCES: { Aliased: { Game_Battler: new Map() } } } } };

    function StubGameBattler()
    {
    }

    StubGameBattler.prototype.paySkillHpCost = vi.fn();
    StubGameBattler.prototype.gainHpFromResource = vi.fn();
    StubGameBattler.prototype.gainMpFromResource = vi.fn();
    StubGameBattler.prototype.gainTpFromResource = vi.fn();
    StubGameBattler.prototype.getUuid = vi.fn().mockReturnValue('battler-uuid');
    globalThis.Game_Battler = StubGameBattler;

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };

    const chainMethods = [ 'isHpDamage', 'isMpDamage', 'isTpDamage', 'forEnemyDamageRing', 'forIncomingHealRing' ];
    function FakeTextPopBuilder(value)
    {
      this.value = value;
      this.calls = [];
    }
    chainMethods.forEach(name =>
    {
      FakeTextPopBuilder.prototype[name] = function(...args)
      {
        this.calls.push([ name, ...args ]);
        return this;
      };
    });
    FakeTextPopBuilder.prototype.build = function()
    {
      return { value: this.value, calls: this.calls };
    };
    globalThis.TextPopBuilder = FakeTextPopBuilder;

    await import('../../../../../../src/plugins/popups/ext/resources/objects/Game_Battler.js');
    ({ Game_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
    globalThis.J.ABS = true;
  });

  describe('paySkillHpCost', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = new Game_Battler();

      // Act
      battler.paySkillHpCost(5);

      // Assert
      expect(globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('paySkillHpCost')).toHaveBeenCalledWith(5);
    });

    it('does not pop a zero cost', () =>
    {
      // Arrange
      const battler = new Game_Battler();

      // Act
      battler.paySkillHpCost(0);

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does not pop when not using JABS', () =>
    {
      // Arrange
      globalThis.J.ABS = false;
      const battler = new Game_Battler();

      // Act
      battler.paySkillHpCost(5);

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('does not pop when there is no associated JABS battler', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act/Assert (no throw)
      expect(() => battler.paySkillHpCost(5)).not.toThrow();
    });

    it('routes an hp-damage strike pop with the paid amount', () =>
    {
      // Arrange
      globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('paySkillHpCost').mockClear();
      globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character, getUuid: () => 'battler-uuid' });
      const battler = new Game_Battler();

      // Act
      battler.paySkillHpCost(5);

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 5 }),
        character,
        { attackerUuid: 'battler-uuid', targetUuid: 'battler-uuid', amount: 5 },
      );
    });
  });

  describe('gainHpFromResource', () =>
  {
    it('does not pop a zero gain', () =>
    {
      // Arrange
      const battler = new Game_Battler();

      // Act
      battler.gainHpFromResource(0);

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('routes a negated hp-heal strike pop', () =>
    {
      // Arrange
      globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character, getUuid: () => 'battler-uuid' });
      const battler = new Game_Battler();

      // Act
      battler.gainHpFromResource(8);

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.objectContaining({ value: -8 }),
        character,
        { attackerUuid: 'battler-uuid', targetUuid: 'battler-uuid', amount: -8 },
      );
    });
  });

  describe('gainMpFromResource', () =>
  {
    it('routes a negated mp-heal strike pop', () =>
    {
      // Arrange
      globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character, getUuid: () => 'battler-uuid' });
      const battler = new Game_Battler();

      // Act
      battler.gainMpFromResource(6);

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.objectContaining({ value: -6 }),
        character,
        expect.objectContaining({ amount: -6 }),
      );
    });
  });

  describe('gainTpFromResource', () =>
  {
    it('routes a negated tp-heal strike pop', () =>
    {
      // Arrange
      globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character, getUuid: () => 'battler-uuid' });
      const battler = new Game_Battler();

      // Act
      battler.gainTpFromResource(3);

      // Assert
      expect(globalThis.JABS_PopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.objectContaining({ value: -3 }),
        character,
        expect.objectContaining({ amount: -3 }),
      );
    });
  });

  //region the guards every gain shares
  //
  // All three gains carry the identical three-guard preamble, and each guard exists for a different
  // reason: a zero gain would pop a "0" over the player's head every time a resource tick did
  // nothing, a missing JABS namespace means there is no map to pop onto at all, and an untracked
  // battler is an ordinary state for anything off-screen.
  [
    [ 'gainHpFromResource', 'gainHpFromResource' ],
    [ 'gainMpFromResource', 'gainMpFromResource' ],
    [ 'gainTpFromResource', 'gainTpFromResource' ],
  ].forEach(([ describeName, method ]) =>
  {
    describe(`${describeName} guards`, () =>
    {
      it('does not pop a zero gain', () =>
      {
        // Arrange
        globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
        const character = {};
        globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({
          getCharacter: () => character,
          getUuid: () => 'battler-uuid',
        });
        const battler = new Game_Battler();

        // Act
        battler[method](0);

        // Assert
        expect(globalThis.JABS_PopupMergeController.routeStrikePop).not.toHaveBeenCalled();
      });

      it('does not pop when JABS is not installed', () =>
      {
        // Arrange: the untracked-battler guard sitting right below this one would suppress the pop
        // all by itself, so the battler is deliberately tracked here - a missing J.ABS namespace has
        // to be the only reason nothing pops, and the lookup itself must never even be attempted.
        globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
        globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({
          getCharacter: () => ({}),
          getUuid: () => 'battler-uuid',
        });
        globalThis.J.ABS = false;
        const battler = new Game_Battler();

        // Act
        battler[method](5);

        // Assert
        expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
        expect(globalThis.JABS_PopupMergeController.routeStrikePop).not.toHaveBeenCalled();
      });

      it('does not pop when the battler is not tracked on the map', () =>
      {
        // Arrange
        globalThis.JABS_PopupMergeController = { routeStrikePop: vi.fn() };
        globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
        const battler = new Game_Battler();

        // Act
        battler[method](5);

        // Assert
        expect(globalThis.JABS_PopupMergeController.routeStrikePop).not.toHaveBeenCalled();
      });

      it('still performs the original gain regardless of whether it pops', () =>
      {
        // Arrange: the pop is decoration; the resource change itself must never be gated behind it.
        globalThis.J.ABS = false;
        const battler = new Game_Battler();

        // Act
        battler[method](5);

        // Assert
        expect(globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get(method))
          .toHaveBeenCalledWith(5);
      });
    });
  });
  //endregion the guards every gain shares
});
//endregion plugins/popups/ext/resources/objects/game-battler.test.js
