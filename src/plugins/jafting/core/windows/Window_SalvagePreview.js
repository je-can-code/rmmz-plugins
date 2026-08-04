//region Window_SalvagePreview
import JaftingSalvageManager from './../managers/JaftingSalvageManager.js';

/**
 * Refund breakdown for the highlighted salvage candidate—icons and name colors match standard {@link Window_Base}
 * item drawing so the pane reads like the rest of the engine menus.<br>
 * {@link Scene_JaftingSalvage} places this window full-height beside the list with a capped width;
 * {@link JaftingSalvageManager} expands nested `w`/`a` ledger rows into ingredients for display and payout.
 */
class Window_SalvagePreview
  extends Window_Base
{

  //region properties
  /**
   * Gets the refund two column.
   * @returns {boolean} The refundTwoColumn.
   */
  

  //region properties
  /**
   * Gets the dismantle amount.
   * @returns {number} The dismantleAmount.
   */
  dismantleAmount()
  {
    // hand back the dismantle amount.
    return this._dismantleAmount;
  }

  /**
   * Gets the datum.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|null} The datum.
   */
  datum()
  {
    // hand back the datum.
    return this._datum;
  }
  //endregion properties

  /**
   * @param {Rectangle} rect Window geometry (repositioned by {@link Scene_JaftingSalvage#layoutSalvagePanels}).
   */

  isRefundTwoColumn()
  {
    // hand back the refund two column.
    return this._refundTwoColumn;
  }

  /**
   * Sets the refund two column.
   * @param {boolean} newRefundTwoColumn The new refundTwoColumn.
   */
  setRefundTwoColumn(newRefundTwoColumn)
  {
    // assign the refund two column.
    this._refundTwoColumn = newRefundTwoColumn;
  }
  //endregion properties

  constructor(rect)
  {
    super(rect);
    this._datum = null;
    this._dismantleAmount = 1;
    // store  refund two column on the instance for later reads.
    this._refundTwoColumn = false;
  }

  /**
   * When true, refund rows render in two columns so more components fit without scrolling.
   *
   * @param {boolean} flag The flag driving this step.
   */
  setRefundTwoColumnMode(flag)
  {
    this.setRefundTwoColumn(flag === true);
  }

  /**
   * How many stamped units one confirm action dismantles (must match {@link Scene_JaftingSalvage.DismantleBatchSize}).
   *
   * @param {number} amount The amount driving this step.
   */
  setDismantleAmount(amount)
  {
    if (amount < 1)
    {
      this._dismantleAmount = 1;
    }
    else
    {
      // store  dismantle amount on the instance for later reads.
      this._dismantleAmount = amount;
    }
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null} datum The datum driving this step.
   */
  setDatum(datum)
  {
    this._datum = datum;
    this.refresh();
  }

  /**
   * Renders stack context, dismantle batch size, and scaled refund lines (expanded snapshot).
   */
  refresh()
  {
    // refreshes can beat window open—ensure contents exist before drawing preview lines.
    if (!this.contents)
    {
      this.createContents();
    }

    this.contents.clear();

    if (this.datum() === null || this.datum() === undefined)
    {
      this.drawText('Select an item to preview refunds.', 0, 0, this.contentsWidth(), 'left');

      // exit early without a payload.
      return;
    }

    const raw = JaftingSalvageManager.getLedgerForDatum(this.datum());

    if (!raw || !raw.rows || raw.rows.length === 0)
    {
      this.drawText('Nothing recoverable is stamped on this item.', 0, 0, this.contentsWidth(), 'left');

      // exit early without a payload.
      return;
    }

    const snap = JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(this.datum());

    if (!snap || !snap.rows || snap.rows.length === 0)
    {
      this.drawText(
        'Stamped, but every weapon/armor line was vendor-only—nothing returns when dismantled.',
        0,
        0,
        this.contentsWidth(),
        'left',
      );

      // exit early without a payload.
      return;
    }

    const visibleRows = Window_SalvagePreview.collectNonBannedRows(snap.rows);

    const stack = $gameParty.numItems(this.datum());
    const batch = this.dismantleAmount();
    let y = 0;
    const lh = this.lineHeight();
    const countCol = 72;
    const nameW = this.contentsWidth() - countCol;

    this.changeTextColor(ColorManager.systemColor());
    this.drawText('Selected item', 0, y, this.contentsWidth(), 'left');
    y += lh;
    this.resetTextColor();
    this.drawItemName(this.datum(), 0, y, nameW);
    this.drawText(`×${stack}`, nameW, y, countCol, 'right');
    y += lh;

    this.changeTextColor(ColorManager.systemColor());

    if (batch === 1)
    {
      this.drawText('Refund after dismantling ×1 unit:', 0, y, this.contentsWidth(), 'left');
    }
    else
    {
      this.drawText(`Refund after dismantling ×${batch} units:`, 0, y, this.contentsWidth(), 'left');
    }

    y += lh;
    this.resetTextColor();

    this.paintExpandedRefundRows(y, visibleRows, batch, lh, countCol, nameW);
  }

  /**
   * @param {object[]} rows The rows driving this step.
   * @returns {object[]}
   */
  static collectNonBannedRows(rows)
  {
    const out = [];

    for (let i = 0; i < rows.length; i++)
    {
      const row = rows[i];

      if (row.banned === true)
      {
        continue;
      }

      // Append the row to the working collection.
      out.push(row);
    }

    return out;
  }

  /**
   * @param {number} y The y driving this step.
   * @param {object[]} visibleRows The visible rows driving this step.
   * @param {number} batch The batch driving this step.
   * @param {number} lh The lh driving this step.
   * @param {number} countCol The count col driving this step.
   * @param {number} nameW The name w driving this step.
   */
  paintExpandedRefundRows(y, visibleRows, batch, lh, countCol, nameW)
  {
    if (this.isRefundTwoColumn() === false)
    {
      this.paintExpandedRefundRowsSingle(y, visibleRows, batch, lh, countCol, nameW);

      // exit early without a payload.
      return;
    }

    this.paintExpandedRefundRowsDouble(y, visibleRows, batch, lh);
  }

  /**
   * @param {number} y The y driving this step.
   * @param {object[]} visibleRows The visible rows driving this step.
   * @param {number} batch The batch driving this step.
   * @param {number} lh The lh driving this step.
   * @param {number} countCol The count col driving this step.
   * @param {number} nameW The name w driving this step.
   */
  paintExpandedRefundRowsSingle(y, visibleRows, batch, lh, countCol, nameW)
  {
    let yy = y;
    let rendered = 0;

    for (let i = 0; i < visibleRows.length; i++)
    {
      if (yy + lh > this.contentsHeight())
      {
        break;
      }

      yy = this.drawLedgerRefundRow(visibleRows[i], 0, yy, batch, lh, countCol, nameW, this.contentsWidth());
      rendered++;
    }

    if (rendered < visibleRows.length && yy + lh <= this.contentsHeight())
    {
      const more = visibleRows.length - rendered;

      this.changeTextColor(ColorManager.systemColor());
      this.drawText(`+${more} more refunds.`, 0, yy, this.contentsWidth(), 'left');
      this.resetTextColor();
    }
  }

  /**
   * @param {number} y The y driving this step.
   * @param {object[]} visibleRows The visible rows driving this step.
   * @param {number} batch The batch driving this step.
   * @param {number} lh The lh driving this step.
   */
  paintExpandedRefundRowsDouble(y, visibleRows, batch, lh)
  {
    let yy = y;
    const gutter = 12;
    const colW = Math.floor((this.contentsWidth() - gutter) / 2);
    const ccL = Math.min(56, Math.floor(colW * 0.28));
    const nwL = colW - ccL;
    const ccR = Math.min(56, Math.floor(colW * 0.28));
    const nwR = colW - ccR;
    let rendered = 0;

    for (let i = 0; i < visibleRows.length; i += 2)
    {
      if (yy + lh > this.contentsHeight())
      {
        break;
      }

      const rowL = visibleRows[i];
      const rowR = visibleRows[i + 1];
      const rowY = yy;

      yy = this.drawLedgerRefundRow(rowL, 0, rowY, batch, lh, ccL, nwL, colW);
      rendered++;

      if (rowR)
      {
        this.drawLedgerRefundRow(rowR, colW + gutter, rowY, batch, lh, ccR, nwR, colW);
        rendered++;
      }

      yy += lh;
    }

    if (rendered < visibleRows.length && yy + lh <= this.contentsHeight())
    {
      const more = visibleRows.length - rendered;

      this.changeTextColor(ColorManager.systemColor());
      this.drawText(`+${more} more refunds.`, 0, yy, this.contentsWidth(), 'left');
      this.resetTextColor();
    }
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static previewContentLineCount(datum)
  {
    return JaftingSalvageManager.layoutPreviewLineCountSingle(datum);
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static previewContentLineCountTwoColumn(datum)
  {
    return JaftingSalvageManager.layoutPreviewLineCountTwoColumn(datum);
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static countVisibleRefundRowsForDatum(datum)
  {
    return JaftingSalvageManager.visibleExpandedRefundRowCount(datum);
  }

  /**
   * @param {{ t: string, id: number, n: number, banned?: boolean }} row
   * @param {number} baseX The base x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} dismantleBatch The dismantle batch driving this step.
   * @param {number} lh The lh driving this step.
   * @param {number} countCol The count col driving this step.
   * @param {number} nameW The name w driving this step.
   * @param {number} colInnerW width budget for this column (drawItemName + count).
   * @returns {number} next Y below this row.
   */
  drawLedgerRefundRow(row, baseX, y, dismantleBatch, lh, countCol, nameW, colInnerW)
  {
    const qty = row.n * dismantleBatch;
    const nameWClamped = Math.max(40, colInnerW - countCol);

    if (row.t === 'i' || row.t === 'w' || row.t === 'a')
    {
      const datum = Window_SalvagePreview.databaseDatumForRow(row);

      if (datum === null || datum === undefined)
      {
        this.drawText(`(missing) ×${qty}`, baseX, y, colInnerW, 'left');

        return y + lh;
      }

      this.drawItemName(datum, baseX, y, nameWClamped);
      this.drawText(`×${qty}`, baseX + nameWClamped, y, countCol, 'right');

      return y + lh;
    }

    if (row.t === 'g')
    {
      this.drawCurrencyValue(String(qty), TextManager.currencyUnit, baseX, y, colInnerW);

      return y + lh;
    }

    if (row.t === 's')
    {
      this.changeTextColor(ColorManager.systemColor());
      this.drawText(TextManager.sdpPoints(), baseX, y, colInnerW - countCol, 'left');
      this.resetTextColor();
      this.drawText(String(qty), baseX + nameWClamped, y, countCol, 'right');

      return y + lh;
    }

    this.drawText(`Unknown ×${qty}`, baseX, y, colInnerW, 'left');

    return y + lh;
  }

  /**
   * @param {{ t: string, id: number, n: number }} row
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor|null}
   */
  static databaseDatumForRow(row)
  {
    if (row.t === 'i')
    {
      return $dataItems[row.id];
    }

    if (row.t === 'w')
    {
      return $dataWeapons[row.id];
    }

    if (row.t === 'a')
    {
      return $dataArmors[row.id];
    }

    return null;
  }
}

export default Window_SalvagePreview;

//endregion Window_SalvagePreview