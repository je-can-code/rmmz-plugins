//region Sprite_MapHpGauge
/**
 * A dedicated HP gauge for map sprites.
 * Extends {@link Sprite_MapGauge} and binds to a {@link Game_Battler}.
 */
class Sprite_MapHpGauge
  extends Sprite_MapGauge
{
  constructor(bitmapWidth = 96, bitmapHeight = 24, gaugeHeight = 6)
  {
    super(bitmapWidth, bitmapHeight, gaugeHeight);

    // store  status type on the instance for later reads.
    this.setStatusType('hp');
  }

  /**
   * Binds this gauge to a battler.
   * @param {Game_Battler} battler The battler to bind the gauge to.
   */
  setupBattler(battler)
  {
    // use the base Sprite_Gauge setup for value/max and redraw lifecycle.
    this.setup(battler, 'hp');
  }
}

export default Sprite_MapHpGauge;
//endregion Sprite_MapHpGauge