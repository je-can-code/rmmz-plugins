//region plugin metadata
import JabsBossEncounter from '../models/JabsBossEncounter.js';
import JabsBossManager from '../managers/JabsBossManager.js';
import JabsBossParticipant from '../models/JabsBossParticipant.js';
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

    return new JabsBossEncounter(rawEncounter.key, rawEncounter.map, participants, aiControl, routines);
  }

  /**
   * Builds one participant out of its raw configuration.
   * @param {any} rawParticipant The unparsed participant from configuration.
   * @returns {JabsBossParticipant}
   */
  parseParticipant(rawParticipant)
  {
    const { key, eventId, enemyId, expect } = rawParticipant;

    return new JabsBossParticipant(key, eventId, enemyId, expect);
  }

  /**
   * Builds one routine out of its raw configuration.
   * @param {any} rawRoutine The unparsed routine from configuration.
   * @returns {JabsBossRoutine}
   */
  parseRoutine(rawRoutine)
  {
    const cadenceFrames = Math.round(rawRoutine.cadence * FRAMES_PER_SECOND);
    const steps = rawRoutine.steps.map(raw => this.parseStep(raw));

    return new JabsBossRoutine(rawRoutine.key, cadenceFrames, steps);
  }

  /**
   * Builds one step out of its raw configuration.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {JabsBossStep}
   */
  parseStep(rawStep)
  {
    const { verb, skill, expect } = rawStep;

    // a skill defaults to observing its own cast time, because the common case is an attack the
    // player is meant to see coming. Removing the wind-up is the exception and must be asked for.
    const cast = rawStep.cast !== false;

    return new JabsBossStep(verb, skill, expect, cast);
  }
}

export default J_BossPluginMetadata;
//endregion plugin metadata