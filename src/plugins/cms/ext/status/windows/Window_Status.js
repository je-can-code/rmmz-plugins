//region Window_Status
/**
 * Overwrites {@link #drawBlock1}.<br/>
 * Renders the actor name and class without the nickname.
 */
Window_Status.prototype.drawBlock1 = function()
{
  // grab the y coordinate.
  const y = this.block1Y();

  // draw the components.
  this.drawActorName(this.actor(), 0, y, 168);
  this.drawActorClass(this.actor(), 204, y, 168);

  // don't draw the nickname.
};

/**
 * Overwrites {@link #drawBlock2}.<br/>
 * Renders the actor face, basic info, and experience at non-default positioning.
 */
Window_Status.prototype.drawBlock2 = function()
{
  // grab the y coordinate.
  const y = this.block2Y();

  // draw the components.
  this.drawActorFace(this.actor(), 12, y);
  this.drawBasicInfo(204, y);
  this.drawExpInfo(0, y + 250);
};
//endregion Window_Status