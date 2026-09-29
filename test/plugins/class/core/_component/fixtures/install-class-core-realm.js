//region plugins/class/core/_component/fixtures/install-class-core-realm.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../../setup/rmmz-view-harness.js';

/**
 * The multiplier each test class applies to the starting class's curve, per base parameter.
 *
 * Shaped like Chef Adventure's classes on purpose: every curve is the starting class's times a constant, so a
 * multiplier read back at level 99 has exactly one right answer.
 * @type {Record<number, number[]>}
 */
export const CLASS_MULTIPLIERS = {
  2: [ 1.05, 1, 1.15, 1.05, 0.9, 0.9, 1, 1 ],
  3: [ 0.8, 1.1, 1, 0.8, 1.1, 1, 1.1, 1.05 ],
  4: [ 1, 1, 1, 1, 1, 1, 1, 1 ],
};

/**
 * The harness's own class curve: every base parameter is `100 + 10 * level`.
 * @param {number} level The level to read.
 * @returns {number}
 */
export const startingCurveAt = level => 100 + (level * 10);

/**
 * Builds a raw class row whose curves are the harness curve scaled per parameter.
 * @param {number} id The class id.
 * @param {string} name The class name.
 * @param {number[]} multipliers One multiplier per base parameter.
 * @returns {object} A raw database row, in the shape RPG Maker writes it.
 */
const classRow = (id, name, multipliers) => ({
  id,
  name,
  expParams: [ 30, 20, 30, 30 ],
  params: multipliers.map(multiplier => Array.from(
    { length: 100 },
    (unused, level) => Math.round(startingCurveAt(level) * multiplier))),
  learnings: [],
  traits: [],
  note: '',
});

/**
 * The icon the JMZ data editor gave Brawler, the one class in this realm with an icon of its own.
 * @type {number}
 */
export const BRAWLER_ICON_INDEX = 96;

/**
 * The starting class's Max Tech curve, written the way Chef Adventure writes its base classes' curves.
 * @type {string}
 */
const STARTING_MAX_TP_CURVE = '<mtpGrowthCurve:[(180+30*(a.level-1))*1]>';

/**
 * Brawler's Max Tech curve: the starting class's, times 1.20.
 * @type {string}
 */
const BRAWLER_MAX_TP_CURVE = '<mtpGrowthCurve:[(180+30*(a.level-1))*1.20]>';

/**
 * How much attack the realm's one sword adds to whoever wears it.
 * @type {number}
 */
export const SWORD_ATTACK = 20;

/**
 * Adds the classes, the gear, and the second actor these tests read to the harness database.
 *
 * Class 5 has no Max Magi at all, and is actor 2's starting class, so that actor has a parameter nothing can be
 * a multiple of. Brawler carries a description and an icon, the way the JMZ data editor writes them; every
 * other class has neither, the way RPG Maker writes them. Pathfinder and Warden are set aside, one for each
 * actor, so each actor's list has one class to tease and one that is somebody else's.
 *
 * The starting class and Brawler carry Max Tech curves, which only J-LevelMaster reads: Brawler's is the
 * starting class's times 1.20, and Scholar has none. Without J-LevelMaster they are inert text.
 *
 * Actor 1 may wear swords and starts wearing nothing, so a test can put the sword on to prove the class sheet
 * leaves gear out. Everything goes in before J-Base loads, because J-Base rewrites these tables into its own
 * models and a row added afterwards would stay raw.
 */
const seedClassDatabase = () =>
{
  const [ , harnessActor ] = globalThis.$dataActors;
  const [ , harnessClass ] = globalThis.$dataClasses;

  harnessClass.note = STARTING_MAX_TP_CURVE;
  globalThis.$dataClasses.push(
    {
      ...classRow(2, 'Brawler', CLASS_MULTIPLIERS[2]),
      description: 'Hits first.\nAsks later.',
      iconIndex: BRAWLER_ICON_INDEX,
      note: BRAWLER_MAX_TP_CURVE,
    },
    classRow(3, 'Scholar', CLASS_MULTIPLIERS[3]),
    classRow(4, 'Hermit', CLASS_MULTIPLIERS[4]),
    classRow(5, 'Void', [ 1, 0, 1, 1, 1, 1, 1, 1 ]),
    {
      ...classRow(6, 'Pathfinder', [ 1, 1, 1, 1, 1, 1, 1, 1 ]),
      note: '<unlockableForActors:[1]>',
    },
    {
      ...classRow(7, 'Warden', [ 1, 1, 1, 1, 1, 1, 1, 1 ]),
      note: '<unlockableForActors:[2]>',
    });

  globalThis.$dataWeapons.push({
    id: 1,
    name: 'Sword',
    description: '',
    iconIndex: 0,
    note: '',
    traits: [],
    etypeId: 1,
    wtypeId: 1,
    params: [ 0, 0, SWORD_ATTACK, 0, 0, 0, 0, 0 ],
    price: 0,
    animationId: 0,
  });

  globalThis.$dataActors.push({
    ...harnessActor,
    id: 2,
    name: 'Second Actor',
    classId: 5,
  });

  // only actor 1 may wear swords; the second actor was copied above, and keeps the empty list it copied.
  harnessActor.traits = [ { code: 51, dataId: 1, value: 0 } ];

  globalThis.$dataSystem.partyMembers = [ 1, 2 ];

  // the engine ignores a switch id past the end of this list, so the harness's lone entry would swallow
  // every switch the menu tests set.
  globalThis.$dataSystem.switches = Array.from({ length: 21 }, () => '');
};

/**
 * Stands up the real engine with J-Base, J-CMS's catalog, and J-Classes' own bootstrap and actor state.
 *
 * J-Base arrives as its shipped bundle, since a plugin source file may never import across a ship boundary
 * and its globals are what J-Classes is written against. J-CMS's catalog is imported from source instead,
 * because the two files J-Classes draws through are the ones this plugin extended- testing against the
 * last build would test the version before the change.
 *
 * The game objects are rebuilt last, once J-Base has rewritten the database and J-Classes has aliased
 * `initMembers`, so both actors exist exactly as they would in a running game. An extension's realm loads
 * its own hosts in `beforeWorld`, which runs just before that rebuild- the last moment a raw database row
 * can still be edited, and the last moment a plugin can still alias `initMembers` onto every actor.
 * @param {Record<string, string>} pluginParameters J-Classes' plugin parameters, as the editor stores them.
 * @param {function(): Promise<void>} beforeWorld Anything to install before the world is rebuilt.
 * @returns {Promise<void>}
 */
export async function installClassCoreRealm(pluginParameters = {}, beforeWorld = async () => {})
{
  installRmmzViewLayer();
  installMinimalDatabase();
  seedClassDatabase();

  // J-Classes reads its parameters by name, the way every plugin's metadata does. So does J-Base, and the
  // editor always writes its parameters out: without them its actor max TP reads as `NaN`, which the catalog
  // then draws as a changing row, since `NaN` never equals itself. These are the editor's defaults.
  globalThis.$plugins = [
    {
      name: 'J-Base',
      status: true,
      parameters: {
        actorBaseTp: '0',
        enemyBaseTp: '100',
        newGameCommonEventId: '0',
      },
    },
    {
      name: 'J-Classes',
      status: true,
      parameters: pluginParameters,
    },
  ];
  const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);
  globalThis.PluginManager.parameters = name =>
  {
    const found = globalThis.$plugins.find(plugin => plugin.name === name);

    return found
      ? found.parameters
      : realParameters(name);
  };

  // read from `out/`, which `hotfix` and `bun run test` both rebuild before the suite runs. The copy under
  // `project/` is only refreshed after the suite passes, so it is one build behind any J-Base change.
  const bundle = path.join(repoRoot, 'out/base/J-Base.js');
  vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

  // normally Scene_Boot's job: the parameter catalog the parameters window reads, and which anything binding
  // natural growth binds against- so it goes in before any extension, and before any actor exists.
  globalThis.VanillaParameterRegistration.registerAll();

  // J-Classes checks J-CMS's version at boot, and reads its catalog and formats its values through it.
  globalThis.J.CMS = {
    Metadata: {
      version: {
        version: () => '1.2.1',
      },
    },
  };
  ({ default: globalThis.ParameterCatalogRenderer } = await import(
    '../../../../../../src/plugins/cms/core/helpers/ParameterCatalogRenderer.js'));

  // the build-time defines `initialization.js` reads, which only exist inside a bundle.
  globalThis.__PLUGIN_NAME__ = 'J-Classes';
  globalThis.__PLUGIN_VERSION__ = '1.0.0';
  await import('../../../../../../src/plugins/class/core/_metadata/initialization.js');
  await import('../../../../../../src/plugins/class/core/objects/Game_Actor.js');

  // whatever an extension's realm needs in place before the world exists.
  await beforeWorld();

  // rebuild the world now that every plugin is in place.
  globalThis.DataManager.rewriteDatabaseData();
  globalThis.DataManager.createGameObjects();
  globalThis.$gameParty.setupStartingMembers();
}
//endregion plugins/class/core/_component/fixtures/install-class-core-realm.js