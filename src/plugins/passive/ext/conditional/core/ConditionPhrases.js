//region ConditionPhrases
import AutoRuleManager from './../managers/AutoRuleManager.js';
import PassiveRuleJabsAccess from './../helpers/PassiveRuleJabsAccess.js';

/**
 * Turns the condition an automatic rule, a passive gate or a stack count hangs on into the phrase a player reads, in
 * the words the game's config keeps for each kind: "every 5 seconds", "while an ally is within 3 tiles", "per nearby
 * enemy".
 *
 * Every tuple is read the way its own reader reads it ({@link AutoRuleManager}, {@link PassiveGateEvaluator} and
 * {@link PassiveStackCountEvaluator}), so a phrase never claims a number the rule does not use. Frames are spoken as
 * seconds and distances as tiles, each through a phrase of its own, so the unit's word belongs to the game as well.
 *
 * A count of exactly one asks for its phrase's `.one` variant and never falls back to the plural, since "1 seconds"
 * is worse than no line at all. A gate reading battlers other than its holder asks for its scope's variant the same
 * way, since the plain phrase would describe the holder instead. Only a trigger's throttle may be left unsaid: it is
 * detail, and a line without it is still true.
 */
class ConditionPhrases
{
  /**
   * How many frames make a second.
   * @type {number}
   */
  static FramesPerSecond = 60;

  /**
   * The trigger kinds whose number is an interval to wait out, rather than a throttle on an event.
   * @type {string[]}
   */
  static IntervalTriggerKinds = [ 'time', 'stand' ];

  /**
   * The trigger kinds firing on one resource being lost or restored, keyed to the resource each watches.
   * @type {Object<string, string>}
   */
  static ResourceTriggerKinds = {
    hpDmg: 'hp',
    mpDmg: 'mp',
    tpDmg: 'tp',
    onHealHp: 'hp',
    onHealMp: 'mp',
    onHealTp: 'tp',
  };

  /**
   * The proximity kinds that count allies, whose automatic rules always measure the default radius.
   * @type {string[]}
   */
  static AllyProximityKinds = [ 'alliesNearby', 'alliesNearbyBelow' ];

  /**
   * The gate kinds comparing a resource against a percentage, keyed to the resource each reads.
   * @type {Object<string, string>}
   */
  static ResourceGateKinds = {
    hpAbove: 'hp',
    hpBelow: 'hp',
    mpAbove: 'mp',
    mpBelow: 'mp',
    tpAbove: 'tp',
    tpBelow: 'tp',
  };

  /**
   * The gate kinds counting battlers, near or targeting the holder, against a threshold.
   * @type {string[]}
   */
  static CountingGateKinds = [
    'alliesNearby',
    'enemiesNearby',
    'alliesNearbyBelow',
    'enemiesNearbyBelow',
    'enemiesTargetingMe',
    'enemiesTargetingMeBelow',
  ];

  /**
   * The gate kinds measured in frames since, or within, something last happened.
   * @type {string[]}
   */
  static TimingGateKinds = [
    'sinceLastMoved',
    'sinceLastHit',
    'sinceLastAttacked',
    'movedWithin',
    'hitWithin',
    'attackedWithin',
    'onHealHp',
    'onHealMp',
    'onHealTp',
  ];

  /**
   * The stack count kinds scaled by how much of a resource is missing or present, keyed to the resource each reads.
   * @type {Object<string, string>}
   */
  static ResourceCountKinds = {
    lessIsMoreHp: 'hp',
    lessIsMoreMp: 'mp',
    lessIsMoreTp: 'tp',
    moreIsMoreHp: 'hp',
    moreIsMoreMp: 'mp',
    moreIsMoreTp: 'tp',
  };

  /**
   * The name each resource goes by, asked of the manager that owns it.
   * @type {Object<string, function(): string>}
   */
  static ResourceNames = {
    hp: () => TextManager.hp,
    mp: () => TextManager.mp,
    tp: () => TextManager.tp,
  };

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  //region triggers
  /**
   * The phrase for the condition an automatic rule fires on, from a tuple shaped `[payload, kind, param, …]` as every
   * automatic rule tag writes it.
   * @param {any[]} tuple The rule's parsed tuple.
   * @returns {{text: string, kind: string}}
   */
  static trigger(tuple)
  {
    const [ , kind, param ] = tuple;

    // a proximity rule counts battlers in range, and fires on its own cooldown while enough of them are there.
    if (AutoRuleManager.isProximityKind(kind)) return this.proximityTrigger(tuple);

    // travel fires once for every so many whole tiles moved.
    if (kind === 'move') return this.moveTrigger(param);

    // a timer, or standing still, fires once every interval.
    if (this.IntervalTriggerKinds.includes(kind)) return this.intervalTrigger(kind, param);

    // every other trigger is an event, whose number only says how often it may fire.
    return this.eventTrigger(kind, param);
  }

  /**
   * The phrase for a trigger that fires once for every so many whole tiles its holder travels.
   * @param {number} tilesPerFiring The whole tiles traveled between two firings.
   * @returns {{text: string, kind: string}}
   */
  static moveTrigger(tilesPerFiring)
  {
    // the distance, in the tiles a player sees.
    const tiles = this.tiles(tilesPerFiring);

    return NotetagDescriber.phrase('trigger.move', { tiles });
  }

  /**
   * The phrase for a trigger that fires once every interval.
   * @param {string} kind The trigger kind.
   * @param {number} frames The interval, in frames.
   * @returns {{text: string, kind: string}}
   */
  static intervalTrigger(kind, frames)
  {
    // the interval, in the seconds a player feels.
    const seconds = this.seconds(frames);

    return NotetagDescriber.phrase(`trigger.${kind}`, { seconds });
  }

  /**
   * The phrase for a trigger that counts battlers in range, singular when it asks for exactly one.
   * @param {any[]} tuple The rule's parsed tuple, `[payload, kind, count, cooldown, radius?]`.
   * @returns {{text: string, kind: string}}
   */
  static proximityTrigger(tuple)
  {
    const [ , kind, count ] = tuple;

    // exactly one battler reads in the singular.
    const key = this.countedKey(`trigger.${kind}`, count);
    const tokens = this.proximityTokens(tuple);

    return NotetagDescriber.phrase(key, tokens);
  }

  /**
   * The tokens every proximity rule's words may name: how many battlers, within how far, and how often.
   *
   * An automatic rule counting allies always measures the default radius, whatever the tag writes after it, so its
   * tiles are the default's too.
   * @param {any[]} tuple The rule's parsed tuple, `[payload, kind, count, cooldown, radius?]`.
   * @returns {Object<string, {text: string, kind: string}>}
   */
  static proximityTokens(tuple)
  {
    const [ , kind, count, cooldown, radius ] = tuple;

    // allies are always sought within the default radius.
    const measuredRadius = this.AllyProximityKinds.includes(kind)
      ? undefined
      : radius;

    return {
      count: this.quantity(count),
      tiles: this.radius(measuredRadius),
      seconds: this.seconds(cooldown),
    };
  }

  /**
   * The phrase for a trigger that fires on an event, saying its throttle when the game's words for that are written.
   *
   * An event watching one resource, such as losing Life or having Magi restored, may name that resource as
   * `{resource}`.
   * @param {string} kind The trigger kind.
   * @param {number} throttleFrames The fewest frames between two firings, or 0 for none.
   * @returns {{text: string, kind: string}}
   */
  static eventTrigger(kind, throttleFrames)
  {
    const key = `trigger.${kind}`;
    const throttledKey = `${key}.throttled`;
    const tokens = this.eventTokens(kind);

    // a throttle is detail: said when its words are written, and otherwise left out, which is still true.
    if (throttleFrames > 0 && NotetagDescriber.hasTemplate(throttledKey))
    {
      const seconds = this.seconds(throttleFrames);

      return NotetagDescriber.phrase(throttledKey, { ...tokens, seconds });
    }

    return NotetagDescriber.phrase(key, tokens);
  }

  /**
   * The tokens an event trigger's words may name: the resource it watches, when it watches one.
   * @param {string} kind The trigger kind.
   * @returns {Object<string, {text: string, kind: string}>}
   */
  static eventTokens(kind)
  {
    // most events watch no resource at all.
    if (Object.hasOwn(this.ResourceTriggerKinds, kind) === false) return {};

    // the resource being lost or restored, as its manager names it.
    const resource = this.resourceToken(this.ResourceTriggerKinds[kind]);

    return { resource };
  }
  //endregion triggers

  //region gates
  /**
   * The phrase for the condition a passive gate holds on, from a rule shaped `[kind, param, …]` as a source rule
   * writes it, and as a state rule writes it after its state.
   * @param {any[]} rule The gate's parsed rule.
   * @returns {{text: string, kind: string}}
   */
  static gate(rule)
  {
    const [ kind, param ] = rule;

    // a resource against a percentage, for the holder or for the battlers around it.
    if (Object.hasOwn(this.ResourceGateKinds, kind)) return this.resourceGate(rule);

    // battlers counted near the holder, or targeting it.
    if (this.CountingGateKinds.includes(kind)) return this.countingGate(rule);

    // time since, or within, something last happened.
    if (this.TimingGateKinds.includes(kind))
    {
      const seconds = this.seconds(param);

      return NotetagDescriber.phrase(`gate.${kind}`, { seconds });
    }

    // anything else names nothing but its own words, or says nothing.
    return NotetagDescriber.phrase(`gate.${kind}`, {});
  }

  /**
   * The phrase for a gate comparing a resource against a percentage.
   *
   * A gate reading battlers around its holder asks for its scope's own phrase, and says nothing when that is not
   * written, since the plain phrase would be about the holder instead.
   * @param {any[]} rule The gate's parsed rule, `[kind, percent, scope?, range?]`.
   * @returns {{text: string, kind: string}}
   */
  static resourceGate(rule)
  {
    const [ kind, percent, scope, range ] = rule;

    // the holder's own resource, unless the gate reads the battlers around it.
    const isAboutOthers = scope !== undefined && scope !== 'self';
    const key = isAboutOthers
      ? `gate.${kind}.${scope}`
      : `gate.${kind}`;

    // the threshold, the resource it reads, and how far around the holder it looks when it looks at all.
    const tokens = {
      percent: this.quantity(`${percent}%`),
      resource: this.resourceToken(this.ResourceGateKinds[kind]),
      tiles: this.radius(range),
    };

    return NotetagDescriber.phrase(key, tokens);
  }

  /**
   * The phrase for a gate counting battlers against a threshold, singular when the threshold is exactly one.
   * @param {any[]} rule The gate's parsed rule, `[kind, count, radius?]`.
   * @returns {{text: string, kind: string}}
   */
  static countingGate(rule)
  {
    const [ kind, count, radius ] = rule;

    // exactly one battler reads in the singular.
    const key = this.countedKey(`gate.${kind}`, count);

    // how many battlers, and within how far when the gate measures a distance.
    const tokens = {
      count: this.quantity(count),
      tiles: this.radius(radius),
    };

    return NotetagDescriber.phrase(key, tokens);
  }
  //endregion gates

  //region counts
  /**
   * The phrase for what a stack count counts, from a tuple shaped `[state, kind, per, radius?]`.
   *
   * A resource is counted in steps of a percentage, which reads the same for any step. Everything else is counted
   * per so many things, which reads in the singular when the step is exactly one.
   * @param {any[]} tuple The count's parsed tuple.
   * @returns {{text: string, kind: string}}
   */
  static count(tuple)
  {
    const [ , kind, per, radius ] = tuple;

    // a resource's missing or present share, in steps of a percentage.
    if (Object.hasOwn(this.ResourceCountKinds, kind)) return this.resourceCount(kind, per);

    // so many battlers or states per stack, singular for exactly one.
    const key = this.countedKey(`count.${kind}`, per);

    // the step, and how far around the holder it counts when it counts battlers.
    const tokens = {
      per: this.quantity(per),
      tiles: this.radius(radius),
    };

    return NotetagDescriber.phrase(key, tokens);
  }

  /**
   * The phrase for a stack count scaled by a resource, in steps of a percentage.
   * @param {string} kind The count kind.
   * @param {number} percentPerStack The percentage of the resource each stack takes.
   * @returns {{text: string, kind: string}}
   */
  static resourceCount(kind, percentPerStack)
  {
    // the step, and the resource it is a share of.
    const tokens = {
      per: this.quantity(`${percentPerStack}%`),
      resource: this.resourceToken(this.ResourceCountKinds[kind]),
    };

    return NotetagDescriber.phrase(`count.${kind}`, tokens);
  }
  //endregion counts

  //region units
  /**
   * A number of frames, spoken as seconds to two decimals at most, in the unit's own words.
   * @param {number} frames The frames.
   * @returns {{text: string, kind: string}}
   */
  static seconds(frames)
  {
    // frames as the seconds a player feels, to two decimals at most.
    const seconds = Math.round((frames / this.FramesPerSecond) * 100) / 100;

    return this.unit('unit.seconds', seconds);
  }

  /**
   * A number of tiles, in the unit's own words.
   * @param {number} tiles The tiles.
   * @returns {{text: string, kind: string}}
   */
  static tiles(tiles)
  {
    return this.unit('unit.tiles', tiles);
  }

  /**
   * The tiles a rule measures, the plugin's default radius when the tag writes none.
   * @param {number|undefined} radius The radius the tag writes, if it writes one.
   * @returns {{text: string, kind: string}}
   */
  static radius(radius)
  {
    // a tag that writes no radius is measured at the plugin's default.
    const tiles = radius === undefined
      ? PassiveRuleJabsAccess.defaultProximity()
      : radius;

    return this.tiles(tiles);
  }

  /**
   * An amount in its unit's own words, singular for exactly one.
   * @param {string} key The unit's phrase key.
   * @param {number} amount The amount.
   * @returns {{text: string, kind: string}}
   */
  static unit(key, amount)
  {
    // exactly one reads in the singular.
    const unitKey = this.countedKey(key, amount);
    const n = { text: `${amount}`, kind: NotetagDescriber.TokenKinds.MEASURE };

    return NotetagDescriber.phrase(unitKey, { n });
  }

  /**
   * The key of a phrase's singular variant when its count is exactly one, and of the phrase itself otherwise.
   * @param {string} key The phrase's key.
   * @param {number} count The count the phrase reads.
   * @returns {string}
   */
  static countedKey(key, count)
  {
    return count === 1
      ? `${key}.one`
      : key;
  }

  /**
   * A number or percentage named in a phrase, bold in the quantity's color.
   * @param {number|string} amount The amount.
   * @returns {{text: string, kind: string}}
   */
  static quantity(amount)
  {
    return { text: `${amount}`, kind: NotetagDescriber.TokenKinds.QUANTITY };
  }

  /**
   * A resource named in a phrase, as the manager that owns its name calls it.
   * @param {string} resource One of hp, mp or tp.
   * @returns {{text: string, kind: string}}
   */
  static resourceToken(resource)
  {
    return { text: this.ResourceNames[resource](), kind: NotetagDescriber.TokenKinds.SUBJECT };
  }
  //endregion units
}

export default ConditionPhrases;
//endregion ConditionPhrases