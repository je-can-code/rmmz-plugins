//region Sprite_Damage
/**
 * Extends this `.initialize()` function to include our parameters for all damage sprites.
 */
J.POPUPS.Aliased.Sprite_Damage.set('initialize', Sprite_Damage.prototype.initialize);
Sprite_Damage.prototype.initialize = function()
{
  J.POPUPS.Aliased.Sprite_Damage.get('initialize')
    .call(this);
  this.initMembers();
};

/**
 * Initializes all members of this class.
 */
Sprite_Damage.prototype.initMembers = function()
{
  /**
   * The master reference to the `_j` object containing all plugin properties.
   * @type {{}}
   */
  this._j ||= {};

  /**
   * This plugins' relevant data points.
   * @type {{}}
   */
  this._j._popups ||= {};

  /**
   * Whether or not this damage is flagged as critical.
   * @type {boolean}
   */
  this._j._popups._isCritical = false;

  /**
   * Whether or not this damage is flagged as healing.
   * @type {boolean}
   */
  this._j._popups._isHealing = false;

  /**
   * Whether or not this sprite is actually a damage popup, or a non-damage popup.
   * @type {boolean}
   */
  this._j._popups._isDamage = false;

  /**
   * The text color index for this sprite's text.
   * @type {number}
   */
  this._j._popups._damageColor = 0;

  /**
   * The x coordinate variance on this sprite.
   * @type {number}
   */
  this._j._popups._xVariance = 0;

  /**
   * The y coordinate variance on this sprite.
   * @type {number}
   */
  this._j._popups._yVariance = 0;

  /**
   * Typography hint from {@link Map_TextPop#textAccent}.
   * @type {string|null}
   */
  this._j._popups._textAccent = null;

  /**
   * Source popup for lifecycle events (read-only for observers).
   * @type {Map_TextPop|null}
   */
  this._j._popups._sourcePopup = null;
};

/**
 * Gets whether or not this sprite is a damage popup.
 * @returns {boolean} True if it is a damage popup, false if it is a non-damage popup.
 */
Sprite_Damage.prototype.isDamage = function()
{
  return this._j._popups._isDamage;
};

/**
 * Sets the damage flag to the specified value.
 * @param {boolean} isDamage True if it is a damage popup, false if it is a non-damage popup.
 */
Sprite_Damage.prototype.setDamageFlag = function(isDamage)
{
  this._j._popups._isDamage = isDamage;
};

/**
 * Gets whether or not this sprite is a healing damage popup.
 * @returns {boolean} True if it is a healing damage pop, false otherwise.
 */
Sprite_Damage.prototype.isHealing = function()
{
  return this._j._popups._isHealing;
};

/**
 * Sets the healing flag to the specified value.
 * @param {boolean} isHealing True if it is a healing popup, false otherwise.
 */
Sprite_Damage.prototype.setHealingFlag = function(isHealing)
{
  this._j._popups._isHealing = isHealing;
};

/**
 * Get the x coordinate variance.
 * @returns {number}
 */
Sprite_Damage.prototype.getXVariance = function()
{
  return this._j._popups._xVariance;
};

/**
 * Set the x variance for this damage sprite.
 * @param {number} xVariance The x coordinate variance.
 */
Sprite_Damage.prototype.setXVariance = function(xVariance)
{
  this._j._popups._xVariance = xVariance;
};

/**
 * Get the y coordinate variance.
 * @returns {number}
 */
Sprite_Damage.prototype.getYVariance = function()
{
  return this._j._popups._yVariance;
};

/**
 * Set the y variance for this damage sprite.
 * @param {number} yVariance The y coordinate variance.
 */
Sprite_Damage.prototype.setYVariance = function(yVariance)
{
  this._j._popups._yVariance = yVariance;
};

/**
 * Extends `createChildSprite()` to add the additional properties to the child sprite.
 */
J.POPUPS.Aliased.Sprite_Damage.set('createChildSprite', Sprite_Damage.prototype.createChildSprite);
Sprite_Damage.prototype.createChildSprite = function(width, height)
{
  const sprite = J.POPUPS.Aliased.Sprite_Damage.get('createChildSprite')
    .call(this, width, height);
  this.setupMotionData(sprite);
  return sprite;
};

/**
 * Sets up some additional variables
 * @param sprite
 */
Sprite_Damage.prototype.setupMotionData = function(sprite)
{
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  
  // motion is only for damage and healing.
  const isMotionType = this.isDamage() || this.isHealing();

  // if motion is enabled, initialize the variables needed for it.
  if (J.POPUPS.Layout.Motion.Enabled === true && isMotionType)
  {
    sprite.y = 0; // children start at the parent's baseline.
    sprite.dy = J.POPUPS.Layout.Motion.InitialJump; // starting jump.
    sprite.zt = 0;
    sprite.ry = sprite.y;
    sprite.yf = 0;
    sprite.yf2 = 0;
    sprite.yf3 = 0;
    sprite.ex = false;
    sprite.bounceMaxX = sprite.x + J.POPUPS.Layout.Motion.MaxDrift;
  }
  else
  {
    // motion disabled: use the vertical offset baseline.
    sprite.y = J.POPUPS.Layout.VerticalOffset;
  }
};

/**
 * Assigns the provided value to be the text of this popup.
 * @param {string} value The value to display in the popup.
 */
Sprite_Damage.prototype.createValue = function(value)
{
  const w = J.POPUPS.Layout.ValueBitmapWidth;
  const h = this.fontSize();
  const sprite = this.createChildSprite(w, h);

  let fontSize = 20;

  if (this._j._popups._isCritical)
  {
    fontSize += 12;
    sprite.bitmap.fontBold = true;
  }
  else
  {
    const accent = this._j._popups._textAccent;
    const accentItalic = accent === 'miss' || accent === 'evade' || accent === 'parry';
    const legacyItalic = value.includes('Missed') || value.includes('Evaded') || value.includes('Parry');

    if (accentItalic || legacyItalic)
    {
      fontSize -= 6;
      sprite.bitmap.fontItalic = true;
    }
  }

  // assign the new size.
  sprite.bitmap.fontSize = fontSize;

  // draw the text.
  // we center the text on the bitmap, and the bitmap is centered on the parent.
  // using 0 y-offset to align with the icon's vertical center.
  sprite.bitmap.drawText(value, 0, 0, w, h, "center");
};

/**
 * Adds an icon to the damage sprite.
 * @param {number} iconIndex The id/index of the icon on the iconset.
 */
Sprite_Damage.prototype.addIcon = function(iconIndex)
{
  // create the sprite for the icon.
  const sprite = this.createChildSprite(ImageManager.iconWidth, ImageManager.iconHeight);

  // generate the bitmap for it based on the iconset.
  const bitmap = ImageManager.loadSystem("IconSet");

  // crop the chosen icon to be the only one.
  const pw = ImageManager.iconWidth;
  const ph = ImageManager.iconHeight;
  const sx = (iconIndex % 16) * pw;
  const sy = Math.floor(iconIndex / 16) * ph;

  // blit the icon onto the sprite's bitmap directly.
  sprite.bitmap.blt(bitmap, sx, sy, pw, ph, 0, 0);

  const iconScale = J.POPUPS.Layout.IconScale;
  sprite.scale.x = iconScale;
  sprite.scale.y = iconScale;

  // track the icon sprite.
  this._j._popups._iconSprite = sprite;

  // we want the icon to be vertically centered with the text.
  // since both text and icon now use the same y-offset and anchor=0.5, they align automatically.
  sprite.anchor.y = 0.5; 
  
  sprite.x = 0;
};

/**
 * Repositions children to be side-by-side if both icon and text exist.
 */
Sprite_Damage.prototype.repositionChildren = function()
{
  const icon = this._j._popups._iconSprite;
  // find the text sprite (it's the one with the large bitmap).
  const text = this.children.find(child =>
    child !== icon && child.bitmap && child.bitmap.width === J.POPUPS.Layout.ValueBitmapWidth);

  if (icon && text)
  {
    const spacing = 4;
    const iconWidth = ImageManager.iconWidth * J.POPUPS.Layout.IconScale;
    
    // measure the actual text width.
    const textWidth = text.bitmap.measureTextWidth(this._j._popups._sourcePopup.value);
    const totalWidth = iconWidth + spacing + textWidth;
    
    // the center of the group should be at x=0.
    const startX = -(totalWidth / 2);
    
    // icon is on the left.
    icon.x = startX + (iconWidth / 2);
    
    // text is on the right.
    // since the text is drawn centered in a 400px bitmap, we just move the bitmap
    // so that its center is at the correct spot for the text content.
    text.x = startX + iconWidth + spacing + (textWidth / 2);
  }
};

/**
 * Extends the duration of this sprite by the given amount in frames.
 * @param {number} extraDuration The amount to extend in frames.
 */
Sprite_Damage.prototype.addDuration = function(extraDuration)
{
  this._duration += extraDuration;
};

/**
 * OVERWRITE Replaces the damage updating with our own motion management.
 * @param {Sprite} sprite The sprite to udpate.
 */
Sprite_Damage.prototype.updateChild = function(sprite)
{
  // flashing always happens, sorry!
  sprite.setBlendColor(this._flashColor);

  // motion is only for damage and healing.
  const isMotionType = this.isDamage() || this.isHealing();

  // if motion is enabled, execute the designated motion style.
  if (J.POPUPS.Layout.Motion.Enabled === true && isMotionType)
  {
    const style = J.POPUPS.Layout.Motion.Style;
    switch (style)
    {
      case J.POPUPS.MotionStyles.Bounce:
        if (this.isDamage())
        {
          this.updateDamageSpriteMotion(sprite);
        }
        else
        {
          this.updateNonDamageSpriteMotion(sprite);
        }
        break;
      case J.POPUPS.MotionStyles.Flyaway:
        this.flyawayDamageSpriteMotion(sprite);
        break;
    }
  }
};

/**
 * Updates the motion for the child of the non-damage sprite.
 * NOTE: This is actually just copy-paste of the default bounce/motion that RMMZ uses.
 * @param {Sprite} sprite The sprite to update.
 */
Sprite_Damage.prototype.updateNonDamageSpriteMotion = function(sprite)
{
  sprite.dy += J.POPUPS.Layout.Motion.Gravity;
  sprite.ry += sprite.dy;
  if (sprite.ry >= 0)
  {
    sprite.ry = 0;
    sprite.dy *= -0.6;
  }

  // determine the drift direction.
  // healing drifts left, damage drifts right.
  const drift = this.isHealing()
    ? -J.POPUPS.Layout.Motion.DriftSpeed
    : J.POPUPS.Layout.Motion.DriftSpeed;

  // if we haven't reached the max drift yet, keep drifting.
  if (Math.abs(sprite.x) < J.POPUPS.Layout.Motion.MaxDrift)
  {
    sprite.x += drift;
  }

  sprite.y = Math.round(sprite.ry);
};

/**
 * Updates the motion for the child of the damage sprite.
 * @param {Sprite} sprite The sprite to update.
 */
Sprite_Damage.prototype.updateDamageSpriteMotion = function(sprite)
{
  if (this.isHealing())
  {
    this.updateNonDamageSpriteMotion(sprite);
  }
  else
  {
    this.defaultDamageSpriteMotion(sprite);
  }
};

/**
 * The default motion for RMMZ's damage sprite children.
 * The sprite bounces a little, and thats it.
 * @param {Sprite} sprite The sprite to move.
 */
Sprite_Damage.prototype.defaultDamageSpriteMotion = function(sprite)
{
  sprite.dy += J.POPUPS.Layout.Motion.Gravity;
  sprite.ry += sprite.dy;
  if (sprite.ry >= 0)
  {
    sprite.ry = 0;
    sprite.dy *= -0.8;
  }

  // determine the drift direction.
  // healing drifts left, damage drifts right.
  const drift = this.isHealing()
    ? -J.POPUPS.Layout.Motion.DriftSpeed
    : J.POPUPS.Layout.Motion.DriftSpeed;
  
  // if we haven't reached the max drift yet, keep drifting.
  if (Math.abs(sprite.x) < J.POPUPS.Layout.Motion.MaxDrift)
  {
    sprite.x += drift;
  }

  sprite.y = Math.round(sprite.ry);
};

/**
 * A custom motion for damage sprites.
 * Causes the damage sprite to fly vertically up and fade away.
 * @param {Sprite} sprite The sprite to move.
 */
Sprite_Damage.prototype.flyawayDamageSpriteMotion = function(sprite)
{
  sprite.yf3 -= 1;
  sprite.y = -sprite.yf2 + sprite.yf3;
  if (this._duration > 30)
  {
    sprite.opacity += 10;
  }
  else
  {
    sprite.opacity -= 10;
  }
};

/**
 * OVERWRITE Updates the duration to start fading later, and for longer.
 */
Sprite_Damage.prototype.updateOpacity = function()
{
  const baseDuration = J.POPUPS.Layout.BaseDuration;
  if (this._duration < baseDuration)
  {
    this.opacity = (255 * this._duration) / baseDuration;
  }
};

/**
 * Sets the color of the damage pop to be any of the text color indexes available.
 * @param {number} damageColor The new color index.
 */
Sprite_Damage.prototype.setDamageColor = function(damageColor)
{
  this._j._popups._damageColor = damageColor;
};

/**
 * OVERWRITE Replaces the color with a designated color on-creation.
 */
Sprite_Damage.prototype.damageColor = function()
{
  return ColorManager.textColor(this._j._popups._damageColor);
};

/**
 * Applies the flash effects and extends duration of this sprite if the damage is critical.
 */
J.POPUPS.Aliased.Sprite_Damage.set('setupCriticalEffect', Sprite_Damage.prototype.setupCriticalEffect);
Sprite_Damage.prototype.setupCriticalEffect = function()
{
  J.POPUPS.Aliased.Sprite_Damage.get('setupCriticalEffect')
    .call(this);

  // confirm this is indeed a critical popup.
  this._j._popups._isCritical = true;

  // make the critical red flash stronger.
  this._flashColor[3] = 240;

  // extend the duration for all to see your critical glory!
  this.addDuration(60);
};
//endregion Sprite_Damage