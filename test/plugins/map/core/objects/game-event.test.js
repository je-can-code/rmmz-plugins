//region plugins/map/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMapHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMap,
} from '../../_component/fixtures/install-map-host-globals.js';

/**
 * What J-MAP asks an event to say about itself for the minimap.
 *
 * Two of these methods answer the same question twice - once through JABS, once through the event's
 * own comments - and the order matters: a battler's liveness is not something a comment tag can
 * override, so the JABS block runs first and returns outright. Everything below it only ever sees an
 * event JABS had no opinion about.
 */
describe('J-MAP Game_Event', () =>
{
  /** @type {typeof import('../../../../../src/plugins/map/core/__models/MinimapEventType.js').default} */
  let MinimapEventType;

  /**
   * The JABS namespace the fixture installs, kept so tests can put it back after removing it.
   * @type {object}
   */
  let jabsNamespace;

  /**
   * Builds a bare event with its J-MAP members seeded.
   * @param {object=} overrides Per-instance methods this event should answer with.
   * @returns {Game_Event} The event under test.
   */
  const buildEvent = (overrides = {}) =>
  {
    const event = new globalThis.Game_Event();
    event.initMembers();

    Object.assign(event, overrides);

    return event;
  };

  /**
   * Builds the comment command shape `getValidCommentCommands` hands back.
   * @param {string} comment The comment's text.
   * @returns {object} The command.
   */
  const commentCommand = comment => ({ parameters: [ comment ] });

  /**
   * Builds a JABS battler answering the three questions the minimap asks one.
   * @param {object=} overrides Which of the three answers to change.
   * @returns {object} The battler.
   */
  const jabsBattler = (overrides = {}) => ({
    isDead: () => false,
    isHidden: () => false,
    isInanimate: () => false,
    ...overrides,
  });

  /**
   * Installs the OmniQuest namespace, which is what makes an event capable of being a quest event.
   * @param {boolean} hasCommand What `hasPluginCommand` should answer for this event.
   * @returns {object} The per-instance overrides carrying that answer.
   */
  const withQuestPlugin = hasCommand =>
  {
    globalThis.J.OMNI = { EXT: { QUEST: { Metadata: { name: 'J-Omni-Quest' } } } };

    return { hasPluginCommand: vi.fn(() => hasCommand) };
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../../../src/plugins/map/core/_metadata/initialization.js');

    // must come from the same post-reset module registry epoch as Game_Event.js below, since that
    // file imports its own copy - two separate static imports would otherwise resolve to two module
    // instances whose enums are structurally equal but not identical.
    ({ default: MinimapEventType } = await import(
      '../../../../../src/plugins/map/core/__models/MinimapEventType.js'));

    await import('../../../../../src/plugins/map/core/objects/Game_Event.js');

    jabsNamespace = globalThis.J.ABS;
  });

  beforeEach(() =>
  {
    globalThis.J.ABS = jabsNamespace;
    delete globalThis.J.OMNI;
  });

  //region the cache the whole thing exists for
  describe('initMembers()', () =>
  {
    it('seeds both minimap caches cold, so the first ask is the one that computes', () =>
    {
      // Arrange
      // Act
      const event = buildEvent();

      // Assert
      expect(event.getCachedMinimapEventType())
        .toBeNull();
      expect(event.getCachedShowOnMinimap())
        .toBeNull();
    });
  });

  describe('clearMinimapCache()', () =>
  {
    it('puts both caches back to cold', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setCachedShowOnMinimap(true);
      event.setCachedMinimapEventType(MinimapEventType.Npc);

      // Act
      event.clearMinimapCache();

      // Assert
      expect(event.getCachedShowOnMinimap())
        .toBeNull();
      expect(event.getCachedMinimapEventType())
        .toBeNull();
    });
  });

  describe('refresh()', () =>
  {
    it('clears the cache, because a refreshed page can mean a different answer', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setCachedShowOnMinimap(true);

      // Act
      event.refresh();

      // Assert
      expect(event.getCachedShowOnMinimap())
        .toBeNull();
    });
  });
  //endregion the cache the whole thing exists for

  //region whether the event shows at all
  describe('shouldShowOnMinimap()', () =>
  {
    it('shows loot that is still on the ground', () =>
    {
      // Arrange
      const event = buildEvent({
        isErased: () => false,
        isJabsLoot: () => true,
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(true);
    });

    it('does not treat erased loot as loot, since the drop is already gone', () =>
    {
      // Arrange
      const event = buildEvent({
        isErased: () => true,
        isJabsLoot: () => true,
        getJabsBattler: () => null,
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(false);
    });

    it('shows an enemy that is alive and revealed', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler() });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(true);
    });

    it('hides a dead enemy', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler({ isDead: () => true }) });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(false);
    });

    it('hides an enemy that has not been revealed yet', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler({ isHidden: () => true }) });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(false);
    });

    it('never asks JABS anything when JABS is not installed', () =>
    {
      // Arrange: core does not know about its extensions, so the namespace check is the whole test.
      delete globalThis.J.ABS;
      const isJabsLoot = vi.fn(() => true);
      const event = buildEvent({
        isJabsLoot,
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(isJabsLoot)
        .not.toHaveBeenCalled();
      expect(shouldShow)
        .toBe(false);
    });

    it('answers from the cache once one has been computed', () =>
    {
      // Arrange
      const getValidCommentCommands = vi.fn(() => [ commentCommand('<minimap:npc>') ]);
      const event = buildEvent({ getValidCommentCommands });
      event.shouldShowOnMinimap();

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert: recomputing per frame would re-scan every comment on every event on the map.
      expect(shouldShow)
        .toBe(true);
      expect(getValidCommentCommands)
        .toHaveBeenCalledTimes(1);
    });

    it('shows an event whose comments carry a minimap tag', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [ commentCommand('<mm:object>') ] });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(true);
    });

    it('shows a teleport, which is inferred from the page rather than tagged', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [],
        getEventCommandList: () => [ { code: 201 } ],
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(true);
    });

    it('shows a quest event, which is inferred from its plugin commands', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
        ...withQuestPlugin(true),
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(true);
    });

    it('hides an ordinary event that says nothing about itself', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<someOtherTag>') ],
        getEventCommandList: () => [],
      });

      // Act
      const shouldShow = event.shouldShowOnMinimap();

      // Assert
      expect(shouldShow)
        .toBe(false);
    });
  });
  //endregion whether the event shows at all

  //region which marker the event draws as
  describe('minimapEventType()', () =>
  {
    it('marks still-collectable loot as loot', () =>
    {
      // Arrange
      const event = buildEvent({
        isErased: () => false,
        isJabsLoot: () => true,
      });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Loot);
    });

    it('gives a hidden enemy no marker at all', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler({ isHidden: () => true }) });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Unset);
    });

    it('gives a dead enemy no marker at all', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler({ isDead: () => true }) });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Unset);
    });

    it('marks a living enemy as hostile', () =>
    {
      // Arrange
      const event = buildEvent({ getJabsBattler: () => jabsBattler() });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.EnemyHostile);
    });

    it('marks an inanimate battler apart from a hostile one', () =>
    {
      // Arrange: a breakable crate is a battler and should not read as something that fights back.
      const event = buildEvent({ getJabsBattler: () => jabsBattler({ isInanimate: () => true }) });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.EnemyInanimate);
    });

    it('never asks JABS anything when JABS is not installed', () =>
    {
      // Arrange
      delete globalThis.J.ABS;
      const getJabsBattler = vi.fn(() => jabsBattler());
      const event = buildEvent({
        getJabsBattler,
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
      });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(getJabsBattler)
        .not.toHaveBeenCalled();
      expect(type)
        .toBe(MinimapEventType.Unset);
    });

    it('answers from the cache once one has been computed', () =>
    {
      // Arrange
      const getValidCommentCommands = vi.fn(() => [ commentCommand('<minimap:npc>') ]);
      const event = buildEvent({
        getValidCommentCommands,
        getEventCommandList: () => [],
      });
      event.minimapEventType();

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Npc);
      expect(getValidCommentCommands)
        .toHaveBeenCalledTimes(1);
    });

    [
      [ 'npc', 'Npc' ],
      [ 'loot', 'Loot' ],
      [ 'object', 'Object' ],
      [ 'teleport', 'Teleport' ],
      [ 'questOffer', 'QuestOffer' ],
      [ 'questProgress', 'QuestProgress' ],
      [ 'questTurnIn', 'QuestTurnIn' ],
    ].forEach(([ tag, member ]) =>
    {
      it(`reads the ${tag} tag as its matching marker`, () =>
      {
        // Arrange
        const event = buildEvent({
          getValidCommentCommands: () => [ commentCommand(`<minimap:${tag}>`) ],
          getEventCommandList: () => [],
        });

        // Act
        const type = event.minimapEventType();

        // Assert
        expect(type)
          .toBe(MinimapEventType[member]);
      });
    });

    it('skips a comment that carries no minimap tag rather than treating it as one', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('just a note'), commentCommand('<minimap:npc>') ],
        getEventCommandList: () => [],
      });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Npc);
    });

    it('lets a turn-in override whatever the comments claimed, since it is the highest priority', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<minimap:npc>') ],
        getEventCommandList: () => [],
        ...withQuestPlugin(true),
      });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.QuestTurnIn);
    });

    it('elevates an untagged event to progress when it advances a quest', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
        ...withQuestPlugin(false),
      });
      event.hasPluginCommand = vi.fn((name, commands) => commands.includes('progress-quest'));

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.QuestProgress);
    });

    it('elevates an offer to progress, because a quest already taken is no longer on offer', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<minimap:questOffer>') ],
        getEventCommandList: () => [],
        ...withQuestPlugin(false),
      });
      event.hasPluginCommand = vi.fn((name, commands) => commands.includes('progress-quest'));

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.QuestProgress);
    });

    it('leaves a tagged marker alone when the event only unlocks quests', () =>
    {
      // Arrange: offer is the lowest priority and only fills a marker nothing else claimed.
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<minimap:npc>') ],
        getEventCommandList: () => [],
        ...withQuestPlugin(false),
      });
      event.hasPluginCommand = vi.fn((name, commands) => commands.includes('unlock-quests'));

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Npc);
    });

    it('marks an untagged quest giver as an offer', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [],
        getEventCommandList: () => [],
        ...withQuestPlugin(false),
      });
      event.hasPluginCommand = vi.fn((name, commands) => commands.includes('unlock-quests'));

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.QuestOffer);
    });

    it('infers a teleport from the page when nothing else claimed the marker', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [],
        getEventCommandList: () => [ { code: 201 } ],
      });

      // Act
      const type = event.minimapEventType();

      // Assert
      expect(type)
        .toBe(MinimapEventType.Teleport);
    });
  });
  //endregion which marker the event draws as

  //region what the page itself says
  describe('isTeleportEvent()', () =>
  {
    it('recognizes a page carrying a transfer command', () =>
    {
      // Arrange
      const event = buildEvent({ getEventCommandList: () => [ { code: 101 }, { code: 201 } ] });

      // Act
      const isTeleport = event.isTeleportEvent();

      // Assert
      expect(isTeleport)
        .toBe(true);
    });

    it('does not mistake any other command for a transfer', () =>
    {
      // Arrange
      const event = buildEvent({ getEventCommandList: () => [ { code: 101 }, null ] });

      // Act
      const isTeleport = event.isTeleportEvent();

      // Assert
      expect(isTeleport)
        .toBe(false);
    });
  });

  describe('isQuestEvent()', () =>
  {
    it('is not a quest event when the quest plugin is not installed', () =>
    {
      // Arrange
      const hasPluginCommand = vi.fn(() => true);
      const event = buildEvent({ hasPluginCommand });

      // Act
      const isQuest = event.isQuestEvent();

      // Assert
      expect(isQuest)
        .toBe(false);
      expect(hasPluginCommand)
        .not.toHaveBeenCalled();
    });

    it('asks after all three quest commands at once, since any of them makes it a quest event', () =>
    {
      // Arrange
      const event = buildEvent(withQuestPlugin(true));

      // Act
      const isQuest = event.isQuestEvent();

      // Assert
      expect(isQuest)
        .toBe(true);
      expect(event.hasPluginCommand)
        .toHaveBeenCalledWith('J-Omni-Quest', [ 'unlock-quests', 'progress-quest', 'finalize-quest' ]);
    });
  });

  describe('hasQuestPluginCommand()', () =>
  {
    it('answers no outright when the quest plugin is not installed', () =>
    {
      // Arrange
      const event = buildEvent({ hasPluginCommand: vi.fn(() => true) });

      // Act
      const found = event.hasQuestPluginCommand([ 'unlock-quests' ]);

      // Assert
      expect(found)
        .toBe(false);
    });

    it('looks the commands up under the quest plugin\'s own name', () =>
    {
      // Arrange
      const event = buildEvent(withQuestPlugin(true));

      // Act
      const found = event.hasQuestPluginCommand([ 'finalize-quest' ]);

      // Assert
      expect(found)
        .toBe(true);
      expect(event.hasPluginCommand)
        .toHaveBeenCalledWith('J-Omni-Quest', [ 'finalize-quest' ]);
    });
  });
  //endregion what the page itself says

  //region how much ground the event covers
  describe('getAreaEventRect()', () =>
  {
    it('defaults to a single tile when nothing says otherwise', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [] });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 1,
          h: 1,
        });
    });

    it('reads the dimensions off the area tag', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [ commentCommand('<areaEvent:3x5>') ] });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 3,
          h: 5,
        });
    });

    it('steps over an empty comment rather than trying to match one', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand(''), commentCommand('<areaEvent: 2x4>') ],
      });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 2,
          h: 4,
        });
    });

    it('steps over a comment that is not the area tag', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<minimap:npc>'), commentCommand('<areaEvent:6x2>') ],
      });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 6,
          h: 2,
        });
    });

    it('stops at the first area tag, so a second one cannot quietly win', () =>
    {
      // Arrange
      const event = buildEvent({
        getValidCommentCommands: () => [ commentCommand('<areaEvent:2x2>'), commentCommand('<areaEvent:9x9>') ],
      });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 2,
          h: 2,
        });
    });

    it('never lets a zero-sized area through, since an event always occupies its own tile', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [ commentCommand('<areaEvent:0x0>') ] });

      // Act
      const area = event.getAreaEventRect();

      // Assert
      expect(area)
        .toEqual({
          w: 1,
          h: 1,
        });
    });
  });
  //endregion how much ground the event covers
});
//endregion plugins/map/core/objects/game-event.test.js