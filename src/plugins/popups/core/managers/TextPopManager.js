//region TextPopManager
/**
 * A static utility providing the canonical dispatch pattern for map popups.
 * All popup extensions should route through here rather than calling
 * addTextPop / requestTextPop directly, so the dispatch point stays singular.
 */
class TextPopManager
{
  /**
   * Adds a single popup to a character and flags the flush request.
   * @param {Map_TextPop} pop The popup to display.
   * @param {Game_Character} character The character to anchor the popup on.
   */
  static show(pop, character)
  {
    character.addTextPop(pop);
    character.requestTextPop();
  }

  /**
   * Adds multiple popups to a character, then flags a single flush request.
   * Prefer this over calling show() in a loop to avoid redundant flush signals.
   * @param {Map_TextPop[]} pops The popups to display.
   * @param {Game_Character} character The character to anchor the popups on.
   */
  static showBatch(pops, character)
  {
    pops.forEach(pop => character.addTextPop(pop));
    character.requestTextPop();
  }
}
//endregion TextPopManager