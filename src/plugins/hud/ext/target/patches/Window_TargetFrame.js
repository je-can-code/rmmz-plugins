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

    // line up with the battler gauge column (same x as drawTargetBattlerInfo).
    layout.originX = 32;
    layout.originY = this.targetBattlerGaugesY() + ImageManager.iconHeight;

    // extra breathing room so the positive row clears the negative row timer text.
    layout.rowGap = 24;

    return layout;
  };

  /**
   * Updates affliction rows every frame while a battler is framed.
   */
  Window_TargetFrame.prototype.updateTargetAfflictions = function()
  {
    if (!this._afflictionPresenter)
    {
      return;
    }

    if (!this._j._battler)
    {
      return;
    }

    if (this._j._inactivityTimer < 60)
    {
      return;
    }

    const layout = this.targetAfflictionLayoutSpec();

    this._afflictionPresenter.render(this._j._battler, layout);
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
//endregion Window_TargetFrame afflictions