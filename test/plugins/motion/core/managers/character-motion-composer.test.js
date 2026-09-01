//region plugins/motion/core/managers/character-motion-composer.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installMotionHostGlobals, installMotionMetadata } from '../../fixtures/install-motion-host-globals.js';

describe('CharacterMotionComposer', () =>
{
  /** @type {typeof import('../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js').default} */
  let MotionDeclaration;

  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  /** @type {typeof import('../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js').default} */
  let MotionTypeRegistry;

  beforeAll(async () =>
  {
    installMotionHostGlobals();
    installMotionMetadata();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    ({ default: MotionTypeRegistry } =
      await import('../../../../../src/plugins/motion/core/core/MotionTypeRegistry.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionDeclaration } =
      await import('../../../../../src/plugins/motion/core/models/MotionDeclaration.js'));
    ({ default: MotionChannels } =
      await import('../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /** @type {Object} */
  let character;

  beforeEach(() =>
  {
    // a character is only ever used as a key, so a bare object is the whole truth of one here.
    character = { name: 'a-character' };
  });

  afterEach(() =>
  {
    CharacterMotionComposer.forget(character);
    vi.restoreAllMocks();
  });

  /**
   * Builds a declaration.
   * @param {string} type The motion type.
   * @param {Array} parameters The authored parameters.
   * @param {string} sourceKey Who is declaring it.
   * @returns {Object} The declaration.
   */
  const aDeclaration = (type, parameters, sourceKey) => new MotionDeclaration(type, parameters, sourceKey);

  /**
   * Composes a character for a number of frames and hands back the last composition.
   * @param {Object} target The character being composed.
   * @param {number} frames How many frames to run.
   * @returns {Object} The final composition.
   */
  const composeFor = (target, frames) =>
  {
    let composition = null;
    for (let index = 0; index < frames; index++)
    {
      composition = CharacterMotionComposer.compose(target);
    }

    return composition;
  };

  describe('hasMotion', () =>
  {
    it('reports nothing for a character nobody has ever declared anything on', () =>
    {
      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('reports motion once something has been declared', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('breathe', [], 'page') ]);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('reports nothing again once the last motion has finished winding down', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('breathe', [], 'page') ]);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'page');
      CharacterMotionComposer.compose(character);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });

  describe('compose', () =>
  {
    it('hands a still character a composition that changes nothing', () =>
    {
      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1.0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('reports what a declared motion contributes', () =>
    {
      // Arrange
      const declaration = aDeclaration('float', [ 20, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ declaration ]);

      // Act
      const composition = composeFor(character, 50);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-20, 10);
    });

    it('composes two motions declared by different sources onto one character', () =>
    {
      // Arrange
      const floating = aDeclaration('float', [ 20, 100, 'sync' ], 'page');
      const swaying = aDeclaration('sway', [ 8, 100, 'sync' ], 'state:1');
      CharacterMotionComposer.declare(character, 'page', [ floating ]);
      CharacterMotionComposer.declare(character, 'state:1', [ swaying ]);

      // Act
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeLessThan(0);
    });
  });

  describe('declare', () =>
  {
    it('keeps the running motion when the same source declares the very same thing again', () =>
    {
      // Arrange- synced, so the cycle position is a function of elapsed frames alone and a rebuilt
      // effect is therefore distinguishable from a surviving one by its value rather than by luck.
      const first = aDeclaration('breathe', [ 0.05, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ first ]);
      composeFor(character, 25);

      // Act
      const identical = aDeclaration('breathe', [ 0.05, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ identical ]);
      const after = CharacterMotionComposer.compose(character)
        .valueFor(MotionChannels.SCALE_Y);

      // Assert
      // 26 frames into a 100 frame breath. A rebuilt effect would be one frame in, reading 1.0031.
      expect(after).toBeCloseTo(1.0499, 4);
    });

    it('replaces the running motion when the same source declares something different', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('float', [ 20, 100, 'sync' ], 'page') ]);
      composeFor(character, 50);

      // Act
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('sway', [ 8, 100, 'sync' ], 'page') ]);
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('replaces when the incoming set is a different length entirely', () =>
    {
      // Arrange
      const floating = aDeclaration('float', [ 20, 100, 'sync' ], 'page');
      const swaying = aDeclaration('sway', [ 8, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ floating ]);

      // Act
      CharacterMotionComposer.declare(character, 'page', [ floating, swaying ]);
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('stops the running motion when a source declares nothing at all', () =>
    {
      // Arrange- an event page changing to one with no motion tags declares an empty set rather
      // than withdrawing, and every event on a map does this on any self-switch anywhere.
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('float', [ 20, 100, 'sync' ], 'page') ]);
      composeFor(character, 25);

      // Act
      CharacterMotionComposer.declare(character, 'page', []);
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });

  describe('removeDeclarations', () =>
  {
    it('stops what that source declared', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('sway', [ 8, 100, 'sync' ], 'page') ]);
      composeFor(character, 25);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'page');
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
    });

    it('leaves every other source running', () =>
    {
      // Arrange
      const swaying = aDeclaration('sway', [ 8, 100, 'sync' ], 'page');
      const floating = aDeclaration('float', [ 20, 100, 'sync' ], 'state:42');
      CharacterMotionComposer.declare(character, 'page', [ swaying ]);
      CharacterMotionComposer.declare(character, 'state:42', [ floating ]);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'page');
      const composition = composeFor(character, 50);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-20, 10);
    });

    it('does not mistake one state for another whose id merely starts the same way', () =>
    {
      // Arrange
      const fourth = aDeclaration('sway', [ 8, 100, 'sync' ], 'state:4');
      const fortyFirst = aDeclaration('float', [ 20, 100, 'sync' ], 'state:41');
      CharacterMotionComposer.declare(character, 'state:4', [ fourth ]);
      CharacterMotionComposer.declare(character, 'state:41', [ fortyFirst ]);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'state:4');
      const composition = composeFor(character, 50);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-20, 10);
    });

    it('lets a transition travel home rather than snapping the character back', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'state:1', [ aDeclaration('scale', [ 200, 40 ], 'state:1') ]);
      composeFor(character, 40);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'state:1');
      const composition = composeFor(character, 20);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(1.25, 10);
    });
  });

  describe('claim arbitration', () =>
  {
    /**
     * Registers a motion type that claims a channel, standing in for what a combat extension does.
     * @param {string} typeName The name to register it under.
     */
    const registerClaimingType = typeName =>
    {
      class ClaimingEffect
      {
        constructor(declaration)
        {
          this._declaration = declaration;
        }

        declaration()
        {
          return this._declaration;
        }

        tick()
        {
        }

        isDiscardable()
        {
          return false;
        }

        claims()
        {
          return [ MotionChannels.SCALE_X ];
        }

        isBaseline()
        {
          return false;
        }

        applyTo(composition)
        {
          composition.contribute(this, MotionChannels.SCALE_X, 9);
        }
      }

      MotionTypeRegistry.register(typeName, {
        implementation: ClaimingEffect,
        parameterNames: [],
        defaults: {},
        phaseSpan: () => 0,
      });
    };

    it('lets a claiming effect take a channel from an ambient one', () =>
    {
      // Arrange
      registerClaimingType('claimer');
      const ambient = aDeclaration('breathe', [ 0.5, 100 ], 'page');
      const claiming = aDeclaration('claimer', [], 'combat:1');
      CharacterMotionComposer.declare(character, 'page', [ ambient ]);
      CharacterMotionComposer.declare(character, 'combat:1', [ claiming ]);

      // Act
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(9);
    });

    it('leaves the ambient motion in charge of the channels nobody claimed', () =>
    {
      // Arrange
      registerClaimingType('claimer');
      const ambient = aDeclaration('breathe', [ 0.5, 100, 'sync' ], 'page');
      const claiming = aDeclaration('claimer', [], 'combat:1');
      CharacterMotionComposer.declare(character, 'page', [ ambient ]);
      CharacterMotionComposer.declare(character, 'combat:1', [ claiming ]);

      // Act
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.5, 10);
    });

    it('gives the channel to the higher-ranked source when two both claim it', () =>
    {
      // Arrange
      registerClaimingType('claimerA');
      MotionTypeRegistry.register('claimerB', {
        ...MotionTypeRegistry.definitionFor('claimerA'),
      });
      const lowly = aDeclaration('claimerA', [], 'page');
      const mighty = aDeclaration('claimerB', [], 'combat:1');
      CharacterMotionComposer.declare(character, 'page', [ lowly ]);
      CharacterMotionComposer.declare(character, 'combat:1', [ mighty ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('combat:1');
    });

    it('keeps the higher-ranked claim even when the lesser one is declared afterwards', () =>
    {
      // Arrange
      registerClaimingType('claimerC');
      const mighty = aDeclaration('claimerC', [], 'combat:1');
      const lowly = aDeclaration('claimerC', [], 'page');
      CharacterMotionComposer.declare(character, 'combat:1', [ mighty ]);
      CharacterMotionComposer.declare(character, 'page', [ lowly ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('combat:1');
    });

    it('composes a claimed channel with the baseline it was resting at', () =>
    {
      // Arrange- a breathe rides along on the same channel as the near miss. It is an ambient
      // wobble rather than a baseline, so it must still be suppressed; only the held scale survives.
      registerClaimingType('claimerR');
      CharacterMotionComposer.declare(character, 'passive:301',
        [ aDeclaration('scale', [ 150, 1 ], 'passive:301') ]);
      CharacterMotionComposer.declare(character, 'page',
        [ aDeclaration('breathe', [ 0.5, 100, 'sync' ], 'page') ]);
      CharacterMotionComposer.declare(character, 'combat:1', [ aDeclaration('claimerR', [], 'combat:1') ]);

      // Act
      const composition = composeFor(character, 2);

      // Assert- the claimant's 9, multiplied by the 1.5 it is modulating. A discarded baseline
      // would read 9, and a surviving breathe would put it somewhere either side of 13.5.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(13.5, 10);
    });

    it('leaves an unclaimed channel of the same baseline alone', () =>
    {
      // Arrange- the claimant takes only SCALE_X, so SCALE_Y proves the baseline still composes
      // normally where nothing contested it.
      registerClaimingType('claimerS');
      CharacterMotionComposer.declare(character, 'passive:301',
        [ aDeclaration('scale', [ 150, 1 ], 'passive:301') ]);
      CharacterMotionComposer.declare(character, 'combat:1', [ aDeclaration('claimerS', [], 'combat:1') ]);

      // Act
      const composition = composeFor(character, 2);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBeCloseTo(1.5, 10);
    });

    it('gives the channel to an applied state over a passive one', () =>
    {
      // Arrange — an affix swelling a creature is outranked by the affliction that just landed on
      // it, because the transient thing is the thing the player is meant to be reading.
      registerClaimingType('claimerP');
      const passive = aDeclaration('claimerP', [], 'passive:301');
      const applied = aDeclaration('claimerP', [], 'state:42');
      CharacterMotionComposer.declare(character, 'passive:301', [ passive ]);
      CharacterMotionComposer.declare(character, 'state:42', [ applied ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('state:42');
    });

    it('gives the channel to a passive over an event page', () =>
    {
      // Arrange — the passive is declared first, so winning cannot be an artifact of declaration
      // order the way it would be between two sources of equal rank.
      registerClaimingType('claimerQ');
      const passive = aDeclaration('claimerQ', [], 'passive:301');
      const ambient = aDeclaration('claimerQ', [], 'page');
      CharacterMotionComposer.declare(character, 'passive:301', [ passive ]);
      CharacterMotionComposer.declare(character, 'page', [ ambient ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('passive:301');
    });

    it('ranks an unrecognised source below every named one', () =>
    {
      // Arrange
      registerClaimingType('claimerD');
      const stranger = aDeclaration('claimerD', [], 'mystery:1');
      const known = aDeclaration('claimerD', [], 'page');
      CharacterMotionComposer.declare(character, 'mystery:1', [ stranger ]);
      CharacterMotionComposer.declare(character, 'page', [ known ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('page');
    });

    it('does not let an unrecognised source take a channel a named one already holds', () =>
    {
      // Arrange- declared in the opposite order to the case above, which is the order that
      // distinguishes "the stranger ranks lowest" from "the stranger has no rank at all". An
      // unranked source compares as undefined, and every comparison against undefined is false, so
      // it would quietly win every channel it asked for.
      registerClaimingType('claimerE');
      const known = aDeclaration('claimerE', [], 'page');
      const stranger = aDeclaration('claimerE', [], 'mystery:1');
      CharacterMotionComposer.declare(character, 'page', [ known ]);
      CharacterMotionComposer.declare(character, 'mystery:1', [ stranger ]);

      // Act
      const composition = CharacterMotionComposer.compose(character);

      // Assert
      const claimant = composition.claimantFor(MotionChannels.SCALE_X);
      expect(claimant.declaration()
        .sourceKey()).toBe('page');
    });
  });

  describe('timed declarations', () =>
  {
    it('keeps running while its time has not yet elapsed', () =>
    {
      // Arrange
      const declaration = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      CharacterMotionComposer.declare(character, 'command', [ declaration ], 30);

      // Act
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('withdraws itself once its time is up', () =>
    {
      // Arrange
      const declaration = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      CharacterMotionComposer.declare(character, 'command', [ declaration ], 10);

      // Act
      composeFor(character, 11);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('runs indefinitely when no time was given', () =>
    {
      // Arrange
      const declaration = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      CharacterMotionComposer.declare(character, 'command', [ declaration ]);

      // Act
      composeFor(character, 500);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('restarts the clock when the same timed motion is applied again', () =>
    {
      // Arrange
      const declaration = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      CharacterMotionComposer.declare(character, 'command', [ declaration ], 10);
      composeFor(character, 8);

      // Act
      const identical = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      CharacterMotionComposer.declare(character, 'command', [ identical ], 10);
      composeFor(character, 8);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('leaves an untimed source alone while a timed one expires beside it', () =>
    {
      // Arrange
      const timed = aDeclaration('sway', [ 8, 100, 'sync' ], 'command');
      const ambient = aDeclaration('float', [ 20, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ ambient ]);
      CharacterMotionComposer.declare(character, 'command', [ timed ], 10);

      // Act
      // frame 25 is where a surviving sway would read its full 8, so the zero below cannot be
      // confused with the sway merely passing through the middle of its own cycle.
      const composition = composeFor(character, 25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });
  });

  describe('removeDeclarationKind', () =>
  {
    it('withdraws every source of the named kind at once', () =>
    {
      // Arrange- two states, because withdrawing "the state one" would look identical to
      // withdrawing "every state" if there were only one to withdraw.
      CharacterMotionComposer.declare(character, 'state:7', [ aDeclaration('breathe', [], 'state:7') ]);
      CharacterMotionComposer.declare(character, 'state:41', [ aDeclaration('float', [], 'state:41') ]);

      // Act
      CharacterMotionComposer.removeDeclarationKind(character, 'state');
      composeFor(character, 1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('leaves every other kind of source alone', () =>
    {
      // Arrange- the page declaration is the near-miss that has to survive.
      CharacterMotionComposer.declare(character, 'state:7', [ aDeclaration('breathe', [], 'state:7') ]);
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('float', [ 12, 100, 'sync' ], 'page') ]);

      // Act
      CharacterMotionComposer.removeDeclarationKind(character, 'state');
      const composition = composeFor(character, 25);

      // Assert- still floating, and no longer breathing.
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).not.toBe(0);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
    });

    it('is harmless on a character with nothing of that kind declared', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('breathe', [], 'page') ]);

      // Act
      CharacterMotionComposer.removeDeclarationKind(character, 'state');

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });
  });

  describe('re-declaring over a motion that is still winding down', () =>
  {
    it('resumes a transition rather than stacking a second one on the same channel', () =>
    {
      // Arrange- a scale transition parks a channel somewhere visible, so it outlives its own
      // withdrawal in order to travel home. Half way through that journey, the same source asks
      // for exactly what it asked for before.
      const scaleUp = () => [ aDeclaration('scale', [ 200, 30 ], 'state:7') ];
      CharacterMotionComposer.declare(character, 'state:7', scaleUp());
      composeFor(character, 30);
      CharacterMotionComposer.removeDeclarations(character, 'state:7');
      composeFor(character, 10);

      // Act
      CharacterMotionComposer.declare(character, 'state:7', scaleUp());
      const composition = composeFor(character, 1);

      // Assert- one effect holding the target. Two would multiply into roughly 3.4 here.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(2, 10);
    });

    it('discards a transition that was winding down when the source asks for something else', () =>
    {
      // Arrange- same journey home, but the source has changed its mind on the way.
      CharacterMotionComposer.declare(character, 'state:7', [ aDeclaration('scale', [ 200, 30 ], 'state:7') ]);
      composeFor(character, 30);
      CharacterMotionComposer.removeDeclarations(character, 'state:7');
      composeFor(character, 10);

      // Act
      CharacterMotionComposer.declare(character, 'state:7', [ aDeclaration('scale', [ 150, 30 ], 'state:7') ]);
      const midFlight = composeFor(character, 5)
        .valueFor(MotionChannels.SCALE_X);
      const settled = composeFor(character, 25)
        .valueFor(MotionChannels.SCALE_X);

      // Assert- the mid-flight frame is the one that matters. Both effects would still be alive
      // there, and scale multiplies, so a surviving release would report about 1.441 instead of
      // 1.153. By the time it settles the old one has finished releasing either way, which is why
      // the final value alone proves nothing.
      expect(midFlight).toBeCloseTo(1.15278, 4);
      expect(settled).toBeCloseTo(1.5, 10);
    });

    it('rebuilds when the source comes back asking for more than it had', () =>
    {
      // Arrange- one transition winding down, and a return that wants two motions. Resuming the
      // one that matches and building the other would leave the source holding a set it never
      // asked for, so the whole request is built fresh instead.
      CharacterMotionComposer.declare(character, 'state:7', [ aDeclaration('scale', [ 200, 30 ], 'state:7') ]);
      composeFor(character, 30);
      CharacterMotionComposer.removeDeclarations(character, 'state:7');
      composeFor(character, 10);

      // Act
      CharacterMotionComposer.declare(character, 'state:7', [
        aDeclaration('scale', [ 200, 30 ], 'state:7'),
        aDeclaration('sway', [ 8, 100, 'sync' ], 'state:7'),
      ]);
      const composition = composeFor(character, 30);

      // Assert- exactly one scale reaching its target rather than two multiplying into 4, plus the
      // sway that came with it, mid-cycle and therefore unmistakably running.
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(2, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(7.60845, 4);
    });

    it('rebuilds a motion that stops the instant it is withdrawn, so a repeat replays', () =>
    {
      // Arrange- a breathe does not outlive its declaration, so there is nothing to resume and a
      // fresh one has to start from the top. This is the case that separates "going" from "gone".
      const breathe = () => [ aDeclaration('breathe', [ 0.5, 100, 'sync' ], 'combat:reaction') ];
      CharacterMotionComposer.declare(character, 'combat:reaction', breathe());
      const partway = composeFor(character, 25)
        .valueFor(MotionChannels.SCALE_X);

      // Act
      CharacterMotionComposer.removeDeclarations(character, 'combat:reaction');
      CharacterMotionComposer.declare(character, 'combat:reaction', breathe());
      const restarted = composeFor(character, 1)
        .valueFor(MotionChannels.SCALE_X);

      // Assert- back near the start of the cycle rather than continuing from a quarter through.
      expect(partway).toBeCloseTo(0.5, 10);
      expect(restarted).toBeCloseTo(0.96861, 4);
    });
  });

  describe('forget', () =>
  {
    it('discards everything known about a character', () =>
    {
      // Arrange
      CharacterMotionComposer.declare(character, 'page', [ aDeclaration('breathe', [], 'page') ]);

      // Act
      CharacterMotionComposer.forget(character);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });
});
//endregion plugins/motion/core/managers/character-motion-composer.test.js