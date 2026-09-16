//region Window_ChatterLayout
/**
 * A message window that exists only to measure, and is never put on screen.
 *
 * Laying out a line into glyphs is something only a `Window_Message` knows how to do - the emission
 * lives in that prototype's own overrides, and the pass needs `contents` to measure against, a font
 * to measure in, and a line height to place baselines on. Chatter has none of that and must not
 * borrow the real one: going through `$gameMessage` would stop the interpreter and take the player's
 * input, which is the one thing chatter can never do.
 *
 * So it gets a window of its own, added to nothing, asked for `layoutMessageGlyphs` and nothing
 * else. The pass already saves and restores the two pieces of window state it disturbs, so the
 * instance is inert between calls.
 *
 * **It must be built lazily, on the map.** `Window_Base.initialize` reaches `updatePadding`, which
 * reads `$gameSystem.windowPadding()` - and `$gameSystem` does not exist until a game has started,
 * so one of these constructed at plugin load would boot to a stack trace.
 */
class Window_ChatterLayout
  extends Window_Message
{
  /**
   * How many lines tall the measuring window is.
   *
   * It is never seen, so this is only about the size of the bitmap the measuring happens against.
   * Four is what the editor allows a single Show Text command, which makes it the most any authored
   * line can need.
   * @type {number}
   */
  static LineCapacity = 4;

  /**
   * Where a line starts, horizontally.
   *
   * Vanilla's answer reads `$gameMessage.faceName()` and indents by the width of a face portrait
   * when there is one. A chatter line has no face, and it is being laid out while some completely
   * unrelated message may well be open - so inheriting that answer would indent every chatter line
   * in the game by the width of somebody else's portrait, and the four pixels it returns otherwise
   * are dead margin inside a bubble sized to its own text.
   * @param {RPG_TextState} _textState The text state being laid out.
   * @returns {number}
   */
  newLineX(_textState)
  {
    return 0;
  }
}

export default Window_ChatterLayout;
//endregion Window_ChatterLayout