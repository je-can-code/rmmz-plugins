//region MasteryTagShapes
/**
 * Says which argument of a notetag carries which meaning.
 *
 * Reading a tag's grammar is generic, but reading its *shape* is not: {@code onSelfHpHealMp:[50, 3]}
 * puts the magnitude first and the reach second, while {@code boostElement:[8, 50]} does the reverse.
 * Without this table a resolver has to guess, and guessing prints a plausible wrong number rather than
 * failing - the one outcome the prose system is built to avoid.
 *
 * This is an extension point rather than a private detail. A plugin introducing a tag whose shape is
 * not obvious registers it from its own tree - {@code MasteryTagShapes.Shapes.myTag = { magnitude: 1 }}
 * - the same way trait formatters are added to {@link RPG_Trait.NameFormatters}. A tag with no entry
 * falls back to "the last numeric argument", which is right for the many tags carrying a single value.
 * @type {Object<string, {magnitude?: number, radius?: number, interval?: number, chance?: number,
 * window?: number, count?: number, perStack?: number}>}
 */
class MasteryTagShapes
{
  /**
   * The known tag shapes, keyed by tag name.
   * @type {Object<string, object>}
   */
  static Shapes = {
    // [TYPE_ID, WINDOW, PCT, COUNT_MODE]
    skillHistoryBonus: { magnitude: 2, window: 1 },

    // [STATE_ID, KIND, COOLDOWN_FRAMES]
    autoApplyState: { interval: 2 },

    // [ID, KIND, MIN_COUNT, COOLDOWN_FRAMES, TRIGGER_TILES]
    autoApplyStateOnNearby: { interval: 3, radius: 4 },
    autoExecuteSkill: { interval: 3, radius: 4 },

    // [PCT, RANGE, MAX_DEPTH]
    onSelfHpHealHp: { magnitude: 0, radius: 1 },
    onSelfHpHealMp: { magnitude: 0, radius: 1 },
    onSelfMpHealMp: { magnitude: 0, radius: 1 },
    onSelfAnyHealMp: { magnitude: 0, radius: 1 },
    onSelfTpHealTp: { magnitude: 0, radius: 1 },
    onAllyHpHealHp: { magnitude: 0, radius: 1 },
    onAllyMpHealMp: { magnitude: 0, radius: 1 },
    onAllyTpHealTp: { magnitude: 0, radius: 1 },

    // [PCT, TILES]
    spread: { magnitude: 0, chance: 0, radius: 1 },

    // [ELEMENT_ID, PCT]
    pierceElement: { magnitude: 1 },
    boostElement: { magnitude: 1 },

    // [ID, PCT, ...]
    retaliate: { chance: 1 },
    onCritApply: { chance: 1 },
    onEvadeApplySelf: { chance: 1 },
    bonusDamageIfState: { magnitude: 1 },
    bonusDamageIfStateType: { magnitude: 1 },

    // [STATE_ID, KIND, PARAM]
    passiveStateCount: { perStack: 2 },

    // [TYPE, ALLOW_DEATH, COUNT]
    purgeStates: { count: 2 },

    // single-value tags whose one argument is a cadence rather than a magnitude.
    spreadTick: { interval: 0 },
  };

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The argument index carrying the given meaning for the given tag.
   * @param {string} tagName The tag being read.
   * @param {string} meaning One of magnitude, radius, interval, chance, window, count or perStack.
   * @returns {number|null} Null when this tag declares no index for that meaning.
   */
  static indexOf(tagName, meaning)
  {
    const shape = MasteryTagShapes.Shapes[tagName];

    if (!shape) return null;

    const index = shape[meaning];

    if (index === undefined) return null;

    return index;
  }
}

export default MasteryTagShapes;
//endregion MasteryTagShapes