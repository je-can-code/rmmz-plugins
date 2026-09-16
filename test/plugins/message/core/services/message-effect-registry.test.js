//region plugins/message/core/services/message-effect-registry.test.js
import { afterEach, describe, expect, it } from 'vitest';

import MessageEffectRegistry
  from '../../../../../src/plugins/message/core/services/MessageEffectRegistry.js';
import MessageGlyphModulation
  from '../../../../../src/plugins/message/core/__models/MessageGlyphModulation.js';

/**
 * These functions run once per visible glyph per frame, and every expectation below is a value read
 * off the implementation and pinned rather than re-derived from its constants - an expectation
 * computed the same way the code computes it agrees with the code by construction, including when
 * both are wrong.
 *
 * The jitter cases carry more weight than they look. Its whole job is to appear random while being
 * perfectly reproducible, and the two ways that goes wrong are invisible in a single sample: the
 * axes agreeing with each other (which slides a glyph along a diagonal instead of shaking it), and
 * neighbouring glyphs agreeing with each other (which makes a whole line tremble in unison). Both
 * need two samples compared, so both are tested that way.
 */
describe('J-Message MessageEffectRegistry (direct src import)', () =>
{
  afterEach(() =>
  {
    // register() mutates a static map that outlives the test file; anything added has to go.
    MessageEffectRegistry.unregister('testEffect');
  });

  it('reports a built-in effect as registered', () =>
  {
    // Arrange & Act
    const registered = MessageEffectRegistry.isRegistered('wave');

    // Assert
    expect(registered).toBe(true);
  });

  it('reports an unknown name as not registered', () =>
  {
    // Arrange & Act
    const registered = MessageEffectRegistry.isRegistered('definitelyNotAnEffect');

    // Assert
    expect(registered).toBe(false);
  });

  it('accepts a newly registered effect and applies it', () =>
  {
    // Arrange
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(11, 13, 0x123456));

    // Act
    const modulation = MessageEffectRegistry.modulate([ 'testEffect' ], 0, 0);

    // Assert
    expect(modulation.offsetX).toBe(11);
    expect(modulation.offsetY).toBe(13);
    expect(modulation.tint).toBe(0x123456);
  });

  it('hands a registered effect the glyph index and frame it was asked about', () =>
  {
    // Arrange
    const seen = [];
    MessageEffectRegistry.register('testEffect', (glyphIndex, frame) =>
    {
      seen.push([ glyphIndex, frame ]);
      return MessageGlyphModulation.none();
    });

    // Act
    MessageEffectRegistry.modulate([ 'testEffect' ], 7, 22);

    // Assert
    expect(seen).toEqual([ [ 7, 22 ] ]);
  });

  it('skips a name nothing is registered under rather than failing the whole message', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.modulate([ 'notInstalledPluginEffect' ], 3, 9);

    // Assert
    expect(modulation.offsetX).toBe(0);
    expect(modulation.offsetY).toBe(0);
    expect(modulation.tint).toBeNull();
  });

  it('still applies the effects it knows when one name is unknown', () =>
  {
    // Arrange
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(5, 0, null));

    // Act
    const modulation = MessageEffectRegistry.modulate([ 'notInstalled', 'testEffect' ], 0, 0);

    // Assert
    expect(modulation.offsetX).toBe(5);
  });

  it('combines two effects acting on the same glyph', () =>
  {
    // Arrange
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(0, 0, 0xabcdef));

    // Act
    // rainbow has a colour opinion and is resolved first, so the later effect's opinion wins.
    const modulation = MessageEffectRegistry.modulate([ 'rainbow', 'testEffect' ], 0, 0);

    // Assert
    expect(modulation.tint).toBe(0xabcdef);
  });

  it('carries a waving glyph to the far end of its travel a quarter-cycle in', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.wave(0, 10);

    // Assert
    // ten frames is a quarter of the forty-frame period, which is the crest.
    expect(modulation.offsetY).toBe(-4);
    expect(modulation.offsetX).toBe(0);
  });

  it('gives neighbouring glyphs different wave phases so a word rolls', () =>
  {
    // Arrange & Act
    const firstGlyph = MessageEffectRegistry.wave(0, 0);
    const secondGlyph = MessageEffectRegistry.wave(1, 0);

    // Assert
    expect(secondGlyph.offsetY).toBeCloseTo(-2.258569, 5);
    expect(firstGlyph.offsetY).not.toBe(secondGlyph.offsetY);
  });

  it('moves a waving glyph as the frames advance', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.wave(3, 17);

    // Assert
    expect(modulation.offsetY).toBeCloseTo(3.883408, 5);
  });

  it('never tints a waving glyph', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.wave(4, 13);

    // Assert
    expect(modulation.tint).toBeNull();
  });

  it('throws a jittering glyph off rest without pinning it to the extreme of its travel', () =>
  {
    // Arrange & Act
    // the very first glyph on the very first frame is the degenerate case: both hash inputs are
    // at their minimum, and an unsalted hash would put this glyph hard against its limit of -2.
    const modulation = MessageEffectRegistry.jitter(0, 0);

    // Assert
    expect(modulation.offsetX).toBeCloseTo(-1.848, 5);
    expect(modulation.offsetY).toBeCloseTo(-0.856, 5);
  });

  it('displaces the two axes of a jittering glyph independently', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.jitter(2, 7);

    // Assert
    expect(modulation.offsetX).toBeCloseTo(1.3, 5);
    expect(modulation.offsetY).toBeCloseTo(-0.496, 5);
    expect(modulation.offsetX).not.toBeCloseTo(modulation.offsetY, 5);
  });

  it('gives neighbouring glyphs different jitter so a line does not shake as one', () =>
  {
    // Arrange & Act
    const firstGlyph = MessageEffectRegistry.jitter(0, 0);
    const secondGlyph = MessageEffectRegistry.jitter(1, 0);

    // Assert
    expect(firstGlyph.offsetX).not.toBeCloseTo(secondGlyph.offsetX, 5);
    expect(firstGlyph.offsetY).not.toBeCloseTo(secondGlyph.offsetY, 5);
  });

  it('holds a jittering glyph still for the frames within one step', () =>
  {
    // Arrange & Act
    const atRest = MessageEffectRegistry.jitter(2, 0);
    const oneFrameLater = MessageEffectRegistry.jitter(2, 1);
    const twoFramesLater = MessageEffectRegistry.jitter(2, 2);

    // Assert
    expect(oneFrameLater.offsetX).toBe(atRest.offsetX);
    expect(twoFramesLater.offsetX).toBe(atRest.offsetX);
    expect(twoFramesLater.offsetY).toBe(atRest.offsetY);
  });

  it('moves a jittering glyph once the hold expires', () =>
  {
    // Arrange & Act
    const atRest = MessageEffectRegistry.jitter(2, 0);
    const afterHold = MessageEffectRegistry.jitter(2, 3);

    // Assert
    expect(afterHold.offsetX).not.toBe(atRest.offsetX);
  });

  it('never tints a jittering glyph', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.jitter(1, 4);

    // Assert
    expect(modulation.tint).toBeNull();
  });

  it('leaves a pulsing glyph at its drawn size at rest', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.pulse(0, 0);

    // Assert
    expect(modulation.scale).toBe(1);
  });

  it('swells a pulsing glyph to its peak a quarter-cycle in', () =>
  {
    // Arrange & Act
    // thirteen frames is a quarter of the fifty-two frame period.
    const modulation = MessageEffectRegistry.pulse(0, 13);

    // Assert
    expect(modulation.scale).toBeCloseTo(1.18, 5);
  });

  it('shrinks a pulsing glyph below its drawn size at the trough', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.pulse(0, 39);

    // Assert
    // a pulse that only ever grew would read as a glyph that had simply been set larger.
    expect(modulation.scale).toBeCloseTo(0.82, 5);
  });

  it('gives neighbouring glyphs different pulse phases', () =>
  {
    // Arrange & Act
    const firstGlyph = MessageEffectRegistry.pulse(0, 0);
    const secondGlyph = MessageEffectRegistry.pulse(1, 0);

    // Assert
    expect(secondGlyph.scale).toBeCloseTo(1.061722, 5);
    expect(firstGlyph.scale).not.toBe(secondGlyph.scale);
  });

  it('neither displaces nor tints a pulsing glyph', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.pulse(3, 7);

    // Assert
    expect(modulation.offsetX).toBe(0);
    expect(modulation.offsetY).toBe(0);
    expect(modulation.tint).toBeNull();
  });

  it('never resizes a waving glyph', () =>
  {
    // Arrange & Act
    // the three older effects predate scale and must leave it exactly alone.
    const modulation = MessageEffectRegistry.wave(2, 9);

    // Assert
    expect(modulation.scale).toBe(1);
  });

  it('starts a rainbow glyph at the top of the wheel', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.rainbow(0, 0);

    // Assert
    expect(modulation.tint).toBe(0xff0000);
  });

  it('advances a rainbow glyph around the wheel as frames pass', () =>
  {
    // Arrange & Act
    // fifteen frames at four degrees each is sixty degrees, which is yellow.
    const modulation = MessageEffectRegistry.rainbow(0, 15);

    // Assert
    expect(modulation.tint).toBe(0xffff00);
  });

  it('offsets neighbouring rainbow glyphs so a word reads as a gradient', () =>
  {
    // Arrange & Act
    const firstGlyph = MessageEffectRegistry.rainbow(0, 0);
    const secondGlyph = MessageEffectRegistry.rainbow(1, 0);

    // Assert
    expect(secondGlyph.tint).toBe(0xff4d00);
    expect(firstGlyph.tint).not.toBe(secondGlyph.tint);
  });

  it('never displaces a rainbow glyph', () =>
  {
    // Arrange & Act
    const modulation = MessageEffectRegistry.rainbow(4, 10);

    // Assert
    expect(modulation.offsetX).toBe(0);
    expect(modulation.offsetY).toBe(0);
  });

  it('forgets an effect it is told to unregister', () =>
  {
    // Arrange
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(1, 1, null));

    // Act
    MessageEffectRegistry.unregister('testEffect');

    // Assert
    expect(MessageEffectRegistry.isRegistered('testEffect')).toBe(false);
  });

  it('reports how far up and down a waving glyph travels', () =>
  {
    // Arrange & Act
    const excursion = MessageEffectRegistry.excursionOf([ 'wave' ]);

    // Assert
    expect(excursion.offsetY).toBe(4);
    expect(excursion.offsetX).toBe(0);
    expect(excursion.scale).toBe(1);
  });

  it('reports a jittering glyph as reaching equally far on both axes', () =>
  {
    // Arrange & Act
    const excursion = MessageEffectRegistry.excursionOf([ 'jitter' ]);

    // Assert
    expect(excursion.offsetX).toBe(2);
    expect(excursion.offsetY).toBe(2);
  });

  it('reports a pulsing glyph as swelling rather than moving', () =>
  {
    // Arrange & Act
    const excursion = MessageEffectRegistry.excursionOf([ 'pulse' ]);

    // Assert
    expect(excursion.scale).toBe(1.18);
    expect(excursion.offsetX).toBe(0);
    expect(excursion.offsetY).toBe(0);
  });

  it('reports a rainbow glyph as needing no room at all', () =>
  {
    // Arrange & Act
    // it only ever changes colour, and a colour occupies no pixels.
    const excursion = MessageEffectRegistry.excursionOf([ 'rainbow' ]);

    // Assert
    expect(excursion.offsetX).toBe(0);
    expect(excursion.offsetY).toBe(0);
    expect(excursion.scale).toBe(1);
  });

  it('sums the reach of two effects acting on the same glyph', () =>
  {
    // Arrange & Act
    // a glyph that waves and trembles gets all the way out to both at once, which is the case a
    // container has to be big enough for.
    const excursion = MessageEffectRegistry.excursionOf([ 'wave', 'jitter' ]);

    // Assert
    expect(excursion.offsetY).toBe(6);
    expect(excursion.offsetX).toBe(2);
  });

  it('reports a glyph carrying no effects as needing no room', () =>
  {
    // Arrange & Act
    const excursion = MessageEffectRegistry.excursionOf([]);

    // Assert
    expect(excursion.offsetX).toBe(0);
    expect(excursion.offsetY).toBe(0);
    expect(excursion.scale).toBe(1);
  });

  it('skips an uninstalled effect when reserving room rather than failing', () =>
  {
    // Arrange & Act
    // the same reasoning as skipping it during modulation: the name came from a config file or a
    // text code, and the plugin that answers to it may simply not be installed.
    const excursion = MessageEffectRegistry.excursionOf([ 'wave', 'definitelyNotAnEffect' ]);

    // Assert
    expect(excursion.offsetY).toBe(4);
  });

  it('reserves room for a newly registered effect that declares its reach', () =>
  {
    // Arrange
    const declaredReach = new MessageGlyphModulation(7, 9, null, 1.5);

    // Act
    MessageEffectRegistry.register('testEffect', () => MessageGlyphModulation.none(), declaredReach);
    const excursion = MessageEffectRegistry.excursionOf([ 'testEffect' ]);

    // Assert
    expect(excursion.offsetX).toBe(7);
    expect(excursion.offsetY).toBe(9);
    expect(excursion.scale).toBe(1.5);
  });

  it('treats an effect that declares no reach as one that never moves', () =>
  {
    // Arrange & Act
    // the safe default: an effect that does move and forgot to say so is drawn correctly and
    // measured as though it were still, which is the author's bug to find rather than a crash.
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(50, 50, null));
    const excursion = MessageEffectRegistry.excursionOf([ 'testEffect' ]);

    // Assert
    expect(excursion.offsetX).toBe(0);
    expect(excursion.offsetY).toBe(0);
    expect(excursion.scale).toBe(1);
  });

  it('still applies a newly registered effect that declares a reach', () =>
  {
    // Arrange
    const declaredReach = new MessageGlyphModulation(7, 9, null, 1.5);

    // Act
    MessageEffectRegistry.register('testEffect', () => new MessageGlyphModulation(3, 4, null), declaredReach);
    const modulation = MessageEffectRegistry.modulate([ 'testEffect' ], 0, 0);

    // Assert- declaring a reach must not cost the effect its actual behaviour.
    expect(modulation.offsetX).toBe(3);
    expect(modulation.offsetY).toBe(4);
  });
});
//endregion plugins/message/core/services/message-effect-registry.test.js