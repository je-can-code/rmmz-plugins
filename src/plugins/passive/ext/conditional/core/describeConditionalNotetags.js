//region describeConditionalNotetags
import ConditionPhrases from './ConditionPhrases.js';

/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key, and the condition
 * a tag hangs on is a phrase of the game's too, which {@link ConditionPhrases} fills in and every sentence names as a
 * token. A sentence ends with its condition, so a phrase is always a lowercase clause and never needs capitalizing.
 *
 * None of these lines hands the screen a value to color: their numbers are all tokens, which makes every line plain
 * text any window can draw as it is.
 */
class ConditionalNotetagDescriptions
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Every tag this plugin describes, each paired with its describer, in the order their lines are listed: what gates
   * the passives first, then what fires on its own, then what takes stacks away.
   * @returns {Array<[RegExp, function(RegExpExecArray): NotetagLine[]]>}
   */
  static describedTags()
  {
    const { RegExp: tags } = J.PASSIVE.EXT.CONDITIONAL;

    return [
      [ tags.PassiveSourceRule, match => this.sourceRuleLines(match) ],
      [ tags.PassiveStateRule, match => this.stateRuleLines(match) ],
      [ tags.PassiveStateCount, match => this.stateCountLines(match) ],
      [ tags.AutoApplyState, match => this.selfTriggerLines(match, 'autoApplyState') ],
      [ tags.AutoApplyStateOnNearby, match => this.nearbyLines(match) ],
      [ tags.AutoExecuteSkill, match => this.skillTriggerLines(match) ],
      [ tags.AutoInflictState, match => this.selfTriggerLines(match, 'autoInflictState') ],
      [ tags.AutoModifyCooldowns, match => this.cooldownLines(match) ],
      [ tags.RemoveOnSkillExecution, match => this.removalLines(match, 'removeOnSkillExecution') ],
      [ tags.RemoveOnSkillResolution, match => this.removalLines(match, 'removeOnSkillResolution') ],
      [ tags.RemoveStateOnMove, match => this.moveRemovalLines(match) ],
    ];
  }

  /**
   * The regexes of every tag this plugin describes, in the order their lines are listed.<br/>
   * What a screen showing only this plugin's lines asks {@link NotetagDescriber.linesForTags} for.
   * @returns {RegExp[]}
   */
  static structures()
  {
    return this.describedTags()
      .map(([ structure ]) => structure);
  }

  /**
   * Registers the describer of every tag this plugin reads.
   */
  static registerAll()
  {
    this.describedTags()
      .forEach(([ structure, describe ]) => NotetagDescriber.register(structure, describe));
  }

  //region gates and counts
  /**
   * The line describing a gate on every passive its source grants, in the sentence the game's config keeps under
   * `passiveSourceRule`. The sentence may name `{gate}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the rule.
   * @returns {NotetagLine[]}
   */
  static sourceRuleLines(match)
  {
    // the condition every passive from this source holds on.
    const rule = this.tupleOf(match);
    const gate = ConditionPhrases.gate(rule);

    return NotetagDescriber.line('passiveSourceRule', { tokens: { gate } });
  }

  /**
   * The line describing a gate on one passive its source grants, in the sentence the game's config keeps under
   * `passiveStateRule`. The sentence may name `{state}` and `{gate}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the state and its rule.
   * @returns {NotetagLine[]}
   */
  static stateRuleLines(match)
  {
    // the state, then the condition it alone holds on.
    const [ stateId, ...rule ] = this.tupleOf(match);
    const state = this.stateToken(stateId);
    const gate = ConditionPhrases.gate(rule);

    return NotetagDescriber.line('passiveStateRule', { tokens: { state, gate } });
  }

  /**
   * The line describing how many stacks of a passive its source contributes, in the sentence the game's config keeps
   * under `passiveStateCount`. The sentence may name `{state}` and `{count}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the state and its count.
   * @returns {NotetagLine[]}
   */
  static stateCountLines(match)
  {
    // the state, and what each of its stacks is counted per.
    const tuple = this.tupleOf(match);
    const [ stateId ] = tuple;
    const state = this.stateToken(stateId);
    const count = ConditionPhrases.count(tuple);

    return NotetagDescriber.line('passiveStateCount', { tokens: { state, count } });
  }
  //endregion gates and counts

  //region automatic rules
  /**
   * The line describing an automatic rule that applies a state, to its holder or to whoever its holder just acted
   * on, in the sentence the game's config keeps under the given key. The sentence may name `{state}` and
   * `{trigger}`. The rule works in its holder's favor.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the rule.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static selfTriggerLines(match, templateKey)
  {
    // the state, and the condition it is applied on.
    const tuple = this.tupleOf(match);
    const [ stateId ] = tuple;
    const state = this.stateToken(stateId);
    const trigger = ConditionPhrases.trigger(tuple);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line(templateKey, { holderImpact, tokens: { state, trigger } });
  }

  /**
   * The line describing an automatic rule that uses a skill, in the sentence the game's config keeps under
   * `autoExecuteSkill`. The sentence may name `{skill}` and `{trigger}`. The rule works in its holder's favor.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the rule.
   * @returns {NotetagLine[]}
   */
  static skillTriggerLines(match)
  {
    // the skill, and the condition it is used on.
    const tuple = this.tupleOf(match);
    const [ skillId ] = tuple;
    const skill = { text: `\\skill[${skillId}]`, kind: NotetagDescriber.TokenKinds.CODE };
    const trigger = ConditionPhrases.trigger(tuple);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line('autoExecuteSkill', { holderImpact, tokens: { skill, trigger } });
  }

  /**
   * The line describing an aura that applies a state to the battlers around its holder, in the sentence the game's
   * config keeps for its kind: `autoApplyStateOnNearby.enemiesNearby` and the like, singular when it asks for exactly
   * one battler. The sentence may name `{state}`, `{count}`, `{tiles}` and `{seconds}`. The aura works in its
   * holder's favor.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the rule.
   * @returns {NotetagLine[]}
   */
  static nearbyLines(match)
  {
    // the kind decides who the aura reaches, so each kind has a sentence of its own.
    const tuple = this.tupleOf(match);
    const [ stateId, kind, count ] = tuple;
    const key = ConditionPhrases.countedKey(`autoApplyStateOnNearby.${kind}`, count);

    // the state, then how many battlers, within how far, and how often.
    const tokens = {
      state: this.stateToken(stateId),
      ...ConditionPhrases.proximityTokens(tuple),
    };
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line(key, { holderImpact, tokens });
  }

  /**
   * The line describing an automatic rule that shortens or lengthens its holder's cooldowns, in the sentence the
   * game's config keeps for its direction, unit and reach: `autoModifyCooldowns.reduce.percent`,
   * `autoModifyCooldowns.increase.flat.combat` and so on, a reach of every slot needing no suffix of its own. The
   * sentence may name `{amount}`, `{trigger}` and `{slot}`.
   *
   * A shorter cooldown works in its holder's favor, and a longer one against it.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the rule.
   * @returns {NotetagLine[]}
   */
  static cooldownLines(match)
  {
    const tuple = this.tupleOf(match);
    const [ amount, , , unit, range, slot ] = tuple;

    // the sentence for this direction, unit and reach.
    const key = this.cooldownKey(amount, unit, range);

    // how much, on what condition, and on which slot when the reach is a single one.
    const tokens = {
      amount: this.cooldownAmount(amount, unit),
      trigger: ConditionPhrases.trigger(tuple),
      slot: this.slotToken(slot),
    };
    const holderImpact = amount < 0
      ? NotetagLine.Impacts.HELPS
      : NotetagLine.Impacts.HURTS;

    return NotetagDescriber.line(key, { holderImpact, tokens });
  }

  /**
   * The key of a cooldown rule's sentence: its direction, then its unit, then its reach unless that is every slot,
   * which the rule's reader assumes when none is written.
   * @param {number} amount The signed change, negative for shorter.
   * @param {string} unit Either percent or flat.
   * @param {string|undefined} range The slots reached, if written.
   * @returns {string}
   */
  static cooldownKey(amount, unit, range)
  {
    // shorter or longer.
    const direction = amount < 0
      ? 'reduce'
      : 'increase';

    // every slot is the plain sentence; any narrower reach has its own.
    const reach = (range === undefined || range === 'all')
      ? String.empty
      : `.${range}`;

    return `autoModifyCooldowns.${direction}.${unit}${reach}`;
  }

  /**
   * The one slot a cooldown rule reaches, named as its tag writes it, or nothing at all when the rule reaches more
   * than one: an empty token, so a sentence naming a slot the rule never gave says nothing rather than a wrong word.
   * @param {string|undefined} slot The slot the tag names, if it names one.
   * @returns {{text: string, kind: string}}
   */
  static slotToken(slot)
  {
    // a rule reaching several slots names none.
    const text = slot === undefined
      ? String.empty
      : slot;

    return { text, kind: NotetagDescriber.TokenKinds.SUBJECT };
  }

  /**
   * How much a cooldown rule changes each cooldown by: a share of the cooldown's full length, or so many seconds.
   * @param {number} amount The signed change.
   * @param {string} unit Either percent or flat, the flat amount being frames.
   * @returns {{text: string, kind: string}}
   */
  static cooldownAmount(amount, unit)
  {
    // the direction is the sentence's to say, so the amount is only its size.
    const size = Math.abs(amount);

    // a share of each cooldown's own length.
    if (unit === 'percent') return ConditionPhrases.quantity(`${size}%`);

    // so many frames, spoken as seconds.
    return ConditionPhrases.seconds(size);
  }
  //endregion automatic rules

  //region removals
  /**
   * The line describing a chance to lose a stack of the carrying state when its holder uses a skill, in the
   * sentence the game's config keeps under the given key, or under its `.any` variant when any skill at all will
   * do. The sentence may name `{skillType}` and `{chance}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the skill type and chance.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static removalLines(match, templateKey)
  {
    const [ skillTypeId, chance ] = this.tupleOf(match);

    // a skill type of zero means any skill at all, which says itself differently.
    const key = skillTypeId === 0
      ? `${templateKey}.any`
      : templateKey;

    // the kind of skill, and the chance of losing a stack.
    const tokens = {
      skillType: { text: `\\skillType[${skillTypeId}]`, kind: NotetagDescriber.TokenKinds.CODE },
      chance: ConditionPhrases.quantity(`${chance}%`),
    };

    return NotetagDescriber.line(key, { tokens });
  }

  /**
   * The line describing a state its holder loses by moving, in the sentence the game's config keeps under
   * `removeStateOnMove`. The sentence may name `{state}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the state.
   * @returns {NotetagLine[]}
   */
  static moveRemovalLines(match)
  {
    // the state moving costs.
    const [ stateId ] = this.tupleOf(match);
    const state = this.stateToken(stateId);

    return NotetagDescriber.line('removeStateOnMove', { tokens: { state } });
  }
  //endregion removals

  //region helpers
  /**
   * A tag's tuple, parsed the way every one of this plugin's readers parses it.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the bracketed tuple.
   * @returns {any[]}
   */
  static tupleOf(match)
  {
    const [ , writtenTuple ] = match;

    return JsonMapper.parseObject(writtenTuple);
  }

  /**
   * A state named in a line, as the text code that draws its icon and name when the line is drawn.
   * @param {number} stateId The state's id.
   * @returns {{text: string, kind: string}}
   */
  static stateToken(stateId)
  {
    return { text: `\\state[${stateId}]`, kind: NotetagDescriber.TokenKinds.CODE };
  }
  //endregion helpers
}

export default ConditionalNotetagDescriptions;
//endregion describeConditionalNotetags