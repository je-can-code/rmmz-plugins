//region BattlerMotionCoordinator
import DeathMotionResolver from '../core/DeathMotionResolver.js';

/**
 * Connects what is happening to a battler with what its sprite is doing about it.
 *
 * J-Motion core knows how to animate a character and knows nothing about combat. J-ABS knows a
 * great deal about combat and nothing about motion. This is the piece in between, and it is
 * deliberately the only piece: everything here is a translation from a combat event into a motion
 * declaration, and there is no animation logic in it at all.
 *
 * A battler is not a character. Only `JABS_Battler` holds both, which is why this extension exists
 * at all rather than living in core — core has no way to reach an enemy's sprite, because outside
 * of JABS an enemy has no presence on the map to reach.
 */
class BattlerMotionCoordinator
{
  /**
   * The source key a state's motions are declared under.
   * @param {number} stateId The state declaring the motion.
   * @returns {string}
   */
  static sourceKeyForState(stateId)
  {
    return `state:${stateId}`;
  }

  /**
   * The source key a death collapse is declared under.
   * @type {string}
   */
  static DEATH_SOURCE_KEY = 'combat:death';

  /**
   * Declares whatever motions a state asks for onto the battler it was applied to.
   *
   * Reached from the state being added rather than polled, so a bleed that makes something pulse
   * starts pulsing on the frame the bleed lands rather than on the next frame that happened to
   * check. There is no per-frame cost to this feature at all.
   * @param {Game_Battler} battler The battler the state was applied to.
   * @param {number} stateId The state that was applied.
   */
  static applyStateMotions(battler, stateId)
  {
    // asking for a state is not the same as getting one: a resist trait, an immunity, or already
    // being dead all make J-ABS drop the application while still running this hook. Declaring here
    // would give the battler a motion for an affliction it does not have — and since nothing will
    // ever remove a state it never had, that motion would run for the rest of its life.
    if (battler.isStateAffected(stateId) === false) return;

    const character = BattlerMotionCoordinator.characterFor(battler);

    // this battler has no presence on the map, so there is nothing to animate.
    if (character === null) return;

    const state = battler.state(stateId);
    const sourceKey = BattlerMotionCoordinator.sourceKeyForState(stateId);
    const declarations = BattlerMotionCoordinator.declarationsFromNote(state, sourceKey);

    // most states do not ask for a motion, and declaring an empty set would be a wasted write.
    if (declarations.length === 0) return;

    CharacterMotionComposer.declare(character, sourceKey, declarations);
  }

  /**
   * Withdraws whatever motions a state had asked for.
   * @param {Game_Battler} battler The battler the state was removed from.
   * @param {number} stateId The state that was removed.
   */
  static removeStateMotions(battler, stateId)
  {
    const character = BattlerMotionCoordinator.characterFor(battler);

    // nothing on the map means nothing was ever declared.
    if (character === null) return;

    const sourceKey = BattlerMotionCoordinator.sourceKeyForState(stateId);

    CharacterMotionComposer.removeDeclarations(character, sourceKey);
  }

  /**
   * Starts a battler's death animation, and reports how long it needs.
   *
   * The caller is expected to hold the battler on the map for the returned number of frames. This
   * does not do that itself, because how long a defeated battler lingers is J-ABS's business and it
   * already has a mechanism for it.
   * @param {JABS_Battler} jabsBattler The battler that was defeated.
   * @returns {number} How many frames the collapse needs, or 0 when this battler opts out.
   */
  static beginDeath(jabsBattler)
  {
    const battler = jabsBattler.getBattler();
    const style = DeathMotionResolver.resolveStyleFor(battler);

    // this battler handles its own death, so nothing is declared and nothing is delayed.
    if (style === null) return 0;

    const metadata = J.MOTION.EXT.ABS.Metadata;

    // a style nobody recognises is a typo in a notetag. the battler still gets a death, at the
    // default pacing, and the name is reported so whoever wrote it can find it.
    if (metadata.isKnownDeathStyle(style) === false)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `unknown death motion style: [ ${style} ]`, { style });
    }

    const duration = metadata.deathDurationFor(style);
    const character = jabsBattler.getCharacter();
    const declaration = new MotionDeclaration('collapse', [ style, duration ],
      BattlerMotionCoordinator.DEATH_SOURCE_KEY);

    CharacterMotionComposer.declare(character, BattlerMotionCoordinator.DEATH_SOURCE_KEY, [ declaration ]);

    return duration;
  }

  /**
   * Re-derives the state motions on the character the player is currently driving.
   *
   * `$gamePlayer` is a single character that stands in for whichever actor is leading, so a party
   * cycle hands the same character to somebody else without anything being declared or withdrawn.
   * Left alone, the outgoing leader's motions keep playing on the incoming one, and the withdrawal
   * that should have stopped them later resolves against a different character entirely and never
   * lands — so one cycle is enough to strand a motion for the rest of the session.
   *
   * Everything is torn down and rebuilt from the new leader's actual states rather than diffed,
   * because the thing that would know what to diff against is precisely what just changed.
   */
  static refreshLeaderStateMotions()
  {
    const leader = $gameParty.leader();
    const character = BattlerMotionCoordinator.characterFor(leader);

    // no leader is on the map, which happens between a party wipe and the game-over that follows.
    if (character === null) return;

    CharacterMotionComposer.removeDeclarationKind(character, 'state');

    leader.states()
      .forEach(state => BattlerMotionCoordinator.applyStateMotions(leader, state.id), this);
  }

  /**
   * Reads every motion tag out of a database entry's note.
   *
   * A note is handed to the same parser an event page's comments go through, one line at a time.
   * That is not a convenience — it is the reason `<motion:[breathe]>` means exactly one thing
   * whether it was written on an event, a state, or anything added later.
   * @param {RPG_Base} databaseData The database entry whose note is being read.
   * @param {string} sourceKey Who is declaring these motions.
   * @returns {MotionDeclaration[]}
   */
  static declarationsFromNote(databaseData, sourceKey)
  {
    const lines = databaseData.note.split(/\r?\n/);

    return MotionTagParser.parseComments(lines, sourceKey);
  }

  /**
   * Finds the map character a battler is riding around in, if it has one.
   * @param {Game_Battler} battler The battler to locate.
   * @returns {Game_Character|null} The character, or null when this battler is not on the map.
   */
  static characterFor(battler)
  {
    const jabsBattler = JABS_AiManager.getBattlerByUuid(battler.getUuid());

    // a battler with no JABS counterpart is not on the map: a party member in reserve, or a
    // troop member in a scene this plugin has no business animating.
    if (!jabsBattler) return null;

    return jabsBattler.getCharacter();
  }
}

export default BattlerMotionCoordinator;
//endregion BattlerMotionCoordinator