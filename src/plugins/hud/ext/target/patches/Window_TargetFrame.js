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
   * Builds the layout spec for target frame affliction rows.
   * @returns {StateAfflictionHudLayoutSpec}
   */
  Window_TargetFrame.prototype.targetAfflictionLayoutSpec = function()
  {
    const layout = new StateAfflictionHudLayoutSpec();

    // base indent keeps afflictions off the window's left edge.
    layout.originX = 32;

    // when a family/type icon is drawn to the left of the afflictions, push them
    // right by one icon width so they don't crowd against the icon.
    if (this.hasTargetIcon())
    {
      layout.originX += ImageManager.iconWidth;
    }

    // gauge stack: HP at+0, MP at+22; each gauge is 16px tall.
    // MP ends at +38; add 6px gap = +44.
    layout.originY = this.targetBattlerGaugesY() + 44;

    // extra breathing room so the positive row clears the negative row timer text.
    layout.rowGap = 24;

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