//region Sprite_MapHpGauge
/**
 * A dedicated HP gauge for map sprites.
 * Extends {@link Sprite_MapGauge} and binds to a {@link Game_Battler}.
 */
function Sprite_MapHpGauge()
{
  this.initialize(...arguments);
}

Sprite_MapHpGauge.prototype = Object.create(Sprite_MapGauge.prototype);
Sprite_MapHpGauge.prototype.constructor = Sprite_MapHpGauge;

/**
 * Initializes this map HP gauge with the given parameters.
 * @param {number=} bitmapWidth The bitmap width of this gauge.
 * @param {number=} bitmapHeight The bitmap height of this gauge.
 * @param {number=} gaugeHeight The height of the filled strip.
 */
Sprite_MapHpGauge.prototype.initialize = function(
  bitmapWidth = 96,
  bitmapHeight = 24,
  gaugeHeight = 6)
{
  // initialize as a map gauge.
  Sprite_MapGauge.prototype.initialize.call(this, bitmapWidth, bitmapHeight, gaugeHeight);

  // designate the bar as an HP gauge.
  this._statusType = "hp";
};

/**
 * Binds this gauge to a battler.
 * @param {Game_Battler} battler The battler to bind the gauge to.
 */
Sprite_MapHpGauge.prototype.setupBattler = function(battler)
{
  // use the base Sprite_Gauge setup for value/max and redraw lifecycle.
  this.setup(battler, "hp");
};
//endregion Sprite_MapHpGauge