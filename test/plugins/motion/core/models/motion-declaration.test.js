//region plugins/motion/core/models/motion-declaration.test.js
import { beforeAll, describe, expect, it } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionDeclaration', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  beforeAll(async () =>
  {
    // the field initializers seed from String.empty.
    installMotionHostGlobals();

    // a literal import path, so Stryker can map mutants in this file back to this test file.
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
  });

  describe('accessors', () =>
  {
    it('reports what it was built with', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');

      // Assert
      expect(declaration.type()).toBe('breathe');
      expect(declaration.parameters()).toEqual([ 0.08, 90 ]);
      expect(declaration.sourceKey()).toBe('page');
    });
  });

  describe('matches', () =>
  {
    it('agrees with an identical declaration', () =>
    {
      // Arrange
      const original = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');
      const identical = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');

      // Act
      const matched = original.matches(identical);

      // Assert
      expect(matched).toBe(true);
    });

    it('rejects a different motion asked for the same way', () =>
    {
      // Arrange
      const original = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');
      const other = new MotionDeclaration('stretch', [ 0.08, 90 ], 'page');

      // Act
      const matched = original.matches(other);

      // Assert
      expect(matched).toBe(false);
    });

    it('rejects the same motion asked for by somebody else', () =>
    {
      // Arrange
      const original = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');
      const other = new MotionDeclaration('breathe', [ 0.08, 90 ], 'state:42');

      // Act
      const matched = original.matches(other);

      // Assert
      expect(matched).toBe(false);
    });

    it('rejects a declaration carrying an extra parameter', () =>
    {
      // Arrange
      const original = new MotionDeclaration('breathe', [ 0.08 ], 'page');
      const other = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');

      // Act
      const matched = original.matches(other);

      // Assert
      expect(matched).toBe(false);
    });

    it('rejects a declaration whose parameters differ in value', () =>
    {
      // Arrange
      const original = new MotionDeclaration('breathe', [ 0.08, 90 ], 'page');
      const other = new MotionDeclaration('breathe', [ 0.08, 150 ], 'page');

      // Act
      const matched = original.matches(other);

      // Assert
      expect(matched).toBe(false);
    });

    it('rejects a declaration whose parameters are the same values in a different order', () =>
    {
      // Arrange
      const original = new MotionDeclaration('ghost', [ 0.2, 0.9 ], 'page');
      const other = new MotionDeclaration('ghost', [ 0.9, 0.2 ], 'page');

      // Act
      const matched = original.matches(other);

      // Assert
      expect(matched).toBe(false);
    });

    it('agrees when neither declaration carries any parameters', () =>
    {
      // Arrange
      const original = new MotionDeclaration('float', [], 'page');
      const identical = new MotionDeclaration('float', [], 'page');

      // Act
      const matched = original.matches(identical);

      // Assert
      expect(matched).toBe(true);
    });
  });
});
//endregion plugins/motion/core/models/motion-declaration.test.js