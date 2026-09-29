//region ClassManager
/**
 * Answers every question the class scene asks: which classes an actor may look at, whether one of them can
 * be changed into right now, and what changing would do to the actor's parameters.
 *
 * None of this lives in the scene or its windows. A window here draws what this answers and routes input
 * back to it, and nothing more, so everything that decides anything can be tested without a screen.
 */
class ClassManager
{
  /**
   * The level both classes are read at when measuring a multiplier.
   *
   * The editor's maximum, where a baked curve is at its largest and its rounding at its smallest. A class
   * authored as its starting class's curve times a constant reads back as exactly that constant here, which
   * a low level cannot promise: at level 1, a base of 10 times 1.05 bakes to 11 and would read as 1.10.
   * @type {number}
   */
  static MULTIPLIER_REFERENCE_LEVEL = 99;

  /**
   * The parameters the class scene lists for every class, in this order: the three resources, the six stats a
   * class's curves are built around, then the six every class buffs.
   *
   * Every class lists the same parameters, so each keeps its row as the cursor moves from one class to the
   * next, and two classes compare at a glance.
   * @type {string[]}
   */
  static LISTED_PARAMETER_KEYS = [
    'mhp', 'mmp', 'mtp',
    'atk', 'mat', 'def', 'mdf', 'agi', 'luk',
    'hit', 'grd', 'cri', 'cev', 'eva', 'mev',
  ];

  /**
   * The palette index of the engine's power-up color, which {@link ColorManager.powerUpColor} reads: the green
   * the equip screen marks a better parameter in.
   * @type {number}
   */
  static POWER_UP_COLOR_INDEX = 24;

  /**
   * The palette index of the engine's power-down color, which {@link ColorManager.powerDownColor} reads: the
   * red the equip screen marks a worse parameter in.
   * @type {number}
   */
  static POWER_DOWN_COLOR_INDEX = 25;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  //region listing
  /**
   * The classes an actor's list shows, in database order: every class they have unlocked, the one they are
   * standing in, and every class set aside for them that they have yet to unlock, which shows as "???".
   * @param {Game_Actor} actor The actor whose classes are listed.
   * @returns {RPG_Class[]}
   */
  static selectableClasses(actor)
  {
    // the class the actor is standing in is always shown, unlocked or not.
    const currentClassId = actor.currentClass().id;

    // walk the database in order, keeping only what this actor can see.
    return $dataClasses.filter(dataClass => this.isSelectableClass(actor, dataClass, currentClassId));
  }

  /**
   * Determines whether one database row belongs in an actor's class list.
   * @param {Game_Actor} actor The actor whose classes are listed.
   * @param {RPG_Class|null} dataClass The database row, which the engine leaves null at index zero.
   * @param {number} currentClassId The id of the class the actor is standing in.
   * @returns {boolean}
   */
  static isSelectableClass(actor, dataClass, currentClassId)
  {
    // the engine leaves index zero of every database table empty.
    if (dataClass === null) return false;

    // the class the actor is standing in is always shown.
    if (dataClass.id === currentClassId) return true;

    // anything else is shown once it has been unlocked.
    if (actor.isClassUnlocked(dataClass.id)) return true;

    // and a class set aside for the actor shows as "???" until it is.
    return this.isTeasedClass(actor, dataClass.id);
  }

  /**
   * Determines whether an actor may see everything about a class: the one they wear, and any they have
   * unlocked. A class they have yet to unlock shows as "???" and nothing more.
   * @param {Game_Actor} actor The actor looking.
   * @param {number} classId The id of the class being looked at.
   * @returns {boolean}
   */
  static isClassRevealed(actor, classId)
  {
    // the class being worn is always known.
    if (this.isCurrentClass(actor, classId)) return true;

    return actor.isClassUnlocked(classId);
  }

  /**
   * The name a class's row shows: its own once revealed, "???" until then.
   * @param {Game_Actor} actor The actor whose list the row is in.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {string}
   */
  static listedClassName(actor, dataClass)
  {
    // a class not yet unlocked keeps its name to itself.
    if (this.isClassRevealed(actor, dataClass.id) === false) return '???';

    return dataClass.name;
  }

  /**
   * The icon a class's row shows: its own once revealed, the scene's shared class icon until then.
   * @param {Game_Actor} actor The actor whose list the row is in.
   * @param {RPG_Class} dataClass The class the row names.
   * @returns {number}
   */
  static listedClassIconIndex(actor, dataClass)
  {
    // a class not yet unlocked gives nothing of itself away, its icon included.
    if (this.isClassRevealed(actor, dataClass.id) === false) return J.CLASS.Metadata.classIconIndex;

    return this.classIconIndex(dataClass);
  }

  /**
   * The icon a class wears: its own, or the scene's shared class icon for a class without one.
   * @param {RPG_Class} dataClass The class.
   * @returns {number}
   */
  static classIconIndex(dataClass)
  {
    // icon zero is the blank cell, which means the class was never given one.
    if (dataClass.iconIndex === 0) return J.CLASS.Metadata.classIconIndex;

    return dataClass.iconIndex;
  }

  //endregion listing

  //region unlocking
  /**
   * The actors a class may be unlocked for: every id its `<unlockableForActors>` tags name, or none at all for
   * a class without the tag, which any actor may unlock.
   * @param {number} classId The id of the class being read.
   * @returns {number[]}
   */
  static unlockableActorIds(classId)
  {
    const tagStructure = J.CLASS.RegExp.UnlockableForActors;
    const actorIdArrays = RPGManager.getArraysFromNotesByRegex($dataClasses[classId], tagStructure);

    return actorIdArrays.flat();
  }

  /**
   * Determines whether a class is set aside for particular actors, rather than open to anyone.
   * @param {number} classId The id of the class being read.
   * @returns {boolean}
   */
  static isRestrictedClass(classId)
  {
    return this.unlockableActorIds(classId).length > 0;
  }

  /**
   * Determines whether a class may be unlocked for an actor: any class open to anyone, and a class set aside
   * for particular actors only for them.
   * @param {Game_Actor} actor The actor the class would be unlocked for.
   * @param {number} classId The id of the class.
   * @returns {boolean}
   */
  static canUnlockClass(actor, classId)
  {
    // a class that names nobody is open to anyone.
    if (this.isRestrictedClass(classId) === false) return true;

    return this.unlockableActorIds(classId)
      .includes(actor.actorId());
  }

  /**
   * Determines whether a class shows in an actor's list as a locked "???" row: a class set aside for them that
   * they have yet to unlock.
   *
   * Only a class naming the actor is ever teased. One open to anyone would tease every actor at once, and one
   * set aside for somebody else is not theirs to see at all.
   * @param {Game_Actor} actor The actor whose list is being built.
   * @param {number} classId The id of the class.
   * @returns {boolean}
   */
  static isTeasedClass(actor, classId)
  {
    // a class already open to the actor is shown for real.
    if (actor.isClassUnlocked(classId)) return false;

    // only a class set aside for particular actors hints at itself.
    if (this.isRestrictedClass(classId) === false) return false;

    // and only to the actors it is set aside for.
    return this.canUnlockClass(actor, classId);
  }

  //endregion unlocking

  //region changing
  /**
   * Determines whether a class is the one the actor is standing in right now.
   * @param {Game_Actor} actor The actor being asked about.
   * @param {number} classId The id of the class being asked about.
   * @returns {boolean}
   */
  static isCurrentClass(actor, classId)
  {
    return actor.currentClass().id === classId;
  }

  /**
   * Determines whether confirming a class would change the actor into it.
   * @param {Game_Actor} actor The actor who would change.
   * @param {number} classId The id of the class being confirmed.
   * @param {boolean} isChangingAllowed Whether the scene was opened with changing allowed.
   * @returns {boolean}
   */
  static canChangeClass(actor, classId, isChangingAllowed)
  {
    // a scene opened only to look at classes never changes one.
    if (isChangingAllowed === false) return false;

    // changing into the class already worn would do nothing at all.
    if (this.isCurrentClass(actor, classId)) return false;

    // anything else must have been unlocked first.
    return actor.isClassUnlocked(classId);
  }

  /**
   * Changes the actor into the given class.
   *
   * Experience is kept because a class is something an actor decides to be, not a new life. Under
   * J-LevelMaster the level is shared across classes anyway; without it, keeping the experience is what
   * stops every change from dropping the actor back to their new class's first level.
   * @param {Game_Actor} actor The actor who changes.
   * @param {number} classId The id of the class to change into.
   */
  static changeClass(actor, classId)
  {
    actor.changeClass(classId, true);
  }

  //endregion changing

  //region menu
  /**
   * Determines whether the class command appears in the main menu.
   * @returns {boolean}
   */
  static isMenuCommandVisible()
  {
    // an unconfigured switch means the command is always available.
    const switchId = J.CLASS.Metadata.menuSwitchId;
    if (switchId === 0) return true;

    // otherwise the switch governs it.
    return $gameSwitches.value(switchId);
  }

  /**
   * Determines whether the class command in the main menu may change classes, rather than only view them.
   * @returns {boolean}
   */
  static canMenuChangeClasses()
  {
    // an unconfigured switch means the menu only ever views, leaving changes entirely to events.
    const switchId = J.CLASS.Metadata.menuChangeSwitchId;
    if (switchId === 0) return false;

    // otherwise the switch governs it.
    return $gameSwitches.value(switchId);
  }

  //endregion menu

  //region parameters
  /**
   * The id of the class an actor started the game in, which every multiplier is measured against.
   * @param {Game_Actor} actor The actor being measured.
   * @returns {number}
   */
  static startingClassId(actor)
  {
    return actor.actor().classId;
  }

  /**
   * What a class contributes to a parameter at the reference level: the measure its multiplier is read from.
   *
   * J-Classes measures the one thing it knows a class contributes, a parameter's growth curve: a base
   * parameter's, baked into the class's params table, and Max Tech's, which J-LevelMaster reads from a tag- see
   * {@link #maxTpCurveValue}. Every other parameter measures nothing here. An extension that knows another way
   * a class contributes to a parameter- a buff it grants while worn, say- extends this to measure that too,
   * and every multiplier follows from whatever it answers.
   * @param {Game_Actor} actor The actor being measured, for a measure that has to be worked out for them.
   * @param {number} classId The id of the class to read.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {number}
   */
  static referenceValue(actor, classId, parameterKey)
  {
    // max tech has no row in the params table, so its curve is read from where it lives instead.
    if (parameterKey === 'mtp') return this.maxTpCurveValue(classId);

    // only a base parameter has a curve in the params table.
    const paramId = ParameterTraitMap.BaseParameterKeys.indexOf(parameterKey);
    if (paramId === -1) return 0;

    return $dataClasses[classId].params[paramId][this.MULTIPLIER_REFERENCE_LEVEL];
  }

  /**
   * What a class's Max Tech curve gives at the reference level.
   *
   * RPG Maker gives max tech no curve. J-LevelMaster gives a class one through its `<mtpGrowthCurve>` tag, and
   * that curve is the class's base max tech at every level, so this reads the very number J-LevelMaster would
   * give an actor at the reference level. Without J-LevelMaster there is no curve to read, and a class without
   * the tag contributes nothing to measure either way.
   * @param {number} classId The id of the class to read.
   * @returns {number}
   */
  static maxTpCurveValue(classId)
  {
    // only J-LevelMaster gives max tech a curve.
    if (!J.LEVEL) return 0;

    // the class's base max tech at the level every multiplier is measured at.
    const curveValue = GrowthCurveFormula.baseMaxTpForClass($dataClasses[classId], this.MULTIPLIER_REFERENCE_LEVEL);

    // a class without the tag has no curve, and so contributes nothing to measure.
    if (curveValue === null) return 0;

    return curveValue;
  }

  /**
   * Determines whether a parameter can be expressed as a multiple of the actor's starting class. A starting
   * class contributing none of the parameter at the reference level leaves nothing to multiply.
   * @param {Game_Actor} actor The actor being measured.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {boolean}
   */
  static hasParameterMultiplier(actor, parameterKey)
  {
    // read the starting class, which every multiplier divides by.
    const startingClassId = this.startingClassId(actor);

    return this.referenceValue(actor, startingClassId, parameterKey) !== 0;
  }

  /**
   * How a class scales a parameter compared with the actor's starting class.
   * @param {Game_Actor} actor The actor being measured.
   * @param {number} classId The id of the class being measured.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {number}
   */
  static parameterMultiplier(actor, classId, parameterKey)
  {
    // read the class being measured, and the one it is measured against.
    const startingClassId = this.startingClassId(actor);
    const classValue = this.referenceValue(actor, classId, parameterKey);
    const startingValue = this.referenceValue(actor, startingClassId, parameterKey);

    return classValue / startingValue;
  }

  /**
   * The class scene's multiplier column for a parameter: the class's multiplier, to the two decimals
   * multipliers are authored in.
   *
   * A class leaving a parameter at its starting class's reads ×1.00, and shows it, so every row carries a
   * multiplier. Only a parameter the starting class contributes nothing to has nothing to multiply, and shows
   * nothing.
   * @param {Game_Actor} actor The actor being measured.
   * @param {number} classId The id of the class being measured.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {string}
   */
  static multiplierText(actor, classId, parameterKey)
  {
    // a starting class contributing none of the parameter leaves nothing to compare against.
    if (this.hasParameterMultiplier(actor, parameterKey) === false) return String.empty;

    // two decimals is what multipliers are authored in.
    const multiplier = this.parameterMultiplier(actor, classId, parameterKey);

    return `×${multiplier.toFixed(2)}`;
  }

  /**
   * Determines whether changing into the class a preview stands in would move a parameter's value.
   *
   * A parameter the change would leave where it is reads as it stands, the way the equip screen reads a
   * parameter an item leaves alone, and so does every parameter of the class already worn, which has no
   * preview to compare against.
   * @param {Game_Actor} actor The actor as they stand, raw- see {@link #baselineActor}.
   * @param {Game_Actor|null} previewActor The copy of the actor standing in the class, which the class
   *   already worn does not have.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {boolean}
   */
  static isParameterChanging(actor, previewActor, parameterKey)
  {
    // the class already worn has nothing to compare against.
    if (previewActor === null) return false;

    // any other class changes a parameter whose value it would move.
    return actor.parameter(parameterKey) !== previewActor.parameter(parameterKey);
  }

  /**
   * How one parameter would change if the actor changed into the class a preview stands in: the value it
   * would become, padded the way the catalog pads a value as it stands so every row reads alike, the signed
   * change, and the palette index both are drawn in- see {@link #changeColorIndex}.
   *
   * The color says which way the change reads rather than which way the number moves. A cost or a damage rate
   * reads a drop as good news, so its sign is flipped before the color is chosen.
   * @param {Game_Actor} actor The actor as they stand, raw- see {@link #baselineActor}.
   * @param {Game_Actor} previewActor The copy of the actor standing in the class.
   * @param {string} parameterKey The registry key of the parameter.
   * @returns {{valueText: string, changeText: string, colorIndex: number}}
   */
  static parameterChange(actor, previewActor, parameterKey)
  {
    const definition = ParameterRegistry.get(parameterKey);
    const projected = previewActor.parameter(parameterKey);
    const difference = projected - actor.parameter(parameterKey);

    // lower-is-better parameters read a drop as the good direction.
    const benefit = definition.isIncreaseBeneficial()
      ? difference
      : -difference;

    // the change is always signed, so it reads as a change even beside a value that is itself negative.
    const deltaText = definition.prettyDelta(difference, actor);

    return {
      valueText: definition.prettyValue(projected, true, previewActor),
      changeText: `(${deltaText})`,
      colorIndex: this.changeColorIndex(benefit),
    };
  }

  /**
   * The palette index a change is drawn in, the same colors the equip screen marks a change with: the
   * engine's power-up color for a change that is good for the actor, its power-down color for one that is
   * bad, and normal text for no change at all.
   * @param {number} benefit How good the change is for the actor: positive when good, negative when bad.
   * @returns {number}
   */
  static changeColorIndex(benefit)
  {
    // good news reads in the power-up color.
    if (benefit > 0) return this.POWER_UP_COLOR_INDEX;

    // bad news reads in the power-down color.
    if (benefit < 0) return this.POWER_DOWN_COLOR_INDEX;

    // and no change at all reads as normal text.
    return 0;
  }

  /**
   * The parameters the class scene lists for every class, in the order it lists them- see
   * {@link #LISTED_PARAMETER_KEYS}.
   * @returns {string[]}
   */
  static listedParameterKeys()
  {
    return [ ...this.LISTED_PARAMETER_KEYS ];
  }

  /**
   * Orders parameters the way the class scene lists them, as {@link #listedParameterKeys} does.
   *
   * A parameter the scene never lists can still arrive here- a growth section lists anything a class grows-
   * so it sorts after every listed one, keeping the order it arrived in.
   * @param {string[]} parameterKeys The parameters to order.
   * @returns {string[]} The same parameters, in listing order.
   */
  static inListingOrder(parameterKeys)
  {
    const listedKeys = this.listedParameterKeys();

    /**
     * Where a parameter falls in the listing: its place, or after every listed parameter.
     * @param {string} parameterKey The parameter to place.
     * @returns {number}
     */
    const rankOf = parameterKey =>
    {
      const rank = listedKeys.indexOf(parameterKey);

      // a parameter the listing never shows follows all of it.
      if (rank === -1) return listedKeys.length;

      return rank;
    };

    // sorting is stable, so parameters sharing a rank keep the order they arrived in.
    return [ ...parameterKeys ].sort((left, right) => rankOf(left) - rankOf(right));
  }

  /**
   * The copy of the actor a class's parameters are compared against in the class scene.
   *
   * Returns null for the class the actor is already standing in: it would change nothing, so its parameters
   * are shown as they stand rather than as a comparison.
   * @param {Game_Actor} actor The actor whose classes are shown.
   * @param {number} classId The id of the class being shown.
   * @returns {Game_Actor|null}
   */
  static comparisonActor(actor, classId)
  {
    // the class already worn has nothing to compare against.
    if (this.isCurrentClass(actor, classId)) return null;

    return this.previewActor(actor, classId);
  }

  /**
   * Builds a copy of the actor standing in the given class with nothing equipped, to read what the class
   * itself makes of them.
   *
   * This is the equip scene's preview trick with the gear taken off. The class sheet compares raw stats, so
   * the class's curve and its own buffs, the actor's growth and their passives all land in what the copy
   * reports, and only equipment is left out. Leaving gear in would mislead: a class that cannot wear what is
   * equipped takes it off when it is changed into, so the copy would count gear the change removes.
   *
   * The copy is thrown away after reading, and nothing done to it reaches the real actor. The gear comes off
   * each slot directly rather than through unequipping, which trades with the party's inventory and runs the
   * refresh every plugin hooks into. For the same reason the class-change hooks are not run, so a class
   * granting passive states through `<passive>` previews without them.
   * @param {Game_Actor} actor The actor to copy.
   * @param {number} classId The id of the class the copy stands in.
   * @returns {Game_Actor}
   */
  static previewActor(actor, classId)
  {
    // copy everything the actor carries.
    const preview = JsonEx.makeDeepCopy(actor);

    // stand the copy in the class being previewed, with nothing equipped.
    preview.setClassId(classId);
    preview.rawEquips()
      .forEach(slot => slot.setObject(null));

    // drop every cache the class and the gear feed, so the copy reads what it is now.
    preview.onBattlerDataChange();

    return preview;
  }

  /**
   * Builds a copy of the actor as they stand, in the class they wear, with nothing equipped: the raw stats
   * every other class is compared against.
   * @param {Game_Actor} actor The actor to copy.
   * @returns {Game_Actor}
   */
  static baselineActor(actor)
  {
    const currentClassId = actor.currentClass().id;

    return this.previewActor(actor, currentClassId);
  }

  //endregion parameters
}

export default ClassManager;
//endregion ClassManager