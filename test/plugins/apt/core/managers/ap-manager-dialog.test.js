//region plugins/apt/core/managers/ap-manager-dialog.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ApManager dia log announcements (direct src import)', () =>
{
  let ApManager;
  let actor;
  let addLog;
  let learning;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { APT: { Aliased: {} } };

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

    ({ default: ApManager } = await import('../../../../../src/plugins/apt/core/managers/ApManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    addLog = vi.fn();
    globalThis.$mapLogs = { dialog: { addLog } };

    // J-Log being present is what permits announcing at all.
    globalThis.J.LOG = {};

    // a learning that has already crossed its threshold, so the learn resolves on the first tick.
    learning = {
      currentAp: 100,
      setRequiredAp: vi.fn(),
      isLearned: vi.fn()
        .mockReturnValue(true),
    };

    actor = {
      hasLearnedAptitudeSkill: vi.fn()
        .mockReturnValue(false),
      hasAptitudeProgress: vi.fn()
        .mockReturnValue(true),
      getAptitudeProgress: vi.fn()
        .mockReturnValue({
          hasLearning: vi.fn()
            .mockReturnValue(true),
          learningBySkillId: vi.fn()
            .mockReturnValue(learning),
        }),
      setAptitudeProgress: vi.fn(),
      learnAptitudeSkill: vi.fn(),
      isLearnedSkill: vi.fn()
        .mockReturnValue(false),
      learnSkill: vi.fn(),
      name: vi.fn()
        .mockReturnValue('Jerald'),
      faceName: vi.fn()
        .mockReturnValue('Actor1'),
      faceIndex: vi.fn()
        .mockReturnValue(2),
      skill: vi.fn()
        .mockReturnValue({ name: 'Whirlwind Slash', message1: '', message2: '' }),
      getAptitudeSources: vi.fn()
        .mockReturnValue([]),
    };
  });

  /**
   * Drives a single AP tick that crosses the learn threshold for one teachable.
   */
  function awardCrossingTick()
  {
    ApManager.applyApToSource(actor, 'class:5', [ { skillId: 77, requiredAp: 100 } ], 100, 'victory');
  }

  it('does not build a log when J-Log is not loaded', () =>
  {
    // Arrange
    globalThis.J.LOG = undefined;

    // Act
    awardCrossingTick();

    // Assert
    expect(actor.learnSkill).toHaveBeenCalledWith(77);
    expect(addLog).not.toHaveBeenCalled();
  });

  it('names the resolved aptitude source in the default phrasing', () =>
  {
    // Arrange
    vi.spyOn(ApManager, 'resolveSourceByKey')
      .mockReturnValue({ name: 'Bladesman' });

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog).toHaveBeenCalledTimes(1);
    expect(addLog.mock.calls[0][0].lines[0]).toContain('Bladesman aptitudes');

    // Cleanup
    ApManager.resolveSourceByKey.mockRestore();
  });

  it('falls back to an unattributed label when the source no longer resolves', () =>
  {
    // Arrange
    vi.spyOn(ApManager, 'resolveSourceByKey')
      .mockReturnValue(null);

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog.mock.calls[0][0].lines[0]).toContain('training aptitudes');

    // Cleanup
    ApManager.resolveSourceByKey.mockRestore();
  });

  it('prefers the skill authored message1 over the default phrasing', () =>
  {
    // Arrange
    actor.skill = vi.fn()
      .mockReturnValue({ name: 'Whirlwind Slash', message1: 'Custom headline.', message2: '' });

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog.mock.calls[0][0].lines[0]).toBe('Custom headline.');
  });

  it('uses the default equip instruction when the skill authors no message2', () =>
  {
    // Arrange/Act
    awardCrossingTick();

    // Assert
    expect(addLog.mock.calls[0][0].lines[1]).toBe('Equip it from the skills menu to use it.');
  });

  it('prefers the skill authored message2 over the default instruction', () =>
  {
    // Arrange
    actor.skill = vi.fn()
      .mockReturnValue({ name: 'Whirlwind Slash', message1: '', message2: 'Custom instruction.' });

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog.mock.calls[0][0].lines[1]).toBe('Custom instruction.');
  });

  it('stamps the learning actor face onto the log', () =>
  {
    // Arrange/Act
    awardCrossingTick();

    // Assert
    expect(addLog.mock.calls[0][0].faceName).toBe('Actor1');
    expect(addLog.mock.calls[0][0].faceIndex).toBe(2);
  });

  it('announces nothing for a teachable whose threshold was not crossed', () =>
  {
    // Arrange
    learning.isLearned = vi.fn()
      .mockReturnValue(false);

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog).not.toHaveBeenCalled();
  });

  it('announces nothing for a skill already learned permanently', () =>
  {
    // Arrange
    actor.hasLearnedAptitudeSkill = vi.fn()
      .mockReturnValue(true);

    // Act
    awardCrossingTick();

    // Assert
    expect(addLog).not.toHaveBeenCalled();
  });
});
//endregion plugins/apt/core/managers/ap-manager-dialog.test.js
