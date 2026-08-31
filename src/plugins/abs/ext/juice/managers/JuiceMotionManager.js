//region JuiceMotionManager
/**
 * Turns combat events into the motion a battler makes about them.
 *
 * Everything that happens to a character's own body — squashing on impact, leaning into a swing,
 * flipping, shimmering while it charges — is declared on J-Motion's composer and animated there.
 * This class decides *when* a reaction happens and *how hard*; it does not animate anything, and it
 * never touches a sprite to do it.
 *
 * That split is why an enemy can be breathing, poisoned and recoiling from a hit at the same time
 * without any of those three knowing the others exist. The composer resolves them.
 *
 * Every reaction is declared under one source key, so a new one replaces whatever the last one was
 * doing. A battler has one body and can only be doing one thing with it, which used to be enforced
 * with a lock and is now simply what sharing a source key means.
 *
 * The queue further down is the exception, and it is a different job: the weapon swing overlay is a
 * sprite this plugin creates and owns outright, not a character the engine is drawing for us, so it
 * has nowhere to be composed and is driven frame by frame from here.
 *
 * `CharacterMotionComposer` and `MotionDeclaration` are reached as globals rather than imports:
 * they ship inside J-Motion's bundle and are hoisted by the time this one loads.
 */
class JuiceMotionManager
{
  /**
   * The source key every combat reaction is declared under.
   *
   * `combat` is the highest-priority source there is, which is what lets a reaction claim scale or
   * rotation away from whatever ambient motion a battler happens to be carrying.
   * @type {string}
   */
  static REACTION_SOURCE_KEY = 'combat:reaction';

  /**
   * The source key the casting pulse is declared under.
   *
   * Deliberately not the reaction key. The pulse is renewed every frame and relies on the composer
   * recognising an unchanged declaration, while a one-shot reaction deliberately defeats that same
   * check to restart itself — sharing a key means each destroys the other, and a battler struck
   * while casting would flinch for exactly one frame before the next renewal wiped it.
   *
   * Separated, they compose: both rank `combat`, the reaction is declared later so it takes the
   * scale claim, and the charge glow keeps burning underneath it.
   * @type {string}
   */
  static CASTING_SOURCE_KEY = 'combat:casting';

  /**
   * Sprite-bound effects this plugin drives itself, rather than through the composer.
   * @type {JuiceBaseEffect[]}
   */
  static #effects = [];

  /**
   * Squashes a battler's body, optionally several times over.
   * @param {Game_Character} character The character reacting.
   * @param {number} intensity How far the body deforms at the peak of a cycle, ex: `0.12`.
   * @param {number} durationFrames How long one cycle lasts.
   * @param {number} [repeatCount=1] How many cycles to run.
   */
  static scheduleSquish(character, intensity, durationFrames, repeatCount = 1)
  {
    const parameters = [ intensity, durationFrames, repeatCount ];
    const totalFrames = durationFrames * repeatCount;

    JuiceMotionManager.#declareReaction(character, 'squish', parameters, totalFrames);
  }

  /**
   * Leans a battler's body into a swing.
   * @param {Game_Character} character The character reacting.
   * @param {number} peakRadians How far it leans at the peak of the arc.
   * @param {number} durationFrames How long the lean lasts.
   */
  static scheduleTilt(character, peakRadians, durationFrames)
  {
    const parameters = [ peakRadians, durationFrames ];

    JuiceMotionManager.#declareReaction(character, 'tilt', parameters, durationFrames);
  }

  /**
   * Turns a battler's body through one or more complete rotations.
   * @param {Game_Character} character The character reacting.
   * @param {string} direction Which way it turns: `cw` or `ccw`.
   * @param {number} durationFrames How long the whole flip takes.
   * @param {number} [turnCount=1] How many complete turns to make in that time.
   */
  static scheduleFlipBody(character, direction, durationFrames, turnCount = 1)
  {
    const parameters = [ turnCount, durationFrames, direction ];

    JuiceMotionManager.#declareReaction(character, 'flip', parameters, durationFrames);
  }

  /**
   * Keeps a battler shimmering while it charges a skill.
   *
   * This is declared with no duration and is expected to be called again on every frame the cast is
   * still running. Re-declaring the same thing does not restart it — the composer recognises an
   * unchanged declaration and lets the effect keep running — so the pulse builds continuously while
   * something keeps asking for it and lapses shortly after anything stops.
   *
   * That is deliberately a heartbeat rather than a start and a stop. A cast can end in ways nobody
   * hooked: the caster is killed mid-incantation, knocked out of it, or moved to another map. An
   * explicit teardown has to know about every one of those, while a heartbeat only has to stop
   * beating.
   * @param {Game_Character} character The character charging.
   * @param {number} amplitude How far it swells at the peak of a pulse, ex: `0.04`.
   * @param {number} heartbeatFrames How long to keep pulsing after the last call.
   */
  static scheduleCastingPulse(character, amplitude, heartbeatFrames)
  {
    const sourceKey = JuiceMotionManager.CASTING_SOURCE_KEY;
    const declaration = new MotionDeclaration('charge', [ amplitude ], sourceKey);

    CharacterMotionComposer.declare(character, sourceKey, [ declaration ], heartbeatFrames);
  }

  /**
   * Stops a battler's casting pulse.
   * @param {Game_Character} character The character to settle.
   */
  static cancelCastingPulse(character)
  {
    CharacterMotionComposer.removeDeclarations(character, JuiceMotionManager.CASTING_SOURCE_KEY);
  }

  /**
   * Stops every motion a battler is making about combat, of either kind.
   *
   * Used when something ends a battler's participation outright rather than ending one reaction —
   * a death, most of all, where anything still shimmering would be shimmering on a corpse.
   * @param {Game_Character} character The character to settle.
   */
  static cancelForCharacter(character)
  {
    CharacterMotionComposer.removeDeclarations(character, JuiceMotionManager.REACTION_SOURCE_KEY);
    CharacterMotionComposer.removeDeclarations(character, JuiceMotionManager.CASTING_SOURCE_KEY);
  }

  /**
   * Declares a one-off reaction with a frame budget.
   *
   * The previous reaction is withdrawn before the new one is declared, which looks redundant next to
   * a method whose whole job is to replace what a source had — and is not. The composer deliberately
   * leaves an unchanged declaration alone so that an ambient motion is not restarted every time a
   * map refreshes, and a reaction wants the opposite: hitting something twice with the same weapon
   * has to squash it twice, not extend one squash into a longer one.
   * @param {Game_Character} character The character reacting.
   * @param {string} motionType The registered motion to run.
   * @param {Array<string|number>} parameters The motion's parameters, in registered order.
   * @param {number} totalFrames How long the whole reaction lasts.
   */
  static #declareReaction(character, motionType, parameters, totalFrames)
  {
    const sourceKey = JuiceMotionManager.REACTION_SOURCE_KEY;
    const declaration = new MotionDeclaration(motionType, parameters, sourceKey);

    CharacterMotionComposer.removeDeclarations(character, sourceKey);
    CharacterMotionComposer.declare(character, sourceKey, [ declaration ], totalFrames);
  }

  /**
   * Discards every queued overlay effect.
   *
   * Call this whenever the map scene is about to be torn down, so that effects referencing
   * soon-to-be-destroyed sprites do not linger in the static queue and crash the next `Scene_Map`
   * the first time {@link #frameTick} runs again.
   *
   * Character reactions need no equivalent: the composer keys them by character in a `WeakMap`, so
   * leaving a map takes its motions with it.
   */
  static clearAll()
  {
    JuiceMotionManager.#effects.length = 0;
  }

  /**
   * Registers a sprite-bound effect on the overlay queue.
   * @param {JuiceBaseEffect} effect The effect instance.
   */
  static pushExternalEffect(effect)
  {
    JuiceMotionManager.#effects.push(effect);
  }

  /**
   * Runs every frame while on the map, via the {@link Scene_Map#update} alias.
   */
  static frameTick()
  {
    if (!JuiceMotionManager.#effects.length)
    {
      return;
    }

    const survivors = [];
    for (let i = 0; i < JuiceMotionManager.#effects.length; i++)
    {
      const effect = JuiceMotionManager.#effects[i];

      // pixi nulls out the internal transform when a sprite is destroy()ed; writing scale or
      // rotation through a dead sprite would throw. silently discard the effect instead.
      if (!effect.isSpriteAlive())
      {
        continue;
      }

      if (effect.tick())
      {
        survivors.push(effect);
      }
    }

    JuiceMotionManager.#effects.length = 0;
    survivors.forEach(s => JuiceMotionManager.#effects.push(s));
  }
}
export default JuiceMotionManager;
//endregion JuiceMotionManager