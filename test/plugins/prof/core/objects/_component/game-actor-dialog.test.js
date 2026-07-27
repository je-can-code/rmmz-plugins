//region plugins/prof/core/objects/_component/game-actor-dialog.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor prof dia log augments (direct src import)', () =>
{
  let actor;
  let addLog;

  beforeAll(async () =>
  {
    vi.resetModules();

    // models pulled in transitively self-register for save serialization on import.
    globalThis.SerializableRegistry = { register: vi.fn() };

    globalThis.J = {
      PROF: {
        Aliased: {
          Game_Actor: new Map(),
          Game_Enemy: new Map(),
        },
        Metadata: {
          conditionals: [],
          actorConditionalsMap: new Map(),
        },
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

    StubGameActor.prototype.learnSkill = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../../src/plugins/prof/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    addLog = vi.fn();
    globalThis.$diaLogManager = { addLog };

    // J-Log being present is what permits announcing at all.
    globalThis.J.LOG = {};

    actor = new globalThis.Game_Actor();
    actor.name = vi.fn()
      .mockReturnValue('Jerald');
    actor.faceName = vi.fn()
      .mockReturnValue('Actor1');
    actor.faceIndex = vi.fn()
      .mockReturnValue(3);

    // skill 1 is the practiced skill driving the conditional; 6 is the skill it rewards.
    actor.skill = vi.fn(skillId => (skillId === 1
      ? { name: 'Rough Chop', message1: '', message2: '' }
      : { name: 'Vigorous Sword', message1: '', message2: '' }));
  });

  describe('handleProficiencySkillLearnedLog', () =>
  {
    it('does not build a log when J-Log is not loaded', () =>
    {
      // Arrange
      globalThis.J.LOG = undefined;

      // Act
      actor.handleProficiencySkillLearnedLog({ requirements: [ { skillId: 1 } ] }, 6);

      // Assert
      expect(addLog).not.toHaveBeenCalled();
    });

    it('uses the default proficiency phrasing when the skill authors no message1', () =>
    {
      // Arrange
      const conditional = { requirements: [ { skillId: 1 } ] };

      // Act
      actor.handleProficiencySkillLearnedLog(conditional, 6);

      // Assert
      expect(addLog).toHaveBeenCalledTimes(1);
      expect(addLog.mock.calls[0][0].lines[0]).toContain('learned');
      expect(addLog.mock.calls[0][0].lines[0]).toContain('Rough Chop proficiency');
    });

    it('prefers the skill authored message1 over the default phrasing', () =>
    {
      // Arrange
      actor.skill = vi.fn()
        .mockReturnValue({
          name: 'Vigorous Sword',
          message1: 'A custom headline.',
          message2: '',
          requiredWtypeId1: 1,
        });

      // Act
      actor.handleProficiencySkillLearnedLog({ requirements: [ { skillId: 1 } ] }, 6);

      // Assert
      expect(addLog.mock.calls[0][0].lines[0]).toBe('A custom headline.');
    });

    it('uses the default equip instruction when the skill authors no message2', () =>
    {
      // Arrange/Act
      actor.handleProficiencySkillLearnedLog({ requirements: [ { skillId: 1 } ] }, 6);

      // Assert
      expect(addLog.mock.calls[0][0].lines[1]).toBe('Equip it from the skills menu to use it.');
    });

    it('prefers the skill authored message2 over the default instruction', () =>
    {
      // Arrange
      actor.skill = vi.fn()
        .mockReturnValue({
          name: 'Vigorous Sword',
          message1: '',
          message2: 'A custom instruction.',
          requiredWtypeId1: 1,
        });

      // Act
      actor.handleProficiencySkillLearnedLog({ requirements: [ { skillId: 1 } ] }, 6);

      // Assert
      expect(addLog.mock.calls[0][0].lines[1]).toBe('A custom instruction.');
    });

    it('stamps the learning actor face onto the log', () =>
    {
      // Arrange/Act
      actor.handleProficiencySkillLearnedLog({ requirements: [ { skillId: 1 } ] }, 6);

      // Assert
      expect(addLog.mock.calls[0][0].faceName).toBe('Actor1');
      expect(addLog.mock.calls[0][0].faceIndex).toBe(3);
    });
  });

  describe('proficiencySourceLabel', () =>
  {
    it('falls back to a generic label when the conditional has no requirements', () =>
    {
      // Arrange/Act
      const result = actor.proficiencySourceLabel({ requirements: [] });

      // Assert
      expect(result).toBe('combat');
    });

    it('falls back to a generic label when the practiced skill cannot be resolved', () =>
    {
      // Arrange
      actor.skill = vi.fn()
        .mockReturnValue(null);

      // Act
      const result = actor.proficiencySourceLabel({ requirements: [ { skillId: 999 } ] });

      // Assert
      expect(result).toBe('combat');
    });

    it('names the practiced skill, since proficiency is tracked per-skill', () =>
    {
      // Arrange/Act
      const result = actor.proficiencySourceLabel({ requirements: [ { skillId: 1 } ] });

      // Assert
      expect(result).toBe('Rough Chop');
    });

  });

  describe('executeSkillRewards', () =>
  {
    it('announces one log per taught skill without passing the iteration index as context', () =>
    {
      // Arrange
      const conditional = { requirements: [ { skillId: 1 } ], skillRewards: [ 6, 7 ] };
      const spy = vi.spyOn(actor, 'handleProficiencySkillLearnedLog');

      // Act
      actor.executeSkillRewards(conditional);

      // Assert
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, conditional, 6);
      expect(spy).toHaveBeenNthCalledWith(2, conditional, 7);

      // Cleanup
      spy.mockRestore();
    });

    it('announces nothing when the conditional carries no skill rewards', () =>
    {
      // Arrange
      const spy = vi.spyOn(actor, 'handleProficiencySkillLearnedLog');

      // Act
      actor.executeSkillRewards({ requirements: [ { skillId: 1 } ], skillRewards: [] });

      // Assert
      expect(spy).not.toHaveBeenCalled();

      // Cleanup
      spy.mockRestore();
    });
  });
});
//endregion plugins/prof/core/objects/_component/game-actor-dialog.test.js
