//region plugins/omni/ext/quest/objects/_component/game-event.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Event ext/quest augments (direct src import)', () =>
{
  let OmniQuest;
  let OmniConditional;
  let FakeQuestManager;

  beforeEach(async () =>
  {
    vi.resetModules();

    String.empty = '';

    FakeQuestManager = { quest: vi.fn() };
    vi.doMock('../../../../../../../src/plugins/omni/ext/quest/managers/QuestManager.js', () => ({ default: FakeQuestManager }));

    globalThis.J = {
      OMNI: {
        EXT: {
          QUEST: {
            Aliased: { Game_Event: new Map() },
            RegExp: {
              EventQuest: /<questActive:\[(.*)]>/i,
              EventQuestObjective: /<questObjectiveActive:\[(.*)]>/i,
              EventQuestObjectiveForState: /<questObjectiveState:\[(.*)]>/i,
              ChoiceQuest: /<choiceQuestActive:\[(.*)]>/i,
              ChoiceQuestObjective: /<choiceQuestObjectiveActive:\[(.*)]>/i,
              ChoiceQuestObjectiveForState: /<choiceQuestObjectiveState:\[(.*)]>/i,
            },
          },
        },
      },
    };

    // JsonMapper is a J-Base utility with its own lenient (non-JSON) parsing rules; rather than
    // reimplement that parsing here, each test configures the exact parsed shape it needs.
    globalThis.JsonMapper = { parseObject: vi.fn() };

    function StubGameEvent()
    {
    }

    StubGameEvent.prototype.meetsConditions = vi.fn();
    StubGameEvent.getValidCommentCommandsFromPage = vi.fn().mockReturnValue([]);
    StubGameEvent.filterInvalidEventCommand = vi.fn().mockReturnValue(true);
    globalThis.Game_Event = StubGameEvent;

    ({ default: OmniQuest } = await import('../../../../../../../src/plugins/omni/ext/quest/__models/OmniQuest.js'));
    ({ default: OmniConditional } = await import('../../../../../../../src/plugins/omni/ext/quest/__models/OmniConditional.js'));

    await import('../../../../../../../src/plugins/omni/ext/quest/objects/Game_Event.js');
  });

  function makeComment(text)
  {
    return { parameters: [ text ] };
  }

  describe('meetsConditions', () =>
  {
    it('returns false immediately when the original conditions are not met', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions').mockReturnValue(false);

      // Act
      const result = event.meetsConditions({});

      // Assert
      expect(result).toEqual(false);
      expect(globalThis.Game_Event.getValidCommentCommandsFromPage).not.toHaveBeenCalled();
    });

    it('returns true when there are no comment commands at all', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions').mockReturnValue(true);
      globalThis.Game_Event.getValidCommentCommandsFromPage.mockReturnValue([]);

      // Act
      const result = event.meetsConditions({});

      // Assert
      expect(result).toEqual(true);
    });

    it('returns true when comments exist but none are quest conditionals', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions').mockReturnValue(true);
      globalThis.Game_Event.getValidCommentCommandsFromPage.mockReturnValue([ makeComment('unrelated comment') ]);

      // Act
      const result = event.meetsConditions({});

      // Assert
      expect(result).toEqual(true);
    });

    it('returns true when every quest conditional on the page is satisfied', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions').mockReturnValue(true);
      globalThis.Game_Event.getValidCommentCommandsFromPage.mockReturnValue([ makeComment('<questActive:[quest-1]>') ]);
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1' ]);
      FakeQuestManager.quest.mockReturnValue({ state: OmniQuest.States.Active });

      // Act
      const result = event.meetsConditions({});

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false when any quest conditional on the page is not satisfied', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      globalThis.J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions').mockReturnValue(true);
      globalThis.Game_Event.getValidCommentCommandsFromPage.mockReturnValue([ makeComment('<questActive:[quest-1]>') ]);
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1' ]);
      FakeQuestManager.quest.mockReturnValue({ state: OmniQuest.States.Inactive });

      // Act
      const result = event.meetsConditions({});

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('toQuestConditionals', () =>
  {
    it('returns an empty array when there are no quest comment commands', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.toQuestConditionals([ makeComment('unrelated') ]);

      // Assert
      expect(result).toEqual([]);
    });

    it('maps each quest comment command into an OmniConditional', () =>
    {
      // Arrange
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1' ]);

      // Act
      const result = globalThis.Game_Event.toQuestConditionals([ makeComment('<questActive:[quest-1]>') ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OmniConditional);
      expect(result[0].questKey).toEqual('quest-1');
    });
  });

  describe('toQuestConditional', () =>
  {
    it('builds a quest-only conditional from a single-value tag', () =>
    {
      // Arrange
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1' ]);

      // Act
      const result = globalThis.Game_Event.toQuestConditional(makeComment('<questActive:[quest-1]>'));

      // Assert
      expect(result.questKey).toEqual('quest-1');
      expect(result.objectiveId).toEqual(null);
      expect(result.state).toEqual(OmniQuest.States.Active);
    });

    it('builds a quest+objective conditional from a two-value tag', () =>
    {
      // Arrange
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1', 2 ]);

      // Act
      const result = globalThis.Game_Event.toQuestConditional(makeComment('<questObjectiveActive:[quest-1,2]>'));

      // Assert
      expect(result.questKey).toEqual('quest-1');
      expect(result.objectiveId).toEqual(2);
      expect(result.state).toEqual(OmniQuest.States.Active);
    });

    it('builds a quest+objective+target-state conditional from a three-value tag', () =>
    {
      // Arrange
      globalThis.JsonMapper.parseObject.mockReturnValue([ 'quest-1', 2, 'completed' ]);

      // Act
      const result = globalThis.Game_Event.toQuestConditional(makeComment('<questObjectiveState:[quest-1,2,"completed"]>'));

      // Assert
      expect(result.questKey).toEqual('quest-1');
      expect(result.objectiveId).toEqual(2);
      expect(result.state).toEqual(OmniQuest.States.Completed);
    });

    it('throws for an unrecognized tuple length', () =>
    {
      // Arrange
      globalThis.JsonMapper.parseObject.mockReturnValue([ 1, 2, 3, 4 ]);

      // Act/Assert
      expect(() => globalThis.Game_Event.toQuestConditional(makeComment('<questActive:[quest-1]>'))).toThrow();
    });

    // the three tags above gate a whole event page; these three gate an individual dialogue choice.
    // Both families run through the same `switch (true)`, and each is matched by its own pattern -
    // so a choice tag falling through to an event branch would gate the wrong thing entirely.
    [
      [ 'a choice gated on a whole quest', '<choiceQuestActive:[quest-1]>', [ 'quest-1' ], null ],
      [ 'a choice gated on one objective', '<choiceQuestObjectiveActive:[quest-1,2]>', [ 'quest-1', 2 ], 2 ],
      [
        'a choice gated on an objective in a named state',
        '<choiceQuestObjectiveState:[quest-1,2,"completed"]>',
        [ 'quest-1', 2, 'completed' ],
        2,
      ],
    ].forEach(([ label, tag, parsed, expectedObjectiveId ]) =>
    {
      it(`recognizes ${label}`, () =>
      {
        // Arrange
        globalThis.JsonMapper.parseObject.mockReturnValue(parsed);

        // Act
        const result = globalThis.Game_Event.toQuestConditional(makeComment(tag));

        // Assert
        expect(result.questKey).toEqual('quest-1');
        expect(result.objectiveId).toEqual(expectedObjectiveId);
      });
    });
  });

  describe('filterCommentCommandsByEventQuestConditional', () =>
  {
    it('returns false for a command with no comment text', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventQuestConditional(makeComment(undefined));

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the comment matches any of the event quest regexes', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventQuestConditional(makeComment('<questActive:[quest-1]>'));

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false when the comment matches none of the event quest regexes', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.filterCommentCommandsByEventQuestConditional(makeComment('unrelated'));

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('filterCommentCommandsByChoiceQuestConditional', () =>
  {
    it('returns false for a command with no comment text', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional(makeComment(undefined));

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the comment matches any of the choice quest regexes', () =>
    {
      // Arrange/Act
      const result = globalThis.Game_Event.filterCommentCommandsByChoiceQuestConditional(makeComment('<choiceQuestActive:[quest-1]>'));

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('questConditionalMet', () =>
  {
    it('checks the objective state when an objectiveId is present', () =>
    {
      // Arrange
      const quest = { isObjectiveInState: vi.fn().mockReturnValue(true) };
      FakeQuestManager.quest.mockReturnValue(quest);
      const conditional = new OmniConditional('quest-1', 2, OmniQuest.States.Active);

      // Act
      const result = globalThis.Game_Event.questConditionalMet(conditional);

      // Assert
      expect(quest.isObjectiveInState).toHaveBeenCalledWith(OmniQuest.States.Active, 2);
      expect(result).toEqual(true);
    });

    it('checks the overall quest state when there is no objectiveId', () =>
    {
      // Arrange
      const quest = { state: OmniQuest.States.Active };
      FakeQuestManager.quest.mockReturnValue(quest);
      const conditional = new OmniConditional('quest-1', null, OmniQuest.States.Active);

      // Act
      const result = globalThis.Game_Event.questConditionalMet(conditional);

      // Assert
      expect(result).toEqual(true);
    });

    it('checks the overall quest state when the objectiveId is negative', () =>
    {
      // Arrange
      const quest = { state: OmniQuest.States.Completed };
      FakeQuestManager.quest.mockReturnValue(quest);
      const conditional = new OmniConditional('quest-1', -1, OmniQuest.States.Completed);

      // Act
      const result = globalThis.Game_Event.questConditionalMet(conditional);

      // Assert
      expect(result).toEqual(true);
    });
  });
});
//endregion plugins/omni/ext/quest/objects/_component/game-event.test.js
