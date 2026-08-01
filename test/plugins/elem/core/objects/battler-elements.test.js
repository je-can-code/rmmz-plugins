//region plugins/elem/core/objects/battler-elements.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  actorData,
  enemyData,
  installElemHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJElem,
} from '../../_component/fixtures/install-elem-host-globals.js';

/**
 * The battler side of elemental handling answers three questions about a target: which elements it
 * absorbs, which elements are allowed to touch it at all ("strict"), and how much its own boosts
 * amplify a given element. Absorption is the sharp one - an absorbed element inverts the rate,
 * which is what turns an incoming hit into healing, so a sign error here does not merely mis-scale
 * damage, it flips who benefits from the attack.
 */
describe('J-Elementalistics battler elements (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installElemHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../../src/plugins/_base/objects/Game_Action.js');

    setPluginContextToJElem();
    await import('../../../../../src/plugins/elem/core/_metadata/initialization.js');

    // load order mirrors the plugin entry point: actor before enemy.
    await import('../../../../../src/plugins/elem/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Enemy.js');
    await import('../../../../../src/plugins/elem/core/objects/Game_Action.js');
  });

  /**
   * Builds an actor whose notes are exactly the given database rows.
   * @param {string} note The note text to carry.
   * @returns {Game_Actor}
   */
  function makeActor(note = '')
  {
    const actor = new globalThis.Game_Actor();
    actor.getAllNotes = () => [ actorData({ id: 1, name: 'Testy', note }) ];

    return actor;
  }

  /**
   * Builds an enemy whose notes are exactly the given database rows.
   * @param {string} note The note text to carry.
   * @returns {Game_Enemy}
   */
  function makeEnemy(note = '')
  {
    const enemy = new globalThis.Game_Enemy();
    enemy.getAllNotes = () => [ enemyData({ id: 1, name: 'Testy', note }) ];

    return enemy;
  }

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  //region absorption
  describe('elementsAbsorbed', () =>
  {
    it('reports nothing absorbed on a battler with no tags', () =>
    {
      // Arrange & Act
      const absorbed = makeActor().elementsAbsorbed();

      // Assert
      expect(absorbed).toEqual([]);
    });

    it('reports the elements an actor absorbs', () =>
    {
      // Arrange & Act
      const absorbed = makeActor('<absorbElements:[3,5]>').elementsAbsorbed();

      // Assert
      expect(absorbed).toEqual([ 3, 5 ]);
    });

    it('reports the elements an enemy absorbs', () =>
    {
      // Arrange & Act
      const absorbed = makeEnemy('<absorbElements:[7]>').elementsAbsorbed();

      // Assert
      expect(absorbed).toEqual([ 7 ]);
    });

    it('reports nothing absorbed on a bare battler, which has no note sources of its own', () =>
    {
      // Arrange: the base implementation is the neutral answer subclasses build on.
      const battler = new globalThis.Game_Battler();

      // Act
      const absorbed = battler.elementsAbsorbed();

      // Assert
      expect(absorbed).toEqual([]);
    });
  });

  describe('isElementAbsorbed', () =>
  {
    it('recognizes an absorbed element', () =>
    {
      // Arrange & Act
      const result = makeActor('<absorbElements:[3,5]>').isElementAbsorbed(3);

      // Assert
      expect(result).toBe(true);
    });

    it('does not recognize an element the battler merely resists', () =>
    {
      // Arrange & Act
      const result = makeActor('<absorbElements:[3,5]>').isElementAbsorbed(4);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('elementRate inversion', () =>
  {
    it('inverts an actor rate for an absorbed element, turning damage into healing', () =>
    {
      // Arrange: a negative rate is how the damage pipeline expresses "this heals instead".
      const actor = makeActor('<absorbElements:[3]>');

      // Act
      const rate = actor.elementRate(3);

      // Assert
      expect(rate).toBeLessThan(0);
    });

    it('leaves an actor rate positive for an element it does not absorb', () =>
    {
      // Arrange
      const actor = makeActor('<absorbElements:[3]>');

      // Act
      const rate = actor.elementRate(4);

      // Assert
      expect(rate).toBeGreaterThan(0);
    });

    it('inverts an enemy rate for an absorbed element', () =>
    {
      // Arrange
      const enemy = makeEnemy('<absorbElements:[7]>');

      // Act
      const rate = enemy.elementRate(7);

      // Assert
      expect(rate).toBeLessThan(0);
    });

    it('leaves an enemy rate positive for an element it does not absorb', () =>
    {
      // Arrange
      const enemy = makeEnemy('<absorbElements:[7]>');

      // Act
      const rate = enemy.elementRate(8);

      // Assert
      expect(rate).toBeGreaterThan(0);
    });
  });
  //endregion absorption

  //region strictness
  describe('strictElements', () =>
  {
    it('allows every element through when an actor declares no strict list', () =>
    {
      // Arrange: strictness is opt-in, so an untagged battler must not become immune to
      // everything by accident.
      const actor = makeActor();

      // Act
      const strict = actor.strictElements();

      // Assert
      expect(strict.length).toBeGreaterThan(0);
    });

    it('narrows an actor to only its declared strict elements', () =>
    {
      // Arrange & Act
      const strict = makeActor('<strictElements:[2,4]>').strictElements();

      // Assert
      expect(strict).toEqual([ 2, 4 ]);
    });

    it('narrows an enemy to only its declared strict elements', () =>
    {
      // Arrange & Act
      const strict = makeEnemy('<strictElements:[6]>').strictElements();

      // Assert
      expect(strict).toEqual([ 6 ]);
    });
  });

  describe('isElementStrict', () =>
  {
    it('permits any element on a battler with no strict list at all', () =>
    {
      // Arrange: the bare battler answers with an empty list, which means "no restriction".
      const battler = new globalThis.Game_Battler();
      battler.strictElements = () => [];

      // Act
      const result = battler.isElementStrict(99);

      // Assert
      expect(result).toBe(true);
    });

    it('permits an element named in the strict list', () =>
    {
      // Arrange & Act
      const result = makeActor('<strictElements:[2,4]>').isElementStrict(2);

      // Assert
      expect(result).toBe(true);
    });

    it('refuses an element absent from the strict list', () =>
    {
      // Arrange & Act
      const result = makeActor('<strictElements:[2,4]>').isElementStrict(3);

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion strictness

  //region boosts
  describe('elementRateBoost', () =>
  {
    it('leaves the rate neutral on a battler with no boosts', () =>
    {
      // Arrange: a boost is a multiplier, so "no boost" has to be one rather than zero.
      // Act
      const boost = makeActor().elementRateBoost(3);

      // Assert
      expect(boost).toBe(1);
    });

    it('raises the rate for a boosted element', () =>
    {
      // Arrange: boosts are authored in whole percent-points on top of neutral.
      // Act
      const boost = makeActor('<boostElement:[3,50]>').elementRateBoost(3);

      // Assert
      expect(boost).toBeCloseTo(1.5, 10);
    });

    it('lowers the rate for a negatively boosted element', () =>
    {
      // Arrange & Act
      const boost = makeActor('<boostElement:[3,-25]>').elementRateBoost(3);

      // Assert
      expect(boost).toBeCloseTo(0.75, 10);
    });

    it('accumulates several boosts for the same element additively', () =>
    {
      // Arrange: multiple sources stacking on one element sum their percent-points rather than
      // multiplying, so two twenties are forty rather than forty four.
      // Act
      const boost = makeActor('<boostElement:[3,20]>\n<boostElement:[3,20]>').elementRateBoost(3);

      // Assert
      expect(boost).toBeCloseTo(1.4, 10);
    });

    it('ignores boosts belonging to a different element', () =>
    {
      // Arrange & Act
      const boost = makeActor('<boostElement:[3,50]>').elementRateBoost(4);

      // Assert
      expect(boost).toBe(1);
    });

    it('applies enemy boosts the same way it does actor boosts', () =>
    {
      // Arrange & Act
      const boost = makeEnemy('<boostElement:[3,50]>').elementRateBoost(3);

      // Assert
      expect(boost).toBeCloseTo(1.5, 10);
    });

    it('skips note sources carrying no boosts at all', () =>
    {
      // Arrange: most of a battler's note sources say nothing about elements, so the common
      // case is a source contributing nothing rather than one contributing a row.
      const enemy = new globalThis.Game_Enemy();
      enemy.getAllNotes = () => [
        enemyData({ id: 1, name: 'Quiet', note: '' }),
        enemyData({ id: 2, name: 'Loud', note: '<boostElement:[3,50]>' }),
      ];

      // Act
      const boost = enemy.elementRateBoost(3);

      // Assert
      expect(boost).toBeCloseTo(1.5, 10);
    });

    it('leaves the rate neutral on a bare battler, which carries no boost model', () =>
    {
      // Arrange: the base implementation is the neutral answer the subclasses build on.
      const battler = new globalThis.Game_Battler();

      // Act
      const boost = battler.elementRateBoost(3);

      // Assert
      expect(boost).toBe(1);
    });
  });
  //endregion boosts
});
//endregion plugins/elem/core/objects/battler-elements.test.js