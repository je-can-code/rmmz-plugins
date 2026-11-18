//region plugins/abs/ext/boss/_metadata/metadata.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * These tests construct the metadata against the **real** {@link PluginMetadata}, not a stand-in.
 *
 * That is the whole point of the file. `PluginMetadata`'s constructor calls `initializePlugin`, which
 * calls `postInitialize`, which is where this plugin parses its encounters - so the entire parse runs
 * before `super()` has returned. A derived class installs its own private members only after that
 * point, which means any `#private` helper reached during the parse throws
 * "Receiver must be an instance of class" and the game never finishes booting. A hand-written double
 * for the base class would have its own constructor ordering and would happily miss that.
 */
describe('J-ABS-Boss metadata (constructed through the real PluginMetadata)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/_metadata/_pluginMetadata.js').default} */
  let J_BossPluginMetadata;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default} */
  let JabsBossManager;

  const PLUGIN_NAME = 'J-ABS-Boss-MetadataTest';

  const rawEncounter = {
    key: 'gluttonwolf',
    map: 75,
    defeatSwitch: 24,
    participants: [
      { key: 'mayor', enemyId: 581, expect: 'Gluttonwolf Mayor', x: 8, y: 14 },
      { key: 'golem', enemyId: 501, expect: 'Golem', x: 4, y: 3, template: 601 },
    ],
    aiControl: 'shared',
    routines: [ {
      key: 'devour',
      cadence: 20,
      steps: [ { verb: 'forceSkill', skill: 2584, expect: 'Devour', cast: true } ],
    } ],
    reactions: [
      { key: 'seal', on: 'start', steps: [ { verb: 'addState', participant: 'mayor', state: 2072, expect: 'Sealed' } ] },
      {
        key: 'enrage',
        on: 'fallen',
        participants: [ 'golem' ],
        steps: [ { verb: 'quickenRoutine', routine: 'devour', seconds: 1 } ],
      },
      { key: 'flare', on: 'health', below: 66, steps: [ { verb: 'tint', tone: [ 17, -68, -68, 0 ], seconds: 2 } ] },
    ],
  };

  const previousGlobals = {};

  beforeAll(async () =>
  {
    vi.resetModules();

    previousGlobals.PluginManager = globalThis.PluginManager;
    previousGlobals.PluginMetadata = globalThis.PluginMetadata;
    previousGlobals.J = globalThis.J;
    previousGlobals.empty = String.empty;

    // J-Base hangs the empty string off String for the whole game; a step's unused text fields default to it.
    String.empty = '';

    globalThis.PluginManager = {
      parameters: () => ({}),
      registerCommand: () => {},
    };

    // the ship reaches PluginMetadata as a hoisted global from the J-Base bundle, so the test has to
    // put the real class there rather than let the module import it.
    const { default: PluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = PluginMetadata;

    // J-ABS owns the parsed config root; extensions only read their own block off it.
    globalThis.J = {
      ABS: {
        Metadata: { ExternalConfig: { bosses: [ rawEncounter ] } },
        EXT: { BOSS: { AiControl: { Shared: 'shared', Scripted: 'scripted' } } },
      },
    };

    ({ default: JabsBossManager } =
      await import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));
    ({ default: J_BossPluginMetadata } =
      await import('../../../../../../src/plugins/abs/ext/boss/_metadata/_pluginMetadata.js'));
  });

  afterAll(() =>
  {
    // restore by hand rather than trusting restoreAllMocks, since these are bare global assignments.
    globalThis.PluginManager = previousGlobals.PluginManager;
    globalThis.PluginMetadata = previousGlobals.PluginMetadata;
    globalThis.J = previousGlobals.J;
    String.empty = previousGlobals.empty;
  });

  describe('construction', () =>
  {
    it('parses its encounters without throwing while super() is still on the stack', () =>
    {
      // Arrange & Act
      const construct = () => new J_BossPluginMetadata(PLUGIN_NAME, '1.0.0');

      // Assert: a #private parse helper fails here and nowhere else.
      expect(construct).not.toThrow();
    });

    it('registers the parsed encounters with the manager', () =>
    {
      // Arrange & Act: registration is a side effect of construction, so the instance is unused.
      const metadata = new J_BossPluginMetadata(`${PLUGIN_NAME}-Register`, '1.0.0');

      // Assert
      expect(metadata.name).toBe(`${PLUGIN_NAME}-Register`);
      expect(JabsBossManager.encounters.get('gluttonwolf').mapId()).toBe(75);
    });
  });

  describe('parsing', () =>
  {
    /** @type {J_BossPluginMetadata} */
    let metadata;

    beforeAll(() =>
    {
      metadata = new J_BossPluginMetadata(`${PLUGIN_NAME}-Parsing`, '1.0.0');
    });

    it('reads each participant as an enemy and the tile it appears on', () =>
    {
      // Arrange & Act
      const [ participant ] = metadata.parseEncounter(rawEncounter).participants();

      // Assert
      expect(participant.key()).toBe('mayor');
      expect(participant.enemyId()).toBe(581);
      expect(participant.expect()).toBe('Gluttonwolf Mayor');
      expect(participant.x()).toBe(8);
      expect(participant.y()).toBe(14);
    });

    it('translates the author-facing cadence from seconds into frames', () =>
    {
      // Arrange & Act
      const [ routine ] = metadata.parseEncounter(rawEncounter).routines();

      // Assert: twenty seconds at sixty frames per second.
      expect(routine.cadenceFrames()).toBe(1200);
    });

    it('defaults aiControl to shared when the encounter does not name one', () =>
    {
      // Arrange
      const { aiControl, ...withoutAiControl } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutAiControl);

      // Assert
      expect(encounter.aiControl()).toBe('shared');
    });

    it('defaults a step to observing its cast time when cast is not stated', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'forceSkill', skill: 2584, expect: 'Devour' });

      // Assert
      expect(step.isCast()).toBe(true);
    });

    it('honours a step that explicitly opts out of its cast time', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'forceSkill', skill: 2584, expect: 'Devour', cast: false });

      // Assert
      expect(step.isCast()).toBe(false);
    });

    it('reads the switch an encounter turns on once it is won', () =>
    {
      // Arrange & Act
      const encounter = metadata.parseEncounter(rawEncounter);

      // Assert
      expect(encounter.defeatSwitchId()).toBe(24);
    });

    it('reads an encounter that names no defeat switch as turning none on', () =>
    {
      // Arrange
      const { defeatSwitch, ...withoutDefeatSwitch } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutDefeatSwitch);

      // Assert
      expect(encounter.defeatSwitchId()).toBe(0);
    });

    it('treats a missing routines list as an encounter with no scripted behavior', () =>
    {
      // Arrange
      const { routines, ...withoutRoutines } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutRoutines);

      // Assert
      expect(encounter.routines()).toEqual([]);
    });

    it('spawns a participant that names no template from the slot matching its enemy id', () =>
    {
      // Arrange & Act
      const [ mayor ] = metadata.parseEncounter(rawEncounter).participants();

      // Assert
      expect(mayor.templateId()).toBe(581);
    });

    it('spawns a participant from the template it names, while it stays the enemy it names', () =>
    {
      // Arrange & Act
      const [ , golem ] = metadata.parseEncounter(rawEncounter).participants();

      // Assert
      expect(golem.templateId()).toBe(601);
      expect(golem.enemyId()).toBe(501);
    });

    it('reads a template of zero as naming none', () =>
    {
      // Arrange & Act
      const participant = metadata.parseParticipant({ key: 'golem', enemyId: 501, expect: 'Golem', x: 4, y: 3, template: 0 });

      // Assert
      expect(participant.templateId()).toBe(501);
    });

    it('reads a participant that says it is only standing by as a bystander', () =>
    {
      // Arrange
      const raw = { key: 'skye', enemyId: 554, expect: 'Skye', x: 25, y: 19, template: 607, bystander: true };

      // Act
      const participant = metadata.parseParticipant(raw);

      // Assert
      expect(participant.isBystander()).toBe(true);
    });

    it('reads a participant that says nothing about standing by as a body the fight is won by felling', () =>
    {
      // Arrange & Act
      const [ mayor ] = metadata.parseEncounter(rawEncounter).participants();

      // Assert
      expect(mayor.isBystander()).toBe(false);
    });

    it('reads a participant that says it waits to be summoned as summoned', () =>
    {
      // Arrange
      const raw = { key: 'brine', enemyId: 531, expect: 'Puppet', x: 23, y: 13, template: 608, summoned: true };

      // Act
      const participant = metadata.parseParticipant(raw);

      // Assert
      expect(participant.isSummoned()).toBe(true);
    });

    it('reads a participant that says nothing about being summoned as there from the start', () =>
    {
      // Arrange & Act
      const [ mayor ] = metadata.parseEncounter(rawEncounter).participants();

      // Assert
      expect(mayor.isSummoned()).toBe(false);
    });

    it('reads each reaction as the moment it answers, the bodies it waits on, and its steps', () =>
    {
      // Arrange & Act
      const [ , enrage ] = metadata.parseEncounter(rawEncounter).reactions();

      // Assert
      expect(enrage.key()).toBe('enrage');
      expect(enrage.trigger()).toBe('fallen');
      expect(enrage.participantKeys()).toEqual([ 'golem' ]);
      expect(enrage.steps()[0].routineKey()).toBe('devour');
    });

    it('reads a reaction that names no bodies as waiting on nobody', () =>
    {
      // Arrange & Act
      const [ seal ] = metadata.parseEncounter(rawEncounter).reactions();

      // Assert- the trigger proves this is the parsed reaction, not an empty stand-in.
      expect(seal.trigger()).toBe('start');
      expect(seal.participantKeys()).toEqual([]);
    });

    it('reads the percent of health a health reaction waits for', () =>
    {
      // Arrange & Act
      const [ , , flare ] = metadata.parseEncounter(rawEncounter).reactions();

      // Assert
      expect(flare.trigger()).toBe('health');
      expect(flare.belowPercent()).toBe(66);
    });

    it('reads a reaction that names no percent as waiting on none', () =>
    {
      // Arrange & Act
      const [ seal ] = metadata.parseEncounter(rawEncounter).reactions();

      // Assert- the key proves this is the parsed reaction, not an empty stand-in.
      expect(seal.key()).toBe('seal');
      expect(seal.belowPercent()).toBe(0);
    });

    it('spawns a step\'s enemy from the slot matching its id when it names no template', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'spawn', enemyId: 511, expect: 'Ignihazard', x: 44, y: 16 });

      // Assert
      expect(step.templateId()).toBe(511);
    });

    it('spawns a step\'s enemy from the template it names, while it stays the enemy it names', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'spawn', enemyId: 511, expect: 'Ignihazard', template: 605 });

      // Assert
      expect(step.templateId()).toBe(605);
      expect(step.enemyId()).toBe(511);
    });

    it('treats a missing reactions list as an encounter that reacts to nothing', () =>
    {
      // Arrange
      const { reactions, ...withoutReactions } = rawEncounter;

      // Act
      const encounter = metadata.parseEncounter(withoutReactions);

      // Assert
      expect(encounter.reactions()).toEqual([]);
    });

    it('reads every field a step can carry', () =>
    {
      // Arrange
      const rawStep = {
        verb: 'changeImage',
        participant: 'golem',
        skill: 2584,
        state: 2072,
        expect: 'Sealed',
        cast: false,
        image: '$m_elemental-earthie',
        index: 3,
        routine: 'devour',
        seconds: 2,
        enemyId: 511,
        template: 605,
        x: 44,
        y: 16,
        direction: 6,
        tone: [ 17, -68, -68, 0 ],
        animation: 56,
        face: 'KH06-2_faces_MV_07',
        faceIndex: 3,
        speaker: '\\C[10]Cynder\\C[0]',
        lines: [ '\\pop[self]BRING IT' ],
      };

      // Act
      const step = metadata.parseStep(rawStep);

      // Assert
      expect(step.verb()).toBe('changeImage');
      expect(step.participantKey()).toBe('golem');
      expect(step.skillId()).toBe(2584);
      expect(step.stateId()).toBe(2072);
      expect(step.expect()).toBe('Sealed');
      expect(step.isCast()).toBe(false);
      expect(step.characterName()).toBe('$m_elemental-earthie');
      expect(step.characterIndex()).toBe(3);
      expect(step.routineKey()).toBe('devour');
      expect(step.frames()).toBe(120);
      expect(step.enemyId()).toBe(511);
      expect(step.templateId()).toBe(605);
      expect(step.x()).toBe(44);
      expect(step.y()).toBe(16);
      expect(step.direction()).toBe(6);
      expect(step.tone()).toEqual([ 17, -68, -68, 0 ]);
      expect(step.animationId()).toBe(56);
      expect(step.face()).toBe('KH06-2_faces_MV_07');
      expect(step.faceIndex()).toBe(3);
      expect(step.speaker()).toBe('\\C[10]Cynder\\C[0]');
      expect(step.lines()).toEqual([ '\\pop[self]BRING IT' ]);
    });

    it('fills every field a step leaves out with its none', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'removeState' });

      // Assert- the verb proves the step was parsed; every other field fell back.
      expect(step.verb()).toBe('removeState');
      expect(step.participantKey()).toBe('');
      expect(step.skillId()).toBe(0);
      expect(step.stateId()).toBe(0);
      expect(step.expect()).toBe('');
      expect(step.characterName()).toBe('');
      expect(step.characterIndex()).toBe(0);
      expect(step.routineKey()).toBe('');
      expect(step.frames()).toBe(0);
      expect(step.enemyId()).toBe(0);
      expect(step.templateId()).toBe(0);
      expect(step.x()).toBe(0);
      expect(step.y()).toBe(0);
      expect(step.direction()).toBe(0);
      expect(step.tone()).toEqual([]);
      expect(step.animationId()).toBe(0);
      expect(step.face()).toBe('');
      expect(step.faceIndex()).toBe(0);
      expect(step.speaker()).toBe('');
      expect(step.lines()).toEqual([]);
    });

    it('reads a routine that says it waits to be started as dormant', () =>
    {
      // Arrange & Act
      const routine = metadata.parseRoutine({ key: 'tour', cadence: 15, dormant: true, steps: [] });

      // Assert
      expect(routine.isDormant()).toBe(true);
    });

    it('reads a routine that says nothing about waiting as running from the start', () =>
    {
      // Arrange & Act
      const [ routine ] = metadata.parseEncounter(rawEncounter).routines();

      // Assert- the key proves this is the parsed routine, not an empty stand-in.
      expect(routine.key()).toBe('devour');
      expect(routine.isDormant()).toBe(false);
    });

    it('translates a quickening from seconds into frames, rounded to a whole frame', () =>
    {
      // Arrange & Act
      const step = metadata.parseStep({ verb: 'quickenRoutine', routine: 'devour', seconds: 1.505 });

      // Assert: 90.3 frames rounds to 90.
      expect(step.frames()).toBe(90);
    });
  });
});
//endregion plugins/abs/ext/boss/_metadata/metadata.test.js
