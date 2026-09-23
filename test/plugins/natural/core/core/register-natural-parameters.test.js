//region plugins/natural/core/core/register-natural-parameters.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from '../../_component/fixtures/install-natural-host-globals.js';

/**
 * The registration is a table: thirty rows, each naming one parameter's key, its four tags and its base.
 * A transposed row is silent- two parameters quietly trade tags and every test elsewhere still passes-
 * so every row is pinned here by the tag names it must resolve to, not just by how many there are.
 */
describe('J-NaturalGrowth NaturalParameterRegistration (direct src import)', () =>
{
  let NaturalParameterRegistration;

  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../../src/plugins/natural/core/_metadata/initialization.js');

    // J-Base registers the definitions these bindings attach to.
    const { default: VanillaParameterRegistration } =
      await import('../../../../../src/plugins/_base/core/core/registerVanillaParameters.js');
    VanillaParameterRegistration.registerAll();

    ({ default: NaturalParameterRegistration } =
      await import('../../../../../src/plugins/natural/core/core/registerNaturalParameters.js'));
  });

  beforeEach(() =>
  {
    // binding a key twice throws, so each test binds into an empty set.
    globalThis.ParameterRegistry._naturalBindings.clear();
    NaturalParameterRegistration.registerAll();
  });

  it('binds the engine\'s twenty-eight parameters in engine order, then max tech and healing amplification', () =>
  {
    // Arrange & Act (registerAll ran in beforeEach)
    const result = globalThis.ParameterRegistry.naturallyBoundKeys();

    // Assert
    expect(result).toEqual([
      'mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk',
      'hit', 'eva', 'cri', 'cev', 'mev', 'mrf', 'cnt', 'hrg', 'mrg', 'trg',
      'tgr', 'grd', 'rec', 'pha', 'mcr', 'tcr', 'pdr', 'mdr', 'fdr', 'exr',
      'mtp', 'har',
    ]);
  });

  it.each([
    [ 'mhp', 'MaxLife' ], [ 'mmp', 'MaxMagi' ], [ 'atk', 'Power' ], [ 'def', 'Defense' ],
    [ 'mat', 'Force' ], [ 'mdf', 'Resist' ], [ 'agi', 'Speed' ], [ 'luk', 'Luck' ],
    [ 'hit', 'Hit' ], [ 'eva', 'Evade' ], [ 'cri', 'CritChance' ], [ 'cev', 'CritEvade' ],
    [ 'mev', 'MagiEvade' ], [ 'mrf', 'MagiReflect' ], [ 'cnt', 'Counter' ], [ 'hrg', 'LifeRegen' ],
    [ 'mrg', 'MagiRegen' ], [ 'trg', 'TechRegen' ],
    [ 'tgr', 'Aggro' ], [ 'grd', 'Parry' ], [ 'rec', 'Healing' ], [ 'pha', 'ItemFx' ],
    [ 'mcr', 'MagiCostRate' ], [ 'tcr', 'TechCostRate' ], [ 'pdr', 'PhysDmgRate' ], [ 'mdr', 'MagiDmgRate' ],
    [ 'fdr', 'FloorDmgRate' ], [ 'exr', 'ExpGainRate' ],
    [ 'mtp', 'MaxTech' ], [ 'har', 'Har' ],
  ])('binds %s to its own four tags', (key, prefix) =>
  {
    // Arrange
    const tags = globalThis.J.NATURAL.RegExp;

    // Act
    const binding = globalThis.ParameterRegistry.naturalBinding(key);

    // Assert
    expect(binding.buffPlus).toBe(tags[`${prefix}BuffPlus`]);
    expect(binding.buffRate).toBe(tags[`${prefix}BuffRate`]);
    expect(binding.growthPlus).toBe(tags[`${prefix}GrowthPlus`]);
    expect(binding.growthRate).toBe(tags[`${prefix}GrowthRate`]);
  });

  it.each([
    [ 'mhp', 0 ], [ 'atk', 20 ], [ 'luk', 70 ],
  ])('grows base parameter %s against the engine base of its own id', (key, expected) =>
  {
    // Arrange: every id answers differently, so the wrong id would show.
    const battler = { paramBaseBeforeNatural: paramId => paramId * 10 };

    // Act
    const result = globalThis.ParameterRegistry.naturalBinding(key).getBase(battler);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    [ 'hit', 0 ], [ 'cri', 20 ], [ 'trg', 90 ],
  ])('grows ex-parameter %s against the engine value of its own id', (key, expected) =>
  {
    // Arrange: every id answers differently, so the wrong id would show.
    const battler = { xparamBeforeNatural: xparamId => xparamId * 10 };

    // Act
    const result = globalThis.ParameterRegistry.naturalBinding(key).getBase(battler);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    [ 'tgr', 0 ], [ 'rec', 20 ], [ 'exr', 90 ],
  ])('grows sp-parameter %s against the engine value of its own id', (key, expected) =>
  {
    // Arrange: every id answers differently, so the wrong id would show.
    const battler = { sparamBeforeNatural: sparamId => sparamId * 10 };

    // Act
    const result = globalThis.ParameterRegistry.naturalBinding(key).getBase(battler);

    // Assert
    expect(result).toBe(expected);
  });

  it('grows max tech against its base before natural bonuses', () =>
  {
    // Arrange: healing amplification's base answers too, and must not be the one used.
    const battler = { maxTpBeforeNatural: () => 125, baseHarFactor: () => 1.2 };

    // Act
    const result = globalThis.ParameterRegistry.naturalBinding('mtp').getBase(battler);

    // Assert
    expect(result).toBe(125);
  });

  it('grows healing amplification against the factor its own tags produce', () =>
  {
    // Arrange: max tech's base answers too, and must not be the one used.
    const battler = { maxTpBeforeNatural: () => 125, baseHarFactor: () => 1.2 };

    // Act
    const result = globalThis.ParameterRegistry.naturalBinding('har').getBase(battler);

    // Assert
    expect(result).toBe(1.2);
  });
});
//endregion plugins/natural/core/core/register-natural-parameters.test.js
