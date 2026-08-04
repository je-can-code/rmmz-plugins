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
   * The project-relative path to this plugin's external configuration file. Encounters are authored
   * as data so a fight can be revised without touching a single event command.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.boss.json';

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
   */
  initializeBossEncounters()
  {
    // this file is required- a missing or invalid config crashes boot, same as every other
    // config-driven plugin in this codebase.
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-ABS-Boss')
      .configName('boss encounter configuration')
      .build();

    const config = ExternalJsonConfigLoader.load(J_BossPluginMetadata.CONFIG_PATH, options);

    const encounters = config.encounters.map(rawEncounter => this.#parseEncounter(rawEncounter));

    JabsBossManager.registerEncounters(encounters);
  }

  /**
   * Builds one encounter out of its raw configuration.
   * @param {any} rawEncounter The unparsed encounter from configuration.
   * @returns {JabsBossEncounter}
   */
  #parseEncounter(rawEncounter)
  {
    const participants = rawEncounter.participants.map(raw => this.#parseParticipant(raw));

    // a fight that does not say who drives the boss means the normal AI keeps driving it, because
    // that is what the overwhelming majority of encounters want.
    const aiControl = rawEncounter.aiControl ?? J.ABS.EXT.BOSS.AiControl.Shared;

    // routines are optional; a boss whose only scripted behavior is its phases has none.
    const rawRoutines = rawEncounter.routines ?? [];
    const routines = rawRoutines.map(raw => this.#parseRoutine(raw));

    return new JabsBossEncounter(rawEncounter.key, rawEncounter.map, participants, aiControl, routines);
  }

  /**
   * Builds one participant out of its raw configuration.
   * @param {any} rawParticipant The unparsed participant from configuration.
   * @returns {JabsBossParticipant}
   */
  #parseParticipant(rawParticipant)
  {
    const { key, eventId, enemyId, expect } = rawParticipant;

    return new JabsBossParticipant(key, eventId, enemyId, expect);
  }

  /**
   * Builds one routine out of its raw configuration.
   * @param {any} rawRoutine The unparsed routine from configuration.
   * @returns {JabsBossRoutine}
   */
  #parseRoutine(rawRoutine)
  {
    const cadenceFrames = Math.round(rawRoutine.cadence * FRAMES_PER_SECOND);
    const steps = rawRoutine.steps.map(raw => this.#parseStep(raw));

    return new JabsBossRoutine(rawRoutine.key, cadenceFrames, steps);
  }

  /**
   * Builds one step out of its raw configuration.
   * @param {any} rawStep The unparsed step from configuration.
   * @returns {JabsBossStep}
   */
  #parseStep(rawStep)
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