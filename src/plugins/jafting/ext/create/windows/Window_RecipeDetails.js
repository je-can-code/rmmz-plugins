//region Window_RecipeDetails
class Window_RecipeDetails
  extends Window_Base
{
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
   * Implements {@link Window_Base.drawContent}.<br>
   * Draws a the recipe details.
   */
  drawContent()
  {
    if (!this.#canDrawContent()) return;

    // define the origin x,y coordinates.
    const [ x, y ] = [ 0, 0 ];

    // render the ingredients header text.
    const ingredientsX = x;
    const ingredientsY = y;
    this.drawIngredientsHeader(ingredientsX, ingredientsY);

    // render the tools header text.
    const toolsX = x + 330;
    const toolsY = y;
    this.drawToolsHeader(toolsX, toolsY);

    // render the outputs header text.
    const outputsX = x + 660;
    const outputsY = y;
    this.drawOutputsHeader(outputsX, outputsY);

    // render the primary output data.
    const primaryOutputX = x + 990;
    const primaryOutputY = y;
    this.drawPrimaryOutput(primaryOutputX, primaryOutputY);
  }

  /**
   * Determines if the content for this window can be drawn.
   * @return {boolean}
   */
  #canDrawContent()
  {
    // if there is no recipe, then we cannot draw its detail.
    if (this.#currentRecipe == null) return false;

    // we can draw content!
    return true;
  }

  /**
   * Renders the ingredient list header information.
   */
  drawIngredientsHeader(x, y)
  {
    // reset all the font stuff before we start.
    this.resetFontSettings();

    // render the header text.
    this.modFontSize(4);
    this.toggleBold();
    this.drawText('INGREDIENTS', x, y, 300, 'left');
    this.toggleBold();

    // render the subtext.
    this.modFontSize(-12);
    this.toggleItalics();
    const subtext = 'Materials consumed when crafting this recipe.';
    this.drawText(subtext, x, y + 20, this.textWidth(subtext), Window_Base.TextAlignments.Left);
    this.toggleItalics();

    this.drawHorizontalLine(x, y + 50, 300, 3);
  }

  /**
   * Renders the tool list header information.
   */
  drawToolsHeader(x, y)
  {
    // reset all the font stuff before we start.
    this.resetFontSettings();

    // render the header text.
    this.modFontSize(4);
    this.toggleBold();
    this.drawText('TOOLS', x, y, 300, 'left');
    this.toggleBold();

    // render the subtext.
    this.modFontSize(-12);
    this.toggleItalics();
    const subtext = "Materials required to craft this recipe.";
    this.drawText(subtext, x, y + 20, this.textWidth(subtext), Window_Base.TextAlignments.Left);

    this.drawHorizontalLine(x, y + 50, 300, 3);
  }

  /**
   * Renders the output list header information.
   */
  drawOutputsHeader(x, y)
  {
    // reset all the font stuff before we start.
    this.resetFontSettings();

    // render the outputs header text.
    this.modFontSize(4);
    this.toggleBold();
    this.drawText('OUTPUTS', x, y, 300, 'left');
    this.toggleBold();

    // render the subtext.
    this.modFontSize(-12);
    this.toggleItalics();
    const subtext = "Materials generated when the recipe is crafted.";
    this.drawText(subtext, x, y + 20, this.textWidth(subtext), Window_Base.TextAlignments.Left);

    this.drawHorizontalLine(x, y + 50, 300, 3);
  }

  drawPrimaryOutput(x, y)
  {
    // reset all the font stuff before we start.
    this.resetFontSettings();

    // a nice vertical line is appreciated.
    this.drawVerticalLine(x - 20, y, this.innerHeight, 3);

    // shorthand the line height.
    const lh = this.lineHeight();

    const proficiency = `Proficiency: ${this.#currentRecipe.getProficiency()}`;
    this.drawText(proficiency, x, y, 200);

    // grab the component for the primary output of this recipe.
    const primaryOutput = this.#currentRecipe.outputs.at(0);

    switch (primaryOutput.getComponentType())
    {
      case (CraftingComponent.Types.Item):
        this.drawPrimaryOutputItem(x, y);
        break;
      case (CraftingComponent.Types.Weapon):
        this.drawPrimaryOutputWeaponOrArmor(x, y);
        break;
      case (CraftingComponent.Types.Armor):
        this.drawPrimaryOutputWeaponOrArmor(x, y);
        break;
      case (CraftingComponent.Types.Gold):
        this.drawPrimaryOutputGold(x, y);
        break;
      case (CraftingComponent.Types.SDP):
        this.drawPrimaryOutputSdp(x, y);
        break;
    }

    this.drawText('', x, y + (lh * 1), 300);
  }

  //region item output
  drawPrimaryOutputItem(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying item we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    const lifeY = y + (lh * 1);
    this.drawLifeMessage(output, x, lifeY);

    const magiY = y + (lh * 2);
    this.drawMagiMessage(output, x, magiY);

    const techY = y + (lh * 3);
    this.drawTechMessage(output, x, techY);

    const revivalY = y + (lh * 5);
    this.drawRevival(output, x, revivalY);

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

    // render the message.
    this.drawText(recoveryMessage.trim(), x + 40, y, 200);
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

    // render the message.
    this.drawText(recoveryMessage.trim(), x + 40, y, 200);
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

    // render the message.
    this.drawText(recoveryMessage, x + 40, y, 200);
  }

  drawRevival(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    // find the first revival effect.
    const revivalEffect = output.effects
      .find(effect => effect.code === Game_Action.EFFECT_REMOVE_STATE && effect.dataId === $gameParty.leader()
        .deathStateId());

    this.drawIcon($dataStates.at(1).iconIndex, x, y);

    let text = revivalEffect
      ? `Revival ${revivalEffect.value1 * 100}%`
      : `Cannot revive.`;

    if (this.needsMasking)
    {
      text = '??';
    }

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

    const forEacher = (foodStateEffect, index) =>
    {
      /** @type {RPG_State} */
      const foodState = $dataStates.at(foodStateEffect.dataId);

      const foodStateY = y + (index * lh);
      this.drawIcon(foodState.iconIndex, x, foodStateY);

      const foodStateText = `${foodState.name}`;
      const foodStateNameX = x + 40;
      this.drawText(foodStateText, foodStateNameX, foodStateY, 200);

      const foodStateEffectChance = this.needsMasking
        ? "?"
        : `${foodStateEffect.value1 * 100}%`;

      this.drawText(foodStateEffectChance, foodStateNameX, foodStateY, 160, 'right');
    };

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

    const coreParamsY = y + (lh * 1);
    this.drawCoreParams(output, x, coreParamsY);

    const traitsY = y + (lh * 5);
    this.drawTraits(output, x, traitsY);
  }

  drawCoreParams(output, x, y)
  {
    // start from scratch.
    this.resetFontSettings();

    const leftX = x;
    const rightX = x + 100;

    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // draw mhp
    const mhpY = y;
    const mhp = this.needsMasking
      ? '??'
      : output.params.at(0);
    this.drawIcon(IconManager.param(0), leftX, mhpY);
    this.drawText(mhp, leftX + 40, mhpY);

    // draw mmp
    const mmpY = y + (lh * 1);
    const mmp = this.needsMasking
      ? '??'
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

    const forEacher = (trait, index) =>
    {
      const traitY = y + (lh * index);
      let traitMessage = trait.textNameAndValue();
      if (this.needsMasking)
      {
        traitMessage = traitMessage.replace(/[A-Za-z0-9\-!?',.]/ig, "?");
      }

      this.drawText(traitMessage, x, traitY);
    };

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

    // render the text.
    this.drawText('Resource:', x, y + (lh * 1), 150);

    const resourceY = y + (lh * 2);
    this.drawIcon(IconManager.rewardParam(1), x, resourceY);
    this.drawText('Gold', x, resourceY, 150);
    this.drawText(`${output.quantity()}`, x, resourceY, 150, Window_Base.TextAlignments.Right);
  }

  drawPrimaryOutputSdp(x, y)
  {
    // shorthand the line height.
    const lh = this.lineHeight() - 4;

    // grab the underlying resource we're working with.
    const output = this.#currentRecipe.outputs.at(0)
      .getItem();

    // render the text.
    this.drawText('Resource:', x, y + (lh * 1), 150);

    const resourceY = y + (lh * 2);
    this.drawIcon(IconManager.rewardParam(4), x, resourceY);
    this.drawText('SDP', x, resourceY, 150);
    this.drawText(output.quantity(), x, resourceY, 150, Window_Base.TextAlignments.Right);
  }

  //endregion resource output
}

//endregion Window_RecipeDetails