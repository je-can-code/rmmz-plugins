//region Window_TargetFrame afflictions
import Window_TargetFrame from '../windows/Window_TargetFrame.js';

if (J.HUD && J.HUD.EXT.TARGET)
{
  J.HUD.EXT.TARGET.Aliased.Window_TargetFrame.set('initialize', Window_TargetFrame.prototype.initialize);

  /**
   * Extends {@link Window_TargetFrame#initialize}.<br/>
   * Wires the shared affliction presenter after the target frame cache exists.
   * @param {Rectangle} rect The shape representing this window.
   */
  Window_TargetFrame.prototype.initialize = function(rect)
  {
    // perform original logic.
    J.HUD.EXT.TARGET.Aliased.Window_TargetFrame.get('initialize')
      .call(this, rect);

    /**
     * Shared affliction presenter for the framed battler.
     * @type {StateAfflictionHudPresenter}
     */
    this._afflictionPresenter = new StateAfflictionHudPresenter(this, this._j._spriteCache);
  };

  /**
   * Builds the layout spec for the target frame's affliction strip.<br/>
   * The frame keeps it compact: one row shared by debuffs and buffs, half-size icons, and a colored square
   * behind each icon to tell the two apart.
   * @returns {StateAfflictionHudLayoutSpec}
   */
  Window_TargetFrame.prototype.targetAfflictionLayoutSpec = function()
  {
    const layout = new StateAfflictionHudLayoutSpec();

    // the strip starts where the gauges do, so the two read as one column.
    layout.originX = this.targetBattlerGaugesX();

    // and it tucks in right under the last gauge the frame is showing.
    layout.originY = this.targetBattlerGaugesY() + this.targetGaugeStackHeight();

    // one shared row of half-size icons, each on a square colored by which side it is on.
    layout.singleRow = true;
    layout.iconScale = 0.5;
    layout.polarityBacking = true;

    // spaced so each timer fits under its own icon without running into the next one's.
    layout.iconPitch = 30;

    // the timers shrink with their icons, and tuck in right beneath them.
    layout.timerOffsetY = 5;
    layout.timerFontSizeReduction = 12;
    layout.stackFontSizeReduction = 12;

    return layout;
  };

  /**
   * Updates affliction rows every frame while a battler is framed.
   */
  Window_TargetFrame.prototype.updateTargetAfflictions = function()
  {
    if (!this.afflictionPresenter())
    {
      return;
    }

    if (!this.battler())
    {
      return;
    }

    if (this.inactivityTimer() < 60)
    {
      return;
    }

    const layout = this.targetAfflictionLayoutSpec();

    this.afflictionPresenter().render(this.battler(), layout);
  };

  J.HUD.EXT.TARGET.Aliased.Window_TargetFrame.set('updateTarget', Window_TargetFrame.prototype.updateTarget);
  Window_TargetFrame.prototype.updateTarget = function()
  {
    // perform original logic.
    J.HUD.EXT.TARGET.Aliased.Window_TargetFrame.get('updateTarget')
      .call(this);

    this.updateTargetAfflictions();
  };
}

//region properties
/**
 * Gets the affliction presenter.
 * @returns {StateAfflictionHudPresenter} The afflictionPresenter.
 */
Window_TargetFrame.prototype.afflictionPresenter = function()
{
  // hand back the affliction presenter.
  return this._afflictionPresenter;
};

/**
 * Gets the battler currently displayed in the target frame.
 * @returns {JABS_Battler} The displayed battler.
 */
Window_TargetFrame.prototype.battler = function()
{
  // hand back the battler.
  return this._j._battler;
};

/**
 * Gets the inactivity timer.
 * @returns {number} The inactivityTimer.
 */
Window_TargetFrame.prototype.inactivityTimer = function()
{
  // hand back the inactivity timer.
  return this._j._inactivityTimer;
};
//endregion properties
//endregion Window_TargetFrame afflictions