//region plugins/_base/models/sdp-parameter-binding.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('SdpParameterBinding (direct src import)', () =>
{
  let SdpParameterBinding;

  beforeAll(async () =>
  {
    ({ default: SdpParameterBinding } = await import('../../../../src/plugins/_base/models/SdpParameterBinding.js'));
  });

  beforeEach(() =>
  {
    // the source reads the bare global J.SDP directly, so give each test a clean slate.
    globalThis.J = {};
  });

  afterEach(() =>
  {
    delete globalThis.J;
  });

  describe('none', () =>
  {
    it('returns a binding whose panel bonus is always 0', () =>
    {
      // Arrange
      const binding = SdpParameterBinding.none();

      // Act
      const result = binding.getPanelBonus({}, 999);

      // Assert
      expect(result).toBe(0);
    });

    it('returns a binding with no getBaseForSdp override', () =>
    {
      // Arrange & Act
      const binding = SdpParameterBinding.none();

      // Assert
      expect(binding.getBaseForSdp).toBeUndefined();
    });
  });

  describe('byKey', () =>
  {
    it('returns 0 without touching the actor when J.SDP is not loaded', () =>
    {
      // Arrange
      const binding = SdpParameterBinding.byKey('atk');
      const actor = { getSdpBonusForParameterKey: () => { throw new Error('should not be called'); } };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(0);
    });

    it('delegates to actor.getSdpBonusForParameterKey with the bound key and base when J.SDP is loaded', () =>
    {
      // Arrange
      globalThis.J.SDP = {};
      const binding = SdpParameterBinding.byKey('atk');
      const actor = { getSdpBonusForParameterKey: (key, base) => (key === 'atk' && base === 10 ? 5 : -1) };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(5);
    });

    it('carries the optional getBaseForSdp through unchanged', () =>
    {
      // Arrange
      const getBaseForSdp = (actor) => actor.atk;

      // Act
      const binding = SdpParameterBinding.byKey('atk', getBaseForSdp);

      // Assert
      expect(binding.getBaseForSdp).toBe(getBaseForSdp);
    });
  });

  describe('bparam', () =>
  {
    it('binds to the registry key resolved from the b-param id', () =>
    {
      // Arrange- b-param id 2 resolves to 'atk' per ParameterKeys.BPARAM_KEYS.
      globalThis.J.SDP = {};
      const binding = SdpParameterBinding.bparam(2);
      const actor = { getSdpBonusForParameterKey: (key, base) => (key === 'atk' && base === 10 ? 5 : -1) };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(5);
    });
  });

  describe('xparam', () =>
  {
    it('returns 0 without touching the actor when J.SDP is not loaded', () =>
    {
      // Arrange
      const binding = SdpParameterBinding.xparam(0);
      const actor = { getSdpBonusForNonCoreParam: () => { throw new Error('should not be called'); } };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(0);
    });

    it('delegates to actor.getSdpBonusForNonCoreParam with the xparam id, base, and offset 8 when J.SDP is loaded', () =>
    {
      // Arrange
      globalThis.J.SDP = {};
      const binding = SdpParameterBinding.xparam(3);
      const actor = { getSdpBonusForNonCoreParam: (id, base, offset) => (id === 3 && base === 10 && offset === 8 ? 7 : -1) };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(7);
    });
  });

  describe('sparam', () =>
  {
    it('returns 0 without touching the actor when J.SDP is not loaded', () =>
    {
      // Arrange
      const binding = SdpParameterBinding.sparam(0);
      const actor = { getSdpBonusForNonCoreParam: () => { throw new Error('should not be called'); } };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(0);
    });

    it('delegates to actor.getSdpBonusForNonCoreParam with the sparam id, base, and offset 18 when J.SDP is loaded', () =>
    {
      // Arrange
      globalThis.J.SDP = {};
      const binding = SdpParameterBinding.sparam(4);
      const actor = { getSdpBonusForNonCoreParam: (id, base, offset) => (id === 4 && base === 10 && offset === 18 ? 9 : -1) };

      // Act
      const result = binding.getPanelBonus(actor, 10);

      // Assert
      expect(result).toBe(9);
    });
  });

  describe('custom', () =>
  {
    it('wraps the given getPanelBonus and getBaseForSdp unchanged', () =>
    {
      // Arrange
      const getPanelBonus = (actor, base) => base + 1;
      const getBaseForSdp = (actor) => actor.atk;

      // Act
      const binding = SdpParameterBinding.custom(getPanelBonus, getBaseForSdp);

      // Assert
      expect(binding.getPanelBonus).toBe(getPanelBonus);
      expect(binding.getBaseForSdp).toBe(getBaseForSdp);
    });

    it('defaults getBaseForSdp to undefined when omitted', () =>
    {
      // Arrange
      const getPanelBonus = (actor, base) => base;

      // Act
      const binding = SdpParameterBinding.custom(getPanelBonus);

      // Assert
      expect(binding.getBaseForSdp).toBeUndefined();
    });
  });
});
//endregion plugins/_base/models/sdp-parameter-binding.test.js
