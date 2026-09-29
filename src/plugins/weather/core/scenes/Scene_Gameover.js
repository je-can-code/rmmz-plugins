//region Scene_Gameover
import WeatherAudioChannel from './../managers/WeatherAudioChannel.js';

/**
 * Extends {@link #playGameoverMusic}.<br/>
 * Also silences the weather, at the moment the engine silences the map's own background sound.
 *
 * The weather plays on a channel of its own that `AudioManager` has never heard of, so the engine stopping
 * "the" background sound here stops the map's river and leaves the rain going- on through the game over and
 * onto the title screen.
 */
J.WEATHER.Aliased.Scene_Gameover.set('playGameoverMusic', Scene_Gameover.prototype.playGameoverMusic);
Scene_Gameover.prototype.playGameoverMusic = function()
{
  // perform original logic.
  J.WEATHER.Aliased.Scene_Gameover.get('playGameoverMusic')
    .call(this);

  // the weather falls silent with the rest of the world.
  WeatherAudioChannel.stop();
};
//endregion Scene_Gameover