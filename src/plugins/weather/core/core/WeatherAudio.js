//region WeatherAudio
/**
 * What a given weather sounds like, and how loudly.
 *
 * Only some weather makes a noise, and that is authored rather than assumed: rain and wind do, snow
 * does only once it is a whiteout being driven by wind, and fog does not make a sound at all. A
 * preset with no `sounds` block is simply silent, which is the correct answer for most of them.
 *
 * **The volume arithmetic lives here rather than at the buffer**, because getting it wrong is an
 * infuriating and very shippable bug: weather runs on a channel of its own, so a volume that ignored
 * the player's own BGS setting would let them turn the sound off in Options and still have rain
 * hissing at them for the rest of the game.
 */
class WeatherAudio
{
  /**
   * How the engine folds two percentages into the zero-to-one a buffer wants.
   *
   * Copied from `AudioManager.updateBufferParameters` rather than invented, because weather sitting
   * at a different loudness than everything else for the same slider position is exactly the sort of
   * thing nobody can quite put their finger on.
   * @type {number}
   */
  static VolumeDivisor = 10000;

  /**
   * The sound a given weather makes.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {?{preset: string, intensity: string}} resolution What the map resolved to, or null.
   * @returns {?{name: string, volume: number, pitch: number}} What to play, or null for silence.
   */
  static soundFor(config, resolution)
  {
    // no weather makes no noise.
    if (resolution === null) return null;

    const preset = config.presets[resolution.preset];

    // a preset nobody configured has already been reported by whatever tried to draw it.
    if (preset === undefined) return null;

    // most presets are silent, and say so by having nothing to say.
    if (preset.sounds === undefined) return null;

    const sound = preset.sounds[resolution.intensity];

    // and a preset may be silent at some strengths and not others - snow is quiet until it is a
    // whiteout, at which point what you hear is the wind driving it.
    if (sound === undefined) return null;

    return sound;
  }

  /**
   * The volume a buffer should actually be set to, once the player's own setting is folded in.
   * @param {number} configuredVolume How loud this sound is authored to be, 0 through 100.
   * @param {number} playerVolume The player's BGS setting, 0 through 100.
   * @returns {number} A volume between 0 and 1.
   */
  static bufferVolume(configuredVolume, playerVolume)
  {
    return (playerVolume * configuredVolume) / WeatherAudio.VolumeDivisor;
  }

  /**
   * Determines whether two sounds are the same one, playing the same way.
   *
   * Used to decide whether a change of weather is a change of *sound*. Rain easing from moderate to
   * light is a different volume of the same recording as far as the config is concerned but a
   * different file here, while walking between two maps that are both lightly raining is neither -
   * and restarting the loop for that second case would put an audible hitch in the rain every time
   * the player crossed a boundary.
   * @param {?{name: string, volume: number, pitch: number}} a One sound, or null.
   * @param {?{name: string, volume: number, pitch: number}} b Another sound, or null.
   * @returns {boolean}
   */
  static matches(a, b)
  {
    // silence is silence.
    if (a === null && b === null) return true;

    // one of them being silence when the other is not is a change by definition.
    if (a === null || b === null) return false;

    return a.name === b.name && a.volume === b.volume && a.pitch === b.pitch;
  }
}

export default WeatherAudio;
//endregion WeatherAudio