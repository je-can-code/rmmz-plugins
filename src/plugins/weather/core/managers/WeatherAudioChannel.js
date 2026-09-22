//region WeatherAudioChannel
import WeatherAudio from './../core/WeatherAudio.js';

/**
 * A looping audio channel of the plugin's own, so weather can be heard over whatever else is.
 *
 * RPG Maker keeps exactly one background sound - `AudioManager._bgsBuffer` - and playing anything
 * through it stops whatever was already there. That is why a river and a rainstorm have never been
 * able to coexist: not an engine limitation, just a single field.
 *
 * `AudioManager.createBuffer` hands back an ordinary `WebAudio`, and nothing stops this plugin
 * holding one of its own. So it does, and a map keeps its river while the weather rains on top of it.
 *
 * **What is bought with that is bookkeeping.** `AudioManager` will not stop, retune or clean up a
 * buffer it has never heard of, so every one of those becomes this class's job - including the one
 * that matters most, which is honouring the player's BGS slider. A channel that ignored it would let
 * somebody turn the sound off in Options and still be rained on.
 */
class WeatherAudioChannel
{
  /**
   * How long a sound takes to arrive or leave, in seconds.
   *
   * Weather does not start; it is already going when you walk outside. A fade is what turns a loop
   * beginning into a door opening.
   * @type {number}
   */
  static FadeSeconds = 2;

  /**
   * The buffer currently playing, or null when nothing is.
   * @type {?WebAudio}
   */
  static #buffer = null;

  /**
   * The sound that buffer was started for, or null when nothing is playing.
   * @type {?{name: string, volume: number, pitch: number}}
   */
  static #playing = null;

  /**
   * Plays whatever the given weather sounds like, replacing whatever was playing before.
   *
   * A sound that is already playing is left strictly alone rather than restarted. That is the whole
   * reason this compares before acting: walking between two lightly-raining maps resolves to the same
   * sound twice, and starting the loop again each time would put an audible hitch in the rain at
   * every single boundary.
   * @param {object} config The parsed contents of `config.weather.json`.
   * @param {?{preset: string, intensity: string}} resolution What the map resolved to, or null.
   */
  static play(config, resolution)
  {
    const sound = WeatherAudio.soundFor(config, resolution);

    if (WeatherAudio.matches(sound, WeatherAudioChannel.#playing) === true) return;

    WeatherAudioChannel.stop();

    // the weather turning out to be silent is a perfectly ordinary outcome, and stopping was the
    // entirety of the work.
    if (sound === null) return;

    const buffer = AudioManager.createBuffer('bgs/', sound.name);

    buffer.volume = WeatherAudio.bufferVolume(sound.volume, AudioManager.bgsVolume);
    buffer.pitch = sound.pitch / 100;
    buffer.play(true, 0);
    buffer.fadeIn(WeatherAudioChannel.FadeSeconds);

    WeatherAudioChannel.#buffer = buffer;
    WeatherAudioChannel.#playing = sound;
  }

  /**
   * Silences the channel and lets go of its buffer.
   */
  static stop()
  {
    if (WeatherAudioChannel.#buffer === null) return;

    WeatherAudioChannel.#buffer.stop();
    WeatherAudioChannel.#buffer.destroy();

    WeatherAudioChannel.#buffer = null;
    WeatherAudioChannel.#playing = null;
  }

  /**
   * Re-reads the player's volume setting onto whatever is currently playing.
   *
   * Needed because this channel is invisible to `AudioManager`, which retunes only the buffers it
   * knows about when somebody moves a slider in Options.
   */
  static refreshVolume()
  {
    if (WeatherAudioChannel.#buffer === null) return;

    const sound = WeatherAudioChannel.#playing;

    WeatherAudioChannel.#buffer.volume = WeatherAudio.bufferVolume(sound.volume, AudioManager.bgsVolume);
  }

  /**
   * What is currently playing, or null when nothing is.
   * @returns {?{name: string, volume: number, pitch: number}}
   */
  static playing()
  {
    // hand back the sound currently going.
    return WeatherAudioChannel.#playing;
  }
}

export default WeatherAudioChannel;
//endregion WeatherAudioChannel