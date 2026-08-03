//region plugins/_base/core/register-vanilla-parameters.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('VanillaParameterRegistration (direct src import)', () =>
{
  let VanillaParameterRegistration;
  let ParameterRegistry;
  let ParameterFormat;
  let ParameterDisplayPolicy;
  let ParameterGroups;

  beforeAll(async () =>
  {
    // mtp's custom SDP binding reads the bare global J.SDP directly.
    globalThis.J = {};

    // registerBparam/Xparam/Sparam/Har read the bare global TextManager for label/description text.
    globalThis.TextManager = {
      param: () => '',
      bparamDescription: () => '',
      xparam: () => '',
      xparamDescription: () => '',
      sparam: () => '',
      sparamDescription: () => '',
      maxTp: () => '',
      har: () => '',
      harDescription: () => '',
    };

    ({ default: ParameterFormat } = await import('../../../../../src/plugins/_base/core/core/ParameterFormat.js'));
    ({ default: ParameterDisplayPolicy } = await import('../../../../../src/plugins/_base/core/core/ParameterDisplayPolicy.js'));
    ({ default: ParameterGroups } = await import('../../../../../src/plugins/_base/core/core/ParameterGroups.js'));
    ({ default: ParameterRegistry } = await import('../../../../../src/plugins/_base/core/core/ParameterRegistry.js'));
    ({ default: VanillaParameterRegistration } = await import('../../../../../src/plugins/_base/core/core/registerVanillaParameters.js'));
  });

  beforeEach(() =>
  {
    ParameterRegistry._definitions.clear();
    ParameterRegistry._groupCache.clear();
  });

  afterEach(() =>
  {
    delete globalThis.J.SDP;
  });

  describe('registerBparam', () =>
  {
    it('registers with the default FLAT format when none is given', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerBparam('atk', 2, ParameterGroups.COMBAT, 0);

      // Assert
      expect(ParameterRegistry.get('atk').format).toBe(ParameterFormat.FLAT);
    });

    it('registers with the given format when one is provided', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerBparam('mhp', 0, ParameterGroups.VITALITY, 0, ParameterFormat.FLAT_LARGE);

      // Assert
      expect(ParameterRegistry.get('mhp').format).toBe(ParameterFormat.FLAT_LARGE);
    });

    it('resolves its live value from battler.param(paramId)', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerBparam('atk', 2, ParameterGroups.COMBAT, 0);
      const battler = { param: (id) => (id === 2 ? 55 : -1) };

      // Act
      const result = ParameterRegistry.resolveValue(battler, 'atk');

      // Assert
      expect(result).toBe(55);
    });

    it('wires its label/description/iconIndex getters to the b-param id', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerBparam('atk', 2, ParameterGroups.COMBAT, 0);
      const definition = ParameterRegistry.get('atk');

      // Act & Assert
      expect(definition.label()).toBe('');
      expect(definition.description()).toBe('');
      expect(definition.iconIndex()).toBe(931);
    });
  });

  describe('registerXparam', () =>
  {
    it('registers with the default PERCENT format when none is given', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerXparam('cri', 2, ParameterGroups.PRECISION, 4);

      // Assert
      expect(ParameterRegistry.get('cri').format).toBe(ParameterFormat.PERCENT);
    });

    it('registers with the given format when one is provided', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerXparam('hrg', 7, ParameterGroups.VITALITY, 1, ParameterFormat.REGEN_PER_SECOND);

      // Assert
      expect(ParameterRegistry.get('hrg').format).toBe(ParameterFormat.REGEN_PER_SECOND);
    });

    it('resolves its live value from battler.xparam(xparamId)', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerXparam('cri', 2, ParameterGroups.PRECISION, 4);
      const battler = { xparam: (id) => (id === 2 ? 0.5 : -1) };

      // Act
      const result = ParameterRegistry.resolveValue(battler, 'cri');

      // Assert
      expect(result).toBe(0.5);
    });

    it('wires its label/description/iconIndex getters to the x-param id', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerXparam('cri', 2, ParameterGroups.PRECISION, 4);
      const definition = ParameterRegistry.get('cri');

      // Act & Assert
      expect(definition.label()).toBe('');
      expect(definition.description()).toBe('');
      expect(definition.iconIndex()).not.toBeUndefined();
    });
  });

  describe('registerSparam', () =>
  {
    it('registers with the default format/displayPolicy when none is given', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerSparam('tgr', 0, ParameterGroups.FATE, 0);

      // Assert
      const definition = ParameterRegistry.get('tgr');
      expect(definition.format).toBe(ParameterFormat.PERCENT_CENTERED);
      expect(definition.displayPolicy).toBe(ParameterDisplayPolicy.NONE);
    });

    it('registers with the given format/displayPolicy when provided', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerSparam(
        'mcr', 4, ParameterGroups.COMBAT, 7, ParameterFormat.PERCENT_CENTERED, ParameterDisplayPolicy.COST_RATE,
      );

      // Assert
      expect(ParameterRegistry.get('mcr').displayPolicy).toBe(ParameterDisplayPolicy.COST_RATE);
    });

    it('resolves its live value from battler.sparam(sparamId)', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerSparam('tgr', 0, ParameterGroups.FATE, 0);
      const battler = { sparam: (id) => (id === 0 ? 0.75 : -1) };

      // Act
      const result = ParameterRegistry.resolveValue(battler, 'tgr');

      // Assert
      expect(result).toBe(0.75);
    });

    it('wires its label/description/iconIndex getters to the s-param id', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerSparam('tgr', 0, ParameterGroups.FATE, 0);
      const definition = ParameterRegistry.get('tgr');

      // Act & Assert
      expect(definition.label()).toBe('');
      expect(definition.description()).toBe('');
      expect(definition.iconIndex()).not.toBeUndefined();
    });
  });

  describe('registerHar', () =>
  {
    it('registers "har" in the VITALITY group with a PERCENT_CENTERED format', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerHar();

      // Assert
      const definition = ParameterRegistry.get('har');
      expect(definition.group).toBe(ParameterGroups.VITALITY);
      expect(definition.format).toBe(ParameterFormat.PERCENT_CENTERED);
    });

    it('resolves its live value from battler.har', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerHar();
      const battler = { har: 0.2 };

      // Act
      const result = ParameterRegistry.resolveValue(battler, 'har');

      // Assert
      expect(result).toBe(0.2);
    });

    it('wires its label/description/iconIndex getters', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerHar();
      const definition = ParameterRegistry.get('har');

      // Act & Assert- TextManager/IconManager methods are real calls, just asserting they run.
      expect(definition.label()).toBe('');
      expect(definition.description()).toBe('');
      expect(definition.iconIndex()).toBe(7);
    });

    it('resolves its SDP base to a flat 1 regardless of the actor', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerHar();
      const definition = ParameterRegistry.get('har');

      // Act
      const result = definition.sdpBinding.getBaseForSdp({});

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('registerAll', () =>
  {
    it('registers hit with the SCALED_POINTS format (regression: was undefined before ParameterFormat.SCALED_POINTS existed)', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerAll();

      // Assert
      expect(ParameterRegistry.get('hit').format).toBe(ParameterFormat.SCALED_POINTS);
    });

    it('registers grd with the SCALED_OFFSET format (regression: was undefined before ParameterFormat.SCALED_OFFSET existed)', () =>
    {
      // Arrange & Act
      VanillaParameterRegistration.registerAll();

      // Assert
      expect(ParameterRegistry.get('grd').format).toBe(ParameterFormat.SCALED_OFFSET);
    });

    it('registers every vanilla parameter exactly once', () =>
    {
      // Arrange
      const expectedKeys = [
        'mhp', 'hrg', 'mmp', 'mrg', 'mtp', 'trg', 'rec', 'pha', 'har',
        'atk', 'mat', 'cnt', 'mrf', 'mcr', 'tcr',
        'hit', 'grd', 'agi', 'cri', 'cev',
        'def', 'mdf', 'pdr', 'mdr', 'eva', 'mev', 'fdr', 'tgr',
        'luk', 'exr',
      ];

      // Act
      VanillaParameterRegistration.registerAll();

      // Assert
      expect(ParameterRegistry.all()).toHaveLength(expectedKeys.length);
      expectedKeys.forEach(key => expect(ParameterRegistry.has(key)).toBe(true));
    });

    it('wires cnt\'s label/description/iconIndex/getValue to xparam 6', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerAll();
      const definition = ParameterRegistry.get('cnt');
      const battler = { cnt: 0.3 };

      // Act & Assert
      expect(definition.label())
        .toBe('');
      expect(definition.description())
        .toBe('');
      expect(definition.iconIndex())
        .toBe(950);
      expect(definition.resolveValue(battler))
        .toBe(0.3);
    });

    it('wires mrf\'s label/description/iconIndex/getValue to xparam 5', () =>
    {
      // Arrange
      VanillaParameterRegistration.registerAll();
      const definition = ParameterRegistry.get('mrf');
      const battler = { mrf: 0.4 };

      // Act & Assert
      expect(definition.label())
        .toBe('');
      expect(definition.description())
        .toBe('');
      expect(definition.iconIndex())
        .toBe(949);
      expect(definition.resolveValue(battler))
        .toBe(0.4);
    });

    describe('mtp custom SDP binding', () =>
    {
      it('returns 0 when J.SDP is not loaded', () =>
      {
        // Arrange
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');
        const actor = { maxTpSdpBonuses: () => { throw new Error('should not be called'); } };

        // Act
        const result = definition.sdpBinding.getPanelBonus(actor, 10);

        // Assert
        expect(result).toBe(0);
      });

      it('returns 0 when J.SDP is loaded but the actor has no maxTpSdpBonuses hook', () =>
      {
        // Arrange
        globalThis.J.SDP = {};
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');
        const actor = {};

        // Act
        const result = definition.sdpBinding.getPanelBonus(actor, 10);

        // Assert
        expect(result).toBe(0);
      });

      it('delegates to actor.maxTpSdpBonuses(base) when J.SDP is loaded and the hook exists', () =>
      {
        // Arrange
        globalThis.J.SDP = {};
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');
        const actor = { maxTpSdpBonuses: (base) => (base === 10 ? 4 : -1) };

        // Act
        const result = definition.sdpBinding.getPanelBonus(actor, 10);

        // Assert
        expect(result).toBe(4);
      });

      it('resolves its SDP base from actor.getBaseMaxTp()', () =>
      {
        // Arrange
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');
        const actor = { getBaseMaxTp: () => 77 };

        // Act
        const result = definition.sdpBinding.getBaseForSdp(actor);

        // Assert
        expect(result).toBe(77);
      });

      it('wires its label/description/iconIndex getters', () =>
      {
        // Arrange
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');

        // Act & Assert
        expect(definition.label()).toBe('');
        expect(definition.description()).toBe('');
        expect(definition.iconIndex()).toBe(930);
      });

      it('resolves its live value from battler.maxTp()', () =>
      {
        // Arrange
        VanillaParameterRegistration.registerAll();
        const definition = ParameterRegistry.get('mtp');
        const battler = { maxTp: () => 250 };

        // Act
        const result = definition.resolveValue(battler);

        // Assert
        expect(result).toBe(250);
      });
    });
  });
});
//endregion plugins/_base/core/register-vanilla-parameters.test.js
