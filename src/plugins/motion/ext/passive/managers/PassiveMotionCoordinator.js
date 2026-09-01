//region PassiveMotionCoordinator
/**
 * Keeps a battler's passive motions matching the passives it is actually carrying.
 *
 * J-Motion-ABS animates states by watching them arrive and leave, which works because an applied
 * state announces both. A passive announces neither. J-Passive grants them by rebuilding the whole
 * set from every source a battler owns — its own row, its states, its skills, its equipment, the
 * event that spawned it — and `isStateAddable` refuses passive ids outright, so `addState` is never
 * reached and there is no arrival to hear.
 *
 * So this reconciles rather than listens. Every pass asks what the battler is carrying now and
 * settles the difference against what was declared last time, which is the only approach that works
 * when the answer can change without anything having happened that is worth naming.
 */
class PassiveMotionCoordinator
{
  /**
   * The passive state ids currently declared on each character.
   *
   * Keyed by character rather than by battler because the character is what a declaration is made
   * against, and because the two do not correspond one to one: `$gamePlayer` stands in for whichever
   * actor is leading and a follower for whichever is behind, so the occupant changes underneath a
   * character that never does. Keying this way makes party cycling fall out of the ordinary diff —
   * the incoming leader's reconcile finds the outgoing leader's ids sitting there and withdraws them
   * without anything having had to notice that a cycle happened.
   *
   * A `WeakMap` for the same reason the composer uses one: motion is presentation, nothing here
   * should outlive the character it describes, and there is no field for the save encoder to find.
   * @type {WeakMap<Game_CharacterBase, Set<number>>}
   */
  static #declaredByCharacter = new WeakMap();

  /**
   * The source key a passive state's motions are declared under.
   *
   * Deliberately not the `state:` key J-Motion-ABS uses. The two sets can never overlap — a passive
   * id is refused by `isStateAddable`, so nothing can be applied and passive at once — but they rank
   * differently on a contested channel, and the kind in front of the colon is what carries the rank.
   * @param {number} stateId The passive state declaring the motion.
   * @returns {string}
   */
  static sourceKeyForState(stateId)
  {
    return `passive:${stateId}`;
  }

  /**
   * Settles a battler's passive motions against what it is currently carrying.
   *
   * Safe to call as often as anything likes. Unchanged declarations are handed to the composer
   * anyway and recognised as identical there, which leaves the running motion untouched — so a
   * reconcile that changes nothing costs a comparison and animates nothing anew.
   * @param {Game_Battler} battler The battler whose passives may have changed.
   */
  static reconcile(battler)
  {
    const character = BattlerMotionCoordinator.characterFor(battler);

    // this battler has no presence on the map, so there is nothing to animate. reserve party members
    // and troop members in a scene this plugin has no business touching both land here.
    if (character === null) return;

    const desired = PassiveMotionCoordinator.declarationsByStateId(battler);

    PassiveMotionCoordinator.#withdrawDeparted(character, desired);
    PassiveMotionCoordinator.#declareCurrent(character, desired);

    PassiveMotionCoordinator.#declaredByCharacter.set(character, new Set(desired.keys()));
  }

  /**
   * Every passive state on a battler that asks for a motion, and what it asks for.
   *
   * Passives that declare no motion are dropped here rather than carried through as empty entries,
   * because most passives are pure mechanics and an empty declaration is a source key the composer
   * would have to hold, compare and withdraw for no reason.
   *
   * Stacked passives collapse to one entry. A state applied three times over is still one thing the
   * sprite is doing, and three identical declarations under one key would animate three times as
   * far as the author asked for.
   * @param {Game_Battler} battler The battler being read.
   * @returns {Map<number, MotionDeclaration[]>} What each passive state wants, keyed by state id.
   */
  static declarationsByStateId(battler)
  {
    const declarationsByStateId = new Map();
    const stateIds = new Set(battler.getPassiveStateIds());

    stateIds.forEach(stateId =>
    {
      const state = battler.state(stateId);
      const sourceKey = PassiveMotionCoordinator.sourceKeyForState(stateId);
      const declarations = BattlerMotionCoordinator.declarationsFromNote(state, sourceKey);

      // this passive is mechanics only, which is what most of them are.
      if (declarations.length === 0) return;

      declarationsByStateId.set(stateId, declarations);
    }, this);

    return declarationsByStateId;
  }

  /**
   * Withdraws the passive motions this character was declared with and no longer wants.
   *
   * Only the departed ones are touched. Clearing the whole kind and rebuilding would be simpler to
   * read and wrong to run: the composer recognises a re-declaration as identical and leaves the
   * motion alone, but only while the declaration is still on file, and clearing takes it off.
   * @param {Game_CharacterBase} character The character being reconciled.
   * @param {Map<number, MotionDeclaration[]>} desired What it should be doing now.
   */
  static #withdrawDeparted(character, desired)
  {
    const previous = PassiveMotionCoordinator.#declaredByCharacter.get(character);

    // nothing has ever been declared on this character, so nothing can have departed.
    if (previous === undefined) return;

    previous.forEach(stateId =>
    {
      // this passive is still on the battler and keeps animating.
      if (desired.has(stateId)) return;

      const sourceKey = PassiveMotionCoordinator.sourceKeyForState(stateId);

      CharacterMotionComposer.removeDeclarations(character, sourceKey);
    }, this);
  }

  /**
   * Declares everything the character's current passives are asking for.
   * @param {Game_CharacterBase} character The character being reconciled.
   * @param {Map<number, MotionDeclaration[]>} desired What it should be doing now.
   */
  static #declareCurrent(character, desired)
  {
    desired.forEach((declarations, stateId) =>
    {
      const sourceKey = PassiveMotionCoordinator.sourceKeyForState(stateId);

      CharacterMotionComposer.declare(character, sourceKey, declarations);
    }, this);
  }
}

export default PassiveMotionCoordinator;
//endregion PassiveMotionCoordinator