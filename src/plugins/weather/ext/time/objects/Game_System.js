//region Game_System
import SkyForecast from './../core/SkyForecast.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also sets up the sky's own memory.
 */
J.WEATHER.EXT.TIME.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // perform original logic.
  J.WEATHER.EXT.TIME.Aliased.Game_System.get('initMembers')
    .call(this);

  // initializes members for this plugin.
  this.initWeatherTimeMembers();
};

/**
 * Initializes the forecast.
 *
 * **Everything here is plain data, so none of it needs a codec declaration.** `SerializableRegistry`
 * fails open: an undeclared field of strings and numbers persists and restores on its own, and the
 * throw is reserved for a field holding a class instance. Read `docs/save-system.md` before adding
 * a field that is anything else.
 */
Game_System.prototype.initWeatherTimeMembers = function()
{
  /**
   * The over-arching object that contains all properties for this plugin.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the sky over time.
   */
  this._j._weatherTime ||= {};

  /**
   * What the sky will be doing, phase by phase, for about a year ahead.
   *
   * Seeded empty at phase zero rather than rolled here, because rolling needs the clock and the
   * clock does not exist yet at the moment game objects are created. The first time the forecast is
   * asked for anything it winds itself forward to wherever the calendar actually is.
   * @type {{startPhase: number, types: string[], intensities: string[]}}
   */
  this._j._weatherTime._forecast = SkyForecast.empty(0);

  /**
   * The phase whose sky was last handed to the director.
   *
   * This is the dedupe that makes a once-a-minute announcement into a once-a-phase decision, and it
   * lives in the save rather than on a static so that loading a game does not re-roll the walk at
   * whatever moment the file happened to be written.
   * @type {number}
   */
  this._j._weatherTime._lastApplied = SkyForecast.OffClock;
};

/**
 * Gets what the sky will be doing over the coming year.
 * @returns {{startPhase: number, types: string[], intensities: string[]}} The forecast.
 */
Game_System.prototype.skyForecast = function()
{
  // hand back the forecast.
  return this._j._weatherTime._forecast;
};

/**
 * Sets what the sky will be doing over the coming year.
 * @param {{startPhase: number, types: string[], intensities: string[]}} newForecast The forecast.
 */
Game_System.prototype.setSkyForecast = function(newForecast)
{
  // assign the forecast.
  this._j._weatherTime._forecast = newForecast;
};

/**
 * Gets the phase whose sky was last applied.
 * @returns {number} The absolute phase, or -1 when none has been.
 */
Game_System.prototype.lastAppliedSkyPhase = function()
{
  // hand back the last phase acted on.
  return this._j._weatherTime._lastApplied;
};

/**
 * Sets the phase whose sky was last applied.
 * @param {number} newPhase The absolute phase.
 */
Game_System.prototype.setLastAppliedSkyPhase = function(newPhase)
{
  // assign the last phase acted on.
  this._j._weatherTime._lastApplied = newPhase;
};
//endregion Game_System