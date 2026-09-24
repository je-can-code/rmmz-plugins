//region Sprite_MapGauge
import Sprite_Icon from './Sprite_Icon.js';
import GaugeTrail from '../models/GaugeTrail.js';

/**
 * The sprite for displaying a gauge on a character's sprite.
 */
class Sprite_MapGauge
  extends Sprite_Gauge
{
  /**
   * The resources whose gauges show recent change with a trail: a red chunk draining after a loss, a green
   * chunk filling in after a gain. These are the ones that get spent and restored- a gauge that only ever
   * fills, like a cast or a charge, has no change worth showing.<br/>
   * An extension whose gauge should trail too adds its status type here.
   * @type {string[]}
   */
  static TrailingStatusTypes = [ 'hp', 'mp', 'tp' ];

  //region properties
  /**
   * Gets the gauge.
   * @returns {{_bitmapWidth: number, _bitmapHeight: number, _gaugeHeight: number, _label: string,
   * _value: number|null, _iconIndex: number, _iconSprite: Sprite|null, _activated: boolean,
   * _trail: GaugeTrail}} The gauge.
   */
  gauge()
  {
    // hand back the gauge.
    return this._gauge;
  }

  /**
   * Gets the trail that shows recent change on this gauge.
   * @returns {GaugeTrail}
   */
  gaugeTrail()
  {
    // hand back the trail.
    return this.gauge()._trail;
  }
  //endregion properties

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
    // store  gauge on the instance for later reads.
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

    /**
     * The trail that shows recent change on this gauge, for the gauges that show it.
     * @type {GaugeTrail}
     */
    this._gauge._trail = new GaugeTrail();
  }

  //region properties
  /**
   * Gets the battler associated with this gauge.
   * @returns {Game_Actor|Game_Enemy|null}
   */
  getBattler()
  {
    return this.battler();
  }

  /**
   * Gets the status type associated with this gauge.
   * @returns {string|null}
   */
  getStatusType()
  {
    return this.statusType();
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
    return this.gauge()._bitmapWidth;
  }

  /**
   * Overwrites {@link #bitmapHeight}.<br/>
   * Gets the height of our custom bitmap.
   * @returns {number}
   */
  bitmapHeight()
  {
    return this.gauge()._bitmapHeight;
  }

  /**
   * Overwrites {@link #gaugeHeight}.<br/>
   * Gets the height of our custom gauge.
   * @returns {number}
   */
  gaugeHeight()
  {
    return this.gauge()._gaugeHeight;
  }

  /**
   * Overwrites {@link #label}.<br/>
   * Gets our custom label for the gauge.
   * @returns {string}
   */
  label()
  {
    return this.gauge()._label;
  }

  /**
   * Extends {@link #gaugeX}.<br/>
   * Reserves nothing to the left of the bar when there is no label to put there.
   *
   * Vanilla's answer is the label's measured width plus six pixels of gap, and it adds that gap
   * whether or not a label exists - so an unlabelled gauge draws its bar six pixels narrower than
   * its bitmap and pinned to the right of it. A map gauge is positioned by centring its bitmap on
   * the character it belongs to, which means those six unused pixels put the visible bar three
   * pixels right of the battler for its entire life. Invisible until the day the text got sharp.
   * @returns {number}
   */
  gaugeX()
  {
    // no label means no room to leave for one, and no gap to separate it from.
    if (this.label() === String.empty) return 0;

    // perform original logic.
    return super.gaugeX();
  }

  /**
   * Gets the icon index of the gauge.
   * @returns {number}
   */
  iconIndex()
  {
    return this.gauge()._iconIndex;
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
    this.gauge()._iconIndex = iconIndex;

    // if we already have an icon sprite, update it in-place.
    if (this.gauge()._iconSprite)
    {
      // when "no icon", keep the sprite but hide it.
      if (this.gauge()._iconIndex < 0)
      {
        this.gauge()._iconSprite.visible = false; // hide without removing
      }
      else
      {
        // update the icon tile and make sure it is visible.
        this.gauge()._iconSprite.setIconIndex(this.gauge()._iconIndex);
        this.gauge()._iconSprite.visible = true;

        // re-center vertically in case the gauge height changed.
        const iconHeight = 16; // after 0.5 scale of a 32px icon
        const centeredY = Math.floor((this.bitmapHeight() - iconHeight) / 2);
        this.gauge()._iconSprite.move(10, centeredY);
      }

      // redraw the gauge (label/gradient may still need updating).
      this.redraw();
      return;
    }

    // if we don’t have a sprite yet and the index is valid, create one now.
    if (this.gauge()._iconIndex >= 0)
    {
      const sprite = this.createIconSprite();
      this.addChild(sprite);
      this.gauge()._iconSprite = sprite;
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
    this.gauge()._label = label;
    this.redraw();
  }

  /**
   * Activates the gauge.
   */
  activateGauge()
  {
    this.gauge()._activated = true;
  }

  /**
   * Extends {@link Sprite#hide}.<br/>
   * Also deactivates the gauge so it does not tick or render while hidden.
   */
  hide()
  {
    // perform original hide logic.
    super.hide();

    // deactivate the gauge while hidden.
    this.deactivateGauge();
  }

  /**
   * Deactivates the gauge.
   */
  deactivateGauge()
  {
    this.gauge()._activated = false;
  }

  /**
   * Gets whether or not the gauge is currently active.
   * @returns {boolean}
   */
  isGaugeActive()
  {
    return this.gauge()._activated;
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
        return this.battler().hp;
      case 'mp':
        return this.battler().mp;
      case 'tp':
        return this.battler().tp;
      case 'time':
        return this.battler().currentExp() - this.battler().currentLevelExp();
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

    switch (this.statusType())
    {
      case 'hp':
        return this.battler().mhp;
      case 'mp':
        return this.battler().mmp;
      case 'tp':
        return this.battler().maxTp();
      case 'time':
        return this.battler().nextLevelExp() - this.battler().currentLevelExp();
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
    const sprite = new Sprite_Icon(this.gauge()._iconIndex);

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

  //region trail
  /**
   * Whether this gauge shows recent change with a trail. See {@link Sprite_MapGauge.TrailingStatusTypes}.
   * @returns {boolean}
   */
  usesTrail()
  {
    return Sprite_MapGauge.TrailingStatusTypes.includes(this.getStatusType());
  }

  /**
   * Extends {@link Sprite_Gauge#setup}.<br/>
   * A different battler or resource is a fresh gauge, so its trail starts over from whatever it first shows.
   * The same pair again is not: the target frame asks for it on every hit, and a trail cleared each time would
   * never get to drain. The engine's setup ends by updating the bitmap, so the trail is cleared ahead of it.
   * @param {Game_Battler} battler The battler to show.
   * @param {string} statusType The resource to show, such as "hp".
   */
  setup(battler, statusType)
  {
    // decide whether this is a new gauge before the engine records the new pair.
    const isFreshGauge = battler !== this.getBattler() || statusType !== this.getStatusType();

    // a fresh gauge's trail forgets the last battler, so its first value is shown as it is.
    if (isFreshGauge)
    {
      this.gaugeTrail()
        .clear();
    }

    // perform original logic.
    super.setup(battler, statusType);

    // the engine's setup already recorded the value, so nothing reads as changed- draw the fresh gauge outright.
    if (isFreshGauge)
    {
      this.redraw();
    }
  }

  /**
   * Extends {@link Sprite_Gauge#updateBitmap}.<br/>
   * A gauge that trails leaves the engine's easing behind entirely: its trail decides what the bar shows.
   */
  updateBitmap()
  {
    // gauges that don't trail keep the engine's own update.
    if (!this.usesTrail())
    {
      super.updateBitmap();
      return;
    }

    // everything else follows its trail.
    this.updateTrail();
  }

  /**
   * Feeds the trail this frame's value and redraws whenever there is something new to see.
   */
  updateTrail()
  {
    // nothing bound to the gauge means nothing to follow.
    const value = this.currentValue();
    if (isNaN(value)) return;

    // grab the max to measure the value against.
    const maxValue = this.currentMaxValue();

    // tell whether anything changed, and whether the trail was still moving, before the trail steps- the frame
    // it settles on has to be drawn too, or the last sliver of trail would stay on screen.
    const hasChanged = value !== this.value() || maxValue !== this.maxValue();
    const wasMoving = !this.gaugeTrail()
      .isSettled();

    // keep the engine's own record of the value current, for anything else that reads it.
    this.setValue(value);
    this.setMaxValue(maxValue);

    // move the trail one frame along.
    this.gaugeTrail()
      .track(value, maxValue);

    // only spend a redraw when there is something new to show.
    if (hasChanged || wasMoving)
    {
      this.redraw();
    }
  }

  /**
   * The color of the trail right now: the gain color while a gain fills in, and the loss color otherwise.
   * @returns {string}
   */
  trailColor()
  {
    // grab which way the gauge is moving.
    const trend = this.gaugeTrail()
      .trend();

    // a gain fills in with the gain color.
    if (trend === GaugeTrail.Trends.Gain) return this.trailGainColor();

    // anything else trailing is a loss, draining in the loss color.
    return this.trailLossColor();
  }

  /**
   * The color a loss drains in: the engine's power-down red, the same red a debuff's square uses.
   * @returns {string}
   */
  trailLossColor()
  {
    return ColorManager.powerDownColor();
  }

  /**
   * The color a gain fills in with: the engine's power-up green, the same green a buff's square uses.
   * @returns {string}
   */
  trailGainColor()
  {
    return ColorManager.powerUpColor();
  }
  //endregion trail

  //region draw
  drawIcon()
  {
    // reconcile presence & visibility without destroying when unnecessary.
    if (this.iconIndex() >= 0)
    {
      if (!this.gauge()._iconSprite)
      {
        // add if missing.
        const sprite = this.createIconSprite();
        this.addChild(sprite);
        this.gauge()._iconSprite = sprite;
      }

      // ensure visible when we have an icon index.
      this.gauge()._iconSprite.visible = true;
    }
    else if (this.gauge()._iconSprite)
    {
      // hide (do not remove) when no icon is intended.
      this.gauge()._iconSprite.visible = false;
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
    this.bitmap.drawText(this.gauge()._label, x, y, this.bitmapWidth(), this.bitmapHeight(), 'left');
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
      this.setValue(currentValue); // current filled amount
      this.setMaxValue(this.currentMaxValue()); // maximum value for fill

      // draw the colored fill/backdrop using the cached rate values.
      this.drawGauge();

      // draw label & icon similarly to your existing behavior (skip for "time").
      if (this.statusType() !== 'time')
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
   * Extends {@link Sprite_Gauge#drawGaugeRect}.<br/>
   * A gauge that trails draws its trail between the backdrop and the fill; any other gauge draws as the engine
   * does.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} width The width of the gauge.
   * @param {number} height The height of the gauge.
   */
  drawGaugeRect(x, y, width, height)
  {
    // gauges that don't trail draw as the engine does.
    if (!this.usesTrail())
    {
      super.drawGaugeRect(x, y, width, height);
      return;
    }

    // everything else draws its trail.
    this.drawTrailingGaugeRect(x, y, width, height);
  }

  /**
   * Draws a trailing gauge: the backdrop, then the chunk of recent change from the fill's edge out to the
   * trail's, then the fill over the top. Loss or gain, the chunk sits between the two ends- only its color says
   * which it is.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} width The width of the gauge.
   * @param {number} height The height of the gauge.
   */
  drawTrailingGaugeRect(x, y, width, height)
  {
    // grab the trail whose ends are being drawn.
    const trail = this.gaugeTrail();

    // the engine draws a gauge with nothing valid to show- tp outside battle, unless it is kept- as empty, and
    // so does this.
    const isShown = this.isValid();
    const fillRate = isShown
      ? trail.fillRate()
      : 0;
    const trailRate = isShown
      ? trail.trailRate()
      : 0;

    // the fill and the trail sit inside the same one-pixel border the engine draws its fill within.
    const innerWidth = width - 2;
    const innerHeight = height - 2;
    const fillWidth = Math.floor(innerWidth * fillRate);
    const trailWidth = Math.floor(innerWidth * trailRate);

    // the backdrop.
    const backColor = this.gaugeBackColor();
    this.bitmap.fillRect(x, y, width, height, backColor);

    // the chunk of recent change, from the fill's edge out to the trail's- when there is any to see.
    if (trailWidth > fillWidth)
    {
      const trailColor = this.trailColor();
      this.bitmap.fillRect(x + 1 + fillWidth, y + 1, trailWidth - fillWidth, innerHeight, trailColor);
    }

    // the fill, over the top.
    const fillColor1 = this.gaugeColor1();
    const fillColor2 = this.gaugeColor2();
    this.bitmap.gradientFillRect(x + 1, y + 1, fillWidth, innerHeight, fillColor1, fillColor2);
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