//region Window_EquipControlsHint
/**
 * A single-line controller hint for the equip scene.
 * Sits beside {@link Window_EquipActorRibbon} in the row above the parameter catalog.
 */
class Window_EquipControlsHint
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The dimensions of the window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
  }

  /**
   * Re-renders the static controller hint.
   */
  refresh()
  {
    this.contents.clear();
    this.drawControllerHint();
  }

  /**
   * Draws the controller-first legend for equip/unequip/back.
   */
  drawControllerHint()
  {
    // pull away from the chrome edges slightly so it reads like helper chrome.
    const padX = 12;

    // shrink so it fits comfortably without stealing vertical pixels from the panel lists.
    this.resetFontSettings();
    this.modFontSize(-4);

    // avoid palette picks that can disappear on darker skins; still lighter than body copy via size alone.
    this.changeTextColor(ColorManager.normalColor());

    const text = 'OK: Equip    Cancel: Back    Triangle: Unequip';

    const y = Math.max(0, Math.floor((this.innerHeight - this.lineHeight()) / 2));
    this.drawText(text, padX, y, this.innerWidth - padX * 2, 'center');
    this.resetFontSettings();
  }
}

export default Window_EquipControlsHint;
//endregion Window_EquipControlsHint
