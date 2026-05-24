//region Game_Character
/**
 * Hooks into the `Game_Character.initMembers` and adds in action sprite properties.
 */
J.POPUPS.Aliased.Game_Character.set('initMembers', Game_Character.prototype.initMembers);
Game_Character.prototype.initMembers = function()
{
  /**
   * The master reference to the `_j` object containing all plugin properties.
   * @type {{}}
   */
  this._j ||= {};

  /**
   * The text pops that are pending processing.
   * @type {Map_TextPop[]}
   */
  this._j._textPops = [];

  /**
   * Whether or not this character has a request for generating damage pops.
   * @type {boolean}
   */
  this._j._textPopRequest = false;

  // run the rest of the original logic.
  J.POPUPS.Aliased.Game_Character.get('initMembers')
    .call(this);
};

/**
 * Gets the `requestDamagePop` property from the `actionSpriteProperties` for this event.
 */
Game_Character.prototype.hasTextPops = function()
{
  if (J.POPUPS.Metadata.disablePopups === true) return false;

  return this._j._textPopRequest;
};

/**
 * Flags this character for requiring text pops to be processed.
 */
Game_Character.prototype.requestTextPop = function()
{
  if (J.POPUPS.Metadata.disablePopups === true) return;

  this._j._textPopRequest = true;
  J.POPUPS.notifyPopupFlushRequested(this);
};

/**
 * Acknowledges the request for generating text pops.
 */
Game_Character.prototype.acknowledgeTextPops = function()
{
  this._j._textPopRequest = false;
};

/**
 * Adds a text pop to this character.
 * @param {Map_TextPop} textPop A text pop that will be displayed on the map.
 */
Game_Character.prototype.addTextPop = function(textPop)
{
  if (J.POPUPS.Metadata.disablePopups === true) return;

  if (J.POPUPS.isValidTextPopForQueue(textPop) === false)
  {
    console.warn(
      `[${J.POPUPS.Metadata.name}] addTextPop rejected invalid Map_TextPop (bad type or layoutRing).`,
      textPop,
    );
    return;
  }

  this._j._textPops.push(textPop);
  J.POPUPS.notifyPopupQueued(this, textPop);
};

/**
 * Gets all currently waiting-to-be-processed text pops.
 * @returns {Map_TextPop[]}
 */
Game_Character.prototype.getTextPops = function()
{
  return this._j._textPops;
};

/**
 * Remove all text pops from the collection.
 */
Game_Character.prototype.emptyDamagePops = function()
{
  const textPops = this.getTextPops();

  textPops.splice(0, textPops.length);
};

/**
 * Preferred name for clearing the pending popup queue (same as emptyDamagePops).
 */
Game_Character.prototype.clearPendingTextPops = function()
{
  this.emptyDamagePops();
};
//endregion Game_Character