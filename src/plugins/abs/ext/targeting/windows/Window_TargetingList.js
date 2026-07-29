//region Window_TargetingList
/**
 * A passive list window showing every eligible battler in a cycle-select targeting session.<br/>
 * Purely a visual aid — it never processes its own input/navigation. The manager drives which
 * entry is highlighted by calling {@link #select} whenever the cycle selection changes.
 */
class Window_TargetingList
  extends Window_Command
{
  /**
   * How many font sizes smaller than normal the list entries render at.
   * @type {number}
   */
  

  //region properties
  /**
   * Gets the candidates.
   * @returns {*} The candidates.
   */
  candidates()
  {
    // hand back the candidates.
    return this._candidates;
  }
  //endregion properties

  static FontSizeDelta = -8;

  /**
   * Constructor.
   * @param {Rectangle} rect The shape of this window.
   */
  constructor(rect)
  {
    // perform original logic; this also calls `makeCommandList()` before `_candidates` exists,
    // hence the guard at the top of that method below.
    super(rect);

    // this window is purely a display; it never drives its own input.
    this.deactivate();
  }

  /**
   * Rebuilds the list from the given candidate battlers.
   * @param {JABS_Battler[]} candidates The eligible battlers to list.
   */
  setCandidates(candidates)
  {
    this._candidates = candidates;
    this.refresh();
  }

  /**
   * Extends {@link Window_Command#makeCommandList}.<br/>
   * Builds one command per eligible battler, rendered smaller than normal.
   */
  makeCommandList()
  {
    // this runs once during `super(rect)`, before `_candidates` is ever assigned; nothing to
    // list yet, `setCandidates()` will trigger the real build once the session begins.
    if (!this.candidates()) return;

    // one command per eligible battler, name rendered smaller than normal.
    this.candidates().forEach(candidate =>
    {
      const name = this.modFontSizeForText(Window_TargetingList.FontSizeDelta, candidate.battlerName());
      this.addCommand(name, candidate.getUuid(), true, candidate);
    });
  }
}

export default Window_TargetingList;

//endregion Window_TargetingList
