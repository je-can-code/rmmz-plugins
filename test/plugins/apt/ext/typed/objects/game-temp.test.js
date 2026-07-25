//region plugins/apt/ext/typed/objects/game-temp.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Temp ext/typed augments (direct src import)', () =>
{
  let Game_Temp;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { APT: { EXT: { TYPED: { Aliased: { Game_Temp: new Map() } } } } };

    function StubGameTemp()
    {
    }

    StubGameTemp.prototype.initMembers = vi.fn();
    globalThis.Game_Temp = StubGameTemp;

    await import('../../../../../../src/plugins/apt/ext/typed/objects/Game_Temp.js');
    ({ Game_Temp } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const temp = new Game_Temp();

      // Act
      temp.initMembers();

      // Assert
      expect(globalThis.J.APT.EXT.TYPED.Aliased.Game_Temp.get('initMembers')).toHaveBeenCalled();
    });

    it('initializes an empty inferred-enemy-types cache', () =>
    {
      // Arrange
      const temp = new Game_Temp();

      // Act
      temp.initMembers();

      // Assert
      expect(temp.getAptTypedInferredEnemyTypes(1)).toEqual(null);
    });
  });

  describe('getAptTypedInferredEnemyTypes/setAptTypedInferredEnemyTypes', () =>
  {
    it('returns null for an enemy id with no cached entry', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      temp.initMembers();

      // Act
      const result = temp.getAptTypedInferredEnemyTypes(99);

      // Assert
      expect(result).toEqual(null);
    });

    it('caches and returns a copy of the provided ids array', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      temp.initMembers();
      const ids = [ 1, 2, 3 ];

      // Act
      temp.setAptTypedInferredEnemyTypes(5, ids);
      const result = temp.getAptTypedInferredEnemyTypes(5);

      // Assert
      expect(result).toEqual([ 1, 2, 3 ]);
      expect(result).not.toBe(ids);
    });

    it('stores an empty array when given a non-array value', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      temp.initMembers();

      // Act
      temp.setAptTypedInferredEnemyTypes(5, null);

      // Assert
      // an empty array is truthy, so the `|| null` fallback in the getter does not kick in here.
      expect(temp.getAptTypedInferredEnemyTypes(5)).toEqual([]);
    });
  });
});
//endregion plugins/apt/ext/typed/objects/game-temp.test.js
