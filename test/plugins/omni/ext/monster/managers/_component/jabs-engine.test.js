//region plugins/omni/ext/monster/managers/_component/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/monster augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { OMNI: { EXT: { MONSTER: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.processOnHitEffects = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    globalThis.Game_Action = { extractElementsFromAction: vi.fn().mockReturnValue([]) };

    await import('../../../../../../../src/plugins/omni/ext/monster/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.Game_Action.extractElementsFromAction.mockReturnValue([]);
  });

  function makeAction({ elementId = 5, extraElements = [] } = {})
  {
    globalThis.Game_Action.extractElementsFromAction.mockReturnValue(extraElements);
    return {
      getBaseSkill: () => ({ damage: { elementId } }),
      getCaster: () => ({ getBattler: () => ({ attackElements: () => [ 1, 2 ] }) }),
    };
  }

  describe('processOnHitEffects', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const target = { isEnemy: () => false };

      // Act
      engine.processOnHitEffects({}, target);

      // Assert
      expect(globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Engine.get('processOnHitEffects')).toHaveBeenCalledWith({}, target);
    });

    it('does not observe elements when the target is not an enemy', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.processElementalisticObservations = vi.fn();
      const target = { isEnemy: () => false };

      // Act
      engine.processOnHitEffects({}, target);

      // Assert
      expect(engine.processElementalisticObservations).not.toHaveBeenCalled();
    });

    it('observes elements when the target is an enemy', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.processElementalisticObservations = vi.fn();
      const action = {};
      const target = { isEnemy: () => true };

      // Act
      engine.processOnHitEffects(action, target);

      // Assert
      expect(engine.processElementalisticObservations).toHaveBeenCalledWith(action, target);
    });
  });

  describe('processElementalisticObservations', () =>
  {
    it('observes the skill element plus any extra elements for a non-normal-attack skill', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const action = makeAction({ elementId: 5, extraElements: [ 7 ] });
      const enemy = { observeElement: vi.fn() };
      const target = { getBattler: () => enemy };

      // Act
      engine.processElementalisticObservations(action, target);

      // Assert
      expect(enemy.observeElement).toHaveBeenCalledWith(7);
      expect(enemy.observeElement).toHaveBeenCalledWith(5);
    });

    it("observes the attacker's own attack elements when the base element is normal-attack (-1)", () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const action = makeAction({ elementId: -1 });
      const enemy = { observeElement: vi.fn() };
      const target = { getBattler: () => enemy };

      // Act
      engine.processElementalisticObservations(action, target);

      // Assert
      expect(enemy.observeElement).toHaveBeenCalledWith(1);
      expect(enemy.observeElement).toHaveBeenCalledWith(2);
      expect(enemy.observeElement).not.toHaveBeenCalledWith(-1);
    });
  });
});
//endregion plugins/omni/ext/monster/managers/_component/jabs-engine.test.js
