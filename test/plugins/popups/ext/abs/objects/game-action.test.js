//region plugins/popups/ext/abs/objects/game-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Action ext/abs augments (direct src import)', () =>
{
  let Game_Action;
  let FakeTextPopBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { POPUPS: { EXT: { ABS: { Aliased: { Game_Action: new Map() } } } } };

    globalThis.FormulaEffect = { Resource: { HP: 'hp', MP: 'mp', TP: 'tp' } };

    function StubGameAction()
    {
    }

    StubGameAction.prototype.onFormulaResourceDelta = vi.fn();
    StubGameAction.prototype.onShieldDamageAbsorbed = vi.fn();
    StubGameAction.prototype.onShieldBroken = vi.fn();
    globalThis.Game_Action = StubGameAction;

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    globalThis.TextPopManager = { show: vi.fn() };

    FakeTextPopBuilder = vi.fn(function(value)
    {
      this.value = value;
      this.calls = [];
    });
    const chainMethods = [ 'isHpDamage', 'isMpDamage', 'isTpDamage', 'forIncomingHealRing', 'forEnemyDamageRing', 'isShieldDamage', 'isShieldBreak' ];
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

    await import('../../../../../../src/plugins/popups/ext/abs/objects/Game_Action.js');
    ({ Game_Action } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('onFormulaResourceDelta', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onFormulaResourceDelta(recipient, 5, 'hp');

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onFormulaResourceDelta')).toHaveBeenCalledWith(recipient, 5, 'hp');
    });

    it('does nothing when there is no associated JABS battler', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onFormulaResourceDelta(recipient, 5, 'hp');

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
    });

    it('does nothing when the rounded delta magnitude is zero', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });

      // Act
      action.onFormulaResourceDelta(recipient, 0.4, 'hp');

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
    });

    it('shows a damage-ring hp popup for a positive delta', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character });

      // Act
      action.onFormulaResourceDelta(recipient, 10, globalThis.FormulaEffect.Resource.HP);

      // Assert
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual(10);
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isHpDamage' ], [ 'forEnemyDamageRing' ] ]));
      expect(shownCharacter).toBe(character);
    });

    it('shows a heal-ring mp popup for a negative delta', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });

      // Act
      action.onFormulaResourceDelta(recipient, -10, globalThis.FormulaEffect.Resource.MP);

      // Assert
      const [ [ pop ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual(-10);
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isMpDamage' ], [ 'forIncomingHealRing' ] ]));
    });

    it('shows a tp popup for the tp resource type', () =>
    {
      // Arrange
      const action = new Game_Action();
      const recipient = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });

      // Act
      action.onFormulaResourceDelta(recipient, 3, globalThis.FormulaEffect.Resource.TP);

      // Assert
      const [ [ pop ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isTpDamage' ] ]));
    });
  });

  describe('onShieldDamageAbsorbed', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onShieldDamageAbsorbed(target, 5);

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onShieldDamageAbsorbed')).toHaveBeenCalledWith(target, 5);
    });

    it('does nothing when there is no associated JABS battler', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onShieldDamageAbsorbed(target, 5);

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
    });

    it('shows a shield-damage popup with the rounded absorbed value', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character });

      // Act
      action.onShieldDamageAbsorbed(target, 7.6);

      // Assert
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('  -8');
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isShieldDamage' ] ]));
      expect(shownCharacter).toBe(character);
    });
  });

  describe('onShieldBroken', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onShieldBroken(target);

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onShieldBroken')).toHaveBeenCalledWith(target);
    });

    it('does nothing when there is no associated JABS battler', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.onShieldBroken(target);

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
    });

    it('shows a shield-break popup', () =>
    {
      // Arrange
      const action = new Game_Action();
      const target = { getUuid: () => 'uuid-1' };
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character });

      // Act
      action.onShieldBroken(target);

      // Assert
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('B R E A K');
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isShieldBreak' ] ]));
      expect(shownCharacter).toBe(character);
    });
  });
});
//endregion plugins/popups/ext/abs/objects/game-action.test.js
