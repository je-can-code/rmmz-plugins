//region Window_ForecastNow
/**
 * What the weather is doing where the player is standing, said out loud.
 *
 * **This one is not about Raevula.** The other two views describe the sky over the town, which is
 * the only forecast anybody on Erocia could actually have. This describes the here and now - so
 * standing in a cave it says the cave, and up on the Peaks it says the Peaks. Duplicative in town,
 * which is the one place it does not matter.
 *
 * Said by somebody rather than reported, because "light rain, moderate" is a readout and this is
 * the one place in the screen that can afford a voice.
 */
class Window_ForecastNow
  extends Window_Base
{
  /**
   * Extends {@link Window_Base.initialize}.<br/>
   * @param {Rectangle} rect The bounds of this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    this.initMembers();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the forecast.
     */
    this._j._forecast ||= {};

    /**
     * What is being described, or null when nothing is.
     * @type {?object}
     */
    this._j._forecast._reading = null;
  }

  /**
   * Gets what is currently being described.
   * @returns {?object} The reading.
   */
  reading()
  {
    // hand back what is on screen.
    return this._j._forecast._reading;
  }

  /**
   * Sets what to describe, and draws it.
   * @param {object} newReading What the weather is, and who is remarking on it.
   */
  setReading(newReading)
  {
    // assign what is on screen.
    this._j._forecast._reading = newReading;

    this.refresh();
  }

  /**
   * Redraws the reading.
   */
  refresh()
  {
    this.contents.clear();

    const reading = this.reading();

    if (reading === null) return;

    this.drawWeather(reading);
    this.drawRemark(reading);
  }

  /**
   * Draws what the weather actually is, as icon and words.
   * @param {object} reading What the weather is, and who is remarking on it.
   */
  drawWeather(reading)
  {
    const { weather } = reading;
    const config = J.WEATHER.Metadata.weatherConfig;

    // nothing falling is a real answer, and the commonest one indoors. The word for it is
    // authored, because it is the same word the text code drops into somebody's dialogue.
    if (weather === null)
    {
      this.drawText(WeatherLabel.nothingFalling(config), 0, 0, this.innerWidth, 'left');

      return;
    }

    const iconIndex = WeatherIcons.indexFor(config, weather.preset);
    const label = WeatherLabel.words(config, weather.preset, weather.intensity);

    // a look without artwork yet draws its own name instead, so the screen is complete from the
    // first day rather than waiting on fifteen drawings.
    if (iconIndex === WeatherIcons.None)
    {
      this.drawText(label, 0, 0, this.innerWidth, 'left');

      return;
    }

    this.drawIcon(iconIndex, 0, 0);
    this.drawText(label, ImageManager.iconWidth + this.itemPadding(), 0, this.innerWidth, 'left');
  }

  /**
   * Draws whatever somebody travelling with the player had to say about it.
   *
   * The speaker is an actor id rather than a name, so the face and the name both come from the
   * database - which means renaming somebody in the editor renames them here, and a line can
   * never be attributed to a face that does not match it.
   * @param {object} reading What the weather is, and who is remarking on it.
   */
  drawRemark(reading)
  {
    const { remark } = reading;

    // nobody in the party has a line for this weather yet, which is an ordinary state of a game
    // still being written rather than something worth announcing.
    if (remark === null) return;

    const speaker = $gameActors.actor(remark.who);
    const top = this.lineHeight() * 2;

    this.drawFace(speaker.faceName(), speaker.faceIndex(), 0, top);

    const textX = ImageManager.faceWidth + (this.itemPadding() * 2);
    const textWidth = this.innerWidth - textX;

    this.changeTextColor(ColorManager.systemColor());
    this.drawText(speaker.name(), textX, top, textWidth, 'left');
    this.resetTextColor();

    this.drawRemarkText(remark.says, textX, top + this.lineHeight(), textWidth);
  }

  /**
   * Draws a remark, wrapped to the space beside the speaker's face.
   *
   * `drawTextEx` does not wrap, and a line long enough to say something interesting is long
   * enough to run off the edge - so the words are broken up here rather than the author being
   * asked to guess where the margin falls.
   * @param {string} says What was said.
   * @param {number} x Where the text starts.
   * @param {number} y The top of the text.
   * @param {number} width How much room it has.
   */
  drawRemarkText(says, x, y, width)
  {
    const words = says.split(' ');
    let line = String.empty;
    let row = 0;

    words.forEach(word =>
    {
      const candidate = line === String.empty
        ? word
        : `${line} ${word}`;

      if (this.textWidth(candidate) <= width)
      {
        line = candidate;

        return;
      }

      this.drawText(line, x, y + (row * this.lineHeight()), width, 'left');
      row++;
      line = word;
    });

    this.drawText(line, x, y + (row * this.lineHeight()), width, 'left');
  }
}

export default Window_ForecastNow;
//endregion Window_ForecastNow