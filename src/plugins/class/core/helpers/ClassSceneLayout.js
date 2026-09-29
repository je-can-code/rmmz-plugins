//region ClassSceneLayout
/**
 * The spacing every window beside the class list shares, so the parameters and whatever an extension places
 * beside them can never drift apart.
 */
class ClassSceneLayout
{
  /**
   * How far in from each side the windows beside the list start and end their rows, as a share of each
   * window's contents width.
   *
   * Those windows are each about half the screen, and a row with its name against one edge and its numbers
   * against the other leaves a gulf between them. Drawing the rows a little way in pulls the two together.
   * @type {number}
   */
  static CONTENT_INSET_RATE = 0.1;

  /**
   * The height of a row in any window beside the list: the equip scene catalog's, so a stat sits at the same
   * size and spacing on both screens.
   *
   * It is shorter than the menus' standard row on purpose. A class with a long list of learnings needs every
   * row of the window beside the parameters, and at the standard height the last few fall off the bottom.
   * @type {number}
   */
  static ROW_HEIGHT = 32;

  /**
   * How much smaller than the menus' own type a row beside the list is drawn, suiting the shorter rows.
   * @type {number}
   */
  static ROW_FONT_REDUCTION = 2;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * How far in from each side a window beside the list draws its rows.
   * @param {Window_Base} window The window being laid out.
   * @returns {number}
   */
  static contentInset(window)
  {
    return Math.floor(window.contentsWidth() * this.CONTENT_INSET_RATE);
  }
}

export default ClassSceneLayout;
//endregion ClassSceneLayout