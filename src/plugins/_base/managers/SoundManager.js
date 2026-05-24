//region SoundManager
import RPG_SoundEffect from './../database/miscellaneous/RPG_SoundEffect.js';
/**
 * Plays the sound effect provided.
 * @param {RPG_SoundEffect} se The sound effect to play.
 */
SoundManager.playSoundEffect = function(se)
{
  AudioManager.playStaticSe(se);
};
//endregion SoundManager