//region plugins/abs/ext/tools/objects/game-character-base.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Tools Game_CharacterBase augments (direct src import)', () =>
{
  let Game_CharacterBase;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TOOLS: { Aliased: { Game_CharacterBase: new Map() }, Metadata: { DirectionFixAlways: true } } } } };

    function StubGameCharacterBase()
    {
    }

    StubGameCharacterBase.prototype.initMembers = vi.fn();
    globalThis.Game_CharacterBase = StubGameCharacterBase;

    globalThis.JABS_Timer = vi.fn(function(wait)
    {
      this.wait = wait;
    });

    await import('../../../../../../src/plugins/abs/ext/tools/objects/Game_CharacterBase.js');
    ({ Game_CharacterBase } = globalThis);
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
      const character = new Game_CharacterBase();

      // Act
      character.initMembers();

      // Assert
      expect(globalThis.J.ABS.EXT.TOOLS.Aliased.Game_CharacterBase.get('initMembers')).toHaveBeenCalledTimes(1);
    });

    it('initializes the tools grab/throw member tree', () =>
    {
      // Arrange
      const character = new Game_CharacterBase();

      // Act
      character.initMembers();

      // Assert
      expect(character._j._tools._grabThrow._grab._enabled).toBe(false);
      expect(character._j._tools._grabThrow._grab._check).toBe(false);
      expect(character._j._tools._grabThrow._grab._wait).toBeInstanceOf(globalThis.JABS_Timer);
      expect(character._j._tools._grabThrow._throw._enabled).toBe(false);
      expect(character._j._tools._grabThrow._throw._through).toBe(false);
      expect(character._j._tools._grabThrow._throw._directionFixAlways).toBe(true);
      expect(character._j._tools._grabThrow._throw._directionFix).toBe(false);
      expect(character._j._tools._grabThrow._throw._range).toBe(0);
      expect(character._j._tools._grabThrow._throw._wait).toBeInstanceOf(globalThis.JABS_Timer);
    });
  });

  describe('initToolsMembers', () =>
  {
    it('does not clobber an already-initialized _j member tree', () =>
    {
      // Arrange
      const character = new Game_CharacterBase();
      character._j = { existing: true };

      // Act
      character.initToolsMembers();

      // Assert
      expect(character._j.existing).toBe(true);
      expect(character._j._tools._grabThrow._grab._enabled).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/tools/objects/game-character-base.test.js
