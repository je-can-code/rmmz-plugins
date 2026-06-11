//region Sprite_MapAfflictionSlot
/**
 * One compact affliction slot for the map strip.
 */
class Sprite_MapAfflictionSlot
  extends Sprite
{
  /**
   * The view model bound to this slot.
   * @type {StateAfflictionViewModel|null}
   */
  viewModel = null;

  /**
   * The icon child sprite.
   * @type {Sprite_Icon}
   */
  #iconSprite = null;

  /**
   * The gauge child sprite.
   * @type {Sprite}
   */
  #gaugeSprite = null;

  /**
   * The gauge bitmap width.
   * @type {number}
   */
  #gaugeWidth = 0;

  /**
   * The gauge bitmap height.
   * @type {number}
   */
  #gaugeHeight = 0;

  /**
   * Constructor.
   */
  constructor()
  {
    super();

    this.#iconSprite = new Sprite_Icon(0);
    this.#gaugeSprite = new Sprite();
    this.addChild(this.#iconSprite);
    this.addChild(this.#gaugeSprite);
  }

  /**
   * Binds a view model and layout config to this slot.
   * @param {StateAfflictionViewModel} viewModel The row to display.
   * @param {StateAfflictionMapLayoutConfig} layoutConfig The map layout config.
   */
  setup(viewModel, layoutConfig)
  {
    this.viewModel = viewModel;
    this.#gaugeWidth = layoutConfig.slotPitch - 2;
    this.#gaugeHeight = layoutConfig.gaugeHeight;

    const iconWidth = layoutConfig.iconWidth();
    const iconHeight = layoutConfig.iconHeight();

    // sample the iconset at full tile size, then scale down for map display.
    this.#iconSprite.setIconWidth(ImageManager.iconWidth);
    this.#iconSprite.setIconHeight(ImageManager.iconHeight);
    this.#iconSprite.setIconIndex(viewModel.iconIndex);
    this.#iconSprite.scale.x = layoutConfig.iconScale;
    this.#iconSprite.scale.y = layoutConfig.iconScale;
    this.#iconSprite.move(0, 0);

    const gaugeX = Math.floor((iconWidth - this.#gaugeWidth) / 2);
    const gaugeY = iconHeight + 1;

    this.#gaugeSprite.bitmap = new Bitmap(this.#gaugeWidth, this.#gaugeHeight);
    this.#gaugeSprite.move(gaugeX, gaugeY);

    this.refreshGauge();
  }

  /**
   * Places the slot origin within the strip.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  placeAt(x, y)
  {
    this.move(x, y);
  }

  /**
   * Redraws the gauge fill from the bound view model.
   */
  refreshGauge()
  {
    if (!this.viewModel || !this.#gaugeSprite.bitmap)
    {
      return;
    }

    const { bitmap } = this.#gaugeSprite;
    const trackColor = '#222222';

    bitmap.clear();
    bitmap.fillRect(0, 0, this.#gaugeWidth, this.#gaugeHeight, trackColor);

    if (this.viewModel.fillRatio === null)
    {
      bitmap.strokeRect(0, 0, this.#gaugeWidth, this.#gaugeHeight, '#666666');
      return;
    }

    const fillColor = this.viewModel.polarity === 'negative'
      ? '#cc4466'
      : '#44aa66';
    const fillWidth = Math.floor(this.#gaugeWidth * this.viewModel.fillRatio);

    if (fillWidth > 0)
    {
      bitmap.fillRect(0, 0, fillWidth, this.#gaugeHeight, fillColor);
    }

    this.refreshStackTicks();
  }

  /**
   * Draws stack tick marks across the gauge.
   */
  refreshStackTicks()
  {
    if (!this.viewModel || !this.#gaugeSprite.bitmap)
    {
      return;
    }

    if (this.viewModel.stackCount <= 1)
    {
      return;
    }

    const { bitmap } = this.#gaugeSprite;
    const segmentCount = Math.min(this.viewModel.stackCount, 6);
    const segmentWidth = this.#gaugeWidth / segmentCount;

    for (let index = 1; index < segmentCount; index++)
    {
      const x = Math.floor(segmentWidth * index);

      bitmap.fillRect(x, 0, 1, this.#gaugeHeight, '#ffffff');
    }
  }
}

export default Sprite_MapAfflictionSlot;
//endregion Sprite_MapAfflictionSlot
