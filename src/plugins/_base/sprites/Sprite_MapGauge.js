//region Sprite_MapGauge
import Sprite_Icon from './Sprite_Icon.js';

/**
 * The sprite for displaying a gauge on a character's sprite.
 */
class Sprite_MapGauge
  extends Sprite_Gauge
{
  /**
   * Constructor.
   * @param {number} bitmapWidth - The width of the gauge bitmap.
   * @param {number} bitmapHeight - The height of the gauge bitmap.
   * @param {number} gaugeHeight - The height of the gauge itself.
   * @param {string} label - The label on the gauge.
   * @param {number|null} value - The value of the gauge.
   * @param {number} iconIndex - The index of the icon to display.
   */
  constructor(bitmapWidth = 96, bitmapHeight = 24, gaugeHeight = 6, label = String.empty, value = null, iconIndex = -1)
  {
    super(bitmapWidth, bitmapHeight, gaugeHeight, label, value, iconIndex);
  }

  /**
   * Extends {@link #initialize}.<br/>
   * Intercepts and initializes our custom gauge information first.
   * @param {number} bitmapWidth - The width of the gauge bitmap.
   * @param {number} bitmapHeight - The height of the gauge bitmap.
   * @param {number} gaugeHeight - The height of the gauge itself.
   * @param {string} label - The label on the gauge.
   * @param {number|null} value - The value of the gauge.
   * @param {number} iconIndex - The index of the icon to display.
   */
  initialize(bitmapWidth, bitmapHeight, gaugeHeight, label, value, iconIndex)
  {
    // initialize our custom gauge members ahead of the base initialize.
    this.initGaugeMembers(bitmapWidth, bitmapHeight, gaugeHeight, label, value, iconIndex);

    // perform original logic.
    super.initialize();
  }

  /**
   * Initializes the gauge.
   * @param {number} bitmapWidth - The width of the gauge bitmap.
   * @param {number} bitmapHeight - The height of the gauge bitmap.
   * @param {number} gaugeHeight - The height of the gauge itself.
   * @param {string} label - The label on the gauge.
   * @param {number|null} value - The value of the gauge.
   * @param {number} iconIndex - The icon index of the gauge.
   */
  initGaugeMembers(bitmapWidth, bitmapHeight, gaugeHeight, label, value, iconIndex)
  {
    /**
     * The gauge data points.
     */
    this._gauge = {};

    /**
     * The width of the gauge bitmap.
     * @type {number}
     */
    this._gauge._bitmapWidth = bitmapWidth;

    /**
     * The height of the gauge bitmap.
     * @type {number}
     */
    this._gauge._bitmapHeight = bitmapHeight;

    /**
     * The height of the gauge itself.
     * @type {number}
     */
    this._gauge._gaugeHeight = gaugeHeight;

    /**
     * The label on the gauge.
     * @type {string}
     */
    this._gauge._label = label;

    /**
     * The value of the gauge.
     * @type {number|null}
     */
    this._gauge._value = value;

    /**
     * The icon index of the gauge.
     * @type {number}
     */
    this._gauge._iconIndex = iconIndex;

    /**
     * The sprite representing the icon on the gauge.
     * @type {Sprite_Icon|null}
     */
    this._gauge._iconSprite = null;

    /**
     * Whether or not the gauge is activated.
     * @type {boolean}
     */
    this._gauge._activated = true;
  }

  //region properties
  /**
   * Gets the battler associated with this gauge.
   * @returns {Game_Actor|Game_Enemy|null}
   */
  getBattler()
  {
    return this._battler;
  }

  /**
   * Gets the status type associated with this gauge.
   * @returns {string|null}
   */
  getStatusType()
  {
    return this._statusType;
  }

  /**
   * Sets the status type associated with this gauge.
   * @param {string} statusType The status type to associate with this gauge.
   */
  setStatusType(statusType)
  {
    this._statusType = statusType;
  }

  /**
   * Overwrites {@link #bitmapWidth}.<br/>
   * Gets the width of our custom bitmap.
   * @returns {number}
   */
  bitmapWidth()
  {
    return this._gauge._bitmapWidth;
  }

  /**
   * Overwrites {@link #bitmapHeight}.<br/>
   * Gets the height of our custom bitmap.
   * @returns {number}
   */
  bitmapHeight()
  {
    return this._gauge._bitmapHeight;
  }

  /**
   * Overwrites {@link #gaugeHeight}.<br/>
   * Gets the height of our custom gauge.
   * @returns {number}
   */
  gaugeHeight()
  {
    return this._gauge._gaugeHeight;
  }

  /**
   * Overwrites {@link #label}.<br/>
   * Gets our custom label for the gauge.
   * @returns {string}
   */
  label()
  {
    return this._gauge._label;
  }

  /**
   * Gets the icon index of the gauge.
   * @returns {number}
   */
  iconIndex()
  {
    return this._gauge._iconIndex;
  }

  /**
   * Sets the icon index of the gauge.
   * @param {number} iconIndex The index of the icon to set.
   */
  // TODO: update the name to "setIconIndex".
  // TODO: decompose and refactor this function.
  setIcon(iconIndex)
  {
    // assign the new index (use -1 as the sentinel for "no icon").
    this._gauge._iconIndex = iconIndex;

    // if we already have an icon sprite, update it in-place.
    if (this._gauge._iconSprite)
    {
      // when "no icon", keep the sprite but hide it.
      if (this._gauge._iconIndex < 0)
      {
        this._gauge._iconSprite.visible = false; // hide without removing
      }
      else
      {
        // update the icon tile and make sure it is visible.
        this._gauge._iconSprite.setIconIndex(this._gauge._iconIndex);
        this._gauge._iconSprite.visible = true;

        // re-center vertically in case the gauge height changed.
        const iconHeight = 16; // after 0.5 scale of a 32px icon
        const centeredY = Math.floor((this.bitmapHeight() - iconHeight) / 2);
        this._gauge._iconSprite.move(10, centeredY);
      }

      // redraw the gauge (label/gradient may still need updating).
      this.redraw();
      return;
    }

    // if we don’t have a sprite yet and the index is valid, create one now.
    if (this._gauge._iconIndex >= 0)
    {
      const sprite = this.createIconSprite();
      this.addChild(sprite);
      this._gauge._iconSprite = sprite;
    }

    // redraw the gauge (label/gradient may still need updating).
    this.redraw();
  }

  /**
   * Sets the label of the gauge.
   * @param {string} label The label to set.
   */
  setLabel(label)
  {
    this._gauge._label = label;
    this.redraw();
  }

  /**
   * Activates the gauge.
   */
  activateGauge()
  {
    this._gauge._activated = true;
  }

  /**
   * Deactivates the gauge.
   */
  deactivateGauge()
  {
    this._gauge._activated = false;
  }

  /**
   * Gets whether or not the gauge is currently active.
   * @returns {boolean}
   */
  isGaugeActive()
  {
    return this._gauge._activated;
  }

  /**
   * Overwrites {@link #currentValue}.<br/>
   * Returns the current value of the gauge based on custom values.
   * @returns {number|NaN}
   */
  currentValue()
  {
    // if there is no battler, then there is no value.
    if (!this.getBattler()) return NaN;

    switch (this.getStatusType())
    {
      case 'hp':
        return this._battler.hp;
      case 'mp':
        return this._battler.mp;
      case 'tp':
        return this._battler.tp;
      case 'time':
        return this._battler.currentExp() - this._battler.currentLevelExp();
      default:
        return NaN;
    }
  }

  /**
   * Overwrites {@link #currentMaxValue}.<br/>
   * Returns the maximum value of the gauge based on custom values.
   * @returns {number|NaN}
   */
  currentMaxValue()
  {
    // if there is no battler, then there is no value.
    if (!this.getBattler()) return NaN;

    switch (this._statusType)
    {
      case 'hp':
        return this._battler.mhp;
      case 'mp':
        return this._battler.mmp;
      case 'tp':
        return this._battler.maxTp();
      case 'time':
        return this._battler.nextLevelExp() - this._battler.currentLevelExp();
      default:
        return NaN;
    }
  }

  //endregion properties

  //region create
  /**
   * Creates the sprite for the icon on this gauge.
   * @returns {Sprite_Icon}
   */
  createIconSprite()
  {
    // create the icon sprite at the current index.
    const sprite = new Sprite_Icon(this._gauge._iconIndex);

    // scale the icon smaller for map display.
    sprite.scale.x = 0.5;
    sprite.scale.y = 0.5;

    // center the icon vertically inside this gauge’s bitmap height.
    const iconHeight = 16;
    const centeredY = Math.floor((this.bitmapHeight() - iconHeight) / 2);

    // give it a small left padding so the label can start at x=32 nicely.
    sprite.move(10, centeredY);

    return sprite;
  }

  //endregion create

  //region update
  update()
  {
    // don't update if its not activated.
    if (this.isGaugeActive() === false) return;

    // perform original logic.
    super.update();
  }

  //endregion update

  //region draw
  drawIcon()
  {
    // reconcile presence & visibility without destroying when unnecessary.
    if (this.iconIndex() >= 0)
    {
      if (!this._gauge._iconSprite)
      {
        // add if missing.
        const sprite = this.createIconSprite();
        this.addChild(sprite);
        this._gauge._iconSprite = sprite;
      }

      // ensure visible when we have an icon index.
      this._gauge._iconSprite.visible = true;
    }
    else if (this._gauge._iconSprite)
    {
      // hide (do not remove) when no icon is intended.
      this._gauge._iconSprite.visible = false;
    }
  }

  /**
   * Overwrites {@link #drawLabel}.<br/>
   * Draws our custom label on the gauge.
   */
  drawLabel()
  {
    // if we can't draw the label, then don't draw it.
    if (!this.label()) return;

    // render the label with an indent.
    const x = 32;
    const y = 0;
    this.bitmap.fontSize = 12;
    this.bitmap.drawText(this._gauge._label, x, y, this.bitmapWidth(), this.bitmapHeight(), 'left');
  }

  /**
   * Overwrites {@link #drawValue}.<br/>
   * Does nothing by design (no values for map gauges).
   */
  drawValue()
  {
    // no-op.
  }

  /**
   * Overwrites {@link #redraw}.<br/>
   * Redraws the gauge with our custom values.
   */
  redraw()
  {
    // clear any prior drawing first.
    this.bitmap.clear();

    // compute current value and cache it into the same fields the base gauge uses.
    const currentValue = this.currentValue(); // may be NaN to skip drawing
    if (!isNaN(currentValue))
    {
      // assign backing fields for gaugeRate() to function.
      this._value = currentValue; // current filled amount
      this._maxValue = this.currentMaxValue(); // maximum value for fill

      // draw the colored fill/backdrop using the cached rate values.
      this.drawGauge();

      // draw label & icon similarly to your existing behavior (skip for "time").
      if (this._statusType !== 'time')
      {
        this.drawLabel();
        this.drawIcon();

        // only draw numeric value when valid (map gauges typically hide values).
        if (this.isValid())
        {
          this.drawValue();
        }
      }
    }
  }

  /**
   * Overwrites {@link #measureLabelWidth}.<br/>
   * Measure the actual custom label for this map gauge. If no label is set,
   * return 0 so HUD gauges (which are unlabeled) render with the same width.
   * @returns {number}
   */
  measureLabelWidth()
  {
    // grab the current label text.
    const label = this.label();

    // if no label, there is no gutter.
    if (!label || label.length === 0)
    {
      return 0;
    }

    // match the font size used by drawLabel() for an accurate measurement.
    this.bitmap.fontSize = 12;

    // measure just this label.
    return this.bitmap.measureTextWidth(label)
  }

  /**
   * Overwrites {@link #textHeight}.<br/>
   * Return the bitmap height as the text height for map gauges to ensure borders are correctly drawn.
   * @returns {number}
   */
  textHeight()
  {
    return this.bitmapHeight();
  }

  //endregion draw
}


export default Sprite_MapGauge;
//endregion Sprite_MapGauge