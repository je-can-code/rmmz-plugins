//region plugins/utils/core/objects/game-temp.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Temp ext/utils augments (direct src import)', () =>
{
  let Game_Temp;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { UTILS: { Aliased: { Game_Temp: new Map() } } };

    function StubGameTemp()
    {
    }

    StubGameTemp.prototype.initMembers = vi.fn();
    globalThis.Game_Temp = StubGameTemp;

    await import('../../../../../src/plugins/utils/core/objects/Game_Temp.js');
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
      expect(globalThis.J.UTILS.Aliased.Game_Temp.get('initMembers')).toHaveBeenCalled();
    });

    it('defaults click-to-log-event to enabled', () =>
    {
      // Arrange
      const temp = new Game_Temp();

      // Act
      temp.initMembers();

      // Assert
      expect(temp.canClickToLogEvent()).toEqual(true);
    });
  });

  describe('canClickToLogEvent/enableClickToLogEvent/disableClickToLogEvent', () =>
  {
    it('disables the click-to-log-event flag', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      temp.initMembers();

      // Act
      temp.disableClickToLogEvent();

      // Assert
      expect(temp.canClickToLogEvent()).toEqual(false);
    });

    it('re-enables the click-to-log-event flag', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      temp.initMembers();
      temp.disableClickToLogEvent();

      // Act
      temp.enableClickToLogEvent();

      // Assert
      expect(temp.canClickToLogEvent()).toEqual(true);
    });
  });

  describe('getAllArmorNames', () =>
  {
    it('maps each armor to a key/name/description record', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      globalThis.$dataArmors = [ undefined, { _key: () => 'a1', name: 'Shield', description: 'blocks stuff' } ];

      // Act
      const result = temp.getAllArmorNames();

      // Assert
      expect(result[1]).toEqual({ key: 'a1', name: 'Shield', description: 'blocks stuff' });
    });

    it('skips a null/undefined armor row', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      globalThis.$dataArmors = [ undefined ];

      // Act
      const result = temp.getAllArmorNames();

      // Assert
      expect(result[0]).toEqual(undefined);
    });

    it('skips an armor whose name starts with "==="', () =>
    {
      // Arrange
      const temp = new Game_Temp();
      globalThis.$dataArmors = [ { _key: () => 'a1', name: '=== Divider ===', description: '' } ];

      // Act
      const result = temp.getAllArmorNames();

      // Assert
      expect(result[0]).toEqual(undefined);
    });
  });
});
//endregion plugins/utils/core/objects/game-temp.test.js
