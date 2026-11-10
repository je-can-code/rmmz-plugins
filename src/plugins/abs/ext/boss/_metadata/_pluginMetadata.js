//region plugin metadata
import JabsBossEncounter from '../models/JabsBossEncounter.js';
import JabsBossManager from '../managers/JabsBossManager.js';
import JabsBossParticipant from '../models/JabsBossParticipant.js';
import JabsBossReaction from '../models/JabsBossReaction.js';
import JabsBossRoutine from '../models/JabsBossRoutine.js';
import JabsBossStep from '../models/JabsBossStep.js';

/**
 * The number of frames in one second, used to translate author-facing cadences into engine time.
 *
 * Authors think in seconds because that is how a fight is designed and described- "a summon every
 * fifteen seconds". The engine counts frames. This is where those two vocabularies meet, exactly
 * once, so no other file has to know the conversion.
 * @type {number}
 */
const FRAMES_PER_SECOND = 60;

class J_BossPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br>
   * Includes parsing the boss encounter configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeBossEncounters();
  }

  /**
   * Reads every boss encounter out of configuration and hands them to the manager.
   *
   * Encounters live in the `bosses` block of `config.jabs.json` rather than in a file of their own,
   * the same way J-ABS-Juice reads its `juice` block. One file per plugin family keeps the editor's
   * boards mapping one-to-one onto config files, and means an extension never has to own the loading
   * of its own configuration.
   */
  initializeBossEncounters()
  {
    // J-ABS guarantees the parsed root is on its metadata by the time extensions postInitialize().
    const { bosses } = J.ABS.Metadata.ExternalConfig;

    const encounters = bosses.map(rawEncounter => this.parseEncounter(rawEncounter));

    JabsBossManager.registerEncounters(encounters);
  }

  /**
   * Builds one encounter out of its raw configuration.
   *
   * None of the parse helpers below may be `#private`. The whole chain runs out of
   * {@link PluginMetadata}'s constructor by way of `postInitialize`, and a derived class installs its
   * private members only after `super()` returns- so a private helper does not exist yet at the moment
   * this runs, and touching one throws before the game finishes booting.
   * @param {any} rawEncounter The unparsed encounter from configuration.
   * @returns {JabsBossEncounter}
   */
  parseEncounter(rawEncounter)
  {
    const participants = rawEncounter.participants.map(raw => this.parseParticipant(raw));

    // a fight that does not say who drives the boss means the normal AI keeps driving it, because
    // that is what the overwhelming majority of encounters want.
    const aiControl = rawEncounter.aiControl ?? J.ABS.EXT.BOSS.AiControl.Shared;

    // routines are optional; a boss whose only scripted behavior is its phases has none.
    const rawRoutines = rawEncounter.routines ?? [];
    const routines = rawRoutines.map(raw => this.parseRoutine(raw));

    // a fight whose ending the story learns some other way names no switch, and zero is that "none".
    const defeatSwitchId = rawEncounter.defeatSwitch ?? 0;

    // reactions are optional too; a boss that does the same thing from start to finish has none.
    const rawReactions = rawEncounter.reactions ?? [];
    const reactions = rawReactions.map(raw => this.parseReaction(raw));

    const { key, map } = rawEncounter;
    return new JabsBossEncounter(key, map, participants, aiControl, routines, defeatSwitchId, reactions);
  }

  /**
   * Builds one participant out of its raw configuration.
   *
   * A participant names an enemy and the tile it appears on rather than an event, because the
   * encounter spawns its own bodies when it starts. The same configuration then serves every map the
   * fight is staged on.
   * @param {any} rawParticipant The unparsed participant from configuration.
   * @returns {JabsBossParticipant}
   */
  parseParticipant(rawParticipant)
  {
    const { key, enemyId, expect, x, y } = rawParticipant;

    // a participant naming no template of its own spawns from the slot matching its enemy id, and zero
    // is that "none".
    const template = rawParticipant.template ?? 0;
    const templateId = template === 0 ? enemyId : template;

    return new JabsBossParticipant(key, enemyId, expect, x, y, templateId);
  }

  /**
   * Builds one reaction out of its raw configuration.
   * @param {any} rawReaction The unparsed reaction from configuration.
   * @returns {JabsBossReaction}
   */
  parseReaction(rawReaction)
  {
    const { key, on } = rawReaction;

    // only a fallen or health trigger waits on anybody, so a reaction to anything else names nobody.
    const participantKeys = rawReaction.participants ?? [];
    const steps = rawReaction.steps.map(raw => this.parseStep(raw));

    // only a health trigger waits on a percent, and zero is that "none" for every other trigger.
    const belowPercent = rawReaction.below ?? 0;

    return new JabsBossReaction(key, on, participantKeys, steps, belowPercent);
  }

  /**
   * Builds one routine out of its raw configuration.
   * @param {any} rawRoutine The unparsed routine from configuration.
   * @returns {JabsBossRoutine}
   */
  parseRoutine(rawRoutine)
  {
    const cadenceFrames = this.secondsToFrames(rawRoutine.cadence);
    const steps = rawRoutine.steps.map(raw => this.parseStep(raw));

    // a routine runs from the first frame of its fight unless it says it waits to be started.
    const dormant = rawRoutine.dormant === true;

    return new JabsBossRoutine(rawRoutine.key, cadenceFrames, steps, dormant);
  }

  /**
   * Builds one step out of its raw configuration.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {JabsBossStep}
   */
  parseStep(rawStep)
  {
    // every field any verb reads is read for every step, and each one this step's verb has no use for
    // simply sits at its "none". That keeps one shape for every step, whatever its verb.
    const details = {
      ...this.parseStepReferences(rawStep),
      ...this.parseStepPlacement(rawStep),
      ...this.parseStepPresentation(rawStep),
    };

    return new JabsBossStep(rawStep.verb, details);
  }

  /**
   * Reads what a step acts on and refers to: its participant, the skill, state or routine it names, and the
   * time it works across.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {Object} Those fields of the step's details.
   */
  parseStepReferences(rawStep)
  {
    return {
      // a step naming nobody acts on the boss itself.
      participantKey: rawStep.participant ?? String.empty,
      skillId: rawStep.skill ?? 0,
      stateId: rawStep.state ?? 0,

      // an author who records no name gets no drift tripwire, which is their choice to make.
      expect: rawStep.expect ?? String.empty,

      // a skill defaults to observing its own cast time, because the common case is an attack the
      // player is meant to see coming. Removing the wind-up is the exception and must be asked for.
      cast: rawStep.cast !== false,
      routineKey: rawStep.routine ?? String.empty,

      // authors speed a routine up, let a tint settle, or pause, in seconds- the same unit they wrote cadences in.
      frames: this.secondsToFrames(rawStep.seconds ?? 0),
    };
  }

  /**
   * Reads where a step puts things: the enemy a spawn puts on the map, the clone map slot it copies, and the
   * tile and facing a spawn or a blink lands on.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {Object} Those fields of the step's details.
   */
  parseStepPlacement(rawStep)
  {
    // a spawn naming no template of its own copies the slot matching its enemy id, exactly the way a
    // participant does, and zero is that "none".
    const enemyId = rawStep.enemyId ?? 0;
    const template = rawStep.template ?? 0;
    const templateId = template === 0 ? enemyId : template;

    return {
      enemyId,
      templateId,
      x: rawStep.x ?? 0,
      y: rawStep.y ?? 0,

      // a blink that names no facing leaves its participant facing the way it already was.
      direction: rawStep.direction ?? 0,
    };
  }

  /**
   * Reads how a step looks and sounds: a changed look, a tint, an animation, and a line with its face and speaker.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {Object} Those fields of the step's details.
   */
  parseStepPresentation(rawStep)
  {
    return {
      characterName: rawStep.image ?? String.empty,
      characterIndex: rawStep.index ?? 0,
      tone: rawStep.tone ?? [],
      animationId: rawStep.animation ?? 0,
      face: rawStep.face ?? String.empty,
      faceIndex: rawStep.faceIndex ?? 0,
      speaker: rawStep.speaker ?? String.empty,
      lines: rawStep.lines ?? [],
    };
  }

  /**
   * Translates an author-facing count of seconds into engine frames, rounded to a whole frame.
   * @param {number} seconds The seconds to translate.
   * @returns {number}
   */
  secondsToFrames(seconds)
  {
    return Math.round(seconds * FRAMES_PER_SECOND);
  }
}

export default J_BossPluginMetadata;
//endregion plugin metadata