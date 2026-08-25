//region plugins/level/core/objects/_component/game-actor-dialog.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor level dia log augments (direct src import)', () =>
{
  let actor;
  let addLog;

  beforeAll(async () =>
  {
    vi.resetModules();

    // models pulled in transitively self-register for save serialization on import.
    globalThis.SerializableRegistry = { register: vi.fn() };

    globalThis.J = {
      LEVEL: {
        Aliased: { Game_Actor: new Map() },
        Metadata: {},
      },
    };

    // the dia log builder is a runtime global provided by J-Log, mirrored here as a fluent stub.
    globalThis.DiaLogBuilder = class
    {
      constructor()
      {
        this.lines = [];
        this.faceName = null;
        this.faceIndex = -1;
      }

      addLine(line)
      {
        this.lines.push(line);
        return this;
      }

      setFaceName(faceName)
      {
        this.faceName = faceName;
        return this;
      }

      setFaceIndex(faceIndex)
      {
        this.faceIndex = faceIndex;
        return this;
      }

      build()
      {
        return { lines: this.lines, faceName: this.faceName, faceIndex: this.faceIndex };
      }
    };

    function StubGameActor()
    {
    }

    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../../src/plugins/level/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    addLog = vi.fn();
    globalThis.$mapLogs = { dialog: { addLog } };

    // J-Log being present is what permits announcing at all.
    globalThis.J.LOG = {};

    actor = new globalThis.Game_Actor();
    actor._level = 10;
    actor.name = vi.fn()
      .mockReturnValue('Rupert');
    actor.faceName = vi.fn()
      .mockReturnValue('Actor2');
    actor.faceIndex = vi.fn()
      .mockReturnValue(1);
    actor.learnSkill = vi.fn();
    actor.isLearnedSkill = vi.fn()
      .mockReturnValue(false);
    actor.currentClass = vi.fn()
      .mockReturnValue({
        name: 'Bladesman',
        learnings: [ { level: 5, skillId: 42 } ],
      });
    actor.skill = vi.fn()
      .mockReturnValue({
        name: 'Rising Cut',
        message1: '',
        message2: '',
      });
  });

  describe('handleLevelSkillLearnedLog', () =>
  {
    it('does not build a log when J-Log is not loaded', () =>
    {
      // Arrange
      globalThis.J.LOG = undefined;

      // Act
      actor.handleLevelSkillLearnedLog(42);

      // Assert
      expect(addLog).not.toHaveBeenCalled();
    });

    it('uses the default class phrasing when the skill authors no message1', () =>
    {
      // Arrange/Act
      actor.handleLevelSkillLearnedLog(42);

      // Assert
      expect(addLog).toHaveBeenCalledTimes(1);
      expect(addLog.mock.calls[0][0].lines[0]).toContain('Bladesman training');
    });

    it('prefers the skill authored message1 over the default phrasing', () =>
    {
      // Arrange
      actor.skill = vi.fn()
        .mockReturnValue({ name: 'Rising Cut', message1: 'Custom headline.', message2: '' });

      // Act
      actor.handleLevelSkillLearnedLog(42);

      // Assert
      expect(addLog.mock.calls[0][0].lines[0]).toBe('Custom headline.');
    });

    it('uses the default equip instruction when the skill authors no message2', () =>
    {
      // Arrange/Act
      actor.handleLevelSkillLearnedLog(42);

      // Assert
      expect(addLog.mock.calls[0][0].lines[1]).toBe('Equip it from the skills menu to use it.');
    });

    it('prefers the skill authored message2 over the default instruction', () =>
    {
      // Arrange
      actor.skill = vi.fn()
        .mockReturnValue({ name: 'Rising Cut', message1: '', message2: 'Custom instruction.' });

      // Act
      actor.handleLevelSkillLearnedLog(42);

      // Assert
      expect(addLog.mock.calls[0][0].lines[1]).toBe('Custom instruction.');
    });
  });

  describe('backfillLearningsForCurrentLevel', () =>
  {
    it('announces a learning whose skill was not previously known', () =>
    {
      // Arrange
      const spy = vi.spyOn(actor, 'handleLevelSkillLearnedLog');

      // Act
      actor.backfillLearningsForCurrentLevel();

      // Assert
      expect(spy).toHaveBeenCalledExactlyOnceWith(42);

      // Cleanup
      spy.mockRestore();
    });

    it('stays silent for a learning whose skill was already known, since backfill repeats', () =>
    {
      // Arrange
      actor.isLearnedSkill = vi.fn()
        .mockReturnValue(true);
      const spy = vi.spyOn(actor, 'handleLevelSkillLearnedLog');

      // Act
      actor.backfillLearningsForCurrentLevel();

      // Assert
      expect(spy).not.toHaveBeenCalled();

      // Cleanup
      spy.mockRestore();
    });

    it('announces nothing for a learning whose level requirement is not yet met', () =>
    {
      // Arrange
      actor.currentClass = vi.fn()
        .mockReturnValue({ name: 'Bladesman', learnings: [ { level: 50, skillId: 42 } ] });
      const spy = vi.spyOn(actor, 'handleLevelSkillLearnedLog');

      // Act
      actor.backfillLearningsForCurrentLevel();

      // Assert
      expect(spy).not.toHaveBeenCalled();

      // Cleanup
      spy.mockRestore();
    });
  });
});
//endregion plugins/level/core/objects/_component/game-actor-dialog.test.js
