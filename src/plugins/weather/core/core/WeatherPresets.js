//region WeatherPresets
import WeatherMotion from './WeatherMotion.js';

/**
 * Turns the name of a look into the layers that draw it.
 *
 * An author writes `<weather:rain>` on a map and means something specific and visual; they do not
 * mean "a falling motion pointed at Rain_01A at density 450 and speed 170." Both are true, but only
 * one of them is worth typing, and only one of them survives being retuned later. This class is the
 * seam between the two - the tag names a preset, the preset names its layers, and the numbers live
 * in `data/config.weather.json` where changing them is a data edit rather than a rebuild.
 *
 * **A preset carries its own intensity ladder rather than a single look.** That is not a convenience:
 * it is how the whole system stays honest about identity. The Negative Peaks are snowy at every
 * intensity the sky can produce, so there is no roll that makes them not snowy - only rolls that
 * make the snow lighter or heavier. A preset with three stops cannot express "and sometimes clear,"
 * which is exactly the property wanted.
 *
 * The ladder also mirrors how these looks were authored in the first place. Fog was tuned by hand as
 * three configurations identical but for their density; snow as one layer, then two, then four.
 */
class WeatherPresets
{
  /**
   * The rungs of every preset's intensity ladder.
   *
   * Three rather than a continuous scale, because the sky rolls between discrete conditions and
   * because three is what an author can actually hold in their head while tuning. The transition
   * between them is smoothed at the emitter, so the player never sees a step.
   * @type {{Light: string, Moderate: string, Heavy: string}}
   */
  static Intensities = {
    Light: 'light',
    Moderate: 'moderate',
    Heavy: 'heavy',
  };

  /**
   * How a layer's authored `speed` and `scale` are read.
   *
   * Both are percentages, because that is the unit they were authored in and the unit an author
   * thinks in - "half as fast", "four times the size". A layer that says nothing about either gets
   * the motion exactly as configured.
   * @type {number}
   */
  static PercentBase = 100;

  /**
   * A fully opaque particle, in the units the renderer draws with.
   * @type {number}
   */
  static FullOpacity = 255;

  /**
   * The tint that leaves a picture exactly as it was painted.
   * @type {number}
   */
  static NoTint = 0xffffff;

  /**
   * The layers that draw a named look at a given intensity.
   *
   * An unknown preset is a content error rather than a contract violation - an author mistyped a tag
   * that the regex was perfectly happy to match - so it is reported and answered with an empty set.
   * The map simply has no ambience, which is a visible and diagnosable outcome rather than a crash
   * during someone's playthrough.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {string} presetName The look being asked for, ex: `rain`.
   * @param {string} intensity One of {@link WeatherPresets.Intensities}.
   * @returns {object[]} Emitter-ready layers, or an empty array.
   */
  static layersFor(config, presetName, intensity)
  {
    const preset = config.presets[presetName];

    if (preset === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no weather preset named: [ ${presetName} ]!`, {
        known: Object.keys(config.presets),
      });

      return [];
    }

    const stop = preset.stops[intensity];

    if (stop === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `preset [ ${presetName} ] has no intensity: [ ${intensity} ]!`, {
        known: Object.keys(preset.stops),
      });

      return [];
    }

    return stop.map(layer => WeatherPresets.resolveLayer(config, layer));
  }

  /**
   * Folds one authored layer together with the motion it names.
   *
   * The motion supplies the shape of the movement and the layer supplies how much of it, which is
   * what keeps a motion reusable: `float` is the same wandering drift whether it is carrying motes of
   * spirit-light through a passage or snow down a mountain, and the two differ by numbers rather than
   * by code.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {object} layer One authored layer of a preset stop.
   * @returns {object} A layer the emitter can build particles from.
   */
  static resolveLayer(config, layer)
  {
    const resolved = WeatherPresets.resolveStage(config, layer);

    // exactly one stage is added, here and nowhere else. The stage resolver never asks for a
    // successor of its own, so a motion that names itself - or two that name each other - is a
    // finite thing rather than a stack overflow at config-load time.
    resolved.becomes = WeatherPresets.successorFor(config, layer);

    return resolved;
  }

  /**
   * Folds one authored layer together with its motion, without following it anywhere.
   *
   * Split out from {@link WeatherPresets.resolveLayer} so that resolving a successor cannot
   * resolve a successor, which is the whole of the cycle protection.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {object} layer One authored layer, or one authored stage of one.
   * @returns {object} A layer the emitter can build particles from, with no successor attached.
   */
  static resolveStage(config, layer)
  {
    const motion = config.motions[layer.motion];

    if (motion === undefined)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `no weather motion named: [ ${layer.motion} ]!`, {
        known: Object.keys(config.motions),
      });

      return WeatherPresets.inertLayer(layer);
    }

    const rate = layer.speed / WeatherPresets.PercentBase;

    return {
      edge: motion.edge,
      speedX: motion.speedX * rate,
      speedY: motion.speedY * rate,
      jitterX: motion.jitterX * rate,
      jitterY: motion.jitterY * rate,
      roll: motion.roll,
      growth: motion.growth,
      fadeIn: motion.fadeIn,
      staggerFrames: motion.staggerFrames,
      margin: motion.margin,
      entryDepth: motion.entryDepth,

      // how far a particle strays is a distance and stays one, but how fast it works through the
      // wander rides the layer's speed - otherwise the same motion run faster weaves through a
      // longer stretch of screen per cycle, and the shape of the wander changes with the speed.
      sway: motion.sway,
      swayRate: WeatherMotion.swayRateOf(motion) * rate,

      // a lifetime is a duration and stays one - a layer running faster covers more ground in the
      // same seconds, which is the point, rather than living proportionally less long.
      life: motion.life,
      lifeJitter: motion.lifeJitter,
      fadeOut: motion.fadeOut,

      // how much a picture is allowed to vary from itself, which is a property of the picture
      // rather than of how fast the layer runs.
      tilt: motion.tilt,
      stretch: motion.stretch,
      lean: motion.lean,
      flip: motion.flip,
      pulse: motion.pulse,
      pulseRate: WeatherMotion.pulseRateOf(motion) * rate,

      scale: layer.scale / WeatherPresets.PercentBase,
      scaleJitter: WeatherPresets.jitterOf(layer) / WeatherPresets.PercentBase,

      // authored as a percentage like the other layer knobs, and stored as the 0-255 the renderer
      // actually wants, so nothing downstream has to remember which of the two it is holding.
      peakOpacity: WeatherPresets.opacityOf(layer),
      tint: WeatherPresets.tintOf(layer),

      asset: layer.asset,
      density: layer.density,
      blend: layer.blend,

      // what these turn into at the end of their lives, filled in by the caller. Nothing, as far as
      // this method is concerned - it resolves one stage and stops.
      becomes: null,
    };
  }

  /**
   * Resolves what a layer's particles turn into at the end of their lives.
   *
   * **One stage deep, deliberately.** A successor's own successor is ignored, which makes a cycle
   * impossible to author by accident and keeps the resolved layer a finite thing rather than a
   * chain somebody has to follow. Two stages is a raindrop and its splash, or a shooting star and
   * the spark it leaves; nothing worth drawing has needed a third.
   *
   * A stage inherits the layer's own speed and blend, because it is the same effect continuing -
   * only its picture, its size and its motion change.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {object} layer One authored layer of a preset stop.
   * @returns {?object} The successor as a resolved layer, or null when there is none.
   */
  static successorFor(config, layer)
  {
    const motion = config.motions[layer.motion];

    // an unknown motion has already been reported by the caller; it certainly has no successor.
    if (motion === undefined) return null;

    if (motion.becomes === undefined) return null;

    const staged = {
      motion: motion.becomes,
      asset: layer.becomesAsset,
      density: layer.density,
      speed: layer.speed,
      scale: WeatherPresets.stageScaleOf(layer),
      scaleJitter: layer.becomesScaleJitter,
      opacity: layer.becomesOpacity,
      tint: layer.becomesTint,
      blend: layer.blend,
    };

    return WeatherPresets.resolveStage(config, staged);
  }

  /**
   * How big a layer's successor draws, as a percentage.
   *
   * Falls back to the layer's own size rather than to a hundred, because a stage that said nothing
   * about its size most likely meant "the same as the thing it came from".
   * @param {object} layer One authored layer of a preset stop.
   * @returns {number}
   */
  static stageScaleOf(layer)
  {
    if (layer.becomesScale === undefined) return layer.scale;

    return layer.becomesScale;
  }

  /**
   * How much a layer's particles vary in size, as a percentage.
   *
   * A layer that says nothing gets none, which suits anything whose picture is already the size it
   * should be. Anything drawn as a *field* rather than as objects wants some: a hundred identical
   * clouds read as a repeated sprite no matter how they are arranged, and the eye finds the
   * repetition faster than it finds the fog.
   * @param {object} layer One authored layer of a preset stop.
   * @returns {number}
   */
  static jitterOf(layer)
  {
    if (layer.scaleJitter === undefined) return 0;

    return layer.scaleJitter;
  }

  /**
   * The colour a layer multiplies its picture by, as the renderer own packed integer.
   *
   * Untinted by default, which draws the asset exactly as it was painted. It matters because an
   * asset carries one colour and a preset may need several - the same light shaft is warm at noon
   * and cold under a moon, and repainting it twice is two files to keep in step rather than one
   * number in a config.
   *
   * Authored as a CSS-style hex string, because that is what an artist has in their clipboard.
   * @param {object} layer One authored layer of a preset stop.
   * @returns {number}
   */
  static tintOf(layer)
  {
    if (layer.tint === undefined) return WeatherPresets.NoTint;

    const digits = layer.tint.replace('#', '');

    return parseInt(digits, 16);
  }

  /**
   * How strongly a layer draws at its fullest, as an opacity out of 255.
   *
   * Authored as a percentage because that is how the rest of a layer is authored, and because
   * "this layer draws at thirty percent" is a sentence somebody tuning a config can hold in their
   * head where "at seventy-six" is not. A layer that says nothing draws at full strength.
   * @param {object} layer One authored layer of a preset stop.
   * @returns {number}
   */
  static opacityOf(layer)
  {
    if (layer.opacity === undefined) return WeatherPresets.FullOpacity;

    const share = layer.opacity / WeatherPresets.PercentBase;

    return Math.round(WeatherPresets.FullOpacity * share);
  }

  /**
   * A layer that draws nothing, for a layer naming a motion that does not exist.
   *
   * Zero density rather than an absent layer, so the shape the emitter receives is the same shape it
   * always receives and the failure stays where it was reported rather than surfacing later as a
   * different-looking bug somewhere downstream.
   * @param {object} layer The authored layer that could not be resolved.
   * @returns {object}
   */
  static inertLayer(layer)
  {
    return {
      edge: 'top',
      speedX: 0,
      speedY: 0,
      jitterX: 0,
      jitterY: 0,
      roll: 0,
      growth: 0,
      fadeIn: 0,
      staggerFrames: 0,
      scale: 1,
      scaleJitter: 0,
      asset: layer.asset,
      density: 0,
      blend: layer.blend,
    };
  }

  /**
   * Every look this configuration knows how to draw.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @returns {string[]}
   */
  static names(config)
  {
    return Object.keys(config.presets);
  }
}

export default WeatherPresets;
//endregion WeatherPresets