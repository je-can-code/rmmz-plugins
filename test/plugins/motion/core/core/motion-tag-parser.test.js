//region plugins/motion/core/core/motion-tag-parser.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionTagParser', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionTagParser.js').default} */
  let MotionTagParser;

  beforeAll(async () =>
  {
    // the parser reaches for JsonMapper, Diagnostics and the shared regex all by bare name.
    installMotionHostGlobals();

    // the registry has to have evaluated for its roster to exist before anything is validated.
    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js');
    ({ default: MotionTagParser } =
      await import('../../../../../src/plugins/motion/core/core/MotionTagParser.js'));
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('parseComments', () =>
  {
    it('finds a motion tag among comments belonging to other plugins', () =>
    {
      // Arrange
      const comments = [ '<enemyId:12>', '<motion:[breathe]>', '<sight:5>' ];

      // Act
      const declarations = MotionTagParser.parseComments(comments, 'page');

      // Assert
      expect(declarations).toHaveLength(1);
      expect(declarations.at(0)
        .type()).toBe('breathe');
    });

    it('finds every motion tag when a page declares several', () =>
    {
      // Arrange
      const comments = [ '<motion:[breathe]>', '<enemyId:12>', '<motion:[swing]>' ];

      // Act
      const declarations = MotionTagParser.parseComments(comments, 'page');

      // Assert
      expect(declarations).toHaveLength(2);
      expect(declarations.at(0)
        .type()).toBe('breathe');
      expect(declarations.at(1)
        .type()).toBe('swing');
    });

    it('finds nothing on a page that declares no motions', () =>
    {
      // Arrange
      const comments = [ '<enemyId:12>', '<sight:5>' ];

      // Act
      const declarations = MotionTagParser.parseComments(comments, 'page');

      // Assert
      expect(declarations).toEqual([]);
    });

    it('stamps every declaration with the source that asked for it', () =>
    {
      // Arrange
      const comments = [ '<motion:[breathe]>' ];

      // Act
      const declarations = MotionTagParser.parseComments(comments, 'state:42');

      // Assert
      expect(declarations.at(0)
        .sourceKey()).toBe('state:42');
    });

    it('skips a tag that was shaped like a motion but named one nobody knows', () =>
    {
      // Arrange
      vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });
      const comments = [ '<motion:[breathe]>', '<motion:[nonsense]>' ];

      // Act
      const declarations = MotionTagParser.parseComments(comments, 'page');

      // Assert
      expect(declarations).toHaveLength(1);
      expect(declarations.at(0)
        .type()).toBe('breathe');
    });
  });

  describe('parsePayload', () =>
  {
    it('reads a motion with no parameters at all', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[float]', 'page');

      // Assert
      expect(declaration.type()).toBe('float');
      expect(declaration.parameters()).toEqual([]);
    });

    it('reads numeric parameters as numbers rather than text', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[breathe, 0.08, 90]', 'page');

      // Assert
      expect(declaration.parameters()).toEqual([ 0.08, 90 ]);
    });

    it('leaves a hex colour as text for the registry to interpret', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[tint, #ffa0a0]', 'page');

      // Assert
      expect(declaration.parameters()).toEqual([ '#ffa0a0' ]);
    });

    it('keeps the sync keyword as a parameter for the registry to strip', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[breathe, 0.08, 90, sync]', 'page');

      // Assert
      expect(declaration.parameters()).toEqual([ 0.08, 90, 'sync' ]);
    });

    it('refuses a motion nobody registered, and says which one', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      const declaration = MotionTagParser.parsePayload('[nonsense]', 'page');

      // Assert
      expect(declaration).toBeNull();
      expect(warned.mock.calls.at(0)
        .at(0)).toContain('nonsense');
    });

    it('refuses a motion given more parameters than it accepts', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      const declaration = MotionTagParser.parsePayload('[breathe, 1, 2, 3]', 'page');

      // Assert
      expect(declaration).toBeNull();
      expect(warned.mock.calls.at(0)
        .at(0)).toContain('accepts up to 2 parameters');
    });

    it('accepts a motion given exactly as many parameters as it takes', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[breathe, 1, 2]', 'page');

      // Assert
      expect(declaration).not.toBeNull();
    });

    it('does not count sync against the parameter budget', () =>
    {
      // Act
      const declaration = MotionTagParser.parsePayload('[breathe, 1, 2, sync]', 'page');

      // Assert
      expect(declaration).not.toBeNull();
    });
  });

  describe('hasTooManyParameters', () =>
  {
    it('accepts fewer parameters than the motion allows', () =>
    {
      // Assert
      expect(MotionTagParser.hasTooManyParameters('breathe', [ 1 ])).toBe(false);
    });

    it('accepts exactly as many as the motion allows', () =>
    {
      // Assert
      expect(MotionTagParser.hasTooManyParameters('breathe', [ 1, 2 ])).toBe(false);
    });

    it('rejects one more than the motion allows', () =>
    {
      // Assert
      expect(MotionTagParser.hasTooManyParameters('breathe', [ 1, 2, 3 ])).toBe(true);
    });

    it('measures a motion with a longer signature against its own budget', () =>
    {
      // Assert
      expect(MotionTagParser.hasTooManyParameters('throb', [ 1, 2, 3, 4, 5 ])).toBe(false);
      expect(MotionTagParser.hasTooManyParameters('throb', [ 1, 2, 3, 4, 5, 6 ])).toBe(true);
    });
  });
});
//endregion plugins/motion/core/core/motion-tag-parser.test.js