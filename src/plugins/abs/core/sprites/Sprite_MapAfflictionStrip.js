//region Sprite_MapAfflictionStrip
import Sprite_MapAfflictionSlot from './Sprite_MapAfflictionSlot.js';
import StateAfflictionMapLayoutConfig from '../models/StateAfflictionMapLayoutConfig.js';
import StateAfflictionProvider from '../models/StateAfflictionProvider.js';

/**
 * Dual-row affliction icons and gauges below a map battler hp gauge.
 */
class Sprite_MapAfflictionStrip
  extends Sprite
{
  /**
   * The battler this strip tracks.
   * @type {Game_Battler|null}
   */
  #battler = null;

  /**
   * Negative-row slot sprites.
   * @type {Sprite_MapAfflictionSlot[]}
   */
  #negativeSlots = [];

  /**
   * Positive-row slot sprites.
   * @type {Sprite_MapAfflictionSlot[]}
   */
  #positiveSlots = [];

  /**
   * The active layout config.
   * @type {StateAfflictionMapLayoutConfig|null}
   */
  #layoutConfig = null;

  /**
   * Binds this strip to a battler.
   * @param {Game_Battler} battler The afflicted battler.
   */
  setupBattler(battler)
  {
    this.#battler = battler;
    this.#layoutConfig = StateAfflictionMapLayoutConfig.fromMetadata();
  }

  /**
   * Refreshes slot data from the provider and lays out visible rows.
   */
  updateStrip()
  {
    if (!this.#battler)
    {
      this.hide();
      return;
    }

    const collection = StateAfflictionProvider.collectForBattler(this.#battler);

    if (collection.isEmpty() === true)
    {
      this.hideAllSlots(this.#negativeSlots);
      this.hideAllSlots(this.#positiveSlots);
      this.hide();
      return;
    }

    const maxSlots = this.resolveMaxSlots();
    const negativeRows = collection.negative.slice(0, maxSlots);
    const positiveRows = collection.positive.slice(0, maxSlots);
    const hasNegative = negativeRows.length > 0;
    const hasPositive = positiveRows.length > 0;
    const rowPitch = this.#layoutConfig.rowPitchY();
    const negativeY = 0;
    const positiveY = hasNegative === true
      ? rowPitch
      : 0;

    if (hasNegative === true)
    {
      this.layoutRow(negativeRows, this.#negativeSlots, negativeY);
    }
    else
    {
      this.hideAllSlots(this.#negativeSlots);
    }

    if (hasPositive === true)
    {
      this.layoutRow(positiveRows, this.#positiveSlots, positiveY);
    }
    else
    {
      this.hideAllSlots(this.#positiveSlots);
    }

    this.show();
  }

  /**
   * Ensures the slot pool matches the requested visible count.
   * @param {Sprite_MapAfflictionSlot[]} pool The row slot pool.
   * @param {number} visibleCount The number of visible slots required.
   */
  reconcileSlots(pool, visibleCount)
  {
    while (pool.length < visibleCount)
    {
      const slot = new Sprite_MapAfflictionSlot();

      pool.push(slot);
      this.addChild(slot);
    }

    for (let index = 0; index < pool.length; index++)
    {
      const slot = pool[index];

      if (index < visibleCount)
      {
        slot.show();
      }
      else
      {
        slot.hide();
      }
    }
  }

  /**
   * Binds view models and positions each visible slot left-to-right.
   * @param {StateAfflictionViewModel[]} rows The active affliction rows.
   * @param {Sprite_MapAfflictionSlot[]} pool The row slot pool.
   * @param {number} rowY The y coordinate for this row.
   */
  layoutRow(rows, pool, rowY)
  {
    const layoutConfig = this.#layoutConfig;
    let cursorX = 0;

    this.reconcileSlots(pool, rows.length);

    for (let index = 0; index < rows.length; index++)
    {
      const row = rows[index];
      const slot = pool[index];

      slot.setup(row, layoutConfig);
      slot.placeAt(cursorX, rowY);

      cursorX += layoutConfig.slotPitch;
    }
  }

  /**
   * Resolves a safe per-row slot cap even when metadata parsing produced a bad number.
   * @returns {number}
   */
  resolveMaxSlots()
  {
    const { maxSlots } = this.#layoutConfig;

    if (Number.isFinite(maxSlots) === false || maxSlots < 1)
    {
      return 8;
    }

    return maxSlots;
  }

  /**
   * Hides every slot in a row pool.
   * @param {Sprite_MapAfflictionSlot[]} pool The row slot pool.
   */
  hideAllSlots(pool)
  {
    for (const slot of pool)
    {
      slot.hide();
    }
  }
}

export default Sprite_MapAfflictionStrip;
//endregion Sprite_MapAfflictionStrip
