//region plugins/abs/ext/shield/_models/jabs-state-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield JABS_StateBuilder (unit, all downstream dependencies mocked)', () =>
{
  let originalBuild;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { JABS_StateBuilder: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js', () => ({ default: class {} }));

    function JABS_StateBuilder()
    {
    }

    originalBuild = vi.fn();
    JABS_StateBuilder.prototype.build = originalBuild;
    globalThis.JABS_StateBuilder = JABS_StateBuilder;

    await import('../../../../../../src/plugins/abs/ext/shield/_models/JABS_StateBuilder.js');
  });

  beforeEach(() =>
  {
    originalBuild.mockReset();
  });

  function buildBuilder()
  {
    return Object.create(globalThis.JABS_StateBuilder.prototype);
  }

  describe('shield getter/setter', () =>
  {
    it('returns null before a shield has ever been set', () =>
    {
      const builder = buildBuilder();
      expect(builder.shield).toBeNull();
    });

    it('returns whatever shield was assigned', () =>
    {
      const builder = buildBuilder();
      const shield = { id: 'shield' };
      builder.shield = shield;
      expect(builder.shield).toBe(shield);
    });
  });

  describe('build', () =>
  {
    it('attaches the builder\'s shield onto the constructed state', () =>
    {
      // Arrange
      const originalState = {};
      originalBuild.mockReturnValue(originalState);
      const builder = buildBuilder();
      const shield = { id: 'shield' };
      builder.shield = shield;

      // Act
      const result = builder.build();

      // Assert
      expect(result.shield).toBe(shield);
      expect(result).toBe(originalState);
    });
  });

  describe('setShield', () =>
  {
    it('assigns the shield and returns the builder for chaining', () =>
    {
      const builder = buildBuilder();
      const shield = { id: 'shield' };

      const result = builder.setShield(shield);

      expect(builder.shield).toBe(shield);
      expect(result).toBe(builder);
    });
  });
});
//endregion plugins/abs/ext/shield/_models/jabs-state-builder.test.js
