//region plugins/abs/ext/shield/_models/jabs-shield.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield JABS_Shield (unit, all downstream dependencies mocked)', () =>
{
  const REGEX = {
    ShieldPointsFormula: Symbol('ShieldPointsFormula'),
    ShieldCapFormula: Symbol('ShieldCapFormula'),
    Priority: Symbol('Priority'),
    Protect: Symbol('Protect'),
    Type: Symbol('Type'),
  };

  /** @type {typeof import('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js').default} */
  let JABS_Shield;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { RegExp: REGEX } } } };
    globalThis.RPGManager = {
      getStringsFromNoteByRegex: vi.fn(),
      getNumberFromNoteByRegex: vi.fn(() => 0),
      checkForBooleanFromNoteByRegex: vi.fn(() => false),
      getArrayFromNotesByRegex: vi.fn(() => []),
    };

    ({ default: JABS_Shield } = await import('../../../../../../src/plugins/abs/ext/shield/_models/JABS_Shield.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getStringsFromNoteByRegex.mockReset().mockReturnValue([]);
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(0);
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset().mockReturnValue(false);
    globalThis.RPGManager.getArrayFromNotesByRegex.mockReset().mockReturnValue([]);
  });

  function buildTarget(overrides = {})
  {
    return Object.assign({ state: vi.fn(() => ({ id: 5 })) }, overrides);
  }

  describe('fromStateId', () =>
  {
    it('returns null when the combined point formulas total zero', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValue([]);
      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());
      expect(result).toBeNull();
    });

    it('sums multiple point formulas', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ '10', '20' ])
        .mockReturnValueOnce([]);

      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      expect(result.getCurrent()).toBe(30);
    });

    it('silently ignores a formula that throws and continues summing the rest', () =>
    {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ 'not(valid(js', '15' ])
        .mockReturnValueOnce([]);

      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      expect(result.getCurrent()).toBe(15);
      console.error.mockRestore();
    });

    it('scales points by the attacker\'s outgoing shield amplification (sar)', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ '10' ])
        .mockReturnValueOnce([]);
      const attacker = buildTarget({ sar: 2 });

      const result = JABS_Shield.fromStateId(5, buildTarget(), attacker);

      expect(result.getCurrent()).toBe(20);
    });

    it('scales points by the target\'s incoming shield efficiency (ser)', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ '10' ])
        .mockReturnValueOnce([]);
      const target = buildTarget({ ser: 0.5 });

      const result = JABS_Shield.fromStateId(5, target, buildTarget());

      expect(result.getCurrent()).toBe(5);
    });

    it('defaults the cap to the total points when no cap formulas are present', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ '10' ])
        .mockReturnValueOnce([]);

      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      expect(result.getCap()).toBe(10);
    });

    it('uses the summed cap formulas when present', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex
        .mockReturnValueOnce([ '10' ])
        .mockReturnValueOnce([ '50' ]);

      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      expect(result.getCap()).toBe(50);
    });

    it('reads the priority, protect flag, and shield types from notes', () =>
    {
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValueOnce([ '10' ]).mockReturnValueOnce([]);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(3);
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 1, 2 ]);

      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      expect(result.getPriority()).toBe(3);
      expect(result.isProtected()).toBe(true);
      expect(result.getShieldTypes()).toEqual([ 1, 2 ]);
    });

    it('leaves the protect flag off when the state carries no protect tag', () =>
    {
      // Arrange (the point formulas anchor that a shield was genuinely derived, so the `false`
      // below cannot be mistaken for an untouched field default)
      globalThis.RPGManager.getStringsFromNoteByRegex.mockReturnValueOnce([ '10' ]).mockReturnValueOnce([]);
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);

      // Act
      const result = JABS_Shield.fromStateId(5, buildTarget(), buildTarget());

      // Assert
      expect(result.getCurrent()).toBe(10);
      expect(result.isProtected()).toBe(false);
    });
  });

  describe('setCurrent', () =>
  {
    it('clamps below zero up to zero', () =>
    {
      const shield = new JABS_Shield(10, 20, 0, [], false, 0);
      shield.setCurrent(-5);
      expect(shield.getCurrent()).toBe(0);
    });

    it('clamps above the cap down to the cap', () =>
    {
      const shield = new JABS_Shield(10, 20, 0, [], false, 0);
      shield.setCurrent(999);
      expect(shield.getCurrent()).toBe(20);
    });

    it('rounds fractional values', () =>
    {
      const shield = new JABS_Shield(10, 20, 0, [], false, 0);
      shield.setCurrent(5.6);
      expect(shield.getCurrent()).toBe(6);
    });
  });

  describe('applyShieldDamage', () =>
  {
    it('absorbs damage fully with no overflow when the shield can cover it', () =>
    {
      const shield = new JABS_Shield(10, 10, 0, [], false, 0);
      const overflow = shield.applyShieldDamage(4);
      expect(overflow).toBe(0);
      expect(shield.getCurrent()).toBe(6);
    });

    it('returns the overflow amount when damage exceeds the current shield', () =>
    {
      const shield = new JABS_Shield(10, 10, 0, [], false, 0);
      const overflow = shield.applyShieldDamage(15);
      expect(overflow).toBe(5);
      expect(shield.getCurrent()).toBe(0);
    });

    it('never lets current go negative', () =>
    {
      const shield = new JABS_Shield(10, 10, 0, [], false, 0);
      shield.applyShieldDamage(100);
      expect(shield.getCurrent()).toBe(0);
    });
  });

  describe('isBroken', () =>
  {
    it('is false while shield points remain', () =>
    {
      const shield = new JABS_Shield(10, 10, 0, [], false, 0);
      expect(shield.isBroken()).toBe(false);
    });

    it('is true once the shield is fully depleted', () =>
    {
      const shield = new JABS_Shield(10, 10, 0, [], false, 0);
      shield.setCurrent(0);
      expect(shield.isBroken()).toBe(true);
    });
  });

  describe('refresh', () =>
  {
    it('adds a full pool amount back onto the current value', () =>
    {
      const shield = new JABS_Shield(10, 30, 0, [], false, 0);
      shield.setCurrent(5);
      shield.refresh();
      expect(shield.getCurrent()).toBe(15);
    });

    it('clamps the refreshed value to the cap', () =>
    {
      const shield = new JABS_Shield(10, 12, 0, [], false, 0);
      shield.setCurrent(10);
      shield.refresh();
      expect(shield.getCurrent()).toBe(12);
    });
  });

  describe('simple getters', () =>
  {
    it('exposes priority, shield types, protect flag, and applied-at timestamp', () =>
    {
      const shield = new JABS_Shield(10, 10, 7, [ 1, 2 ], true, 12345);
      expect(shield.getPriority()).toBe(7);
      expect(shield.getShieldTypes()).toEqual([ 1, 2 ]);
      expect(shield.isProtected()).toBe(true);
      expect(shield.getAppliedAt()).toBe(12345);
    });

    it('reports a shield constructed without the protect flag as unprotected', () =>
    {
      // Arrange (the priority assertion anchors that the constructor ran, since `false` is also
      // the field's cold default)
      const shield = new JABS_Shield(10, 10, 7, [ 1, 2 ], false, 12345);

      // Act/Assert
      expect(shield.getPriority()).toBe(7);
      expect(shield.isProtected()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/shield/_models/jabs-shield.test.js
