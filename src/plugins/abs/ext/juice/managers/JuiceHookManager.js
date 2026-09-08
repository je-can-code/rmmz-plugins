//region JuiceHookManager
import JuiceWeaponSwingOverlay from './JuiceWeaponSwingOverlay.js';
import JuiceProfileResolver from './../resolvers/JuiceProfileResolver.js';
import JuiceMotionManager from './JuiceMotionManager.js';
import JuiceMapSpriteFinder from './../helpers/JuiceMapSpriteFinder.js';
import JuiceFlurryStrikeRecord from './../helpers/JuiceFlurryStrikeRecord.js';
/**
 * Central hook orchestration for J-ABS-Juice (caster, target, casting).
 */
class JuiceHookManager
{
  /**
   * Remembers multi-hit connection counts for amplitude decay.
   * @type {Map<string, JuiceFlurryStrikeRecord>}
   */
  static #flurryState = new Map();

  /**
   * Clears stale flurry rows occasionally so long sessions do not grow forever.
   */
  static #maybeGarbageCollectFlurry()
  {
    if (Graphics.frameCount % 600 !== 0)
    {
      return;
    }

    // continue the routine with the next policy step.
    JuiceHookManager.#flurryState.clear();
  }

  /**
   * Computes amplitude multiplier for pierced / repeated applications.
   * @param {JABS_Action} action The action.
   * @param {JABS_Battler} target The target battler.
   * @returns {number}
   */
  static #computeFlurryAmplitudeScale(action, target)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const key = `${action.getUuid()}::${target.getUuid()}`;
    const frame = Graphics.frameCount;
    const prior = JuiceHookManager.#flurryState.get(key);
    let count = 1;

    if (prior && frame - prior.frame <= 2)
    {
      count = prior.count + 1;
    }

    // Register the value on the alias map for runtime lookup.
    JuiceHookManager.#flurryState.set(key, new JuiceFlurryStrikeRecord(count, frame));

    const decay = md.flurryDecayPercent / 100;
    return Math.pow(decay, count - 1);
  }

  /**
   * Hook: {@link JABS_Engine#postPrimaryBattleEffects}.
   * @param {JABS_Action} action The impacting action.
   * @param {JABS_Battler} target The battler receiving the effect.
   */
  static onPostPrimaryBattleEffects(action, target)
  {
    JuiceHookManager.#maybeGarbageCollectFlurry();

    const result = target.getBattler()
      .result();

    if (result.parried === true)
    {
      return;
    }

    if (result.evaded === true)
    {
      return;
    }

    const character = target.getCharacter();
    const md = J.ABS.EXT.JUICE.Metadata;
    const ga = action.getAction();

    // support / utility skills (damage.type 0 = None) do not produce a target hit-reaction squish.
    // the caster-side juice handles their motion; squishing here would cancel it mid-cycle.
    if (ga.item().damage.type === 0)
    {
      return;
    }

    let intensity = md.targetMagicalSquishIntensity;

    if (ga.isPhysical())
    {
      intensity = md.targetPhysicalSquishIntensity;
    }

    if (action.isHealing())
    {
      intensity *= md.healingRecipientSquishScale;
    }

    intensity *= JuiceHookManager.#computeFlurryAmplitudeScale(action, target);

    JuiceMotionManager.scheduleSquish(character, intensity, md.targetSquishFrames);
  }

  /**
   * Hook: {@link JABS_Engine.executeMapAction}.
   * @param {JABS_Battler} caster The caster.
   * @param {JABS_Action} action The action executing on the map.
   */
  static onExecuteMapAction(caster, action)
  {
    const skill = action.getBaseSkill();
    const cooldownKey = action.getCooldownType();
    const dodgeKey = JABS_Button.Dodge;

    // <noJuice> suppresses all caster motion for this skill.
    if (skill.jabsNoJuice === true)
    {
      return;
    }

    const motionKey = skill.jabsJuiceMotion;

    // a dodge with nothing authored on it gets the dodge squish. An authored <juiceMotion:…> is a
    // deliberate request, so it falls through to the same dispatch every other skill uses rather
    // than being overruled by which slot the skill happens to sit in.
    if (cooldownKey === dodgeKey && motionKey === String.empty)
    {
      JuiceHookManager.#applyDodgeJuice(caster);
      return;
    }

    // <juiceMotion:none> is an inline opt-out equivalent to <noJuice>.
    if (motionKey === 'none')
    {
      return;
    }

    // <juiceMotion:squish> fires a body squash on the caster, repeated per <juiceRepeatCount:N>.
    // <juiceDuration:N> overrides the per-cycle frame count.
    if (motionKey === 'squish')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applySquishCasterJuice(caster, repeatCount, duration);
      return;
    }

    // <juiceMotion:pulse> fires the casting shimmer pulse on the caster, repeated per <juiceRepeatCount:N>.
    // <juiceDuration:N> overrides the per-cycle frame count.
    if (motionKey === 'pulse')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applySupportCasterJuice(caster, repeatCount, duration);
      return;
    }

    // <juiceMotion:flip> spins the caster sprite clockwise N full rotations over the duration.
    if (motionKey === 'flip')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applyFlipBodyJuice(caster, 'cw', repeatCount, duration);
      return;
    }

    // <juiceMotion:flip-reverse> spins the caster sprite counter-clockwise N full rotations over the duration.
    if (motionKey === 'flip-reverse')
    {
      const repeatCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
      const duration = JuiceProfileResolver.resolveJuiceDuration(action);
      JuiceHookManager.#applyFlipBodyJuice(caster, 'ccw', repeatCount, duration);
      return;
    }

    if (action.isHealing())
    {
      // healing without an explicit weapon motion tag gets the gentle support pulse.
      if (motionKey === String.empty)
      {
        JuiceHookManager.#applySupportCasterJuice(caster);
        return;
      }

      // authored <juiceMotion:…> wins over the healing shortcut — same path as strikes (tilt + overlay).
    }

    // support skills (damage.type 0 = None) without an explicit motion tag get the support pulse.
    if (skill.damage.type === 0 && motionKey === String.empty)
    {
      JuiceHookManager.#applySupportCasterJuice(caster);
      return;
    }

    JuiceHookManager.#applyStrikeJuice(caster, action);
  }

  /**
   * Applies dodge-only motion on the caster (scale squash, no weapon overlay).
   * @param {JABS_Battler} caster The dodging battler.
   */
  static #applyDodgeJuice(caster)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = caster.getCharacter();

    // continue the routine with the next policy step.
    JuiceMotionManager.scheduleSquish(character, md.dodgeSquishIntensity, md.dodgeSquishFrames);
  }

  /**
   * Applies a body squash on the caster, optionally repeated {@link repeatCount} times.
   * Used by <juiceMotion:squish> for skills that want a punchy caster reaction without a weapon overlay.
   * @param {JABS_Battler} caster The caster.
   * @param {number} [repeatCount=1] How many times to cycle the squish.
   * @param {number|null} [totalDuration=null] Total frame budget; divided evenly across cycles. Defaults to metadata value.
   */
  static #applySquishCasterJuice(caster, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = caster.getCharacter();

    // divide the total duration evenly across all cycles.
    const baseDuration = totalDuration ?? md.unarmedStrikeSquishFrames;
    const perCycleDuration = Math.max(1, Math.floor(baseDuration / repeatCount));

    JuiceMotionManager.scheduleSquish(character, md.unarmedStrikeSquishIntensity, perCycleDuration, repeatCount);
  }

  /**
   * Applies gentle caster pulse for healing or support actions, optionally repeated {@link repeatCount} times.
   * @param {JABS_Battler} caster The healing caster.
   * @param {number} [repeatCount=1] How many times to cycle the pulse.
   * @param {number|null} [totalDuration=null] Total frame budget; divided evenly across cycles. Defaults to metadata value.
   */
  static #applySupportCasterJuice(caster, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = caster.getCharacter();

    // divide the total duration evenly across all cycles.
    const baseDuration = totalDuration ?? md.supportCasterPulseFrames;
    const perCycleDuration = Math.max(1, Math.floor(baseDuration / repeatCount));

    JuiceMotionManager.scheduleSquish(character, md.supportCasterPulseIntensity, perCycleDuration, repeatCount);
  }

  /**
   * Spins the caster sprite through N full 360° rotations over the total duration.
   * Used by <juiceMotion:flip> (clockwise) and <juiceMotion:flip-reverse> (counter-clockwise).
   * @param {JABS_Battler} caster The caster.
   * @param {string} direction Which way the caster turns: `cw` or `ccw`.
   * @param {number} [repeatCount=1] Number of full rotations to complete.
   * @param {number|null} [totalDuration=null] Total frame budget. Defaults to metadata unarmed squish frames.
   */
  static #applyFlipBodyJuice(caster, direction, repeatCount = 1, totalDuration = null)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = caster.getCharacter();
    const duration = totalDuration ?? md.unarmedStrikeSquishFrames;

    JuiceMotionManager.scheduleFlipBody(character, direction, duration, repeatCount);
  }

  /**
   * Applies strike motion: tilt + optional weapon swing for actors when an icon resolves.
   * @param {JABS_Battler} caster The attacker.
   * @param {JABS_Action} action The strike action.
   */
  static #applyStrikeJuice(caster, action)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = caster.getCharacter();
    const iconIndex = JuiceProfileResolver.resolveWeaponIconIndex(caster, action);

    // nothing resolved to draw an arc with, so the whole strike reads as a body blow instead. the
    // caster gets a squash rather than a lean, because a lean with no weapon following it through
    // looks like the character tripped.
    if (iconIndex < 0)
    {
      JuiceMotionManager.scheduleSquish(
        character,
        md.unarmedStrikeSquishIntensity,
        md.unarmedStrikeSquishFrames
      );

      return;
    }

    const styleKey = JuiceProfileResolver.resolveWeaponStyleKey(caster, action);
    const mul = JuiceProfileResolver.resolveStyleMultipliers(styleKey);

    // the body leans into the swing; the overlay below is what actually arcs.
    JuiceMotionManager.scheduleTilt(
      character,
      md.casterStrikeTiltRadians * mul.tiltMul,
      md.casterStrikeTiltFrames
    );

    JuiceHookManager.#playWeaponSwing(caster, action, iconIndex, mul.swingMul);
  }

  /**
   * Arcs a weapon icon out of the caster to accompany a strike.
   *
   * This is the one piece of juice that still drives a sprite directly, and it has to: the overlay
   * is a sprite this plugin creates and parents itself, not a character the engine is drawing, so
   * there is nothing for the motion composer to compose it onto.
   * @param {JABS_Battler} caster The attacker.
   * @param {JABS_Action} action The strike action.
   * @param {number} iconIndex The weapon icon to arc.
   * @param {number} swingMultiplier The style multiplier applied to the swing's width.
   */
  static #playWeaponSwing(caster, action, iconIndex, swingMultiplier)
  {
    const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(caster.getCharacter());

    // the caster is not currently drawn anywhere, so there is nothing to parent an overlay to.
    if (!sprite)
    {
      return;
    }

    const md = J.ABS.EXT.JUICE.Metadata;

    // exaggerate the swing so it stays readable through rapid combos.
    // this is intentionally over-the-top (paper mario juice).
    const swingWidthMultiplier = 2;
    const swingDurationMultiplier = 2;

    // select the motion type for this skill.
    const motionType = JuiceProfileResolver.resolveJuiceMotion(action);
    const arcSpanDegrees = JuiceProfileResolver.resolveJuiceArcSpanDegrees(action);
    const weaponTipRadians = JuiceProfileResolver.resolveJuiceWeaponTipRadians(action, motionType);
    const spinCount = JuiceProfileResolver.resolveJuiceRepeatCount(action);
    const profileGun = JuiceProfileResolver.resolveJuiceProfileGun(action);
    const juiceDuration = JuiceProfileResolver.resolveJuiceDuration(action)
      ?? (md.weaponSwingFrames * swingDurationMultiplier);
    const peakRadians = md.weaponSwingPeakRadians * swingMultiplier * swingWidthMultiplier;

    JuiceWeaponSwingOverlay.play(
      sprite,
      iconIndex,
      peakRadians,
      juiceDuration,
      motionType,
      arcSpanDegrees,
      action.direction(),
      weaponTipRadians,
      spinCount,
      profileGun
    );
  }

  /**
   * How long a casting pulse outlives the last frame that asked for it.
   *
   * Short enough that a cast ending is indistinguishable from the pulse stopping, long enough to
   * survive a frame the cast loop happens not to run on.
   * @type {number}
   */
  static #castingHeartbeatFrames = 4;

  /**
   * Hook: cast timer loop — keeps the casting pulse alive while a cast is running.
   *
   * Called on every frame of a cast rather than once at the start, which is what makes the pulse
   * self-limiting: it is declared with a few frames of life and renewed for as long as something
   * keeps calling. A cast that ends in a way nobody hooked — the caster killed mid-incantation,
   * interrupted, or moved to another map — simply stops renewing, and the pulse lapses on its own.
   * @param {JABS_Battler} battler The casting battler.
   */
  static tickCastingJuice(battler)
  {
    const md = J.ABS.EXT.JUICE.Metadata;
    const character = battler.getCharacter();

    // a skill may ask for a different body motion for its cast than the default charge-up. the
    // decided action is what is being cast, so it is where that request lives.
    const castMotion = JuiceHookManager.#castMotionFor(battler);

    // the squat: a fixed rapid squash for the whole cast, for skills that are spending something.
    if (castMotion === 'squish')
    {
      const skill = battler.getDecidedAction()[0].getBaseSkill();

      // zero is the getter's "nothing authored" sentinel, so the registered default period stands.
      const period = skill.jabsJuiceCastMotionPeriod || JuiceHookManager.#castingSquishDefaultPeriodFrames;

      JuiceMotionManager.scheduleCastingSquish(
        character,
        JuiceHookManager.#castingSquishIntensityFor(skill, md),
        period,
        JuiceHookManager.#castingHeartbeatFrames
      );
      return;
    }

    JuiceMotionManager.scheduleCastingPulse(
      character,
      md.castingPulseAmplitude,
      JuiceHookManager.#castingHeartbeatFrames
    );
  }

  /**
   * How many frames one casting squat takes when the skill does not say.
   *
   * Eight frames is seven and a half squats a second, which is the "rapidly" the design asked for
   * without turning into a vibration.
   * @type {number}
   */
  static #castingSquishDefaultPeriodFrames = 8;

  /**
   * How hard the casting squat deforms the sprite.
   *
   * A skill may author its own peak as a percent; a workout wants to read as a workout, and the
   * config's unarmed strike squish is tuned for a poke. Zero is the getter's "nothing authored"
   * sentinel, in which case that config value stands.
   * @param {RPG_Skill} skill The skill being cast.
   * @param {object} md This plugin's metadata, holding the config fallback.
   * @returns {number} The peak deformation as a fraction of true size, ex: `0.45`.
   */
  static #castingSquishIntensityFor(skill, md)
  {
    const authoredPercent = skill.jabsJuiceCastMotionIntensity;

    // nothing authored means the ordinary unarmed strike squish.
    if (authoredPercent === 0) return md.unarmedStrikeSquishIntensity;

    return authoredPercent / 100;
  }

  /**
   * The cast motion the battler's in-flight skill asked for, if any.
   *
   * A battler mid-cast always has a decided action, but the tick can land on a frame where the
   * decision has not been made yet or has already been cleared, and an empty answer there simply
   * means the default charge-up.
   * @param {JABS_Battler} battler The casting battler.
   * @returns {string} The cast motion key, or an empty string for the default.
   */
  static #castMotionFor(battler)
  {
    const actions = battler.getDecidedAction();

    // nothing decided means nothing authored to read.
    if (!actions || actions.length === 0) return String.empty;

    return actions[0].getBaseSkill().jabsJuiceCastMotion;
  }

  /**
   * Hook: cast completion — tears down casting-layer motion before execution juice runs.
   *
   * The heartbeat above would retire the pulse on its own within a few frames, but a cast that
   * completes is immediately followed by the juice for whatever it cast, and those few frames are
   * exactly the ones the player is watching. This ends it on the frame it actually ended.
   *
   * Only the pulse is withdrawn. A reaction running at the same time belongs to something else that
   * happened to this battler, and finishing a cast is no reason to cut it short.
   * @param {JABS_Battler} battler The battler who finished casting.
   */
  static endCastingJuice(battler)
  {
    const character = battler.getCharacter();

    JuiceMotionManager.cancelCastingPulse(character);
  }
}
export default JuiceHookManager;
//endregion JuiceHookManager