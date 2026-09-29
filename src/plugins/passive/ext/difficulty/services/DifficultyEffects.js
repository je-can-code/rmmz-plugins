//region DifficultyEffects
/**
 * Turns difficulty layers into the rows the difficulty scene lists for each side of every fight.
 *
 * A layer's effects live on two states, one every actor carries and one every enemy carries, so describing a
 * layer means describing those states' traits and tags. The applied layer at the top of the list stands for every
 * layer in force at once, so it answers with all of their states together.
 *
 * Traits on the same stat fold into one through {@link TraitResolver.consolidate}, which adds them up the way
 * J-Base stacks them in battle. A row then reads from the player's chair: whatever helps the party or hurts the
 * enemies makes the game easier, and the reverse makes it harder.
 *
 * Tags follow the traits, each described by the plugin that owns it through {@link NotetagDescriber}. They are
 * never merged, because how several copies of a tag combine is up to the plugin that reads it.
 *
 * Nothing here draws. The scene hands these rows to its effect lists, which only lay them out.
 */
class DifficultyEffects
{
  /**
   * The two sides of every fight a layer hands a state to.
   * @type {{ACTOR: string, ENEMY: string}}
   */
  static Sides = {
    ACTOR: 'actor',
    ENEMY: 'enemy',
  };

  /**
   * How a row reads from the player's chair.
   * @type {{EASIER: string, HARDER: string, NEUTRAL: string}}
   */
  static Tones = {
    EASIER: 'easier',
    HARDER: 'harder',
    NEUTRAL: 'neutral',
  };

  /**
   * The trait codes carrying one of the three parameter families, whose good direction the parameter catalog
   * already knows.
   * @type {number[]}
   */
  static ParameterTraitCodes = [ 21, 22, 23 ];

  /**
   * The trait codes for rates of something done to their holder: element damage taken, debuffs and ailments.
   * Less of any of those is better for whoever carries it.
   * @type {number[]}
   */
  static IntakeRateTraitCodes = [ 11, 12, 13 ];

  /**
   * The trait codes that mark something other than an effect, and so never become a row. Code 63 is
   * J-JAFTING's marker for traits that transfer, which the passive detail view leaves out as well.
   * @type {number[]}
   */
  static HiddenTraitCodes = [ 63 ];

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The rows describing what a layer does to one side of every fight.
   * @param {DifficultyLayer} layer The layer being described.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {Array<{iconIndex: number, name: string, value: string, tone: string, isProse?: boolean}>}
   */
  static rowsFor(layer, side)
  {
    // the states this layer hands the given side.
    const stateIds = DifficultyEffects.stateIdsFor(layer, side);

    // every trait those states carry, merged the way the game stacks them, a row each.
    const traitRows = DifficultyEffects.effectTraits(stateIds)
      .map(trait => DifficultyEffects.rowFor(trait, side));

    // then every tag they carry, a row per line its own plugin describes it with.
    const tagRows = DifficultyEffects.effectLines(stateIds)
      .map(line => DifficultyEffects.rowForLine(line, side));

    // each row reads as it does from the player's side of the fight.
    return [ ...traitRows, ...tagRows ];
  }

  //region states
  /**
   * The states a layer hands one side of every fight.
   * @param {DifficultyLayer} layer The layer being described.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {number[]}
   */
  static stateIdsFor(layer, side)
  {
    // the applied layer stands for everything in force, so it answers with all of it.
    if (layer.isAppliedLayer()) return DifficultyEffects.stateIdsInForce(side);

    // any other layer answers with its own state for this side.
    const stateId = DifficultyEffects.stateIdOf(layer, side);

    // a layer that grants this side nothing names no state for it.
    if (stateId === 0) return [];

    return [ stateId ];
  }

  /**
   * The state a layer names for one side of every fight, or 0 when it names none.
   * @param {DifficultyLayer} layer The layer being read.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {number}
   */
  static stateIdOf(layer, side)
  {
    if (side === DifficultyEffects.Sides.ACTOR) return layer.actorStateId;

    return layer.enemyStateId;
  }

  /**
   * The states every layer in force hands one side of every fight.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {number[]}
   */
  static stateIdsInForce(side)
  {
    if (side === DifficultyEffects.Sides.ACTOR) return $gameTemp.actorDifficultyStateIds();

    return $gameTemp.enemyDifficultyStateIds();
  }
  //endregion states

  //region traits
  /**
   * The traits of the given states, one per effect, in the order a status screen lists stats.
   * @param {number[]} stateIds The states to read.
   * @returns {RPG_Trait[]}
   */
  static effectTraits(stateIds)
  {
    // every trait the states carry, leaving out the markers that are not effects at all.
    const traits = stateIds
      .flatMap(stateId => $dataStates[stateId].traits)
      .filter(trait => DifficultyEffects.HiddenTraitCodes.includes(trait.code) === false);

    // traits on the same stat fold into one, and stats that net to no change drop out.
    const consolidated = TraitResolver.consolidate(traits);

    // stat order rather than authoring order, so every layer reads the same way.
    return consolidated.sort(DifficultyEffects.compareTraits);
  }

  /**
   * Orders two traits by code, and by stat within a code.
   * @param {RPG_Trait} a The first trait.
   * @param {RPG_Trait} b The second trait.
   * @returns {number}
   */
  static compareTraits(a, b)
  {
    // a different code decides it outright.
    if (a.code !== b.code) return a.code - b.code;

    // within one code, the stat's own order decides it.
    return a.dataId - b.dataId;
  }
  //endregion traits

  //region tags
  /**
   * The lines describing every tag the given states carry, state by state.
   * @param {number[]} stateIds The states to read.
   * @returns {NotetagLine[]}
   */
  static effectLines(stateIds)
  {
    return stateIds.flatMap(stateId => NotetagDescriber.linesFor($dataStates[stateId]));
  }
  //endregion tags

  //region rows
  /**
   * The row describing one effect to one side of every fight.
   * @param {RPG_Trait} trait The effect.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {{iconIndex: number, name: string, value: string, tone: string}}
   */
  static rowFor(trait, side)
  {
    return {
      iconIndex: trait.iconIndex(),
      name: trait.textName(),
      value: trait.textValue(),
      tone: DifficultyEffects.toneFor(trait, side),
    };
  }

  /**
   * The row describing one tag's line to one side of every fight.
   *
   * A line written as a sentence keeps its value inside its words, so its row says so, and the list colors the
   * value where it stands rather than on the right.
   * @param {NotetagLine} line The line.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {{iconIndex: number, name: string, value: string, tone: string, isProse: boolean}}
   */
  static rowForLine(line, side)
  {
    return {
      iconIndex: line.iconIndex,
      name: line.text,
      value: line.value,
      tone: DifficultyEffects.toneForImpact(line.holderImpact, side),
      isProse: line.hasValueInPlace(),
    };
  }

  /**
   * How an effect reads from the player's chair, given the side it applies to: one of
   * {@link DifficultyEffects.Tones}.
   * @param {RPG_Trait} trait The effect.
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {string}
   */
  static toneFor(trait, side)
  {
    // how the effect sits with whoever carries it.
    const impact = DifficultyEffects.holderImpact(trait);

    return DifficultyEffects.toneForImpact(impact, side);
  }

  /**
   * How an effect reads from the player's chair, given which way it cuts for its holder and the side holding it:
   * one of {@link DifficultyEffects.Tones}.
   * @param {number} impact Whether the effect helps its holder (1), hurts it (-1), or neither (0).
   * @param {string} side One of {@link DifficultyEffects.Sides}.
   * @returns {string}
   */
  static toneForImpact(impact, side)
  {
    // some effects are neither better nor worse for their holder, only different.
    if (impact === 0) return DifficultyEffects.Tones.NEUTRAL;

    // good for the party or bad for the enemies makes the game easier; the reverse makes it harder.
    const isPartySide = (side === DifficultyEffects.Sides.ACTOR);
    const isGoodForHolder = (impact > 0);
    if (isPartySide === isGoodForHolder) return DifficultyEffects.Tones.EASIER;

    return DifficultyEffects.Tones.HARDER;
  }
  //endregion rows

  //region impact
  /**
   * Whether an effect helps its holder (1), hurts it (-1), or neither (0).
   * @param {RPG_Trait} trait The effect.
   * @returns {number}
   */
  static holderImpact(trait)
  {
    // a parameter knows which way is good for it.
    if (DifficultyEffects.ParameterTraitCodes.includes(trait.code))
    {
      return DifficultyEffects.parameterImpact(trait);
    }

    // anything done to the holder is better in smaller amounts.
    if (DifficultyEffects.IntakeRateTraitCodes.includes(trait.code))
    {
      return DifficultyEffects.intakeRateImpact(trait);
    }

    // everything else changes what the holder can do, not how well.
    return 0;
  }

  /**
   * Whether a parameter trait helps its holder (1) or hurts it (-1).
   *
   * The parameter catalog decides which direction is good, so a cost or damage rate reads the right way round
   * without a table of its own here.
   * @param {RPG_Trait} trait A trait of one of the three parameter families.
   * @returns {number}
   */
  static parameterImpact(trait)
  {
    // the catalog entry for the stat this trait moves.
    const parameterKeys = DifficultyEffects.parameterKeysFor(trait.code);
    const parameterKey = parameterKeys[trait.dataId];
    const definition = ParameterRegistry.get(parameterKey);

    // a change in the direction the stat prefers helps its holder; the other direction hurts it.
    const isIncrease = DifficultyEffects.parameterChange(trait) > 0;
    if (isIncrease === definition.isIncreaseBeneficial()) return 1;

    return -1;
  }

  /**
   * The parameter keys of one parameter family, in data id order.
   * @param {number} code The trait code of the family.
   * @returns {string[]}
   */
  static parameterKeysFor(code)
  {
    if (code === ParameterTraitMap.BaseParameterCode) return ParameterTraitMap.BaseParameterKeys;

    if (code === ParameterTraitMap.ExParameterCode) return ParameterTraitMap.ExParameterKeys;

    return ParameterTraitMap.SpParameterKeys;
  }

  /**
   * How far a parameter trait moves its stat. An ex-parameter's value is its own change, while every other
   * parameter rate is a multiplier around 1.
   * @param {RPG_Trait} trait A trait of one of the three parameter families.
   * @returns {number}
   */
  static parameterChange(trait)
  {
    if (trait.code === ParameterTraitMap.ExParameterCode) return trait.value;

    return trait.value - 1;
  }

  /**
   * Whether a rate of something done to the holder helps it (1) or hurts it (-1).
   * @param {RPG_Trait} trait An element, debuff or state rate trait.
   * @returns {number}
   */
  static intakeRateImpact(trait)
  {
    // below 1 means less of it lands on the holder.
    if (trait.value < 1) return 1;

    return -1;
  }
  //endregion impact
}

export default DifficultyEffects;
//endregion DifficultyEffects