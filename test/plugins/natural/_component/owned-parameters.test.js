//region plugins/natural/_component/owned-parameters.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  installParameterCatalog,
  registerOwnedParameter,
  registerShippedNaturalParameters,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from './fixtures/install-natural-host-globals.js';

/**
 * A plugin that owns a parameter opts it into natural growth by binding four tags to its key, and adds
 * J-Base's `naturalBonus` wherever it assembles the value. Everything else- storage, refresh, level-up
 * and the conversion from the numbers a tag is written in to the numbers the engine stores- lives in
 * J-NaturalGrowth and is driven only by the parameter's registered format.
 *
 * That conversion is the part most worth pinning, because it is the part that has gone wrong before:
 * RMMZ holds a 75% chance as 0.75, every tag is authored as the 75 a person says out loud, and a single
 * missing or doubled divide by a hundred is the difference between a lifesteal of fifteen percent and a
 * battler that heals fifteen times the damage it deals. Each scenario below is a real one from Chef
 * Adventure's data, run through the whole chain, with the expected number worked out by hand.
 */
describe('J-NaturalGrowth parameters owned by other plugins (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

    const { ParameterFormat } = await installParameterCatalog();

    setPluginContextToJNatural();
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    await import('../../../../src/plugins/natural/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/natural/core/objects/Game_Actor.js');

    await registerShippedNaturalParameters();

    // each owner parameter below mirrors a real one's format and base, and carries its own tags.
    const formula = '([+\\-*/ ().\\w]+)';
    const tagsFor = key => [ 'BuffPlus', 'BuffRate', 'GrowthPlus', 'GrowthRate' ]
      .map(suffix => new RegExp(`<${key}${suffix}:\\[${formula}]>`, 'gi'));

    registerOwnedParameter('lst', ParameterFormat.PERCENT_SUFFIX, tagsFor('lst'), () => 0);
    registerOwnedParameter('dor', ParameterFormat.MULTIPLIER_PERCENT, tagsFor('dor'), () => 0);
    registerOwnedParameter('msb', ParameterFormat.FLAT, tagsFor('msb'), () => 0);
    registerOwnedParameter('sar', ParameterFormat.MULTIPLIER_PERCENT, tagsFor('sar'), () => 1.2);
    registerOwnedParameter('hcr', ParameterFormat.PERCENT_CENTERED, tagsFor('hcr'), () => 1.0);
  });

  /**
   * Builds an actor carrying the given notes.
   * @param {string} note The note every one of the actor's sources carries.
   * @returns {Game_Actor}
   */
  function buildActor(note)
  {
    const actor = new globalThis.Game_Actor();
    actor.__testNoteSources = [ { note } ];
    actor.initMembers();
    return actor;
  }

  it('grows a percent-held parameter by the whole percent its tag names, once per level', () =>
  {
    // Arrange: Medick's lifesteal growth, as authored.
    const actor = buildActor('<lstGrowthPlus:[1.5]>');

    // Act: ten level-ups.
    for (let level = 0; level < 10; level++)
    {
      actor.levelUp();
    }

    // Assert: 1.5% ten times over is 15%, held as 0.15- not the fifteen whole multiples a missing
    // divide would give.
    expect(actor.naturalBonus('lst')).toBeCloseTo(0.15, 10);
  });

  it('adds a percent-held buff as a percent of the multiplier, not as extra multiples of it', () =>
  {
    // Arrange: Trickster's Gambit on a level-thirty actor.
    const actor = buildActor('<dorBuffPlus:[a.level]>');
    actor._level = 30;

    // Act
    actor.refreshAllParameterBuffs();

    // Assert: thirty percent more drops, where the old arithmetic handed out thirty-one times as many.
    expect(actor.naturalBonus('dor')).toBeCloseTo(0.3, 10);
  });

  it('adds a flat parameter\'s tag exactly as written', () =>
  {
    // Arrange: move speed is already held in the numbers people read.
    const actor = buildActor('<msbBuffPlus:[5]>');

    // Act
    actor.refreshAllParameterBuffs();

    // Assert
    expect(actor.naturalBonus('msb')).toBe(5);
  });

  it('takes a rate tag as a percent of the base the status screen shows', () =>
  {
    // Arrange: a shield amplification of 1.2 reads as 120%, so ten percent of it is 12 points.
    const actor = buildActor('<sarBuffRate:[10]>');

    // Act
    actor.refreshAllParameterBuffs();

    // Assert: twelve points of a percent-held parameter is 0.12 on the factor.
    expect(actor.naturalBonus('sar')).toBeCloseTo(0.12, 10);
  });

  it('lets a cost parameter grow cheaper with a negative tag, moving the cost the way the screen shows it', () =>
  {
    // Arrange: life cost two percent cheaper per level.
    const actor = buildActor('<hcrGrowthPlus:[-2]>');

    // Act
    actor.levelUp();

    // Assert
    expect(actor.naturalBonus('hcr')).toBeCloseTo(-0.02, 10);
  });

  it('heals fifteen percent harder with a healing amplification buff of fifteen', () =>
  {
    // Arrange: har is J-Base's own parameter, bound by J-NaturalGrowth and assembled by J-Base's getter.
    const actor = buildActor('<harBuffPlus:[15]>');

    // Act
    actor.refreshAllParameterBuffs();

    // Assert: 1.15, where the old arithmetic made it sixteen times over.
    expect(actor.har).toBeCloseTo(1.15, 10);
  });

  it('refuses to answer for a parameter whose owner folds natural bonuses in but never bound it', () =>
  {
    // Arrange: a key nothing registered or bound, the shape of an owner that forgot its binding.
    const actor = buildActor('');

    // Act
    const attempt = () => actor.naturalBonus('xyz');

    // Assert
    expect(attempt).toThrow('ParameterRegistry: no natural binding for key "xyz"; bind it with bindNatural at boot.');
  });
});
//endregion plugins/natural/_component/owned-parameters.test.js
