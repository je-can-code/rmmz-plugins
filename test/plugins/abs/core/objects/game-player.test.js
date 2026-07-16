//region plugins/abs/core/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_Player (unit, all downstream dependencies mocked)', () =>
{
  let originalStartMapEvent;
  let originalCanMove;
  let originalIsDashing;
  let originalRefresh;
  let originalUpdateMove;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { Game_Player: new Map() },
        Metadata: { LootPickupRange: 1.5 },
      },
    };

    function Game_Player()
    {
    }
    originalStartMapEvent = vi.fn();
    originalCanMove = vi.fn(() => true);
    originalIsDashing = vi.fn(() => true);
    originalRefresh = vi.fn();
    originalUpdateMove = vi.fn();
    Game_Player.prototype.startMapEvent = originalStartMapEvent;
    Game_Player.prototype.canMove = originalCanMove;
    Game_Player.prototype.isDashing = originalIsDashing;
    Game_Player.prototype.refresh = originalRefresh;
    Game_Player.prototype.updateMove = originalUpdateMove;
    globalThis.Game_Player = Game_Player;

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
    originalStartMapEvent.mockClear();
    originalCanMove.mockClear();
    originalIsDashing.mockClear();
    originalRefresh.mockClear();
    originalUpdateMove.mockClear();

    globalThis.$jabsEngine = {
      absEnabled: false,
      requestAbsMenu: false,
      absPause: false,
      getPlayer1: vi.fn(() => ({ hasUninterruptibleMovementLock: vi.fn(() => false) })),
      initializePlayer1: vi.fn(),
      onItemPickedUp: vi.fn(),
      createLootLog: vi.fn(),
      requestClearLoot: false,
    };
    globalThis.$gameMap = {
      isEventRunning: vi.fn(() => false),
      eventsXy: vi.fn(() => []),
      getJabsLootDrops: vi.fn(() => []),
      distance: vi.fn(() => 0),
    };
    globalThis.$gameParty = {
      anyMemberInCombat: vi.fn(() => false),
      gainItem: vi.fn(),
    };
    globalThis.SoundManager = { playUseItem: vi.fn() };
  });

  function buildPlayer(overrides = {})
  {
    const player = Object.create(globalThis.Game_Player.prototype);
    player._realX = 0;
    player._realY = 0;
    return Object.assign(player, overrides);
  }

  //region startMapEvent
  describe('startMapEvent', () =>
  {
    it('delegates to the original logic when JABS is disabled', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = false;

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(originalStartMapEvent).toHaveBeenCalledWith(1, 2, [ 0 ], true);
    });

    it('does not scan for events when JABS is enabled but an event is already running', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      globalThis.$gameMap.isEventRunning.mockReturnValue(true);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(globalThis.$gameMap.eventsXy).not.toHaveBeenCalled();
      expect(originalStartMapEvent).not.toHaveBeenCalled();
    });

    it('starts an event at the coordinates that matches trigger, priority, and is not erased or a JABS battler', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      const event = {
        isErased: vi.fn(() => false),
        isTriggerIn: vi.fn(() => true),
        isNormalPriority: vi.fn(() => true),
        getJabsBattler: vi.fn(() => null),
        start: vi.fn(),
      };
      globalThis.$gameMap.eventsXy.mockReturnValue([ event ]);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(event.start).toHaveBeenCalled();
    });

    it('does not start an erased event', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      const event = {
        isErased: vi.fn(() => true),
        isTriggerIn: vi.fn(() => true),
        isNormalPriority: vi.fn(() => true),
        getJabsBattler: vi.fn(() => null),
        start: vi.fn(),
      };
      globalThis.$gameMap.eventsXy.mockReturnValue([ event ]);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(event.start).not.toHaveBeenCalled();
    });

    it('does not start an event whose trigger does not match', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      const event = {
        isErased: vi.fn(() => false),
        isTriggerIn: vi.fn(() => false),
        isNormalPriority: vi.fn(() => true),
        getJabsBattler: vi.fn(() => null),
        start: vi.fn(),
      };
      globalThis.$gameMap.eventsXy.mockReturnValue([ event ]);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(event.start).not.toHaveBeenCalled();
    });

    it('does not start an event whose priority does not match', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      const event = {
        isErased: vi.fn(() => false),
        isTriggerIn: vi.fn(() => true),
        isNormalPriority: vi.fn(() => false),
        getJabsBattler: vi.fn(() => null),
        start: vi.fn(),
      };
      globalThis.$gameMap.eventsXy.mockReturnValue([ event ]);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(event.start).not.toHaveBeenCalled();
    });

    it('does not start an event that is a JABS battler', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absEnabled = true;
      const event = {
        isErased: vi.fn(() => false),
        isTriggerIn: vi.fn(() => true),
        isNormalPriority: vi.fn(() => true),
        getJabsBattler: vi.fn(() => ({})),
        start: vi.fn(),
      };
      globalThis.$gameMap.eventsXy.mockReturnValue([ event ]);

      // Act
      player.startMapEvent(1, 2, [ 0 ], true);

      // Assert
      expect(event.start).not.toHaveBeenCalled();
    });
  });
  //endregion startMapEvent

  //region canMove
  describe('canMove', () =>
  {
    it('denies movement when the abs menu is requested', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.requestAbsMenu = true;

      // Act/Assert
      expect(player.canMove()).toEqual(false);
    });

    it('denies movement when abs is paused', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.absPause = true;

      // Act/Assert
      expect(player.canMove()).toEqual(false);
    });

    it('denies movement when the player is rooted by an uninterruptible movement lock', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ hasUninterruptibleMovementLock: vi.fn(() => true) });

      // Act/Assert
      expect(player.canMove()).toEqual(false);
    });

    it('delegates to the original logic when nothing denies movement', () =>
    {
      // Arrange
      const player = buildPlayer();

      // Act
      const result = player.canMove();

      // Assert
      expect(originalCanMove).toHaveBeenCalled();
      expect(result).toEqual(true);
    });
  });
  //endregion canMove

  //region isDashing
  describe('isDashing', () =>
  {
    it('forces no dash while any party member is in combat', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameParty.anyMemberInCombat.mockReturnValue(true);

      // Act/Assert
      expect(player.isDashing()).toEqual(false);
      expect(originalIsDashing).not.toHaveBeenCalled();
    });

    it('delegates to the original logic outside of combat', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameParty.anyMemberInCombat.mockReturnValue(false);

      // Act
      const result = player.isDashing();

      // Assert
      expect(originalIsDashing).toHaveBeenCalled();
      expect(result).toEqual(true);
    });
  });
  //endregion isDashing

  describe('refresh', () =>
  {
    it('performs the original logic then initializes player1', () =>
    {
      // Arrange
      const player = buildPlayer();

      // Act
      player.refresh();

      // Assert
      expect(originalRefresh).toHaveBeenCalled();
      expect(globalThis.$jabsEngine.initializePlayer1).toHaveBeenCalled();
    });
  });

  describe('updateMove', () =>
  {
    it('performs the original logic then checks for loot', () =>
    {
      // Arrange
      const player = buildPlayer();
      vi.spyOn(player, 'checkForLoot').mockImplementation(() => {});

      // Act
      player.updateMove();

      // Assert
      expect(originalUpdateMove).toHaveBeenCalled();
      expect(player.checkForLoot).toHaveBeenCalled();
    });
  });

  //region loot
  describe('checkForLoot', () =>
  {
    it('does nothing when there are no loot drops on the map', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameMap.getJabsLootDrops.mockReturnValue([]);
      vi.spyOn(player, 'processLootCollection');

      // Act
      player.checkForLoot();

      // Assert
      expect(player.processLootCollection).not.toHaveBeenCalled();
    });

    it('processes the loot collection when drops exist', () =>
    {
      // Arrange
      const player = buildPlayer();
      const drops = [ {} ];
      globalThis.$gameMap.getJabsLootDrops.mockReturnValue(drops);
      vi.spyOn(player, 'processLootCollection').mockImplementation(() => {});

      // Act
      player.checkForLoot();

      // Assert
      expect(player.processLootCollection).toHaveBeenCalledWith(drops);
    });
  });

  describe('processLootCollection', () =>
  {
    it('skips loot the player cannot collect', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootDrop = {};
      vi.spyOn(player, 'canCollectLoot').mockReturnValue(false);
      vi.spyOn(player, 'pickupLootCollection').mockImplementation(() => {});

      // Act
      player.processLootCollection([ lootDrop ]);

      // Assert
      expect(player.pickupLootCollection).not.toHaveBeenCalled();
    });

    it('immediately uses and removes loot flagged useOnPickup, without adding it to the group', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootData = { id: 1 };
      const lootDrop = { getJabsLoot: vi.fn(() => ({ useOnPickup: true, lootData })) };
      vi.spyOn(player, 'canCollectLoot').mockReturnValue(true);
      vi.spyOn(player, 'useOnPickup').mockImplementation(() => {});
      vi.spyOn(player, 'removeLoot').mockImplementation(() => {});
      vi.spyOn(player, 'pickupLootCollection').mockImplementation(() => {});

      // Act
      player.processLootCollection([ lootDrop ]);

      // Assert
      expect(player.useOnPickup).toHaveBeenCalledWith(lootData);
      expect(player.removeLoot).toHaveBeenCalledWith(lootDrop);
      expect(player.pickupLootCollection).not.toHaveBeenCalled();
    });

    it('groups non-immediate loot and picks it up as a collection', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootDrop = { getJabsLoot: vi.fn(() => ({ useOnPickup: false })) };
      vi.spyOn(player, 'canCollectLoot').mockReturnValue(true);
      vi.spyOn(player, 'pickupLootCollection').mockImplementation(() => {});

      // Act
      player.processLootCollection([ lootDrop ]);

      // Assert
      expect(player.pickupLootCollection).toHaveBeenCalledWith([ lootDrop ]);
    });

    it('does not call pickupLootCollection when nothing ends up in the group', () =>
    {
      // Arrange
      const player = buildPlayer();
      vi.spyOn(player, 'canCollectLoot').mockReturnValue(false);
      vi.spyOn(player, 'pickupLootCollection').mockImplementation(() => {});

      // Act
      player.processLootCollection([ {}, {} ]);

      // Assert
      expect(player.pickupLootCollection).not.toHaveBeenCalled();
    });
  });

  describe('canCollectLoot', () =>
  {
    it('returns false for an erased loot event', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootEvent = { isErased: vi.fn(() => true) };

      // Act/Assert
      expect(player.canCollectLoot(lootEvent)).toEqual(false);
    });

    it('returns false when the player is not touching the loot', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootEvent = { isErased: vi.fn(() => false) };
      vi.spyOn(player, 'isTouchingLoot').mockReturnValue(false);

      // Act/Assert
      expect(player.canCollectLoot(lootEvent)).toEqual(false);
    });

    it('returns true when not erased and within range', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootEvent = { isErased: vi.fn(() => false) };
      vi.spyOn(player, 'isTouchingLoot').mockReturnValue(true);

      // Act/Assert
      expect(player.canCollectLoot(lootEvent)).toEqual(true);
    });
  });

  describe('pickupLootCollection', () =>
  {
    it('stores and removes each loot, then generates popups and plays a sound', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootDataA = { id: 1 };
      const lootDataB = { id: 2 };
      const lootA = { getJabsLoot: vi.fn(() => ({ lootData: lootDataA })) };
      const lootB = { getJabsLoot: vi.fn(() => ({ lootData: lootDataB })) };
      vi.spyOn(player, 'storeOnPickup').mockImplementation(() => {});
      vi.spyOn(player, 'removeLoot').mockImplementation(() => {});

      // Act
      player.pickupLootCollection([ lootA, lootB ]);

      // Assert
      expect(player.storeOnPickup).toHaveBeenNthCalledWith(1, lootDataA);
      expect(player.storeOnPickup).toHaveBeenNthCalledWith(2, lootDataB);
      expect(player.removeLoot).toHaveBeenCalledWith(lootA);
      expect(player.removeLoot).toHaveBeenCalledWith(lootB);
      expect(globalThis.$jabsEngine.onItemPickedUp).toHaveBeenCalledWith([ lootDataA, lootDataB ], player);
      expect(globalThis.SoundManager.playUseItem).toHaveBeenCalled();
    });
  });

  describe('isTouchingLoot', () =>
  {
    it('returns true when the distance is within the configured pickup range', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameMap.distance.mockReturnValue(1.5);
      const lootDrop = { _realX: 5, _realY: 5 };

      // Act/Assert
      expect(player.isTouchingLoot(lootDrop)).toEqual(true);
    });

    it('returns false when the distance exceeds the configured pickup range', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameMap.distance.mockReturnValue(1.6);
      const lootDrop = { _realX: 5, _realY: 5 };

      // Act/Assert
      expect(player.isTouchingLoot(lootDrop)).toEqual(false);
    });
  });

  describe('pickupLoot', () =>
  {
    it('uses the loot immediately when flagged useOnPickup', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootData = { id: 1 };
      const lootEvent = { getJabsLoot: vi.fn(() => ({ useOnPickup: true, lootData })) };
      vi.spyOn(player, 'useOnPickup').mockImplementation(() => {});
      vi.spyOn(player, 'storeOnPickup').mockImplementation(() => {});

      // Act
      player.pickupLoot(lootEvent);

      // Assert
      expect(player.useOnPickup).toHaveBeenCalledWith(lootData);
      expect(player.storeOnPickup).not.toHaveBeenCalled();
    });

    it('stores the loot when not flagged useOnPickup', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootData = { id: 1 };
      const lootEvent = { getJabsLoot: vi.fn(() => ({ useOnPickup: false, lootData })) };
      vi.spyOn(player, 'useOnPickup').mockImplementation(() => {});
      vi.spyOn(player, 'storeOnPickup').mockImplementation(() => {});

      // Act
      player.pickupLoot(lootEvent);

      // Assert
      expect(player.storeOnPickup).toHaveBeenCalledWith(lootData);
      expect(player.useOnPickup).not.toHaveBeenCalled();
    });
  });

  describe('useOnPickup', () =>
  {
    it('applies tool effects to player1', () =>
    {
      // Arrange
      const player = buildPlayer();
      const applyToolEffects = vi.fn();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ applyToolEffects });
      const lootData = { id: 7 };

      // Act
      player.useOnPickup(lootData);

      // Assert
      expect(applyToolEffects).toHaveBeenCalledWith(7, true);
    });
  });

  describe('storeOnPickup', () =>
  {
    it('adds the item to the party and logs it', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootData = { id: 7 };

      // Act
      player.storeOnPickup(lootData);

      // Assert
      expect(globalThis.$gameParty.gainItem).toHaveBeenCalledWith(lootData, 1, true);
      expect(globalThis.$jabsEngine.createLootLog).toHaveBeenCalledWith(lootData);
    });
  });

  describe('removeLoot', () =>
  {
    it('flags the loot event for removal and requests a clear', () =>
    {
      // Arrange
      const player = buildPlayer();
      const setLootNeedsRemoving = vi.fn();
      const lootEvent = { setLootNeedsRemoving };

      // Act
      player.removeLoot(lootEvent);

      // Assert
      expect(setLootNeedsRemoving).toHaveBeenCalledWith(true);
      expect(globalThis.$jabsEngine.requestClearLoot).toEqual(true);
    });
  });
  //endregion loot
});
//endregion plugins/abs/core/objects/game-player.test.js
