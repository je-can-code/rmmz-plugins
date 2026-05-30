//region Window_Selectable
/**
 * Extends {@link #processCursorMove}.<br/>
 * Also recognizes custom D-Pad symbols for menu navigation.
 */
J.ABS.EXT.INPUT.Aliased.Window_Selectable.set('processCursorMove', Window_Selectable.prototype.processCursorMove,);
Window_Selectable.prototype.processCursorMove = function()
{
  // preserve the current index before movement.
  const lastIndex = this.index();

  // perform the original logic (stock up/down/left/right + analog, etc.).
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Window_Selectable.get("processCursorMove").call(this);

  // if the index changed, the original already handled input; exit.
  if (this.index() !== lastIndex)
  {
    return;
  }

  // if this window cannot move the cursor, then do nothing further.
  if (this.isCursorMovable() === false)
  {
    return;
  }

  // check repeat state for each direction using the custom D-Pad symbols.
  const repDown = Input.isRepeated(J.ABS.EXT.INPUT.Symbols.DPadDown);
  const repUp = Input.isRepeated(J.ABS.EXT.INPUT.Symbols.DPadUp);
  const repRight = Input.isRepeated(J.ABS.EXT.INPUT.Symbols.DPadRight);
  const repLeft = Input.isRepeated(J.ABS.EXT.INPUT.Symbols.DPadLeft);

  // if none are repeating, then there is nothing to do.
  if (repDown === false && repUp === false && repRight === false && repLeft === false)
  {
    return;
  }

  // check triggered state to maintain wrap behavior parity with stock logic.
  const trgDown = Input.isTriggered(J.ABS.EXT.INPUT.Symbols.DPadDown);
  const trgUp = Input.isTriggered(J.ABS.EXT.INPUT.Symbols.DPadUp);
  const trgRight = Input.isTriggered(J.ABS.EXT.INPUT.Symbols.DPadRight);
  const trgLeft = Input.isTriggered(J.ABS.EXT.INPUT.Symbols.DPadLeft);

  // process movement using the same directional ordering as the engine.
  if (repDown)
  {
    // move down; wrap if freshly triggered.
    this.cursorDown(trgDown);
  }
  else if (repUp)
  {
    // move up; wrap if freshly triggered.
    this.cursorUp(trgUp);
  }
  else if (repRight)
  {
    // move right; wrap if freshly triggered.
    this.cursorRight(trgRight);
  }
  else if (repLeft)
  {
    // move left; wrap if freshly triggered.
    this.cursorLeft(trgLeft);
  }

  // if movement occurred, play the cursor sound to mirror stock behavior.
  if (this.index() !== lastIndex)
  {
    SoundManager.playCursor();
  }
};
//endregion Window_Selectable