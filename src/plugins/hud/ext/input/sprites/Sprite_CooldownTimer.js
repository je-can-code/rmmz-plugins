//region Sprite_CooldownTimer
/**
 * A sprite that displays a timer representing the cooldown time for a JABS action.
 */
class Sprite_CooldownTimer
  extends Sprite
{
  /**
   * Constructor.
   * @param {string} skillType The slot's skill type key.
   * @param {JABS_Cooldown} cooldownData The cooldown this timer reflects.
   * @param {boolean=} isItem Whether the slot holds an item rather than a skill.
   */
  constructor(skillType, cooldownData, isItem = false)
  {
    super();
    this.initialize(skillType, cooldownData, isItem);
  }

  /**
   * Initializes this cooldown timer sprite.
   * @param {string} skillType The slot that this skill maps to.
   * @param {object} cooldownData The cooldown data associated with this cooldown sprite.
   * @param {boolean} isItem Whether or not this cooldown timer is for an item.
   */
  initialize(skillType, cooldownData, isItem = false)
  {
    super.initialize();
    this.initMembers(skillType, cooldownData, isItem);
    this.loadBitmap();
  }

  /**
   * Initializes the properties associated with this sprite.
   * @param {string} skillType The slot that this skill maps to.
   * @param {object} cooldownData The cooldown data associated with this cooldown sprite.
   * @param {boolean} isItem Whether or not this cooldown timer is for an item.
   */
  initMembers(skillType, cooldownData, isItem)
  {
    this._j = {};
    this._j._skillType = skillType;
    this._j._cooldownData = cooldownData;
    this._j._isItem = isItem;
  }

  //region properties
  /**
   * Gets the j.
   * @returns {{_skillType: string, _cooldownData: JABS_Cooldown, _isItem: boolean}} The j.
   */
  j()
  {
    // hand back the j.
    return this._j;
  }
  //endregion properties

  /**
   * Loads the bitmap into the sprite.
   */
  loadBitmap()
  {
    this.bitmap = new Bitmap(this.bitmapWidth(), this.bitmapHeight());
    this.bitmap.fontFace = this.fontFace();
    this.bitmap.fontSize = this.fontSize();
    this.bitmap.drawText(this.j()._text, 0, 0, this.bitmapWidth(), this.bitmapHeight(), "center");
  }

  update()
  {
    super.update();
    this.updateCooldownText();
  }

  updateCooldownText()
  {
    this.bitmap.clear();
    const baseCooldown = (this.j()._cooldownData.frames / 60).toFixed(1);
    const cooldownBaseText = baseCooldown > 0
      ? baseCooldown
      : String.empty;

    this.bitmap.drawText(cooldownBaseText, 0, 0, this.bitmapWidth(), this.bitmapHeight(), "center");
  }

  /**
   * Determines the width of the bitmap accordingly to the length of the string.
   */
  bitmapWidth()
  {
    return 40;
  }

  /**
   * Determines the width of the bitmap accordingly to the length of the string.
   */
  bitmapHeight()
  {
    return this.fontSize() * 3;
  }

  /**
   * Determines the font size for text in this sprite.
   */
  fontSize()
  {
    return $gameSystem.mainFontSize() - 10;
  }

  /**
   * determines the font face for text in this sprite.
   */
  fontFace()
  {
    return $gameSystem.numberFontFace();
  }
}

export default Sprite_CooldownTimer;
//endregion