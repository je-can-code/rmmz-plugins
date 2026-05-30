//region Window_RefinementDetails
import JaftingManager from './../managers/JaftingManager.js';
import JAFTING_Trait from './../__models/JAFTING_Trait.js';

/**
 * The window containing the chosen equips for refinement and also the projected results.
 */
class Window_RefinementDetails
  extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    this.initMembers();
    // assign opacity on this instance for callers.
    this.opacity = 220;
  }

  /**
   * Initializes all members of this window.
   */
  initMembers()
  {
    /**
     * The primary equip that is the refinement target.
     * Traits from the secondary equip will be transfered to this equip.
     // policy step inside init members.
     * @type {RPG_EquipItem}
     */
    this._primaryEquip = null;

    // policy step inside init members.
    /**
     * The secondary equip that is the refinement material.
     * The transferable traits on this equip will be transfered to the target.
     // policy step inside init members.
     * @type {RPG_EquipItem}
     */
    this._secondaryEquip = null;

    // policy step inside init members.
    /**
     * The output of what would be the result from refining these items.
     * @type {RPG_EquipItem}
     */
    this._resultingEquip = null;
  }

  /**
   * Gets the primary equip selected, aka the refinement target.
   * @returns {RPG_EquipItem}
   */
  get primaryEquip()
  {
    return this._primaryEquip;
  }

  /**
   * Sets the primary equip selected, aka the refinement target.
   * @param {RPG_EquipItem} equip The equip to set as the target.
   */
  set primaryEquip(equip)
  {
    this._primaryEquip = equip;
    this.refresh();
  }

  /**
   * Gets the secondary equip selected, aka the refinement material.
   * @returns {RPG_EquipItem}
   */
  get secondaryEquip()
  {
    return this._secondaryEquip;
  }

  /**
   * Sets the secondary equip selected, aka the refinement material.
   * @param {RPG_EquipItem} equip The equip to set as the material.
   */
  set secondaryEquip(equip)
  {
    this._secondaryEquip = equip;
    this.refresh();
  }

  /**
   * Gets the resulting equip from the output.
   */
  get outputEquip()
  {
    return this._resultingEquip;
  }

  /**
   * Sets the resulting equip to the output to allow for the scene to grab the data.
   * @param {RPG_EquipItem} equip The equip to set.
   */
  set outputEquip(equip)
  {
    this._resultingEquip = equip;
  }

  /**
   * Width of each preview column (base / material / output) from {@link #innerWidth}.
   * @returns {number}
   */
  refinementColumnWidth()
  {
    return Math.max(96, Math.floor(this.innerWidth / 3));
  }

  /**
   * Max draw width for names and traits inside one column.
   * @returns {number}
   */
  refinementColumnTextWidth()
  {
    return Math.max(64, this.refinementColumnWidth() - 12);
  }

  refresh()
  {
    // redraw all the contents.
    this.contents.clear();
    this.drawContent();
  }

  /**
   * Draws all content in this window.
   */
  drawContent()
  {
    // if we don't have anything in the target slot, do not draw anything.
    if (!this.primaryEquip) return;

    // policy step inside draw content.
    this.drawRefinementHeaders();

    // policy step inside draw content.
    this.drawRefinementTarget();
    this.drawRefinementMaterial();
    this.drawRefinementResult();
  }

  /**
   * Draws all columns' titles.
   */
  drawRefinementHeaders()
  {
    const columnWidth = this.refinementColumnWidth();
    const labelWidth = this.refinementColumnTextWidth();
    const ox = 0;

    // policy step inside draw refinement headers.
    this.modFontSize(6);
    this.toggleBold(true);

    // capture base x for downstream policy in this routine.
    const baseX = ox + (columnWidth * 0);
    this.drawText(J.JAFTING.EXT.REFINE.Messages.TitleBase, baseX, 0, labelWidth);

    // capture consumable x for downstream policy in this routine.
    const consumableX = ox + (columnWidth * 1);
    this.drawText(J.JAFTING.EXT.REFINE.Messages.TitleMaterial, consumableX, 0, labelWidth);

    // capture output x for downstream policy in this routine.
    const outputX = ox + (columnWidth * 2);
    this.drawText(J.JAFTING.EXT.REFINE.Messages.TitleOutput, outputX, 0, labelWidth);

    // policy step inside draw refinement headers.
    this.resetFontSettings();
  }

  /**
   * Draws the primary equip that is being used as a base for refinement.
   * Will draw whatever is being hovered over if nothing is selected.
   */
  drawRefinementTarget()
  {
    this.drawEquip(this.primaryEquip, 0, "base");
  }

  /**
   * Draws the secondary equip that is being used as a material for refinement.
   * Will draw whatever is being hovered over if nothing is selected.
   */
  drawRefinementMaterial()
  {
    if (!this.secondaryEquip) return;

    // policy step inside draw refinement material.
    this.drawEquip(this.secondaryEquip, this.refinementColumnWidth(), "material");
  }

  /**
   * Draws one column of a piece of equip and it's traits.
   * @param {RPG_EquipItem} equip The equip to draw details for.
   * @param {number} x The `x` coordinate to start drawing at.
   * @param {string} type Which column this is.
   */
  drawEquip(equip, x, type)
  {
    const parsedTraits = JaftingManager.parseTraits(equip);
    const jaftingTraits = JaftingManager.combineBaseParameterTraits(parsedTraits);
    this.drawEquipTitle(equip, x, type);
    // policy step inside draw equip.
    this.drawEquipTraits(jaftingTraits, x);
  }

  /**
   * Draws the title for this portion of the equip details.
   * @param {RPG_EquipItem} equip The equip to draw details for.
   * @param {number} x The `x` coordinate to start drawing at.
   * @param {string} type Which column this is.
   */
  drawEquipTitle(equip, x, type)
  {
    const lh = this.lineHeight();
    const textW = this.refinementColumnTextWidth();

    // when type  equals  "output", take this branch.
    if (type === "output")
    {
      if (equip.jaftingRefinedCount === 0)
      {
        this.drawTextEx(`\\I[${equip.iconIndex}] \\C[6]${equip.name} +1\\C[0]`, x, lh * 1, textW);
      }
      else
      {
        const suffix = `+${equip.jaftingRefinedCount + 1}`;
        const index = equip.name.lastIndexOf("+");
        if (index > -1)
        {
          // if we found a +, then strip it out and add the suffix to it.
          const name = `${equip.name.slice(0, index)}${suffix}`;
          this.drawTextEx(`\\I[${equip.iconIndex}] \\C[6]${name}\\C[0]`, x, lh * 1, textW);
        }
        else
        {
          // in cases where a refined equip is being used as a material for a never-before refined
          // equip, then there won't be any string manipulation for it's name.
          const name = `${equip.name} ${suffix}`;
          this.drawTextEx(`\\I[${equip.iconIndex}] \\C[6]${name}\\C[0]`, x, lh * 1, textW);
        }
      }
    }
    else
    {
      this.drawTextEx(`\\I[${equip.iconIndex}] \\C[6]${equip.name}\\C[0]`, x, lh * 1, textW);
    }
  }

  /**
   * Draws all transferable traits on this piece of equipment.
   * @param {JAFTING_Trait[]} traits A list of transferable traits.
   * @param {number} x The `x` coordinate to start drawing at.
   */
  drawEquipTraits(traits, x)
  {
    const lh = this.lineHeight();
    const textW = this.refinementColumnTextWidth();

    // when not traits.length, take this branch.
    if (!traits.length)
    {
      this.drawTextEx(`${J.JAFTING.EXT.REFINE.Messages.NoTransferableTraits}`, x, lh * 2, textW);
      return;
    }

    // Order rows so later logic can assume stable sequencing.
    traits.sort((a, b) => a._code - b._code);

    // policy step inside draw equip traits.
    traits.forEach((trait, index) =>
    {
      const y = (lh * 2) + (index * lh);
      this.drawTextEx(`${trait.nameAndValue}`, x, y, textW);
    });
  }

  /**
   * Draws the projected refinement result of fusing the material into the base.
   */
  drawRefinementResult()
  {
    // don't try to draw the result if the player hasn't made it to the material yet.
    if (!this.primaryEquip || !this.secondaryEquip) return;

    // produce the potential result if confirmed.
    const result = JaftingManager.determineRefinementOutput(this.primaryEquip, this.secondaryEquip);

    // render the projected merge results.
    this.drawEquip(result, this.refinementColumnWidth() * 2, "output");

    // assign it for ease of retrieving from the scene.
    this.outputEquip = result;
  }
}

export default Window_RefinementDetails;

//endregion Window_RefinementDetails