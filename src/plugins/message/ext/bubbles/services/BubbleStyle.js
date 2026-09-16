//region BubbleStyle
/**
 * What a bubble looks like, decided by the Background dropdown an author already filled in.
 *
 * Every Show Text command in the engine carries one, and it has meant the same three things since
 * MV: a window, a dimmed backdrop, or nothing at all. A floating message is still a message, so
 * those three still mean something - they just have to mean it about a bubble rather than about a
 * windowskin. Reusing the dropdown is what makes that free: an author who wanted a hush on a line
 * already said so years ago, and nobody has to learn a new code.
 *
 * - **Window** is the ordinary bubble.
 * - **Dim** is the same bubble, greyed and half see-through. It reads as inner thought, or as a
 *   line somebody is not quite saying out loud.
 * - **Transparent** draws no bubble at all - the text simply floats above the speaker with the map
 *   behind it. The message still positions itself over them; only the backdrop is gone.
 */
class BubbleStyle
{
  /**
   * The Background value meaning an ordinary window.
   * @type {number}
   */
  static WindowBackground = 0;

  /**
   * The Background value meaning a dimmed backdrop.
   * @type {number}
   */
  static DimBackground = 1;

  /**
   * The colour an ordinary bubble is filled with.
   * @type {number}
   */
  static FillColor = 0x121826;

  /**
   * How opaque an ordinary bubble's fill is.
   * @type {number}
   */
  static FillAlpha = 0.92;

  /**
   * The colour an ordinary bubble is outlined in.
   * @type {number}
   */
  static BorderColor = 0xf2f4f8;

  /**
   * The colour a dimmed bubble is filled with.
   *
   * Greyer than the ordinary fill rather than merely fainter. Dropping the opacity alone lets the
   * map's own colour come through and tint the bubble differently in every room, which reads as a
   * rendering fault rather than as a deliberate hush.
   * @type {number}
   */
  static DimFillColor = 0x232830;

  /**
   * How opaque a dimmed bubble's fill is.
   * @type {number}
   */
  static DimFillAlpha = 0.58;

  /**
   * The colour a dimmed bubble is outlined in.
   * @type {number}
   */
  static DimBorderColor = 0x8d95a3;

  /**
   * The colour a speaker's name is drawn in, as the CSS string text rendering deals in.
   * @type {string}
   */
  static LegendColor = '#f2f4f8';

  /**
   * The colour a dimmed speaker's name is drawn in.
   *
   * Greyed alongside the border it sits in. A legend left at full brightness inside a hushed bubble
   * is the only loud thing on it, which puts the emphasis on the nameplate rather than on the line.
   * @type {string}
   */
  static DimLegendColor = '#8d95a3';

  /**
   * How a bubble should be drawn for a given Background value.
   * @param {number} background The Show Text command's Background value.
   * @returns {{drawn: boolean, bordered: boolean, fillColor: number, fillAlpha: number, borderColor: number,
   * legendColor: string}}
   */
  static forBackground(background)
  {
    if (background === BubbleStyle.DimBackground)
    {
      return {
        drawn: true,
        // no outline at all, which is most of what separates a hush from a statement. An edge is
        // what makes a bubble read as an object somebody is holding up; a soft translucent shape
        // with no edge reads as something happening inside a head rather than in the room.
        bordered: false,
        fillColor: BubbleStyle.DimFillColor,
        fillAlpha: BubbleStyle.DimFillAlpha,
        borderColor: BubbleStyle.DimBorderColor,
        legendColor: BubbleStyle.DimLegendColor,
      };
    }

    // anything that is not a window and not a dim is the engine's "transparent", and an author who
    // asked for no backdrop on a bubble gets exactly that: floating text over the map. The colours
    // still come back rather than being nulled out, because "what colour is a thing nobody draws"
    // is a question with no answer and a caller should not have to have one ready.
    const drawn = background === BubbleStyle.WindowBackground;

    return {
      drawn,
      bordered: true,
      fillColor: BubbleStyle.FillColor,
      fillAlpha: BubbleStyle.FillAlpha,
      borderColor: BubbleStyle.BorderColor,
      legendColor: BubbleStyle.LegendColor,
    };
  }
}

export default BubbleStyle;
//endregion BubbleStyle