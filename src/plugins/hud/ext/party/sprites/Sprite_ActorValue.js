//region Sprite_ActorValue
import Window_PartyFrame from '../windows/Window_PartyFrame.js';
/**
 * A sprite that represents a value of an actor's parameter.
 */
class Sprite_ActorValue
  extends Sprite
{
  /**
   * Constructor.
   * @param {Game_Actor} actor The actor to track the value of.
   * @param {string} parameter The parameter to track.
   * @param {number=} fontSizeMod The modification of the font size for this value.
   */
  constructor(actor, parameter, fontSizeMod = 0)
  {
    // execute original constructor.
    super();

    // initialize the additional members.
    this.initMembers(actor, parameter, fontSizeMod);

    // generate the bitmap.
    this.bitmap = this.createBitmap();
  }

  /**
   * Initializes the properties associated with this sprite.
   * @param {object} actor The actor to track the value of.
   * @param {string} parameter The parameter to track.
   * @param {number} fontSizeMod The modification of the font size for this value.
   */
  initMembers(actor, parameter, fontSizeMod)
  {
    // initialize our namespaced property block.
    this._j ||= {};

    /**
     * The parameter being tracked by this sprite.
     * @type {string}
     */
    this._j._parameter = parameter;

    /**
     * The actor being tracked by this sprite.
     * @type {Game_Actor}
     */
    this._j._actor = actor;

    /**
     * The font modification from the default font size.
     * @type {number}
     */
    this._j._fontSizeMod = fontSizeMod;

    /**
     * A grouping of all the last-known values for this actor.
     */
    this._j._last ||= {};

    /**
     * The last known hp value.
     * @type {number}
     */
    this._j._last._hp = actor.hp;

    /**
     * The last known mp value.
     * @type {number}
     */
    this._j._last._mp = actor.mp;

    /**
     * The last known tp value.
     * @type {number}
     */
    this._j._last._tp = actor.tp;

    /**
     * The last known exp value- aka the current exp value.
     * @type {number}
     */
    this._j._last._xp = actor.currentExp();

    /**
     * The last known level value- aka the current level.
     * @type {number}
     */
    this._j._last._lvl = actor.level;

    /**
     * A counter for auto refreshing the value.
     * @type {number}
     */
    this._j._autoCounter = 60;
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_parameter: string, _actor: Game_Actor, _fontSizeMod: number,
   * _last: {_hp: number, _mp: number, _tp: number, _xp: number, _lvl: number},
   * _autoCounter: number}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  /**
   * Gets the parameter being tracked by this sprite.
   * @returns {string}
   */
  getParameter()
  {
    return this.j()._parameter;
  }

  /**
   * Gets the actor being tracked by this sprite.
   * @returns {Game_Actor}
   */
  getActor()
  {
    return this.j()._actor;
  }

  /**
   * Gets the autorefresh counter.
   * @returns {number}
   */
  getAutoCounter()
  {
    return this.j()._autoCounter;
  }

  /**
   * Decrements the autorefresh counter.
   */
  decrementAutoCounter()
  {
    this.j()._autoCounter--;
  }

  /**
   * Resets the autorefresh counter to its default value.
   */
  resetAutoCounter()
  {
    this.j()._autoCounter = 60;
  }

  /**
   * Updates the bitmap if it needs updating.
   */
  update()
  {
    // perform original update.
    super.update();

    // updates the actor value accordingly.
    this.handleActorValueUpdates();
  }

  /**
   * Handles the update loop for the actor value tracking.
   */
  handleActorValueUpdates()
  {
    // check if any parameters have changed at this frame.
    if (this.hasParameterChanged())
    {
      // trigger a refresh.
      this.refresh();

      // reset the autocounter.
      this.resetAutoCounter();
    }

    // handle the autorefresh.
    this.handleAutoRefresh();
  }

  /**
   * Automatically refreshes the value being represented by this sprite
   * after a fixed amount of time.
   */
  handleAutoRefresh()
  {
    // check if we need to autorefresh.
    if (this.needsAutoRefresh())
    {
      // refresh the value.
      this.refresh();

      // reset the autocounter.
      this.resetAutoCounter();

      // stop processing.
      return;
    }

    // decrement the autocounter.
    this.decrementAutoCounter();
  }

  /**
   * Determines whether or not we need to trigger an autorefresh.
   * @returns {boolean} True if we need to autorefresh, false otherwise.
   */
  needsAutoRefresh()
  {
    // if the autocounter has reached 0, we need to refresh.
    if (this.getAutoCounter() <= 0) return true;

    // no need to refresh.
    return false;
  }

  /**
   * Refreshes the value being represented by this sprite.
   */
  refresh()
  {
    this.bitmap = this.createBitmap();
  }

  /**
   * Checks whether or not a given parameter has changed.
   */
  hasParameterChanged()
  {
    // each gauge case assigns before return; unknown types fall through to false.
    let changed;

    const actor = this.getActor();

    // decide which parameter we are tracking and compare against the cache.
    switch (this.getParameter())
    {
      case Window_PartyFrame.gaugeTypes.HP:
      {
        // check for hp change.
        changed = actor.hp !== this.j()._last._hp;

        // update the last-known hp if changed.
        if (changed) this.j()._last._hp = actor.hp;

        // end case.
        return changed;
      }
      case Window_PartyFrame.gaugeTypes.MP:
      {
        // check for mp change.
        changed = actor.mp !== this.j()._last._mp;

        // update the last-known mp if changed.
        if (changed) this.j()._last._mp = actor.mp;

        // end case.
        return changed;
      }
      case Window_PartyFrame.gaugeTypes.TP:
      {
        // check for tp change.
        changed = actor.tp !== this.j()._last._tp;

        // update the last-known tp if changed.
        if (changed) this.j()._last._tp = actor.tp;

        // end case.
        return changed;
      }
      case Window_PartyFrame.gaugeTypes.XP:
      {
        // compute the current exp for comparison.
        const current = actor.currentExp();

        // check for exp change.
        changed = current !== this.j()._last._xp;

        // update the last-known exp if changed.
        if (changed) this.j()._last._xp = current;

        // end case.
        return changed;
      }
      case Window_PartyFrame.gaugeTypes.Level:
      {
        // check for level change.
        changed = actor.level !== this.j()._last._lvl;

        // update the last-known level if changed.
        if (changed) this.j()._last._lvl = actor.level;

        // end case.
        return changed;
      }
    }

    return false;
  }

  /**
   * Creates a bitmap to attach to this sprite that shows the value.
   */
  createBitmap()
  {
    // determine the bitmap dimensions.
    const width = this.bitmapWidth();

    // determine the bitmap height relative to font size.
    const height = this.fontSize() + 4;

    // create the bitmap for this value sprite.
    const bitmap = new Bitmap(width, height);

    // update the bitmap based on the parameter.
    const updatedBitmap = this.updateBitmapByParameter(bitmap);

    // get the current value to display.
    const value = this.getActorValue();

    // draw the value left-aligned across the bitmap.
    updatedBitmap.drawText(value, 0, 0, bitmap.width, bitmap.height, 'left');

    // return the created bitmap.
    return bitmap;
  }

  /**
   * Gets the current value of the actor being tracked by this sprite.
   * @returns {number}
   */
  getActorValue()
  {
    const actor = this.getActor();

    // decide how to render based on the parameter being displayed.
    switch (this.getParameter())
    {
      case Window_PartyFrame.gaugeTypes.HP:
      {
        // display rounded HP to avoid off-by-one visuals against fractional HP.
        return Math.round(actor.hp);
      }
      case Window_PartyFrame.gaugeTypes.MP:
      {
        // display rounded MP to align with fractional accumulation.
        return Math.round(actor.mp);
      }
      case Window_PartyFrame.gaugeTypes.TP:
      {
        // TP can change in non-integers under JABS; display rounded for consistency.
        return Math.round(actor.tp);
      }
      case Window_PartyFrame.gaugeTypes.XP:
      {
        // compute exp remaining to next level.
        const curExp = (actor.nextLevelExp() - actor.currentLevelExp());

        // compute progress into the current level.
        const nextLv = (actor.currentExp() - actor.currentLevelExp());

        // calculate the remaining exp as a whole number.
        return curExp - nextLv;
      }
      case Window_PartyFrame.gaugeTypes.Level:
      {
        // display the level as a 3-digit number.
        return actor.level.padZero(3);
      }
    }

    // if we didn't hit a case, return 0.
    return null;
  }

  /**
   * Mutates the bitmap based on the parameter being tracked.
   * @param {Bitmap} bitmap The bitmap to mutate.
   * @returns {Bitmap} The mutated bitmap.
   */
  updateBitmapByParameter(bitmap)
  {
    // assign for local mutation.
    const updatedBitmap = bitmap;

    // decide how to render based on the parameter being displayed.
    switch (this.getParameter())
    {
      case Window_PartyFrame.gaugeTypes.HP:
      {
        // set the outline thickness for readability.
        updatedBitmap.outlineWidth = 4;

        // set the red-tinted outline color for HP.
        updatedBitmap.outlineColor = 'rgba(128, 24, 24, 1.0)';

        // end case.
        break;
      }
      case Window_PartyFrame.gaugeTypes.MP:
      {
        // set the outline thickness for readability.
        updatedBitmap.outlineWidth = 4;

        // set the blue-tinted outline color for MP.
        updatedBitmap.outlineColor = 'rgba(24, 24, 192, 1.0)';

        // end case.
        break;
      }
      case Window_PartyFrame.gaugeTypes.TP:
      {
        // set the outline thickness for readability.
        updatedBitmap.outlineWidth = 4;

        // set the green-tinted outline color for TP.
        updatedBitmap.outlineColor = 'rgba(24, 64, 24, 1.0)';

        // end case.
        break;
      }
      case Window_PartyFrame.gaugeTypes.XP:
      {
        // set the outline thickness for readability.
        updatedBitmap.outlineWidth = 4;

        // set the neutral outline for XP remaining.
        updatedBitmap.outlineColor = 'rgba(72, 72, 72, 1.0)';

        // end case.
        break;
      }
      case Window_PartyFrame.gaugeTypes.Level:
      {
        // set the outline thickness for readability.
        updatedBitmap.outlineWidth = 4;

        // set the neutral outline for level text.
        updatedBitmap.outlineColor = 'rgba(72, 72, 72, 1.0)';

        // end case.
        break;
      }
    }

    // assign the font face for this value.
    updatedBitmap.fontFace = this.fontFace();

    // assign the font size for this value.
    updatedBitmap.fontSize = this.fontSize();

    // return the mutated bitmap.
    return updatedBitmap;
  }

  /**
   * Defaults the bitmap width to be a fixed 200 pixels.
   */
  bitmapWidth()
  {
    return 200;
  }

  /**
   * Defaults the font size to be an adjusted amount from the base font size.
   */
  fontSize()
  {
    return $gameSystem.mainFontSize() + this.j()._fontSizeMod;
  }

  /**
   * Defaults the font face to be the number font.
   */
  fontFace()
  {
    return $gameSystem.numberFontFace();
  }
}

export default Sprite_ActorValue;
//endregion Sprite_ActorValue