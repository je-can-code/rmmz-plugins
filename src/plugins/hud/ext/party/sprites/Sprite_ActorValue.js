//region Sprite_ActorValue
/**
 * A sprite that monitors one of the primary fluctuating values (hp/mp/tp).
 */
function Sprite_ActorValue()
{
  this.initialize(...arguments);
}

Sprite_ActorValue.prototype = Object.create(Sprite.prototype);
Sprite_ActorValue.prototype.constructor = Sprite_ActorValue;
Sprite_ActorValue.prototype.initialize = function(actor, parameter, fontSizeMod = 0)
{
  this._j = {};
  Sprite.prototype.initialize.call(this);
  this.initMembers(actor, parameter, fontSizeMod);
  this.bitmap = this.createBitmap();
};

/**
 * Initializes the properties associated with this sprite.
 * @param {object} actor The actor to track the value of.
 * @param {string} parameter The parameter to track of "hp"/"mp"/"tp"/"time".
 * @param {number} fontSizeMod The modification of the font size for this value.
 */
Sprite_ActorValue.prototype.initMembers = function(actor, parameter, fontSizeMod)
{
  this._j._parameter = parameter;
  this._j._actor = actor;
  this._j._fontSizeMod = fontSizeMod;
  this._j._last = {};
  this._j._last._hp = actor.hp;
  this._j._last._mp = actor.mp;
  this._j._last._tp = actor.tp;
  this._j._last._xp = actor.currentExp();
  this._j._last._lvl = actor.level;
  this._j._autoCounter = 60;
};

/**
 * Updates the bitmap if it needs updating.
 */
Sprite_ActorValue.prototype.update = function()
{
  Sprite.prototype.update.call(this);
  if (this.hasParameterChanged())
  {
    this.refresh();
  }

  this.autoRefresh();
};

/**
 * Automatically refreshes the value being represented by this sprite
 * after a fixed amount of time.
 */
Sprite_ActorValue.prototype.autoRefresh = function()
{
  if (this._j._autoCounter <= 0)
  {
    this.refresh();
    this._j._autoCounter = 60;
  }

  this._j._autoCounter--;
};

/**
 * Refreshes the value being represented by this sprite.
 */
Sprite_ActorValue.prototype.refresh = function()
{
  this.bitmap = this.createBitmap();
};

/**
 * Checks whether or not a given parameter has changed.
 */
Sprite_ActorValue.prototype.hasParameterChanged = function()
{
  // default to "changed" in case we do not match a parameter.
  let changed = true;

  // decide which parameter we are tracking and compare against the cache.
  switch (this._j._parameter)
  {
    case 'hp':
    {
      // check for hp change.
      changed = this._j._actor.hp !== this._j._last._hp;

      // update the last-known hp if changed.
      if (changed) this._j._last._hp = this._j._actor.hp;

      // end case.
      return changed;
    }
    case 'mp':
    {
      // check for mp change.
      changed = this._j._actor.mp !== this._j._last._mp;

      // update the last-known mp if changed.
      if (changed) this._j._last._mp = this._j._actor.mp;

      // end case.
      return changed;
    }
    case 'tp':
    {
      // check for tp change.
      changed = this._j._actor.tp !== this._j._last._tp;

      // update the last-known tp if changed.
      if (changed) this._j._last._tp = this._j._actor.tp;

      // end case.
      return changed;
    }
    case 'time':
    {
      // compute the current exp for comparison.
      const current = this._j._actor.currentExp();

      // check for exp change.
      changed = current !== this._j._last._xp;

      // update the last-known exp if changed.
      if (changed) this._j._last._xp = current;

      // end case.
      return changed;
    }
    case 'lvl':
    {
      // check for level change.
      changed = this._j._actor.level !== this._j._last._lvl;

      // update the last-known level if changed.
      if (changed) this._j._last._lvl = this._j._actor.level;

      // end case.
      return changed;
    }
  }
};

/**
 * Creates a bitmap to attach to this sprite that shows the value.
 */
Sprite_ActorValue.prototype.createBitmap = function()
{
  // default the value to 0.
  let value = 0;

  // determine the bitmap dimensions.
  const width = this.bitmapWidth();

  // determine the bitmap height relative to font size.
  const height = this.fontSize() + 4;

  // create the bitmap for this value sprite.
  const bitmap = new Bitmap(width, height);

  // assign the font face for this value.
  bitmap.fontFace = this.fontFace();

  // assign the font size for this value.
  bitmap.fontSize = this.fontSize();

  // decide how to render based on the parameter being displayed.
  switch (this._j._parameter)
  {
    case 'hp':
    {
      // set the outline thickness for readability.
      bitmap.outlineWidth = 4;

      // set the red-tinted outline color for HP.
      bitmap.outlineColor = 'rgba(128, 24, 24, 1.0)';

      // display rounded HP to avoid off-by-one visuals against fractional HP.
      value = Math.round(this._j._actor.hp);

      // end case.
      break;
    }
    case 'mp':
    {
      // set the outline thickness for readability.
      bitmap.outlineWidth = 4;

      // set the blue-tinted outline color for MP.
      bitmap.outlineColor = 'rgba(24, 24, 192, 1.0)';

      // display rounded MP to align with fractional accumulation.
      value = Math.round(this._j._actor.mp);

      // end case.
      break;
    }
    case 'tp':
    {
      // set the outline thickness for readability.
      bitmap.outlineWidth = 2;

      // set the green-tinted outline color for TP.
      bitmap.outlineColor = 'rgba(64, 128, 64, 1.0)';

      // TP can change in non-integers under JABS; display rounded for consistency.
      value = Math.round(this._j._actor.tp);

      // end case.
      break;
    }
    case 'time':
    {
      // set the outline thickness for readability.
      bitmap.outlineWidth = 4;

      // set the neutral outline for XP remaining.
      bitmap.outlineColor = 'rgba(72, 72, 72, 1.0)';

      // compute exp remaining to next level.
      const curExp = (this._j._actor.nextLevelExp() - this._j._actor.currentLevelExp());

      // compute progress into the current level.
      const nextLv = (this._j._actor.currentExp() - this._j._actor.currentLevelExp());

      // calculate the remaining exp as a whole number.
      value = curExp - nextLv;

      // end case.
      break;
    }
    case 'lvl':
    {
      // set the outline thickness for readability.
      bitmap.outlineWidth = 4;

      // set the neutral outline for level text.
      bitmap.outlineColor = 'rgba(72, 72, 72, 1.0)';

      // display the level as a 3-digit number.
      value = this._j._actor.level.padZero(3);

      // end case.
      break;
    }
  }

  // draw the value left-aligned across the bitmap.
  bitmap.drawText(value, 0, 0, bitmap.width, bitmap.height, 'left');

  // return the created bitmap.
  return bitmap;
};

/**
 * Defaults the bitmap width to be a fixed 200 pixels.
 */
Sprite_ActorValue.prototype.bitmapWidth = function()
{
  return 200;
};

/**
 * Defaults the font size to be an adjusted amount from the base font size.
 */
Sprite_ActorValue.prototype.fontSize = function()
{
  return $gameSystem.mainFontSize() + this._j._fontSizeMod;
};

/**
 * Defaults the font face to be the number font.
 */
Sprite_ActorValue.prototype.fontFace = function()
{
  return $gameSystem.numberFontFace();
};
//endregion Sprite_ActorValue