//region Game_Party
/**
 * Extends {@link #initialize}.<br>
 * Adds a hook for omnipedia extensions to initialize their members.
 */
J.OMNI.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.OMNI.Aliased.Game_Party.get('initialize')
    .call(this);

  // initialize all omnipedia-related members.
  this.initOmnipediaMembers();
};

/**
 * Initializes all members related to the omnipedia.
 */
Game_Party.prototype.initOmnipediaMembers = function()
{
};

/**
 * Determines whether or not the omnipedia has been initialized.
 * @returns {boolean}
 */
Game_Party.prototype.isOmnipediaInitialized = function()
{
  return !!this._j._omni;
};
//endregion Game_Party