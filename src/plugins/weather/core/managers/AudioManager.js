//region AudioManager
import WeatherAudioChannel from './WeatherAudioChannel.js';

/**
 * Extends the `bgsVolume` setter.<br/>
 * Also retunes the weather's own channel.
 *
 * The engine's setter retunes `_currentBgs` and nothing else, which is correct as far as it goes -
 * that is the only background sound it knows about. Weather runs on a channel of its own so that a
 * river and a rainstorm can be heard at once, and the price of that is being invisible to exactly
 * this.
 *
 * Without it, every route that changes the volume silently stops working for weather: the slider in
 * Options, J-SystemUtilities' mute key, a plugin command. The player mutes the game and the rain
 * keeps going, which reads as the mute being broken rather than as weather being special.
 *
 * Hooking the property rather than each of those callers is what makes that true for routes that do
 * not exist yet.
 */
(() =>
{
  const original = Object.getOwnPropertyDescriptor(AudioManager, 'bgsVolume');

  Object.defineProperty(AudioManager, 'bgsVolume', {
    get: original.get,
    set: function(value)
    {
      // perform original logic.
      original.set.call(this, value);

      // and bring the weather along with it.
      WeatherAudioChannel.refreshVolume();
    },
    configurable: true,
  });
})();
//endregion AudioManager