//region plugins/motion/core/core/motion-type-registry.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installMotionHostGlobals } from '../../fixtures/install-motion-host-globals.js';

describe('MotionTypeRegistry', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js').default} */
  let MotionTypeRegistry;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/OscillatorMotionEffect.js').default} */
  let OscillatorMotionEffect;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/TransitionMotionEffect.js').default} */
  let TransitionMotionEffect;

  beforeAll(async () =>
  {
    installMotionHostGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: MotionTypeRegistry } =
      await import('../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: OscillatorMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/OscillatorMotionEffect.js'));
    ({ default: TransitionMotionEffect } =
      await import('../../../../../src/plugins/motion/core/models/TransitionMotionEffect.js'));
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('the shipped roster', () =>
  {
    it('knows every motion the plugin documents', () =>
    {
      // Act
      const types = MotionTypeRegistry.registeredTypes();

      // Assert
      expect(types).toHaveLength(18);
      expect(types).toContain('breathe');
      expect(types).toContain('spin');
      expect(types).toContain('tint');
    });

    it('recognises a motion it was given', () =>
    {
      // Assert
      expect(MotionTypeRegistry.isRegistered('breathe')).toBe(true);
    });

    it('does not recognise a motion nobody registered', () =>
    {
      // Assert
      expect(MotionTypeRegistry.isRegistered('breath')).toBe(false);
    });

    it('reports how many parameters a motion accepts', () =>
    {
      // Assert
      expect(MotionTypeRegistry.parameterCountFor('breathe')).toBe(2);
      expect(MotionTypeRegistry.parameterCountFor('throb')).toBe(5);
    });

    it('points each motion at the implementation that animates it', () =>
    {
      // Assert
      expect(MotionTypeRegistry.definitionFor('breathe').implementation).toBe(OscillatorMotionEffect);
      expect(MotionTypeRegistry.definitionFor('scale').implementation).toBe(TransitionMotionEffect);
    });
  });

  describe('every shipped motion', () =>
  {
    it('builds without its definition needing anything the author did not write', () =>
    {
      // Arrange
      const everyType = MotionTypeRegistry.registeredTypes();

      // Act
      const built = everyType.map(motionType =>
      {
        const declaration = new MotionDeclaration(motionType, [], 'page');

        return MotionTypeRegistry.buildEffect(declaration, {});
      });

      // Assert
      expect(built).toHaveLength(18);
      built.forEach(effect => expect(effect.parameters()).toBeTypeOf('object'));
    });

    it('gives every cycling motion an offset inside its own period, and the rest none', () =>
    {
      // Arrange
      const cycling = [ 'breathe', 'stretch', 'pulse', 'float', 'sway', 'swing', 'ghost', 'throb', 'flash', 'spin' ];
      const still = [ 'shake', 'flicker', 'scale', 'angle', 'fade', 'hue', 'tint' ];

      // Act
      const cyclingSpans = cycling.map(motionType =>
      {
        const definition = MotionTypeRegistry.definitionFor(motionType);

        return definition.phaseSpan(definition.defaults);
      });
      const stillSpans = still.map(motionType =>
      {
        const definition = MotionTypeRegistry.definitionFor(motionType);

        return definition.phaseSpan(definition.defaults);
      });

      // Assert
      cyclingSpans.forEach(span => expect(span).toBeGreaterThan(0));
      stillSpans.forEach(span => expect(span).toBe(0));
    });

    it('spans a hop across both its leap and its rest', () =>
    {
      // Arrange
      const definition = MotionTypeRegistry.definitionFor('hop');

      // Act
      const span = definition.phaseSpan(definition.defaults);

      // Assert
      expect(span).toBe(54);
    });
  });

  describe('register', () =>
  {
    it('accepts a motion an extension supplies', () =>
    {
      // Arrange
      const definition = {
        implementation: OscillatorMotionEffect,
        parameterNames: [ 'depth' ],
        defaults: { depth: 3 },
        phaseSpan: () => 0,
      };

      // Act
      MotionTypeRegistry.register('collapse', definition);

      // Assert
      expect(MotionTypeRegistry.isRegistered('collapse')).toBe(true);
      expect(MotionTypeRegistry.parameterCountFor('collapse')).toBe(1);
    });
  });

  describe('parseColor', () =>
  {
    it('splits a hex colour into its components', () =>
    {
      // Act
      const parsed = MotionTypeRegistry.parseColor('#ffa0a0');

      // Assert
      expect(parsed).toEqual([ 255, 160, 160 ]);
    });

    it('reads a colour that was written without its hash', () =>
    {
      // Act
      const parsed = MotionTypeRegistry.parseColor('00ff80');

      // Assert
      expect(parsed).toEqual([ 0, 255, 128 ]);
    });
  });

  describe('buildEffect', () =>
  {
    it('uses the authored value when the author supplied one', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [ 0.2, 60 ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.parameters()).toEqual({ amount: 0.2, period: 60 });
    });

    it('falls back to configuration for a parameter the author omitted', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [ 0.2 ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, { period: 999 });

      // Assert
      expect(effect.parameters()).toEqual({ amount: 0.2, period: 999 });
    });

    it('falls back to its own defaults when configuration is silent too', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.parameters()).toEqual({ amount: 0.05, period: 150 });
    });

    it('prefers what the author wrote over what configuration says', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [ 0.2, 60 ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, { amount: 0.9, period: 999 });

      // Assert
      expect(effect.parameters()).toEqual({ amount: 0.2, period: 60 });
    });

    it('builds the implementation the definition names', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('scale', [], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect).toBeInstanceOf(TransitionMotionEffect);
    });

    it('turns an authored colour into components on the way in', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('tint', [ '#ff0000' ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.parameters().color).toEqual([ 255, 0, 0 ]);
    });

    it('turns a configured colour into components too', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('tint', [], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, { color: '#00ff00' });

      // Assert
      expect(effect.parameters().color).toEqual([ 0, 255, 0 ]);
    });
  });

  describe('the phase offset', () =>
  {
    it('starts a cycling motion somewhere random inside its own period', () =>
    {
      // Arrange
      vi.spyOn(Math, 'randomInt')
        .mockReturnValue(37);
      const declaration = new MotionDeclaration('breathe', [ 0.05, 150 ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(Math.randomInt).toHaveBeenCalledWith(150);
      expect(effect.phaseOffset()).toBe(37);
    });

    it('starts at the top of the cycle when the author asked for lockstep', () =>
    {
      // Arrange
      vi.spyOn(Math, 'randomInt')
        .mockReturnValue(37);
      const declaration = new MotionDeclaration('breathe', [ 0.05, 150, 'sync' ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.phaseOffset()).toBe(0);
      expect(Math.randomInt).not.toHaveBeenCalled();
    });

    it('does not count the sync keyword as a positional parameter', () =>
    {
      // Arrange
      const declaration = new MotionDeclaration('breathe', [ 0.2, 'sync' ], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.parameters()).toEqual({ amount: 0.2, period: 150 });
    });

    it('gives a motion with no cycle no offset at all', () =>
    {
      // Arrange
      vi.spyOn(Math, 'randomInt')
        .mockReturnValue(37);
      const declaration = new MotionDeclaration('scale', [], 'page');

      // Act
      const effect = MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(effect.phaseOffset()).toBe(0);
      expect(Math.randomInt).not.toHaveBeenCalled();
    });

    it('spans the whole leap-and-rest cycle for a hop, not just the leap', () =>
    {
      // Arrange
      vi.spyOn(Math, 'randomInt')
        .mockReturnValue(5);
      const declaration = new MotionDeclaration('hop', [ 24, 20, 40 ], 'page');

      // Act
      MotionTypeRegistry.buildEffect(declaration, {});

      // Assert
      expect(Math.randomInt).toHaveBeenCalledWith(60);
    });
  });
});
//endregion plugins/motion/core/core/motion-type-registry.test.js