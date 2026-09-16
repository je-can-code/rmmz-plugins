//region MessageEffectRegistry
import MessageGlyphModulation from '../__models/MessageGlyphModulation.js';
import MessageNoise from './MessageNoise.js';
import MessageTintResolver from './MessageTintResolver.js';

/**
 * Every motion a message glyph is capable of, by name, and the seam for adding more.
 *
 * The pipeline that emits glyphs deliberately knows nothing about what "wave" means - it tags a
 * glyph with a set of names and moves on. All the meaning is here, behind a lookup, which is what
 * lets a later plugin teach messages a new trick by registering a function instead of editing a
 * switch statement inside a window. J-Message owns three; an extension that wants `\GLOW` never
 * has to touch this file's body.
 *
 * An effect is a pure function of `(glyphIndex, frame)` returning a {@link MessageGlyphModulation}.
 * Both arguments matter and neither is optional: `frame` is what makes it move at all, and
 * `glyphIndex` is what keeps a word from moving as one rigid block - a wave whose every letter
 * shared a phase would be a bobbing rectangle rather than a wave.
 *
 * **Effects must be deterministic.** Not a stylistic preference: the renderer may be asked for the
 * same glyph on the same frame more than once, and anything reaching for `Math.random` would
 * shimmer rather than tremble. Jitter below is random-*looking* and entirely reproducible, which is
 * also the only reason it can be tested at all.
 */
class MessageEffectRegistry
{
  /**
   * How far a waving glyph travels from its resting line, in logical pixels.
   * @type {number}
   */
  static WaveAmplitude = 4;

  /**
   * How many frames one full wave cycle takes.
   *
   * Forty is a touch over half a second, which reads as a lazy swell rather than a vibration.
   * @type {number}
   */
  static WavePeriod = 40;

  /**
   * How far the wave's phase advances per glyph, in radians.
   *
   * Small enough that neighbouring letters stay visibly connected, large enough that a short word
   * still shows a crest and a trough rather than rising as a unit.
   * @type {number}
   */
  static WavePhasePerGlyph = 0.6;

  /**
   * How far a jittering glyph can be thrown from rest on either axis, in logical pixels.
   *
   * Deliberately small. The effect is meant to read as an unsteady hand, and anything past a couple
   * of pixels stops looking nervous and starts looking broken.
   * @type {number}
   */
  static JitterRadius = 2;

  /**
   * How many frames a jittering glyph holds each position before picking the next.
   *
   * At every frame the motion is too fast to resolve and reads as a blur; holding for three gives
   * the eye something to catch, which is what makes it look like trembling.
   * @type {number}
   */
  static JitterHold = 3;

  /**
   * How far the cycled hue advances per frame, in degrees.
   *
   * Four degrees is a full turn in ninety frames - a second and a half, slow enough to read the
   * word underneath while it happens.
   * @type {number}
   */
  static RainbowDegreesPerFrame = 4;

  /**
   * How far the cycled hue advances per glyph, in degrees.
   *
   * Eighteen spreads a full turn across twenty characters, so a word of ordinary length shows a
   * gradient rather than flashing as one solid colour.
   * @type {number}
   */
  static RainbowDegreesPerGlyph = 18;

  /**
   * How far a pulsing glyph swells past its drawn size, as a fraction.
   *
   * Deliberately small. A glyph is drawn at the size the line was measured with, and the cursor
   * does not move to accommodate a swell - so anything much larger than this starts overlapping the
   * letters on either side rather than reading as emphasis.
   * @type {number}
   */
  static PulseAmplitude = 0.18;

  /**
   * How many frames one full swell and settle takes.
   *
   * Slower than the wave, because size reads as breathing where position reads as motion, and a
   * fast breath is a twitch.
   * @type {number}
   */
  static PulsePeriod = 52;

  /**
   * How far the pulse's phase advances per glyph, in radians.
   *
   * Smaller than the wave's, so a pulsing word swells closer to as one thing - the effect is meant
   * to read as a single emphasised phrase rather than as a travelling ripple.
   * @type {number}
   */
  static PulsePhasePerGlyph = 0.35;

  /**
   * A large odd multiplier used to smear the glyph index across the hash space.
   * @type {number}
   */
  static JitterIndexSalt = 73856093;

  /**
   * A second large odd multiplier, coprime with the first, used for the time input.
   * @type {number}
   */
  static JitterTimeSalt = 19349663;

  /**
   * The constant distinguishing the horizontal axis from the vertical within the hash.
   *
   * Two axes asking the same hash the same question would get the same answer, and a glyph whose
   * horizontal and vertical displacement were always equal would not tremble - it would slide back
   * and forth along a diagonal. Salting them apart is what makes the motion two-dimensional.
   * @type {number}
   */
  static JitterHorizontalSalt = 0x9e3779b9;

  /**
   * The constant distinguishing the vertical axis from the horizontal within the hash.
   * @type {number}
   */
  static JitterVerticalSalt = 0x85ebca6b;

  /**
   * Every registered effect, by the name a glyph carries.
   *
   * Each entry pairs what the effect *does* on a given frame with how far it is ever willing to go.
   * The second half exists because something eventually has to draw a container around moving text -
   * a bubble, a panel, a frame - and sizing that container from where the glyphs are resting clips
   * them the moment they move. Asking each effect for its own worst case is the only version of that
   * question which keeps working when somebody registers a fifth effect.
   * @type {Map<string, {modulate: function(number, number): MessageGlyphModulation, excursion: MessageGlyphModulation}>}
   */
  static #effects = new Map([
    [ 'wave', {
      modulate: MessageEffectRegistry.wave,
      excursion: new MessageGlyphModulation(0, MessageEffectRegistry.WaveAmplitude, null, 1),
    } ],
    [ 'jitter', {
      modulate: MessageEffectRegistry.jitter,
      excursion: new MessageGlyphModulation(
        MessageEffectRegistry.JitterRadius,
        MessageEffectRegistry.JitterRadius,
        null,
        1),
    } ],
    [ 'rainbow', {
      modulate: MessageEffectRegistry.rainbow,
      excursion: MessageGlyphModulation.none(),
    } ],
    [ 'pulse', {
      modulate: MessageEffectRegistry.pulse,
      excursion: new MessageGlyphModulation(0, 0, null, 1 + MessageEffectRegistry.PulseAmplitude),
    } ],
  ]);

  /**
   * Teaches the pipeline a new effect.
   *
   * The extension seam. A plugin loading after J-Message registers its name here and adds the text
   * code that toggles it; nothing in core needs to learn the name.
   *
   * The excursion is optional and defaults to "this effect never moves the glyph", which is both the
   * safe answer for a purely colour-based effect and the honest answer for an author who has not
   * thought about it. An effect that does move and does not say so will be drawn correctly and
   * *measured* as though it were still, so anything sizing a container around it will clip it.
   * @param {string} name The name a glyph will carry to request this effect.
   * @param {function(number, number): MessageGlyphModulation} effect The modulation function.
   * @param {MessageGlyphModulation} excursion The furthest this effect ever displaces or swells a
   * glyph, as absolute magnitudes rather than as a displacement to apply.
   */
  static register(name, effect, excursion = MessageGlyphModulation.none())
  {
    MessageEffectRegistry.#effects.set(name, {
      modulate: effect,
      excursion,
    });
  }

  /**
   * Takes an effect back out of the registry.
   *
   * The counterpart to the seam above, and the only honest way to undo a registration: the map is
   * private, so an effect registered over the top of with a placeholder would still answer
   * {@link isRegistered} with true and would still be reached for on every glyph carrying its name.
   * @param {string} name The name to forget.
   */
  static unregister(name)
  {
    MessageEffectRegistry.#effects.delete(name);
  }

  /**
   * Whether a name has an effect behind it.
   * @param {string} name The effect name.
   * @returns {boolean}
   */
  static isRegistered(name)
  {
    return MessageEffectRegistry.#effects.has(name);
  }

  /**
   * Resolves everything acting on one glyph this frame into a single modulation.
   *
   * An unregistered name is skipped rather than throwing. The names come from notetag-adjacent text
   * codes and a speaker's config file, so an effect can legitimately be absent because the plugin
   * that provides it is not installed - the same reason a message may mention a plugin's icon and
   * still need to render.
   * @param {string[]} effectNames The effects the glyph carries.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} frame How many frames the message has been revealing.
   * @returns {MessageGlyphModulation}
   */
  static modulate(effectNames, glyphIndex, frame)
  {
    const modulations = [];

    effectNames.forEach(name =>
    {
      const effect = MessageEffectRegistry.#effects.get(name);

      // a name nothing answers to contributes nothing, which is what keeps an uninstalled
      // extension from taking the message down with it.
      if (effect === undefined) return;

      modulations.push(effect.modulate(glyphIndex, frame));
    });

    return MessageGlyphModulation.compose(modulations);
  }

  /**
   * The furthest everything acting on one glyph can ever throw or swell it.
   *
   * Not a modulation to apply - nothing should ever hand the result of this to a sprite. It is the
   * envelope those modulations live inside, for whoever has to reserve room for them: the offsets
   * are magnitudes in both directions rather than a signed displacement, and the scale is the
   * largest the glyph ever gets rather than the size it is right now.
   *
   * Composed the same way a frame's modulations are, and for the same reasons - offsets sum because
   * a glyph that waves *and* trembles reaches the sum of the two, and scales multiply because they
   * are ratios. Tint is meaningless here and is left wherever composition puts it.
   * @param {string[]} effectNames The effects the glyph carries.
   * @returns {MessageGlyphModulation}
   */
  static excursionOf(effectNames)
  {
    const excursions = [];

    effectNames.forEach(name =>
    {
      const effect = MessageEffectRegistry.#effects.get(name);

      // an effect nobody has installed reserves no room, exactly as it contributes no motion.
      if (effect === undefined) return;

      excursions.push(effect.excursion);
    });

    return MessageGlyphModulation.compose(excursions);
  }

  /**
   * Rides the glyph up and down on a sine, offset per glyph so the word rolls.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} frame How many frames the message has been revealing.
   * @returns {MessageGlyphModulation}
   */
  static wave(glyphIndex, frame)
  {
    const cycles = frame / MessageEffectRegistry.WavePeriod;
    const phase = (cycles * Math.PI * 2) + (glyphIndex * MessageEffectRegistry.WavePhasePerGlyph);

    // negative because screen space grows downward and a wave should crest upward first.
    const offsetY = -MessageEffectRegistry.WaveAmplitude * Math.sin(phase);

    return new MessageGlyphModulation(0, offsetY, null);
  }

  /**
   * Throws the glyph a pixel or two off rest, holding each position briefly.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} frame How many frames the message has been revealing.
   * @returns {MessageGlyphModulation}
   */
  static jitter(glyphIndex, frame)
  {
    // the held step rather than the raw frame, so the glyph settles briefly instead of blurring.
    const step = Math.floor(frame / MessageEffectRegistry.JitterHold);

    const horizontal = MessageEffectRegistry.jitterAxis(
      glyphIndex,
      step,
      MessageEffectRegistry.JitterHorizontalSalt);
    const vertical = MessageEffectRegistry.jitterAxis(
      glyphIndex,
      step,
      MessageEffectRegistry.JitterVerticalSalt);

    return new MessageGlyphModulation(horizontal, vertical, null);
  }

  /**
   * One axis of jitter: a reproducible pseudo-random displacement within the radius.
   *
   * Both inputs are offset by one before they are multiplied, because the very first glyph of a
   * message on its very first step would otherwise multiply two zeroes, hash to zero, and land at
   * the exact extreme of its travel - so every trembling line in the game would begin with its
   * first letter thrown hard to one corner, identically, forever.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} step Which held interval this is.
   * @param {number} axisSalt The constant distinguishing this axis from the other.
   * @returns {number}
   */
  static jitterAxis(glyphIndex, step, axisSalt)
  {
    const indexTerm = (glyphIndex + 1) * MessageEffectRegistry.JitterIndexSalt;
    const timeTerm = (step + 1) * MessageEffectRegistry.JitterTimeSalt;
    const swing = MessageNoise.signedUnit(indexTerm ^ timeTerm ^ axisSalt);

    return swing * MessageEffectRegistry.JitterRadius;
  }

  /**
   * Swells the glyph and lets it settle again, so a phrase breathes.
   *
   * The only round-one effect that changes size rather than position or colour, which means it is
   * also the only one that can overlap its neighbours - the line was measured once, at the drawn
   * size, and nothing re-measures it. That is why the amplitude is small and why the swell is
   * centred rather than growing from a corner.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} frame How many frames the message has been revealing.
   * @returns {MessageGlyphModulation}
   */
  static pulse(glyphIndex, frame)
  {
    const cycles = frame / MessageEffectRegistry.PulsePeriod;
    const phase = (cycles * Math.PI * 2) + (glyphIndex * MessageEffectRegistry.PulsePhasePerGlyph);
    const scale = 1 + (MessageEffectRegistry.PulseAmplitude * Math.sin(phase));

    return new MessageGlyphModulation(0, 0, null, scale);
  }

  /**
   * Cycles the glyph's colour through the wheel, offset per glyph so the word forms a gradient.
   * @param {number} glyphIndex The glyph's position in the message.
   * @param {number} frame How many frames the message has been revealing.
   * @returns {MessageGlyphModulation}
   */
  static rainbow(glyphIndex, frame)
  {
    const timeHue = frame * MessageEffectRegistry.RainbowDegreesPerFrame;
    const glyphHue = glyphIndex * MessageEffectRegistry.RainbowDegreesPerGlyph;
    const tint = MessageTintResolver.fromHue(timeHue + glyphHue);

    return new MessageGlyphModulation(0, 0, tint);
  }
}

export default MessageEffectRegistry;
//endregion MessageEffectRegistry