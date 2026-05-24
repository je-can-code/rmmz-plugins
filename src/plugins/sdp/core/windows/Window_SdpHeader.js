//region Window_SdpHeader
import StatDistributionPanel from './../__models/StatDistributionPanel.js';
/**
 * A single-line, help-like header that summarizes the hovered panel.
 * Name + rarity + flavor in one readable sentence, controller-first.
 */
class Window_SdpHeader
  extends Window_Base
{
  /**
   * @type {StatDistributionPanel|null}
   */
  #panel = null;

  /**
   * Binds the hovered panel to this header.
   * @param {StatDistributionPanel|null} panel The hovered panel.
   */
  setPanel(panel)
  {
    this.#panel = panel;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br>
   * Renders the single-line summary for the hovered panel.
   */
  drawContent()
  {
    const panel = this.#panel;
    if (!panel)
    {
      return;
    }

    const { name } = panel;
    const { topFlavorText: flavor } = panel;

    // line 1: the panel name should be the anchor and larger.
    // for drawTextEx, we must use text wrappers (\\FS, \\C, \\*) instead of bitmap font mutation.
    this.resetFontSettings();
    const rarityCx = panel.getPanelRarityColorIndex();
    const boldName = `\\*${name}\\*`;
    const tintedName = this.colorizeText(rarityCx, boldName);
    const sizedName = this.modFontSizeForText(2, tintedName);
    this.drawTextEx(sizedName, 0, 0, this.innerWidth);
    this.resetFontSettings();

    // line 2: flavor text, slightly smaller, escape-code aware.
    this.resetFontSettings();
    const sizedFlavor = this.modFontSizeForText(-1, flavor);
    this.drawTextEx(sizedFlavor, 0, this.lineHeight(), this.innerWidth);
    this.resetFontSettings();
  }
}
export default Window_SdpHeader;
//endregion Window_SdpHeader