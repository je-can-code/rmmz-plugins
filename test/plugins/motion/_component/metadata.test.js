//region plugins/motion/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from './fixtures/install-motion-component-globals.js';

describe('J-Motion metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMotionComponentGlobals();

    setMotionConfig({
      breathe: { amount: 0.11, period: 77 },
      float: { distance: 3 },
    });

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMotion();
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');
  });

  describe('the namespace', () =>
  {
    it('claims its own umbrella and an umbrella for its extensions', () =>
    {
      // Assert
      expect(globalThis.J.MOTION).toBeDefined();
      expect(globalThis.J.MOTION.EXT).toBeDefined();
    });

    it('declares an alias map for each engine class it augments', () =>
    {
      // Assert
      expect(globalThis.J.MOTION.Aliased.Game_Event).toBeInstanceOf(Map);
      expect(globalThis.J.MOTION.Aliased.Sprite_Character).toBeInstanceOf(Map);
    });

    it('names itself from the build-time identifier rather than a literal', () =>
    {
      // Assert
      expect(globalThis.J.MOTION.Metadata.name).toBe('J-Motion');
    });
  });

  describe('the motion tag expression', () =>
  {
    it('captures a motion with no parameters', () =>
    {
      // Act
      const match = '<motion:[breathe]>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match[1]).toBe('[breathe]');
    });

    it('captures a motion with several parameters', () =>
    {
      // Act
      const match = '<motion:[breathe, 0.08, 90]>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match[1]).toBe('[breathe, 0.08, 90]');
    });

    it('tolerates the space after the colon being left out', () =>
    {
      // Act
      const match = '<motion:[float]>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match[1]).toBe('[float]');
    });

    it('captures a hex colour parameter', () =>
    {
      // Act
      const match = '<motion:[tint, #ffa0a0]>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match[1]).toBe('[tint, #ffa0a0]');
    });

    it('captures a negative parameter, as a tone component may be', () =>
    {
      // Act
      const match = '<motion:[throb, -40, 0, 0, 0, 120]>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match[1]).toBe('[throb, -40, 0, 0, 0, 120]');
    });

    it('ignores a tag belonging to another plugin entirely', () =>
    {
      // Act
      const match = '<enemyId:12>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match).toBeNull();
    });

    it('ignores a motion tag written without its brackets', () =>
    {
      // Act
      const match = '<motion:breathe>'.match(globalThis.J.MOTION.RegExp.Motion);

      // Assert
      expect(match).toBeNull();
    });

    it('does not carry state between calls, so every tag on a page is found', () =>
    {
      // Arrange
      const { Motion } = globalThis.J.MOTION.RegExp;

      // Act
      const first = Motion.test('<motion:[breathe]>');
      const second = Motion.test('<motion:[swing]>');
      const third = Motion.test('<motion:[float]>');

      // Assert
      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(third).toBe(true);
    });
  });

  describe('the motion defaults', () =>
  {
    it('reports what the external config holds for a configured motion', () =>
    {
      // Act
      const defaults = globalThis.J.MOTION.Metadata.defaultsForMotionType('breathe');

      // Assert
      expect(defaults).toEqual({ amount: 0.11, period: 77 });
    });

    it('reports a partial configuration exactly as written, without inventing the rest', () =>
    {
      // Act
      const defaults = globalThis.J.MOTION.Metadata.defaultsForMotionType('float');

      // Assert
      expect(defaults).toEqual({ distance: 3 });
    });

    it('reports nothing for a motion the config never mentions', () =>
    {
      // Act
      const defaults = globalThis.J.MOTION.Metadata.defaultsForMotionType('swing');

      // Assert
      expect(defaults).toEqual({});
    });
  });
});
//endregion plugins/motion/_component/metadata.test.js