//region Window_Time
/**
 * Extends {@link #drawContent}.<br/>
 * Also draws what the weather is doing.
 *
 * **The weather line lives here rather than in J-TIME**, because J-TIME has never heard of weather
 * and must keep working without it. A `\weather[]` written into J-TIME's own window would render
 * as those nine literal characters for anybody running the clock on its own.
 *
 * `Window_Time` is a hoisted global by the time this runs; J-TIME is a declared dependency of this
 * ship, so the class is there to be extended.
 */
// the window is sized from this, and it is read when the map scene builds its rectangle - long
// after both ships have loaded. Raising it here is what buys the third line its room.
Window_Time.RowCount += 1;

J.WEATHER.EXT.TIME.Aliased.Window_Time.set('drawContent', Window_Time.prototype.drawContent);
Window_Time.prototype.drawContent = function()
{
  // perform original logic.
  J.WEATHER.EXT.TIME.Aliased.Window_Time.get('drawContent')
    .call(this);

  this.drawWeather();
};

/**
 * Draws what the weather is doing where the player is standing.
 *
 * The whole line is the text code, which is the point of having one: the icon, the name and the
 * strength are spelled the same way here as in the forecast and in anybody's dialogue, and this
 * window needs to know nothing about any of them.
 */
Window_Time.prototype.drawWeather = function()
{
  const row = Window_Time.RowCount - 1;

  this.drawTextEx('\\weather[]', 0, this.contentLineY(row), this.contentWidth());
};
//endregion Window_Time