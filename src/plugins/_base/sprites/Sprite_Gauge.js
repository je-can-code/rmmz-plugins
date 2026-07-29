//region Sprite_Gauge
/**
 * Gets the battler this gauge is currently bound to.
 * @returns {Game_Battler} The battler.
 */
Sprite_Gauge.prototype.battler = function()
{
  // hand back the battler this gauge is currently bound to.
  return this._battler;
};

/**
 * Sets the battler this gauge is currently bound to.
 * @param {Game_Battler} newBattler The new battler.
 */
Sprite_Gauge.prototype.setBattler = function(newBattler)
{
  // assign the battler this gauge is currently bound to.
  this._battler = newBattler;
};

/**
 * Gets which resource this gauge renders, such as "hp" or "mp".
 * @returns {string} The statusType.
 */
Sprite_Gauge.prototype.statusType = function()
{
  // hand back which resource this gauge renders, such as "hp" or "mp".
  return this._statusType;
};

/**
 * Sets which resource this gauge renders, such as "hp" or "mp".
 * @param {string} newStatusType The new statusType.
 */
Sprite_Gauge.prototype.setStatusType = function(newStatusType)
{
  // assign which resource this gauge renders, such as "hp" or "mp".
  this._statusType = newStatusType;
};

/**
 * Gets the current value this gauge is rendering.
 * @returns {number} The value.
 */
Sprite_Gauge.prototype.value = function()
{
  // hand back the current value this gauge is rendering.
  return this._value;
};

/**
 * Sets the current value this gauge is rendering.
 * @param {number} newValue The new value.
 */
Sprite_Gauge.prototype.setValue = function(newValue)
{
  // assign the current value this gauge is rendering.
  this._value = newValue;
};

/**
 * Gets the maximum value this gauge is rendering.
 * @returns {number} The maxValue.
 */
Sprite_Gauge.prototype.maxValue = function()
{
  // hand back the maximum value this gauge is rendering.
  return this._maxValue;
};

/**
 * Sets the maximum value this gauge is rendering.
 * @param {number} newMaxValue The new maxValue.
 */
Sprite_Gauge.prototype.setMaxValue = function(newMaxValue)
{
  // assign the maximum value this gauge is rendering.
  this._maxValue = newMaxValue;
};
//endregion Sprite_Gauge
