//region Window_SalvageCandidateList
import JaftingSalvageManager from './../managers/JaftingSalvageManager.js';

/**
 * Lists inventory rows that currently carry a JAFTING salvage ledger.
 */
class Window_SalvageCandidateList
  extends Window_Selectable
{
  /**
   * @param {Rectangle} rect Window geometry.
   */
  constructor(rect)
  {
    super(rect);
    this._data = [];
  }

  /**
   * @returns {number}
   */
  maxItems()
  {
    return this._data.length;
  }

  /**
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|undefined}
   */
  item()
  {
    return this._data[this.index()];
  }

  /**
   * Rebuilds the backing datums from {@link JaftingSalvageManager.getSalvageCandidateDatums}.
   */
  makeItemList()
  {
    // anything lacking a ledger never appears—salvage stays honest about stamped gear only.
    this._data = JaftingSalvageManager.getSalvageCandidateDatums();
  }

  /**
   * Refreshes selectable entries.
   */
  refresh()
  {
    const prevIndex = this.index();

    // policy step inside refresh.
    this.makeItemList();

    // Invoke the aliased body with the original receiver.
    Window_Selectable.prototype.refresh.call(this);

    // after dismantle the list shrinks—clamp so `item()` stays valid and the preview can repaint.
    if (this.maxItems() < 1)
    {
      this.select(-1);

      // exit early without a payload.
      return;
    }

    // when prevIndex < 0, take this branch.
    if (prevIndex < 0)
    {
      this.select(0);

      // exit early without a payload.
      return;
    }

    // when prevIndex >= this.maxItems(), take this branch.
    if (prevIndex >= this.maxItems())
    {
      this.select(this.maxItems() - 1);
    }
  }

  /**
   * @param {number} index Draw index.
   */
  drawItem(index)
  {
    const datum = this._data[index];

    // when datum  equals  undefined  or  datum  equals  null, take this branch.
    if (datum === undefined || datum === null)
    {
      return;
    }

    // capture rect for downstream policy in this routine.
    const rect = this.itemLineRect(index);

    // policy step inside draw item.
    this.resetTextColor();
    this.changePaintOpacity(true);
    this.drawIcon(datum.iconIndex, rect.x + 2, rect.y + 2);
    this.drawText(datum.name, rect.x + 40, rect.y, rect.width - 40);
  }
}

export default Window_SalvageCandidateList;

//endregion Window_SalvageCandidateList