//region Scene_Title
import WeatherAudioChannel from './../managers/WeatherAudioChannel.js';

/**
 * Extends {@link #playTitleMusic}.<br/>
 * Also silences the weather, at the moment the engine silences the map's own background sound.
 *
 * Every way back to the title arrives here: a game over, the menu's To Title, and anything else sending the
 * player there. A game over has already stopped the weather by now, but To Title only fades the engine's own
 * sounds on the way out, and the weather's channel is not one of them.
 */
J.WEATHER.Aliased.Scene_Title.set('playTitleMusic', Scene_Title.prototype.playTitleMusic);
Scene_Title.prototype.playTitleMusic = function()
{
  // perform original logic.
  J.WEATHER.Aliased.Scene_Title.get('playTitleMusic')
    .call(this);

  // the title screen has no weather.
  WeatherAudioChannel.stop();
};
//endregion Scene_Title