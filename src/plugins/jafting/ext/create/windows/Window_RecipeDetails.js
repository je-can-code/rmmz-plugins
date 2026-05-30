//region Window_RecipeDetails
import CraftingComponent from './../__models/CraftingComponent.js';

class Window_RecipeDetails
  extends Window_Base
{
  /**
   * Fourth-column divider is drawn this many pixels left of that column's origin; header rules must not extend past
   * this.
   */
  static #DETAIL_DIVIDER_LEFT_OFFSET = 12;

  /**
   * Horizontal rule under each component header is inset this many pixels from each band edge (matches
   * {@link #DETAIL_DIVIDER_LEFT_OFFSET} so column 3 rules never cross the divider).
   */
  static #COMPONENT_HEADER_RULE_SIDE_INSET = Window_RecipeDetails.#DETAIL_DIVIDER_LEFT_OFFSET;

  static #COMPONENT_HEADER_RULE_GAP_BEFORE = 2;
  static #COMPONENT_HEADER_RULE_HEIGHT = 3;
  static #COMPONENT_HEADER_RULE_GAP_AFTER = 8;

  /**
   * The currently selected recipe being detailed.
   * @type {CraftingRecipe}
   */
  #currentRecipe = null;

  /**
   * True if the text of this list should be masked, false otherwise.
   * @type {boolean}
   */
  needsMasking = false;

  constructor(rect)
  {
    super(rect);
  }

  getCurrentRecipe()
  {
    return this.#currentRecipe;
  }

  setCurrentRecipe(recipe)
  {
    this.#currentRecipe = recipe;
  }

  setNeedsMasking(needsMasking)
  {
    this.needsMasking = needsMasking;
  }

  /**
   * Same quarter split as {@link #detailsQuarterWidth}, for sibling list windows sized by scene layout.
   * @param {number} innerWidth inner pixel width (typically window width minus padding on both sides).
   * @returns {{ cw: number, remainder: number }} cw = floor division width; remainder = pixels to add to the 4th band.
   */
  static quarterWidthsFromInner(innerWidth)
  {
    const cw = Math.max(80, Math.floor(innerWidth / 4));
    const remainder = innerWidth - cw * 4;

    // hand back { cw, remainder } to the caller.
    return { cw, remainder };
  }

  /**
   * Italic subtext under each column title — kept in one place so wrapping math and drawing stay aligned.
   */
  static #SUBTEXT_INGREDIENTS = 'Materials consumed when crafting this recipe.';
  static #SUBTEXT_TOOLS = 'Materials required to craft this recipe.';
  static #SUBTEXT_OUTPUTS = 'Materials generated when the recipe is crafted.';

  /**
   * Inner Y where ingredient / tool / output list windows should start (below the tallest header band).
   * @returns {number}
   */
  componentListRowsInnerStartY()
  {
    return this.#recipeComponentHeaderBandEndInnerY();
  }

  /**
   * Inner Y just below the unified horizontal rules under INGREDIENTS / TOOLS / OUTPUTS.
   * @returns {number}
   */
  #recipeComponentHeaderBandEndInnerY()
  {
    const cw = this.detailsQuarterWidth();
    const { ruleTopY } = this.#tripleColumnHeaderRuleTopInnerY(cw);
    const ruleH = Window_RecipeDetails.#COMPONENT_HEADER_RULE_HEIGHT;
    const gapAfterRule = Window_RecipeDetails.#COMPONENT_HEADER_RULE_GAP_AFTER;

    // hand back ruleTopY + ruleH + gapAfterRule to the caller.
    return ruleTopY + ruleH + gapAfterRule;
  }

  /**
   * Prepares the smaller italic face used under column titles.
   */
  #prepareItalicsSubtextFont()
  {
    this.resetFontSettings();
    this.modFontSize(-12);
    this.toggleItalics();
  }

  /**
   * Restores default font after italic subtext measurement or drawing.
   */
  #restoreAfterItalicsSubtextFont()
  {
    this.toggleItalics();
    this.resetFontSettings();
  }

  /**
   * Wraps plain text to fit width using the current font metrics (caller sets face).
   *
   * @param {string} text The text driving this step.
   * @param {number} maxWidth The max width driving this step.
   * @returns {string[]}
   */
  #splitLongToken(token, maxWidth)
  {
    const segments = [];
    let chunk = '';

    // iterate the loop counter until the guard exits.
    for (let ci = 0; ci < token.length; ci++)
    {
      const next = chunk + token.charAt(ci);

      // when this.textWidth(next) <= maxWidth, take this branch.
      if (this.textWidth(next) <= maxWidth)
      {
        chunk = next;
      }
      else
      {
        if (chunk.length > 0)
        {
          segments.push(chunk);
        }

        // continue the routine with the next policy step.
        chunk = token.charAt(ci);
      }
    }

    // when chunk.length > 0, take this branch.
    if (chunk.length > 0)
    {
      segments.push(chunk);
    }

    // hand back segments to the caller.
    return segments;
  }

  #wrapPlainTextToLines(text, maxWidth)
  {
    if (text === '')
    {
      return [ '' ];
    }

    // capture words for downstream policy in this routine.
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';

    // iterate the loop counter until the guard exits.
    for (let wi = 0; wi < words.length; wi++)
    {
      const word = words[wi];
      const trial = line.length === 0 ? word : `${line} ${word}`;

      // when this.textWidth(trial) <= maxWidth, take this branch.
      if (this.textWidth(trial) <= maxWidth)
      {
        line = trial;
        continue;
      }

      // when line.length > 0, take this branch.
      if (line.length > 0)
      {
        lines.push(line);
        line = '';
      }

      // when this.textWidth(word) <= maxWidth, take this branch.
      if (this.textWidth(word) <= maxWidth)
      {
        line = word;
      }
      else
      {
        const segments = this.#splitLongToken(word, maxWidth);

        // iterate the loop counter until the guard exits.
        for (let si = 0; si < segments.length; si++)
        {
          if (si < segments.length - 1)
          {
            lines.push(segments[si]);
          }
          else
          {
            line = segments[si];
          }
        }
      }
    }

    // when line.length > 0, take this branch.
    if (line.length > 0)
    {
      lines.push(line);
    }

    // when lines.length  equals  0, take this branch.
    if (lines.length === 0)
    {
      lines.push('');
    }

    // hand back lines to the caller.
    return lines;
  }

  /**
   * Measures wrapped lines for italic subtext at the standard recipe-detail size.
   *
   * @param {string} subtext The subtext driving this step.
   * @param {number} bandWidth The band width driving this step.
   * @returns {string[]}
   */
  #measureItalicSubtextLines(subtext, bandWidth)
  {
    this.#prepareItalicsSubtextFont();
    const usableW = Math.max(1, bandWidth - 4);
    const lines = this.#wrapPlainTextToLines(subtext, usableW);
    this.#restoreAfterItalicsSubtextFont();

    // hand back lines to the caller.
    return lines;
  }

  /**
   * Computes the shared rule baseline for all three columns (max of per-column title + wrapped subtext heights).
   *
   * @param {number} cw column inner width
   * @returns {{ ruleTopY: number, layouts: { titleH: number, lines: string[], subLineHeight: number }[] }}
   */
  #tripleColumnHeaderRuleTopInnerY(cw)
  {
    const subtexts = [
      Window_RecipeDetails.#SUBTEXT_INGREDIENTS,
      Window_RecipeDetails.#SUBTEXT_TOOLS,
      Window_RecipeDetails.#SUBTEXT_OUTPUTS,
    ];

    // continue the routine with the next policy step.
    this.#prepareItalicsSubtextFont();
    const subLineHeight = this.lineHeight();
    this.#restoreAfterItalicsSubtextFont();

    // capture layouts for downstream policy in this routine.
    const layouts = [];

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < 3; i++)
    {
      this.resetFontSettings();
      this.modFontSize(4);
      this.toggleBold();
      const titleH = this.lineHeight();
      this.toggleBold();

      // capture lines for downstream policy in this routine.
      const lines = this.#measureItalicSubtextLines(subtexts[i], cw);

      // Append the row to the working collection.
      layouts.push({ titleH, lines, subLineHeight });
    }

    // capture gap before rule for downstream policy in this routine.
    const gapBeforeRule = Window_RecipeDetails.#COMPONENT_HEADER_RULE_GAP_BEFORE;
    let maxContentBottom = 0;

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < 3; i++)
    {
      const L = layouts[i];
      const bottom = L.titleH + L.lines.length * L.subLineHeight;

      // when bottom > maxContentBottom, take this branch.
      if (bottom > maxContentBottom)
      {
        maxContentBottom = bottom;
      }
    }

    // capture rule top y for downstream policy in this routine.
    const ruleTopY = maxContentBottom + gapBeforeRule;

    // hand back { ruleTopY, layouts } to the caller.
    return { ruleTopY, layouts };
  }

  /**
   * Draws title + wrapped subtext for one column; horizontal rules are drawn separately at a shared Y.
   *
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} bandWidth The band width driving this step.
   * @param {string} title The title driving this step.
   * @param {string[]} lines The lines driving this step.
   * @param {number} subLineHeight The sub line height driving this step.
   */
  #drawColumnTitleAndSubtext(x, y, bandWidth, title, lines, subLineHeight)
  {
    this.resetFontSettings();
    this.modFontSize(4);
    this.toggleBold();
    this.drawText(title, x, y, bandWidth, Window_Base.TextAlignments.Left);
    let cursor = y + this.lineHeight();
    this.toggleBold();

    // continue the routine with the next policy step.
    this.#prepareItalicsSubtextFont();

    // iterate the loop counter until the guard exits.
    for (let li = 0; li < lines.length; li++)
    {
      this.drawText(lines[li], x, cursor, bandWidth, Window_Base.TextAlignments.Left);
      cursor += subLineHeight;
    }

    // continue the routine with the next policy step.
    this.#restoreAfterItalicsSubtextFont();
  }

  /**
   * Width of each of the four bands (ingredients, tools, outputs, detail pane).
   * @returns {number}
   */
  detailsQuarterWidth()
  {
    const { cw } = Window_RecipeDetails.quarterWidthsFromInner(this.innerWidth);

    // hand back cw to the caller.
    return cw;
  }

  /**
   * Width of the fourth band (detail pane), including remainder pixels from {@link #quarterWidthsFromInner}.
   * @returns {number}
   */
  detailsFourthBandWidth()
  {
    const { cw, remainder } = Window_RecipeDetails.quarterWidthsFromInner(this.innerWidth);

    // hand back cw + remainder to the caller.
    return cw + remainder;
  }

  /**
   * Max text width in the fourth (detail) column after margins.
   * @returns {number}
   */
  detailsQuarterTextWidth()
  {
    return Math.max(56, this.detailsFourthBandWidth() - 10);
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Draws the recipe details header bands and the primary output column.
   */
  drawContent()
  {
    if (!this.#canDrawContent()) return;

    // policy step inside draw content.
    const [ x, y ] = [ 0, 0 ];
    const { cw, remainder } = Window_RecipeDetails.quarterWidthsFromInner(this.innerWidth);
    const wDetail = cw + remainder;

    // policy step inside draw content.
    const { ruleTopY, layouts } = this.#tripleColumnHeaderRuleTopInnerY(cw);
    const titles = [ 'INGREDIENTS', 'TOOLS', 'OUTPUTS' ];
    const inset = Window_RecipeDetails.#COMPONENT_HEADER_RULE_SIDE_INSET;
    const ruleH = Window_RecipeDetails.#COMPONENT_HEADER_RULE_HEIGHT;

    // iterate the loop counter until the guard exits.
    for (let col = 0; col < 3; col++)
    {
      const L = layouts[col];

      // policy step inside draw content.
      this.#drawColumnTitleAndSubtext(x + cw * col, y, cw, titles[col], L.lines, L.subLineHeight);

      // capture rule w for downstream policy in this routine.
      const ruleW = Math.max(1, cw - inset * 2);
      this.drawHorizontalLine(x + cw * col + inset, ruleTopY, ruleW, ruleH);
    }

    // policy step inside draw content.
    this.drawPrimaryOutput(x + cw * 3, y, wDetail);
  }

  /**
   * Determines if the content for this window can be drawn.
   * @return {boolean}
   */
  #canDrawContent()
  {
    // if there is no recipe, then we cannot draw its detail.
    if (this.#currentRecipe === undefined || this.#currentRecipe === null) return false;

    // we can draw content!
    return true;
  }

  /**
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} bandWidth width of the fourth (detail) column
   */
  drawPrimaryOutput(x, y, bandWidth)
  {
    this.resetFontSettings();

    // policy step inside draw primary output.
    this.drawVerticalLine(x - Window_RecipeDetails.#DETAIL_DIVIDER_LEFT_OFFSET, y, this.innerHeight, 3);

    // capture lh for downstream policy in this routine.
    const lh = this.lineHeight();
    const textW = Math.max(48, bandWidth - 8);

    // capture proficiency for downstream policy in this routine.
    const proficiency = `Proficiency: ${this.#currentRecipe.getProficiency()}`;
    this.drawText(proficiency, x, y, textW);

    // capture body y for downstream policy in this routine.
    const bodyY = this.componentListRowsInnerStartY();

    // capture primary output for downstream policy in this routine.
    const primaryOutput = this.#currentRecipe.outputs.at(0);

    // dispatch on the discriminant for the next policy branch.
    switch (primaryOutput.getComponentType())
    {
      case (CraftingComponent.Types.Item):
        this.drawPrimaryOutputItem(x, bodyY);
        break;
      case (CraftingComponent.Types.Weapon):
        this.drawPrimaryOutputWeaponOrArmor(x, bodyY);
        break;
      case (CraftingComponent.Types.Armor):
        this.drawPrimaryOutputWeaponOrArmor(x, bodyY);
        break;
      case (CraftingComponent.Types.Gold):
        this.drawPrimaryOutputGold(x, bodyY);
        break;
      case (CraftingComponent.Types.SDP):
        this.drawPrimaryOutputSdp(x, bodyY);
        break;
    }

    // policy step inside draw primary output.
    this.drawText(String.empty, x, bodyY + (lh * 1), bandWidth);
  }

  //region item output
  drawPrimaryOutputItem(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying item we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    // capture life y for downstream policy in this routine.
    const lifeY = y + (lh * 1);
    this.drawLifeMessage(output, x, lifeY);

    // capture magi y for downstream policy in this routine.
    const magiY = y + (lh * 2);
    this.drawMagiMessage(output, x, magiY);

    // capture tech y for downstream policy in this routine.
    const techY = y + (lh * 3);
    this.drawTechMessage(output, x, techY);

    // capture revival y for downstream policy in this routine.
    const revivalY = y + (lh * 5);
    this.drawRevival(output, x, revivalY);

    // capture states y for downstream policy in this routine.
    const statesY = y + (lh * 7);
    this.drawFoodStateChanges(output, x, statesY);
  }

  drawLifeMessage(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // initialize these for updating later.
    let percentRecovered = 0;
    let flatRecovered = 0;

    // find the first life recovery effect.
    const foundRecovery = output.effects.find(effect => effect.code === Game_Action.EFFECT_RECOVER_HP);

    // check if we found the effect.
    if (foundRecovery)
    {
      percentRecovered = Math.round(foundRecovery.value1 * 100);
      flatRecovered = foundRecovery.value2;
    }

    // initialize the recovery message.
    let recoveryMessage = ``;

    // add the flat recovered amount if there is any.
    if (flatRecovered !== 0) recoveryMessage += `${flatRecovered}`;

    // add the percent recovered amount if there is any.
    if (percentRecovered !== 0) recoveryMessage += ` +${percentRecovered}%`;

    // render the icon for recovery.
    this.drawIcon(IconManager.param(0), x, y);

    // check first if there was no actual recovery.
    if (percentRecovered === 0 && flatRecovered === 0)
    {
      // change the color to the disabled color.
      this.processColorChange(7); // disabled color.

      // default the message to just zero.
      recoveryMessage = `0`;
    }
    // there was recovery.
    else
    {
      // change the color to the parameter color.
      this.processColorChange(21); // life color
    }

    // check if we should be masking instead.
    if (this.needsMasking)
    {
      // mask away.
      recoveryMessage = '??';
    }

    // policy step inside draw life message.
    this.drawText(recoveryMessage.trim(), x + 40, y, this.detailsQuarterTextWidth() - 40);
  }

  drawMagiMessage(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // initialize these for updating later.
    let percentRecovered = 0;
    let flatRecovered = 0;

    // find the first life recovery effect.
    const foundRecovery = output.effects.find(effect => effect.code === Game_Action.EFFECT_RECOVER_MP);

    // check if we found the effect.
    if (foundRecovery)
    {
      percentRecovered = Math.round(foundRecovery.value1 * 100);
      flatRecovered = foundRecovery.value2;
    }

    // initialize the recovery message.
    let recoveryMessage = ``;

    // add the flat recovered amount if there is any.
    if (flatRecovered !== 0) recoveryMessage += `${flatRecovered}`;

    // add the percent recovered amount if there is any.
    if (percentRecovered !== 0) recoveryMessage += ` +${percentRecovered}%`;

    // render the icon for recovery.
    this.drawIcon(IconManager.param(1), x, y);

    // check first if there was no actual recovery.
    if (percentRecovered === 0 && flatRecovered === 0)
    {
      // change the color to the disabled color.
      this.processColorChange(7); // disabled color.

      // default the message to just zero.
      recoveryMessage = `0`;
    }
    // there was recovery.
    else
    {
      // change the color to the parameter color.
      this.processColorChange(23); // life color
    }

    // check if we should be masking instead.
    if (this.needsMasking)
    {
      // mask away.
      recoveryMessage = '??';
    }

    // policy step inside draw magi message.
    this.drawText(recoveryMessage.trim(), x + 40, y, this.detailsQuarterTextWidth() - 40);
  }

  drawTechMessage(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // initialize these for updating later.
    let flatRecovered = 0;

    // find the first life recovery effect.
    const foundRecovery = output.effects.find(effect => effect.code === Game_Action.EFFECT_GAIN_TP);

    // check if we found the effect.
    if (foundRecovery) flatRecovered = foundRecovery.value1;

    // initialize the recovery message.
    let recoveryMessage = ``;

    // add the flat recovered amount if there is any.
    if (flatRecovered !== 0) recoveryMessage += `${flatRecovered}`;

    // render the icon for recovery.
    this.drawIcon(IconManager.maxTp(), x, y);

    // check first if there was no actual recovery.
    if (flatRecovered === 0)
    {
      // change the color to the disabled color.
      this.processColorChange(7); // disabled color.

      // default the message to just zero.
      recoveryMessage = `0`;
    }
    // there was recovery.
    else
    {
      // change the color to the parameter color.
      this.processColorChange(29); // life color
    }

    // check if we should be masking instead.
    if (this.needsMasking)
    {
      // mask away.
      recoveryMessage = '??';
    }

    // policy step inside draw tech message.
    this.drawText(recoveryMessage, x + 40, y, this.detailsQuarterTextWidth() - 40);
  }

  drawRevival(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // find the first revival effect.
    const revivalEffect = output.effects
      .find(effect => effect.code === Game_Action.EFFECT_REMOVE_STATE && effect.dataId === $gameParty.leader()
        .deathStateId());

    // policy step inside draw revival.
    this.drawIcon($dataStates.at(1).iconIndex, x, y);

    // capture text for downstream policy in this routine.
    let text = revivalEffect
      ? `Revival ${revivalEffect.value1 * 100}%`
      : `Cannot revive.`;

    // when this.needsMasking, take this branch.
    if (this.needsMasking)
    {
      text = '??';
    }

    // capture text x for downstream policy in this routine.
    const textX = x + 40;
    this.drawText(text, textX, y);
  }

  drawFoodStateChanges(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // grab all the food-specific state effects.
    const foodStateEffects = output.effects
      .filter(effect => // it has to add one of OUR states.
        effect.code === Game_Action.EFFECT_ADD_STATE && this.#foodStateIds()
          .includes(effect.dataId));

    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // capture for eacher for downstream policy in this routine.
    const forEacher = (foodStateEffect, index) =>
    {
      /** @type {RPG_State} */
      const foodState = $dataStates.at(foodStateEffect.dataId);

      // capture food state y for downstream policy in this routine.
      const foodStateY = y + (index * lh);
      this.drawIcon(foodState.iconIndex, x, foodStateY);

      // capture food state text for downstream policy in this routine.
      const foodStateText = `${foodState.name}`;
      const foodStateNameX = x + 40;
      const nameCellW = this.detailsQuarterTextWidth() - 48;
      this.drawText(foodStateText, foodStateNameX, foodStateY, nameCellW);

      // capture food state effect chance for downstream policy in this routine.
      const foodStateEffectChance = this.needsMasking
        ? "?"
        : `${foodStateEffect.value1 * 100}%`;

      // policy step inside draw food state changes.
      this.drawText(foodStateEffectChance, foodStateNameX, foodStateY, nameCellW, 'right');
    };

    // policy step inside draw food state changes.
    foodStateEffects.forEach(forEacher, this);
  }

  #foodStateIds()
  {
    return [ 82, 83, 84, 85, 86, 87, 88 ];
  }

  //endregion item output

  //region weapon/armor output
  drawPrimaryOutputWeaponOrArmor(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying weapon we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    // capture core params y for downstream policy in this routine.
    const coreParamsY = y + (lh * 1);
    this.drawCoreParams(output, x, coreParamsY);

    // capture traits y for downstream policy in this routine.
    const traitsY = y + (lh * 5);
    this.drawTraits(output, x, traitsY);
  }

  drawCoreParams(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // capture left x for downstream policy in this routine.
    const leftX = x;
    const rightX = x + Math.max(72, Math.floor(this.detailsFourthBandWidth() / 2) - 8);

    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // draw mhp
    const mhpY = y;
    const mhp = this.needsMasking
      ? '??'
      // policy step inside draw core params.
      : output.params.at(0);
    this.drawIcon(IconManager.param(0), leftX, mhpY);
    this.drawText(mhp, leftX + 40, mhpY);

    // draw mmp
    const mmpY = y + (lh * 1);
    const mmp = this.needsMasking
      ? '??'
      // policy step inside draw core params.
      : output.params.at(1);
    this.drawIcon(IconManager.param(1), leftX, mmpY);
    this.drawText(mmp, leftX + 40, mmpY);

    // draw atk
    const atkY = y + (lh * 2);
    const atk = this.needsMasking
      ? '??'
      : output.params.at(2);
    this.drawIcon(IconManager.param(2), leftX, atkY);
    this.drawText(atk, leftX + 40, atkY);

    // draw def
    const defY = y + (lh * 3);
    const def = this.needsMasking
      ? '??'
      : output.params.at(3);
    this.drawIcon(IconManager.param(3), leftX, defY);
    this.drawText(def, leftX + 40, defY);

    // draw agi
    const agiY = y;
    const agi = this.needsMasking
      ? '??'
      : output.params.at(6);
    this.drawIcon(IconManager.param(6), rightX, agiY);
    this.drawText(agi, rightX + 40, agiY);

    // draw def
    const lukY = y + (lh * 1);
    const luk = this.needsMasking
      ? '??'
      : output.params.at(7);
    this.drawIcon(IconManager.param(7), rightX, lukY);
    this.drawText(luk, rightX + 40, lukY);

    // draw mat
    const matY = y + (lh * 2);
    const mat = this.needsMasking
      ? '??'
      : output.params.at(4);
    this.drawIcon(IconManager.param(4), rightX, matY);
    this.drawText(mat, rightX + 40, matY);

    // draw mdf
    const mdfY = y + (lh * 3);
    const mdf = this.needsMasking
      ? '??'
      : output.params.at(5);
    this.drawIcon(IconManager.param(5), rightX, mdfY);
    this.drawText(mdf, rightX + 40, mdfY);
  }

  drawTraits(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // shorthand the line height.
    const lh = this.lineHeight() - 8;

    // capture for eacher for downstream policy in this routine.
    const forEacher = (trait, index) =>
    {
      const traitY = y + (lh * index);
      let traitMessage = trait.textNameAndValue();
      if (this.needsMasking)
      {
        traitMessage = traitMessage.replace(/[A-Za-z0-9\-!?',.]/ig, "?");
      }

      // policy step inside draw traits.
      this.drawText(traitMessage, x, traitY, this.detailsQuarterTextWidth());
    };

    // policy step inside draw traits.
    output.traits.forEach(forEacher, this);
  }

  //endregion weapon/armor output

  //region resource output
  drawPrimaryOutputGold(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying resource we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    // capture tw for downstream policy in this routine.
    const tw = this.detailsQuarterTextWidth();
    this.drawText('Resource:', x, y + (lh * 1), tw);

    // capture resource y for downstream policy in this routine.
    const resourceY = y + (lh * 2);
    this.drawIcon(IconManager.rewardParam(1), x, resourceY);
    this.drawText('Gold', x, resourceY, tw);
    this.drawText(`${output.quantity()}`, x, resourceY, tw, Window_Base.TextAlignments.Right);
  }

  drawPrimaryOutputSdp(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying resource we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    // capture tw for downstream policy in this routine.
    const tw = this.detailsQuarterTextWidth();
    this.drawText('Resource:', x, y + (lh * 1), tw);

    // capture resource y for downstream policy in this routine.
    const resourceY = y + (lh * 2);
    this.drawIcon(IconManager.rewardParam(4), x, resourceY);
    this.drawText('SDP', x, resourceY, tw);
    this.drawText(output.quantity(), x, resourceY, tw, Window_Base.TextAlignments.Right);
  }

  //endregion resource output
}

export default Window_RecipeDetails;

//endregion Window_RecipeDetails