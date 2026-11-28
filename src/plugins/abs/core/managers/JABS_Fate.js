//region JABS_Fate
/**
 * A static class for the rolls one battler makes against another: the fate each of them brings to the roll, the luck
 * between them, and how many times a state with an authored chance lands.<br/>
 * Every state applied by chance rolls here, whatever carried it to its recipient- a skill's own state effect, an
 * on-hit or on-crit tag, an evasion, an aura, a spread or an expiry chain- so the recipient's resistances and the two
 * battlers' fate weigh on every one of them alike, and the luck between them weighs on every harmful one. Nothing here
 * adds the state: each caller adds it once per proc through whichever add method it needs, and every one of those adds
 * checks immunity on its own.
 */
class JABS_Fate
{
  /**
   * The luck one battler holds over another, as a multiplier on the chance that what it aims at the other lands.<br/>
   * This is the rate RMMZ gives an action against its target: every point of LUK the roller holds over the recipient
   * adds a tenth of a percent, every point it lacks takes one away, and the rate never falls below nothing. A battler
   * rolling against itself holds no edge over itself, so its rate is exactly one.
   * @param {Game_Battler} roller The battler making the roll.
   * @param {Game_Battler} recipient The battler the roll is aimed at.
   * @returns {number}
   */
  static lukEffectRate(roller, recipient)
  {
    // every point of luck the roller holds over the recipient is a tenth of a percent in its favor.
    const luckGap = roller.luk - recipient.luk;

    // a gap wide enough against the roller can take its chance to nothing, but never below.
    return Math.max(1.0 + (luckGap * 0.001), 0.0);
  }

  /**
   * The rolls a battler's own fate brings to a roll it makes, before anything it aims at weighs in: its one chance plus
   * every lucky roll it carries, then every cursed roll it carries as a hurdle the roll has to clear as well.<br/>
   * With a skill in hand, that skill's own `<thisLuckyRolls>` and `<thisCursedRolls>` join the battler-wide totals. A
   * roll made with no skill in hand reads the battler-wide totals alone.
   * @param {Game_Battler} roller The battler making the roll.
   * @param {RPG_UsableItem|null} skill The skill the roll is made with, or null when there is none.
   * @returns {number[]}
   */
  static ownRolls(roller, skill)
  {
    // with no skill in hand, only the roller's battler-wide luck and curse speak.
    if (skill === null) return [ 1 + roller.getPositiveRolls(), roller.getNegativeRolls() ];

    // a skill's own luck and curse join the roller's battler-wide totals while it is being used.
    return [ 1 + roller.getPositiveRollsForSkill(skill), roller.getNegativeRollsForSkill(skill) ];
  }

  /**
   * The rolls one battler brings against another, as the positive and negative counts
   * {@link RPGManager.resolveProcCount} and {@link RPGManager.fateOf100} take.<br/>
   * The roller's own fate speaks for and against its roll, whatever it aims at. The recipient's curse is that
   * recipient's bad fate: harm aimed at a cursed recipient gets one more chance to land for every curse it carries, so
   * the recipient has to survive each of them, while help aimed at it has to clear every curse it carries to land at
   * all. A battler aiming at itself brings its fate once, as the roller. Lucky rolls belong to the roller alone; the
   * recipient's never weigh on a roll aimed at it.
   * @param {Game_Battler} roller The battler making the roll.
   * @param {Game_Battler} recipient The battler the roll is aimed at.
   * @param {RPG_UsableItem|null} skill The skill the roll is made with, or null when there is none.
   * @param {boolean} isHarm Whether the roll is harm aimed at the recipient, rather than help.
   * @returns {number[]}
   */
  static rollsAgainst(roller, recipient, skill, isHarm)
  {
    // the roller's own luck and curse speak for and against its roll, whatever it aims at.
    const [ positiveRolls, negativeRolls ] = this.ownRolls(roller, skill);

    // a battler aiming at itself already brought its fate as the roller.
    if (recipient === roller) return [ positiveRolls, negativeRolls ];

    // the recipient's curse is its own bad fate.
    const recipientCurse = recipient.getNegativeRolls();

    // harm aimed at a cursed recipient gets one more chance to land for every curse it carries.
    if (isHarm) return [ positiveRolls + recipientCurse, negativeRolls ];

    // help aimed at a cursed recipient has to clear every curse it carries to land.
    return [ positiveRolls, negativeRolls + recipientCurse ];
  }

  /**
   * The rolls an action brings against its target: its subject's fate with the item it is using, aimed as harm when
   * the action targets the subject's opponents and as help otherwise.<br/>
   * {@link Game_Action#fateRollsAgainst} answers with this for every roll an action makes: landing the hit, scoring a
   * critical, removing a state and applying one.
   * @param {Game_Action} action The action making the roll.
   * @param {Game_Battler} target The battler the action is aimed at.
   * @returns {number[]}
   */
  static actionRollsAgainst(action, target)
  {
    // the action's subject rolls, with the item it is using.
    const subject = action.subject();
    const skill = action.item();

    // an action aimed at the subject's opponents is harm, and anything else it aims is help.
    const isHarm = action.isForOpponent();

    // weigh the subject's fate against the target's.
    return this.rollsAgainst(subject, target, skill, isHarm);
  }

  /**
   * The luck that weighs on a state aimed at a recipient, as a multiplier on its chance to land.<br/>
   * Luck only weighs on harm. A state carrying the `<type:negative>` classifier, as its recipient sees the state, meets
   * the luck between the two battlers through {@link JABS_Fate.lukEffectRate}. Any other state is a blessing, and no one
   * can luck their way out of a blessing, so its rate is exactly one.
   * @param {Game_Battler} roller The battler applying the state.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @returns {number}
   */
  static stateLuckRate(roller, recipient, stateId)
  {
    // a state that is not harm meets no luck at all.
    const state = recipient.state(stateId);
    if (state.isNegativeType() === false) return 1.0;

    // harm meets the luck between the two battlers.
    return this.lukEffectRate(roller, recipient);
  }

  /**
   * The chance a state lands on its recipient, as the whole percent the dice are rolled against.<br/>
   * The authored percent meets the recipient's resistance to the state by its id, through State Rate traits, and by
   * its type, through `<stateTypeResist>`. A harmful state then meets the luck between the two battlers, as
   * {@link JABS_Fate.stateLuckRate} describes. Every roll meets them alike: a certain hit cannot miss, but the states it
   * carries meet the same resistances and luck as any others.
   * @param {Game_Battler} roller The battler applying the state.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @returns {number}
   */
  static stateApplicationD100(roller, recipient, stateId, percent)
  {
    // the luck between the two battlers, which only a harmful state meets.
    const luckRate = this.stateLuckRate(roller, recipient, stateId);

    // the recipient resists the state by its id and by its type, and the luck between them shapes what remains.
    const chance = percent * recipient.stateRate(stateId) * recipient.stateTypeResistRate(stateId) * luckRate;

    // round it to the whole percent the dice are rolled against.
    return Math.round(chance);
  }

  /**
   * Whether a state is set apart from fate, as its recipient sees the state: one carrying `<immuneToFate>`.<br/>
   * No battler's fate weighs on a roll for such a state, whoever makes it.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being rolled for.
   * @returns {boolean}
   */
  static isImmuneToFateState(recipient, stateId)
  {
    // the state as its recipient sees it.
    const state = recipient.state(stateId);

    // a state carrying the tag answers to no one's fate.
    return state.isImmuneToFate();
  }

  /**
   * Resolves whether a state immune to fate lands on its recipient: once at most, on one plain roll.<br/>
   * The chance is still {@link JABS_Fate.stateApplicationD100}, so the recipient's State Rate traits and
   * `<stateTypeResist>` weigh on it, and the luck between the two battlers shapes a harmful state's. Nothing else
   * does: no lucky or cursed roll, no recipient's curse, no `<veryLucky>`, `<veryCursed>` or `<forceCritProcs>`, no
   * Accumulate Mode and no Encore.
   * @param {Game_Battler} roller The battler applying the state.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @returns {number}
   */
  static resolveImmuneToFateProcCount(roller, recipient, stateId, percent)
  {
    // the chance the state lands, after the recipient's resistances and, for harm, the luck between the two battlers.
    const d100 = this.stateApplicationD100(roller, recipient, stateId, percent);

    // one plain roll, and one landing at most.
    return RPGManager.chanceIn100(d100) ? 1 : 0;
  }

  /**
   * Resolves how many times a state lands on its recipient, given the rolls brought to it.<br/>
   * The chance is {@link JABS_Fate.stateApplicationD100} and the count is {@link RPGManager.resolveProcCount}, so the
   * positive roller's `<veryLucky>` and `<veryCursed>` settle it outright, Accumulate Mode counts every positive roll
   * that lands, and Encore repeats each landing. The positive roller is the roller unless a caller hands over its
   * own, the way `<forceCritProcs>` guarantees an on-crit roll; the roller brings its luck to the chance either way.
   * A state carrying `<immuneToFate>` sets all of that fate aside, as {@link JABS_Fate.resolveImmuneToFateProcCount}
   * describes.
   * Nothing is added here.
   * @param {Game_Battler} roller The battler applying the state.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @param {number[]} rolls The positive rolls, the baseline one included, then the negative rolls.
   * @param {Game_Battler|object=} positiveRoller Whose fate overrides, Accumulate Mode and Encore count the landings;
   * defaults to the roller.
   * @returns {number}
   */
  static resolveStateProcCountWithRolls(roller, recipient, stateId, percent, rolls, positiveRoller = roller)
  {
    // a state immune to fate answers to no one's fate: one plain roll against its resisted chance.
    if (this.isImmuneToFateState(recipient, stateId))
    {
      return this.resolveImmuneToFateProcCount(roller, recipient, stateId, percent);
    }

    // the chance the state lands, after the recipient's resistances and the luck between the two battlers.
    const d100 = this.stateApplicationD100(roller, recipient, stateId, percent);

    // the chances the roll gets to land the state, then the hurdles it still has to clear.
    const [ positiveRolls, negativeRolls ] = rolls;

    // count the landings by the positive roller's own fate overrides, Accumulate Mode and Encore.
    return RPGManager.resolveProcCount(positiveRoller, d100, positiveRolls, negativeRolls);
  }

  /**
   * Resolves how many times a state lands on its recipient when no action aims it: an evasion's state, an aura, a
   * spread, an expiry chain or a region's state.<br/>
   * With no action to say whether it was aimed at a friend or a foe, the state decides: one carrying the
   * `<type:negative>` classifier, as its recipient sees the state, arrives as harm, and any other as help. That
   * decides which side of the roll the recipient's curse weighs on, as {@link JABS_Fate.rollsAgainst} describes.
   * Nothing is added here; the caller adds the state once per proc.
   * @param {Game_Battler} roller The battler applying the state; the recipient itself for a state it gives itself.
   * @param {Game_Battler} recipient The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @param {RPG_UsableItem|null=} skill The skill whose own lucky and cursed rolls join the roller's; defaults to null,
   * which reads the roller's battler-wide totals alone.
   * @returns {number}
   */
  static resolveStateProcCount(roller, recipient, stateId, percent, skill = null)
  {
    // with no action to aim it, the state's own negative classifier decides whether it arrives as harm or as help.
    const state = recipient.state(stateId);
    const isHarm = state.isNegativeType();

    // the fate the roller brings against the recipient.
    const rolls = this.rollsAgainst(roller, recipient, skill, isHarm);

    // roll the state against the recipient's resistances with that fate.
    return this.resolveStateProcCountWithRolls(roller, recipient, stateId, percent, rolls);
  }

  /**
   * Resolves how many times a state lands on a target for an action: a skill's own state effect, or a state carried
   * by an on-hit, on-cast or on-crit tag.<br/>
   * The action's subject is the roller, and the fate it brings is {@link Game_Action#fateRollsAgainst}: harm when the
   * action targets the subject's opponents, help otherwise, and counted once when the target is the subject itself.
   * Nothing is added here; the caller adds the state once per proc.
   * @param {Game_Action} action The action applying the state.
   * @param {Game_Battler} target The battler the state is aimed at; the subject itself for a self-state.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @param {Game_Battler|object=} positiveRoller Whose fate overrides, Accumulate Mode and Encore count the landings;
   * defaults to the action's subject.
   * @returns {number}
   */
  static resolveActionStateProcCount(action, target, stateId, percent, positiveRoller = action.subject())
  {
    // the fate this action brings against its target.
    const rolls = action.fateRollsAgainst(target);

    // the action's subject rolls it, so its luck is the one that meets the target's.
    const subject = action.subject();

    // roll the state against the target's resistances with that fate.
    return this.resolveStateProcCountWithRolls(subject, target, stateId, percent, rolls, positiveRoller);
  }
}

export default JABS_Fate;
//endregion JABS_Fate