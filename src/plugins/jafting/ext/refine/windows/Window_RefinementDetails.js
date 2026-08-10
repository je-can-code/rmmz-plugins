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
     * @type {RPG_EquipItem}
     */
    this._primaryEquip = null;

    /**
     * The secondary equip that is the refinement material.
     * The transferable traits on this equip will be transfered to the target.
     * @type {RPG_EquipItem}
     */
    this._secondaryEquip = null;

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
   * The width each of the two list columns occupies.
   *
   * Fixed rather than a share of the panel, so an equip name has a predictable amount of room no matter
   * how wide the screen is. The result column takes whatever remains, which is deliberate - the result
   * is the answer the scene exists to give, so it should be the widest thing on it.
   * @returns {number}
   */
  static ListColumnWidthCap = 470;

  /**
   * The width one list column takes out of a given inner width.
   *
   * A share rather than a constant, capped so it stops growing once a name has all the room it could
   * want. A fixed width starved the result column at lower resolutions; an uncapped share made the lists
   * absurdly wide at higher ones.
   *
   * **This is the single source for the split** - the scene positions its two list windows against this
   * same function, so the columns and the headings above them cannot disagree.
   * @param {number} innerWidth The drawable width of the panel.
   * @returns {number}
   */
  static listColumnWidthFromInner(innerWidth)
  {
    return Math.min(Window_RefinementDetails.ListColumnWidthCap, Math.floor(innerWidth * 0.3));
  }

  /**
   * The three column origins, in this window's inner coordinates.
   * @returns {number[]}
   */
  columnXs()
  {
    const listWidth = Window_RefinementDetails.listColumnWidthFromInner(this.innerWidth);

    return [ 0, listWidth, listWidth * 2 ];
  }

  /**
   * The width of the result column, which is everything the two lists did not take.
   * @returns {number}
   */
  resultColumnWidth()
  {
    const listWidth = Window_RefinementDetails.listColumnWidthFromInner(this.innerWidth);

    return Math.max(96, this.innerWidth - (listWidth * 2));
  }

  /**
   * Max draw width for text inside one column.
   * @param {number} columnWidth The width of the column being drawn into.
   * @returns {number}
   */
  columnTextWidth(columnWidth)
  {
    return Math.max(64, columnWidth - 12);
  }

  /**
   * The inner Y where each column's content begins - below the titles and the rule under them.
   *
   * The scene positions the two list windows against this, which is the reason the headers live on this
   * window rather than on three of their own: one measurement, one baseline, and the columns cannot
   * drift apart.
   * @returns {number}
   */
  columnContentInnerStartY()
  {
    // title line, the subtext line beneath it, then the rule and a little air under that.
    return (this.lineHeight() * 2) + 10;
  }

  refresh()
  {
    // redraw all the contents.
    this.contents.clear();
    this.drawContent();
  }

  /**
   * The heading each column carries, paired with a line saying what the column is for.
   *
   * The lists themselves used to be unlabelled entirely, which was survivable while only one was on
   * screen at a time and a hint bar narrated which phase you were in. Two similar-looking columns of
   * equipment need saying which is which.
   * @returns {{title: string, subtext: string}[]}
   */
  columnHeadings()
  {
    return [
      {
        title: J.JAFTING.EXT.REFINE.Messages.TitleBase,
        subtext: 'The equipment being upgraded.',
      },
      {
        title: J.JAFTING.EXT.REFINE.Messages.TitleMaterial,
        subtext: 'Consumed; its effects merge into the base.',
      },
      {
        title: J.JAFTING.EXT.REFINE.Messages.TitleOutput,
        subtext: 'What you get if you confirm.',
      },
    ];
  }

  /**
   * Draws all content in this window.
   *
   * The headers draw unconditionally: they are the labels for two list windows that are always on
   * screen, so withholding them until something is selected would leave those lists unlabelled exactly
   * when the player most needs to know what they are choosing between.
   */
  drawContent()
  {
    this.drawRefinementHeaders();

    this.drawRefinementResult();
  }

  /**
   * Draws every column's title, its explanatory line, and the rule that separates them from content.
   */
  drawRefinementHeaders()
  {
    const headings = this.columnHeadings();
    const columnXs = this.columnXs();
    const listWidth = Window_RefinementDetails.listColumnWidthFromInner(this.innerWidth);
    const ruleY = this.columnContentInnerStartY() - 8;

    headings.forEach((heading, index) =>
    {
      const columnWidth = index === 2
        ? this.resultColumnWidth()
        : listWidth;
      const textWidth = this.columnTextWidth(columnWidth);
      const x = columnXs[index];

      // the title, a size up and bold, so it reads as chrome rather than content.
      this.resetFontSettings();
      this.modFontSize(4);
      this.toggleBold(true);
      this.drawText(heading.title, x, 0, textWidth, Window_Base.TextAlignments.Left);
      this.toggleBold(false);
      this.resetFontSettings();

      // the explanatory line, smaller and dimmer, in the manner of the crafting scene's column blurbs.
      this.modFontSize(-4);
      this.changeTextColor(ColorManager.textColor(7));
      this.drawText(heading.subtext, x, this.lineHeight(), textWidth, Window_Base.TextAlignments.Left);
      this.resetTextColor();
      this.resetFontSettings();

      // one rule per column rather than a single rule across all three, so the columns read as separate
      // places rather than as one banded table.
      this.drawHorizontalLine(x, ruleY, textWidth);
    });
  }

  /**
   * The name a refined output carries, with its `+N` suffix advanced by one.
   * @param {RPG_EquipItem} equip The projected output.
   * @returns {string}
   */
  outputDisplayName(equip)
  {
    const suffix = `+${equip.jaftingRefinedCount + 1}`;
    const plusIndex = equip.name.lastIndexOf('+');

    // a never-before-refined base has no suffix to replace, and neither does one whose name simply has
    // no `+` in it - a refined equip used as material against a fresh base lands here too.
    if (plusIndex === -1) return `${equip.name} ${suffix}`;

    return `${equip.name.slice(0, plusIndex)}${suffix}`;
  }

  /**
   * Pairs up what the base has now against what the projected result would have, per effect.
   *
   * Keyed on code and dataId together, because that pair is what identifies an effect - two traits
   * sharing a code are different stats. An effect the base does not carry arrives with a null `before`,
   * which is what lets the column say "new" rather than quietly listing it alongside the rest.
   * @param {RPG_EquipItem} result The projected refinement output.
   * @returns {{key: string, trait: JAFTING_Trait, before: (JAFTING_Trait|null)}[]}
   */
  buildResultComparison(result)
  {
    const keyOf = trait => `${trait.code()}:${trait.dataId()}`;

    const baseTraits = new Map();
    JaftingManager.parseTraits(this.primaryEquip)
      .forEach(trait => baseTraits.set(keyOf(trait), trait));

    const resultTraits = new Map();
    JaftingManager.parseTraits(result)
      .forEach(trait => resultTraits.set(keyOf(trait), trait));

    // the union of both sides, not just the result. an effect the merge cancelled out is gone from the
    // result entirely, and listing only the result would have it vanish from the report as well - which
    // is the one outcome a player most needs told about.
    const keys = [ ...new Set([ ...baseTraits.keys(), ...resultTraits.keys() ]) ];

    const rows = keys.map(key =>
    {
      const before = baseTraits.has(key)
        ? baseTraits.get(key)
        : null;
      const after = resultTraits.has(key)
        ? resultTraits.get(key)
        : null;

      return { key, before, after };
    });

    // stable ordering so the same merge always reads the same way down the column.
    return rows.sort((a, b) =>
    {
      const left = a.after === null
        ? a.before
        : a.after;
      const right = b.after === null
        ? b.before
        : b.after;

      return (left.code() - right.code()) || (left.dataId() - right.dataId());
    });
  }

  /**
   * The neutral value a trait code sits at when nothing is contributing to it.
   *
   * Needed to size the gain on an effect the base did not carry: the "before" is not zero, it is whatever
   * that code treats as no-effect, and the two differ. Matches what {@link TraitResolver} uses when it
   * combines same-code traits.
   * @param {number} code The trait code.
   * @returns {number}
   */
  neutralValueForCode(code)
  {
    // x-params accumulate from nothing; base and sp params are multipliers sitting at 1.
    if (code === 22) return 0;

    return 1;
  }

  /**
   * Draws the projected refinement result into the third column, as a before-and-after.
   *
   * Only the result is drawn here now. The base and the donor are each visible in their own list, so
   * repeating them in this window was showing the player two things they had just chosen and calling it
   * detail. What is genuinely only knowable here is the *change*, which is what this column reports.
   */
  drawRefinementResult()
  {
    // nothing to project until both halves have been picked; the headings still stand on their own.
    if (!this.primaryEquip || !this.secondaryEquip) return;

    // produce the potential result if confirmed.
    const result = JaftingManager.determineRefinementOutput(this.primaryEquip, this.secondaryEquip);

    const [ , , x ] = this.columnXs();
    const columnWidth = this.resultColumnWidth();
    const textWidth = this.columnTextWidth(columnWidth);
    const lh = this.lineHeight();
    let y = this.columnContentInnerStartY();

    // the name it will carry once refined, sharing its line with the numeric column headings. Those are
    // drawn unconditionally: the refinement counter at the foot of this column always occupies the same
    // two columns, so they always have something to label - and pinning them here means the rows below
    // begin at one fixed height whatever kind of donor is selected, instead of jumping a line when the
    // donor happens to grant a name rather than an amount.
    this.drawTextEx(`\\I[${result.iconIndex}] \\C[6]${this.outputDisplayName(result)}\\C[0]`, x, y, textWidth);
    this.drawResultComparisonHeadings(x, y, textWidth);
    y += Math.floor(lh * 1.5);

    const comparison = this.buildResultComparison(result);

    if (comparison.length === 0)
    {
      this.drawTextEx(`${J.JAFTING.EXT.REFINE.Messages.NoTransferableTraits}`, x, y, textWidth);
    }
    else
    {
      // two kinds of effect, and they cannot share a row shape. A parameter has an amount that moved, so
      // it wants before and after. A granted skill or an attack element has a *name* - there is no
      // quantity to compare, only whether you now have it, and forcing one into a numeric column
      // overflows it and collides with the column beside it.
      const quantified = comparison.filter(row => this.isQuantifiedRow(row));
      const granted = comparison.filter(row => !this.isQuantifiedRow(row));

      quantified.forEach(row =>
      {
        this.drawResultComparisonRow(row, result, x, y, textWidth);
        y += lh;
      });

      // a little air between the two shapes, so they do not read as one broken table.
      if (quantified.length > 0 && granted.length > 0) y += Math.floor(lh * 0.5);

      granted.forEach(row =>
      {
        this.drawGrantedRow(row, x, y, textWidth);
        y += lh;
      });
    }

    // note effects are their own block: a formula does not fit a ninety-six pixel column, and these are
    // shown as authored rather than interpreted, so they cannot share the trait rows' shape.
    const noteEffects = JaftingManager.buildNoteEffectComparison(this.primaryEquip, result);

    if (noteEffects.length > 0)
    {
      y += Math.floor(lh * 0.5);
      y = this.drawNoteEffectsHeading(x, y, textWidth);

      noteEffects.forEach(row =>
      {
        this.drawNoteEffectRow(row, x, y, textWidth);
        y += lh;
      });
    }

    // the refinement counter, which the `+N` suffix only ever hinted at.
    this.drawRefinementCounter(result, x, y + Math.floor(lh * 0.5), textWidth);

    // assign it for ease of retrieving from the scene.
    this.outputEquip = result;
  }

  /**
   * Whether this row's effect is an amount that can be compared, rather than a thing that is simply had.
   *
   * Only the three parameter codes carry a value worth putting in a before-and-after. Everything else
   * formats as a name - a skill to learn, an element to strike with, a slot to seal - and the only news
   * about one of those is whether the merge brought it along.
   * @param {{before: (JAFTING_Trait|null), after: (JAFTING_Trait|null)}} row The paired effect.
   * @returns {boolean}
   */
  isQuantifiedRow(row)
  {
    const sample = row.after === null
      ? row.before
      : row.after;
    const code = sample.code();

    return code === 21 || code === 22 || code === 23;
  }

  /**
   * Draws an effect that is had rather than measured, on one full-width line.
   *
   * The whole row width goes to the label, because these read as sentences - "Learn: Palate Cleanser" -
   * and the only column beside it says whether it is arriving, leaving, or staying put.
   * @param {{before: (JAFTING_Trait|null), after: (JAFTING_Trait|null)}} row The paired effect.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} textWidth The drawable width of the result column.
   */
  drawGrantedRow(row, x, y, textWidth)
  {
    const { colW } = this.resultComparisonColumns(textWidth);
    const sample = row.after === null
      ? row.before
      : row.after;
    const iconIndex = sample.convertToRmTrait()
      .iconIndex();

    // the label takes everything except the verdict column on the right.
    const labelWidth = textWidth - colW - 8;

    const label = iconIndex > 0
      ? `\\I[${iconIndex}]${sample.nameAndValue}`
      : sample.nameAndValue;
    this.drawTextEx(label, x, y, labelWidth);

    this.drawGrantedVerdict(row, x + labelWidth + 8, y, colW);
  }

  /**
   * Draws what became of one granted effect, in the column its numeric siblings use for their modifier.
   *
   * Every row gets an answer here, including the ones that arrived untouched. The alternative - dimming
   * the label of a carried effect and leaving this column empty - meant brightness carried meaning for
   * one row shape and none for the other, and grey is already what this scene's donor list uses for rows
   * you cannot pick. A carried effect is the opposite of unavailable.
   * @param {{before: (JAFTING_Trait|null), after: (JAFTING_Trait|null)}} row The paired effect.
   * @param {number} x The verdict column's absolute origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} colW The verdict column's width.
   */
  drawGrantedVerdict(row, x, y, colW)
  {
    const alignRight = Window_Base.TextAlignments.Right;

    // an effect the merge dropped is the loudest thing that can happen to a row.
    if (row.after === null)
    {
      this.changeTextColor(ColorManager.textColor(18));
      this.drawText('lost', x, y, colW, alignRight);
      this.resetTextColor();

      return;
    }

    if (row.before === null)
    {
      this.changeTextColor(ColorManager.textColor(24));
      this.drawText('new', x, y, colW, alignRight);
      this.resetTextColor();

      return;
    }

    // came through untouched, said plainly - the same dash an unchanged numeric row reports.
    this.changeTextColor(ColorManager.textColor(7));
    this.drawText('-', x, y, colW, alignRight);
    this.resetTextColor();
  }

  /**
   * Labels the note-effect block, so a raw tag key is not mistaken for a broken trait row.
   *
   * These rows read differently from everything above them - a key as authored on the left, a value as
   * authored on the right - and saying so is what stops `cdmBuffPlus` looking like a rendering fault.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} textWidth The drawable width of the result column.
   * @returns {number} The vertical position the first row should start at.
   */
  drawNoteEffectsHeading(x, y, textWidth)
  {
    this.modFontSize(-4);
    this.changeTextColor(ColorManager.textColor(7));
    this.drawText('note effects', x, y, textWidth, Window_Base.TextAlignments.Left);
    this.resetTextColor();
    this.resetFontSettings();

    return y + this.lineHeight();
  }

  /**
   * Draws one transferable note effect: its tag key, and what its value becomes.
   *
   * Presented exactly as authored, because nothing here knows what a tag means. A value that changed
   * shows both sides so the movement is visible; one arriving from the donor shows only what it will be,
   * since it had no previous value to move from.
   * @param {{key: string, before: (string|null), after: string}} row The paired effect.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} textWidth The drawable width of the result column.
   */
  drawNoteEffectRow(row, x, y, textWidth)
  {
    const { nameWidth } = this.resultComparisonColumns(textWidth);
    const valueWidth = textWidth - nameWidth - 8;

    this.drawText(row.key, x, y, nameWidth, Window_Base.TextAlignments.Left);

    const isNew = row.before === null;
    const isUnchanged = row.before === row.after;

    // an unchanged value states itself once; repeating it either side of an arrow would dress standing
    // still as a change.
    const valueText = (isNew || isUnchanged)
      ? row.after
      : `${row.before} -> ${row.after}`;

    // arriving and moving both read as gains; standing still is context.
    const colorIndex = isUnchanged
      ? 7
      : 24;

    this.changeTextColor(ColorManager.textColor(colorIndex));
    this.drawText(valueText, x + nameWidth + 8, y, valueWidth, Window_Base.TextAlignments.Right);
    this.resetTextColor();
  }

  /**
   * The x offsets, relative to the column origin, of the before / after / delta columns.
   *
   * The three numeric columns are kept deliberately narrow and adjacent rather than spread across the
   * full width. Three numbers that belong to one row have to be readable as a group; spacing them evenly
   * across the column made each row look like three unrelated facts.
   * @param {number} textWidth The drawable width of the result column.
   * @returns {{beforeX: number, afterX: number, deltaX: number, colW: number, nameWidth: number}}
   */
  resultComparisonColumns(textWidth)
  {
    const colW = 96;
    const groupWidth = colW * 3;

    // the name takes what the number group does not, capped so a long stat name cannot shove the numbers
    // off the right edge.
    const nameWidth = Math.max(120, textWidth - groupWidth - 8);

    return {
      beforeX: nameWidth + 8,
      afterX: nameWidth + 8 + colW,
      deltaX: nameWidth + 8 + (colW * 2),
      colW,
      nameWidth,
    };
  }

  /**
   * Labels the three numeric columns, on the same line as the output's name.
   *
   * Drawn on every refresh rather than only when a numeric row exists, so the block beneath keeps one
   * fixed starting height. Switching between a donor that grants an amount and one that grants a name
   * otherwise moved every row a line up or down, which read as the panel twitching.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at, shared with the output's name.
   * @param {number} textWidth The drawable width of the result column.
   */
  drawResultComparisonHeadings(x, y, textWidth)
  {
    const { beforeX, afterX, deltaX, colW } = this.resultComparisonColumns(textWidth);

    this.modFontSize(-4);
    this.changeTextColor(ColorManager.textColor(7));
    this.drawText('now', x + beforeX, y, colW, Window_Base.TextAlignments.Right);
    this.drawText('after', x + afterX, y, colW, Window_Base.TextAlignments.Right);

    // the third column holds a percentage now rather than a verdict word, so it needs naming too - three
    // numbers on a row with only two of them labelled reads as one of them being unexplained.
    this.drawText('mod', x + deltaX, y, colW, Window_Base.TextAlignments.Right);
    this.resetTextColor();
    this.resetFontSettings();
  }

  /**
   * Draws one effect's before, after, and the percentage responsible for the difference.
   *
   * The projected output arrives as a parameter rather than being read off {@link outputEquip}, which is
   * not assigned until this column has finished drawing - reading it here would measure the previous
   * pairing the player looked at.
   * @param {{trait: JAFTING_Trait, before: (JAFTING_Trait|null)}} row The paired effect.
   * @param {RPG_EquipItem} result The projected refinement output.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} textWidth The drawable width of the result column.
   */
  drawResultComparisonRow(row, result, x, y, textWidth)
  {
    const { beforeX, afterX, deltaX, colW, nameWidth } = this.resultComparisonColumns(textWidth);
    const sample = row.after === null
      ? row.before
      : row.after;
    const iconIndex = sample.convertToRmTrait()
      .iconIndex();

    // the icon where one exists; the name carries the meaning either way.
    const label = iconIndex > 0
      ? `\\I[${iconIndex}]${sample.name}`
      : sample.name;
    this.drawTextEx(label, x, y, nameWidth);

    const code = sample.code();
    const dataId = sample.dataId();

    // what the equip is worth for this stat on its own, before and after. A percentage on equipment
    // scales that equipment, so the number a player can act on is this one - "+25%" alone never said of
    // what, and a percentage landing on a stat the item has none of reads plainly here as 0 to 0.
    const before = this.localWorthFor(this.primaryEquip, code, dataId);
    const after = this.localWorthFor(result, code, dataId);

    this.drawText(`${before}`, x + beforeX, y, colW, Window_Base.TextAlignments.Right);
    this.drawText(`${after}`, x + afterX, y, colW, Window_Base.TextAlignments.Right);

    this.drawResultComparisonModifier(row, x + deltaX, y, colW);
  }

  /**
   * What an equip is worth for one parameter on its own, as a whole number ready to draw.
   *
   * Its base for that stat amplified by its own percentages - the same arithmetic the battler performs
   * when it asks equipment what it contributes, so this column cannot disagree with the stat screen.
   * Base parameters read a flat amount; the other two families are already whole percents.
   * @param {RPG_EquipItem} equip The equip to measure.
   * @param {number} code The trait code: 21, 22, or 23.
   * @param {number} dataId The parameter id within that family.
   * @returns {number}
   */
  localWorthFor(equip, code, dataId)
  {
    const ownRate = equip.ownRate(code, dataId);

    if (code === 21)
    {
      return Math.round(equip.thisBParam(dataId) * ownRate);
    }

    if (code === 22)
    {
      return Math.round(equip.thisXParam(dataId) * ownRate);
    }

    return Math.round(equip.thisSParam(dataId) * ownRate);
  }

  /**
   * Draws the percentage the projected result carries for this row.
   *
   * The two columns to the left say what the equip is worth before and after, which is the number a
   * player acts on. This column says what is producing that difference - the modifier itself - so a row
   * reads as a claim and its evidence rather than as a bare percentage of nothing in particular.
   * @param {{before: (JAFTING_Trait|null), after: (JAFTING_Trait|null)}} row The paired effect.
   * @param {number} x The modifier column's absolute origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} colW The modifier column's width.
   */
  drawResultComparisonModifier(row, x, y, colW)
  {
    const alignRight = Window_Base.TextAlignments.Right;

    // an effect the merge removed outright is the loudest thing that can happen to a row, and it has no
    // modifier left to report - the two columns beside this one already show the drop.
    if (row.after === null)
    {
      this.changeTextColor(ColorManager.textColor(18));
      this.drawText('lost', x, y, colW, alignRight);
      this.resetTextColor();

      return;
    }

    const points = this.rowModifierPoints(row);

    // a code with no numeric reading can only report that it arrived, not by how much.
    if (points === null)
    {
      const colorIndex = row.before === null
        ? 24
        : 7;
      this.changeTextColor(ColorManager.textColor(colorIndex));
      this.drawText(row.before === null
        ? 'new'
        : '-', x, y, colW, alignRight);
      this.resetTextColor();

      return;
    }

    // a modifier of nothing is its own answer; drawing "+0%" would dress a no-op as a change.
    if (points === 0)
    {
      this.changeTextColor(ColorManager.textColor(7));
      this.drawText('-', x, y, colW, alignRight);
      this.resetTextColor();

      return;
    }

    const isGain = points > 0;
    this.changeTextColor(ColorManager.textColor(isGain
      ? 24
      : 18));
    this.drawText(`${isGain ? '+' : ''}${points}%`, x, y, colW, alignRight);
    this.resetTextColor();
  }

  /**
   * The percentage the projected result carries for one row, in whole points.
   *
   * Read off the result's own value rather than the difference between the two sides, because this column
   * answers "what is this item's modifier now" - the movement is already visible in the before and after
   * beside it. Codes 21 and 23 store their values as deltas from 1.0 and code 22 from 0, which is the only
   * thing separating the two arms here.
   *
   * **The row must have an `after`.** A merge that dropped an effect has no modifier left to report, and
   * {@link drawResultComparisonModifier} answers that case itself before reaching this.
   * @param {{before: (JAFTING_Trait|null), after: JAFTING_Trait}} row The paired effect, still present in the result.
   * @returns {number|null} The modifier in whole percents, or null for a code with no numeric reading.
   */
  rowModifierPoints(row)
  {
    const code = row.after.code();

    // only the three parameter codes carry a percentage; the rest are names and flags.
    if (code !== 21 && code !== 22 && code !== 23) return null;

    const neutral = this.neutralValueForCode(code);
    const { value } = row.after.convertToRmTrait();

    return Math.round((value - neutral) * 100);
  }

  /**
   * Draws how many refinements this equip will have used, against its ceiling.
   * @param {RPG_EquipItem} result The projected refinement output.
   * @param {number} x The column origin.
   * @param {number} y The vertical position to draw at.
   * @param {number} textWidth The drawable width of the result column.
   */
  drawRefinementCounter(result, x, y, textWidth)
  {
    const { beforeX, afterX, deltaX, colW, nameWidth } = this.resultComparisonColumns(textWidth);
    const cap = this.primaryEquip.jaftingMaxRefineCount;

    this.modFontSize(-2);
    this.changeTextColor(ColorManager.systemColor());
    this.drawText('refinements', x, y, nameWidth, Window_Base.TextAlignments.Left);
    this.resetTextColor();

    this.drawText(`${this.primaryEquip.jaftingRefinedCount}`, x + beforeX, y, colW, Window_Base.TextAlignments.Right);
    this.drawText(`${result.jaftingRefinedCount + 1}`, x + afterX, y, colW, Window_Base.TextAlignments.Right);

    // the ceiling belongs in the third column with the other per-row verdicts, and only when there is
    // one - a cap of zero is the tag being absent, not a limit of none, so it says nothing at all.
    if (cap > 0)
    {
      this.changeTextColor(ColorManager.textColor(7));
      this.drawText(`of ${cap}`, x + deltaX, y, colW, Window_Base.TextAlignments.Right);
      this.resetTextColor();
    }

    this.resetFontSettings();
  }
}

export default Window_RefinementDetails;

//endregion Window_RefinementDetails