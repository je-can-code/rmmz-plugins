//region Window_MoreEquipData
/**
 * A window designed to display "more" data associated with the equipment.
 */
class Window_MoreEquipData
  extends Window_MoreData
{
  constructor(rect)
  {
    super(rect);
    this.contentsBack.paintOpacity = 255;
  }

  /**
   * Compiles the "more data" for the currently selected equipment.
   */
  makeCommandList()
  {
    // perform base logic.
    super.makeCommandList();

    // check whether or not we can build commands.
    if (!this.canBuildCommands())
    {
      // at least adjust the window height for the no-commands.
      this.adjustWindowHeight();

      // stop processing.
      return;
    }

    // build all the various commands for this data window.
    this.buildCommands();

    // always adjust after determining the commands.
    this.adjustWindowHeight();
  }

  /**
   * Determines whether or not commands for the "more data" window can be built.
   * @returns {boolean} True if the commands can be built, false otherwise.
   */
  canBuildCommands()
  {
    // if there is no item, we cannot build commands.
    if (!this.item) return false;

    // if there is no actor, we cannot build commands.
    if (!this.actor) return false;

    // we can build commands!
    return true;
  }

  /**
   * Build all commands for this particular hovered item.
   */
  buildCommands()
  {
    // add jafting-related data.
    this.addJaftingRefinementData();

    // add the hit count.
    this.addHitsCommand();

    // add all the traits from the database.
    this.addEquipmentTraitData();
  }

  /**
   * Adds per-connection bonus hit lines from scoped JABS tags, plus a weapon hit-count summary.
   */
  addHitsCommand()
  {
    const {item} = this;
    const isWeapon = item.isWeapon();
    const globalHits = item.jabsBonusHitsScopeGlobal;
    const basicHits = item.jabsBonusHitsScopeBasic;
    const skillHits = item.jabsBonusHitsScopeSkill;

    const hasAnyScope = globalHits > 0 || basicHits > 0 || skillHits > 0;

    if (hasAnyScope === false && isWeapon === false) return;

    const hitBonusIcon = IconManager.jabsParameterIcon(IconManager.JABS_PARAMETER.BONUS_HITS);

    const pushScopeRow = (label, value) =>
    {
      const text = `${label}: +${value}`;
      const row = new WindowCommandBuilder(text)
        .setIconIndex(hitBonusIcon)
        .build();
      this.addBuiltCommand(row);
    };

    if (globalHits > 0) pushScopeRow('Bonus hits (global)', globalHits);
    if (basicHits > 0) pushScopeRow('Bonus hits (basic)', basicHits);
    if (skillHits > 0) pushScopeRow('Bonus hits (skill)', skillHits);

    if (isWeapon)
    {
      const weaponHitTotal = 1 + globalHits + basicHits;
      const hitCountRow = new WindowCommandBuilder(`Hit count: x${weaponHitTotal}`)
        .setIconIndex(hitBonusIcon)
        .build();
      this.addBuiltCommand(hitCountRow);
    }
  }

  /**
   * Adds all commands related to JAFTING on the equipment.
   */
  addJaftingRefinementData()
  {
    const {
      jaftingMaxRefineCount,
      jaftingMaxTraitCount,
      jaftingNotRefinementBase,
      jaftingNotRefinementMaterial,
      jaftingRefinedCount,
      jaftingUnrefinable,
    } = this.item;

    if (jaftingUnrefinable)
    {
      const unrefinableCommand = `Unrefinable`;
      const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.UNREFINABLE);
      const unrefinableColor = 2;
      this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
      return;
    }

    if (jaftingNotRefinementBase)
    {
      const unrefinableCommand = `Only Refine as Material`;
      const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.NOT_BASE);
      const unrefinableColor = 2;
      this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
    }

    if (jaftingNotRefinementMaterial)
    {
      const unrefinableCommand = `Only Refine as Base`;
      const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.NOT_MATERIAL);
      const unrefinableColor = 2;
      this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
    }

    let maxRefineCommand = `Refinement: ${jaftingRefinedCount}`;
    let maxRefineIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.TIMES_REFINED);
    if (jaftingMaxRefineCount)
    {
      maxRefineCommand += ` / ${jaftingMaxRefineCount}`;
      if (jaftingMaxRefineCount === jaftingRefinedCount)
      {
        maxRefineIcon = 91;
      }
    }

    this.addCommand(maxRefineCommand, null, true, null, maxRefineIcon);

    const maxTraitIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.MAX_TRAITS);
    const currentTraitCount = JaftingManager.parseTraits(this.item).length;
    let maxTraitCommand = `Transferable Traits: ${currentTraitCount}`;
    if (jaftingMaxTraitCount)
    {
      maxTraitCommand += ` / ${jaftingMaxTraitCount}`;
    }

    this.addCommand(maxTraitCommand, null, true, null, maxTraitIcon);
  }

  /**
   * Adds all trait commands on the equipment.
   */
  addEquipmentTraitData()
  {
    // param-modifying traits (b/x/s) are deliberately excluded here — the equip status window's
    // parameter grid already shows every one of these as a current → projected comparison across
    // the actor's whole build, which is strictly more useful than restating the item's isolated
    // trait value in this popup too.
    const paramTraitCodes = [
      J.BASE.Traits.B_PARAMETER,
      J.BASE.Traits.X_PARAMETER,
      J.BASE.Traits.S_PARAMETER,
    ];

    // we have no traits worth showing.
    const allTraits = this.item.traits.filter(trait => paramTraitCodes.includes(trait.code) === false);
    if (!allTraits.length) return;

    const hasDivider = allTraits.some(trait => trait.code === J.BASE.Traits.NO_DISAPPEAR);
    if (hasDivider)
    {
      this.addCommand(`BASE TRAITS`, null, true, null, 16, 30);
    }

    allTraits.forEach(t =>
    {
      const convertedTrait = new JAFTING_Trait(t.code, t.dataId, t.value);
      let commandName = convertedTrait.nameAndValue;
      let commandColor = 0;
      if (convertedTrait._code === J.BASE.Traits.NO_DISAPPEAR)
      {
        commandName = convertedTrait.name;
        commandColor = 30;
      }

      const commandIcon = IconManager.trait(convertedTrait);
      this.addCommand(commandName, null, true, null, commandIcon, commandColor);
    });
  }
}

export default Window_MoreEquipData;
//endregion Window_MoreEquipData