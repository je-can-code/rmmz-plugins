//region plugins/abs/core/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_Player (unit, all downstream dependencies mocked)', () =>
{
  let originalStartMapEvent;
  let originalCanMove;
  let originalIsDashing;
  let originalRefresh;
  let originalUpdate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { Game_Player: new Map() },
        Metadata: {
          Loot: {
            magnetRadius: 3,
            magnetSpeed: 0.1,
            magnetAcceleration: 4,
          },
        },
      },
    };

    // bare RMMZ-style global (not imported by Game_Player.js- loaded elsewhere at runtime).
    globalThis.JABS_Button = { Tool: 'Tool' };

    function Game_Player()
    {
    }
    originalStartMapEvent = vi.fn();
    originalCanMove = vi.fn(() => true);
    originalIsDashing = vi.fn(() => true);
    originalRefresh = vi.fn();
    originalUpdate = vi.fn();
    Game_Player.prototype.startMapEvent = originalStartMapEvent;
    Game_Player.prototype.canMove = originalCanMove;
    Game_Player.prototype.isDashing = originalIsDashing;
    Game_Player.prototype.refresh = originalRefresh;
    Game_Player.prototype.update = originalUpdate;
    globalThis.Game_Player = Game_Player;

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Player.js');

    // RMMZ exposes map coordinates as native properties on Game_CharacterBase.
    Object.defineProperties(globalThis.Game_Player.prototype, {
      // vanilla exposes these read-only; the double allows writes so tests can position freely.
      x: { get() { return this._x; }, set(v) { this._x = v; }, configurable: true },
      y: { get() { return this._y; }, set(v) { this._y = v; }, configurable: true },
    });

    // J-Base coordinate accessors the pixel/abs layers read and write through.
    globalThis.Game_Player.prototype.setX = function(v) { this._x = v; };
    globalThis.Game_Player.prototype.setY = function(v) { this._y = v; };
    globalThis.Game_Player.prototype.realX = function() { return this._realX; };
    globalThis.Game_Player.prototype.realY = function() { return this._realY; };
    globalThis.Game_Player.prototype.setRealX = function(v) { this._realX = v; };
    globalThis.Game_Player.prototype.setRealY = function(v) { this._realY = v; };
  });

  beforeEach(() =>
  {
    originalStartMapEvent.mockClear();
    originalCanMove.mockClear();
    originalIsDashing.mockClear();
    originalRefresh.mockClear();
    originalUpdate.mockClear();

    globalThis.$jabsEngine = {
      absEnabled: false,
      absPause: false,
      getPlayer1: vi.fn(() => ({
        hasUninterruptibleMovementLock: vi.fn(() => false),
        getBattler: vi.fn(() => ({ getLootMagnetRadius: vi.fn(() => 3) })),
      })),
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

      // the real deltas account for map looping; straight subtraction is the non-looping case.
      deltaX: vi.fn((x1, x2) => x1 - x2),
      deltaY: vi.fn((y1, y2) => y1 - y2),
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

  describe('update', () =>
  {
    it('performs the original logic then checks for loot', () =>
    {
      // Arrange- the loot check hangs off `update` rather than `updateMove` because vanilla only
      // calls the latter while isMoving() is true, which would strand a drop mid-flight the
      // instant the player stood still and leave a player standing on a drop unable to take it.
      const player = buildPlayer();
      vi.spyOn(player, 'checkForLoot').mockImplementation(() => {});

      // Act
      player.update(true);

      // Assert
      expect(originalUpdate).toHaveBeenCalled();
      expect(player.checkForLoot).toHaveBeenCalled();
    });

    it('passes the scene-active flag through to the original logic', () =>
    {
      // Arrange- vanilla gates input handling on this argument, so dropping it would silently
      // leave the player controllable during a scene transition.
      const player = buildPlayer();
      vi.spyOn(player, 'checkForLoot').mockImplementation(() => {});

      // Act
      player.update(false);

      // Assert
      expect(originalUpdate).toHaveBeenCalledWith(false);
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
      vi.spyOn(player, 'processLootMagnetism').mockImplementation(() => {});
      vi.spyOn(player, 'processLootCollection').mockImplementation(() => {});

      // Act
      player.checkForLoot();

      // Assert
      expect(player.processLootCollection).toHaveBeenCalledWith(drops);
    });

    it('draws loot inward before testing what has arrived', () =>
    {
      // Arrange- ordering is the behavior under test: pulling after collecting would leave a drop
      // that lands this frame sitting on the player for an extra tick before being absorbed.
      const player = buildPlayer();
      globalThis.$gameMap.getJabsLootDrops.mockReturnValue([ {} ]);
      const calls = [];
      vi.spyOn(player, 'processLootMagnetism').mockImplementation(() => calls.push('magnetism'));
      vi.spyOn(player, 'processLootCollection').mockImplementation(() => calls.push('collection'));

      // Act
      player.checkForLoot();

      // Assert
      expect(calls).toEqual([ 'magnetism', 'collection' ]);
    });

    it('does not draw loot inward when there are no drops on the map', () =>
    {
      // Arrange
      const player = buildPlayer();
      globalThis.$gameMap.getJabsLootDrops.mockReturnValue([]);
      vi.spyOn(player, 'processLootMagnetism');

      // Act
      player.checkForLoot();

      // Assert
      expect(player.processLootMagnetism).not.toHaveBeenCalled();
    });
  });

  describe('processLootMagnetism', () =>
  {
    it('pulls every drop on the map toward the player', () =>
    {
      // Arrange- two drops, so a loop that only ever handled the first would be visible.
      const player = buildPlayer();
      const dropOne = { id: 'one' };
      const dropTwo = { id: 'two' };
      vi.spyOn(player, 'magnetizeLoot').mockImplementation(() => {});

      // Act
      player.processLootMagnetism([ dropOne, dropTwo ]);

      // Assert
      expect(player.magnetizeLoot).toHaveBeenCalledWith(dropOne, 3);
      expect(player.magnetizeLoot).toHaveBeenCalledWith(dropTwo, 3);
    });

    it('pulls nothing when the resolved radius is zero', () =>
    {
      // Arrange- a battler stripped of magnetism entirely; loot still exists and is still nearby,
      // so only the radius check can be what prevents the pull.
      const player = buildPlayer();
      vi.spyOn(player, 'getLootMagnetRadius').mockReturnValue(0);
      vi.spyOn(player, 'magnetizeLoot').mockImplementation(() => {});

      // Act
      player.processLootMagnetism([ { id: 'one' } ]);

      // Assert
      expect(player.magnetizeLoot).not.toHaveBeenCalled();
    });

    it('resolves the radius once regardless of how many drops there are', () =>
    {
      // Arrange- the radius walks every note source on the leader, so repeating it per drop would
      // be real work wasted. three drops, one resolution.
      const player = buildPlayer();
      vi.spyOn(player, 'getLootMagnetRadius');
      vi.spyOn(player, 'magnetizeLoot').mockImplementation(() => {});

      // Act
      player.processLootMagnetism([ {}, {}, {} ]);

      // Assert
      expect(player.getLootMagnetRadius).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLootMagnetRadius', () =>
  {
    it('reads the radius off the leader battler', () =>
    {
      // Arrange- a value unlike the default so a hardcoded fallback would be caught.
      const player = buildPlayer();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({
        getBattler: () => ({ getLootMagnetRadius: () => 11 }),
      });

      // Act & Assert
      expect(player.getLootMagnetRadius()).toBe(11);
    });
  });

  describe('magnetizeLoot', () =>
  {
    /**
     * Builds a loot event double positioned at the given coordinates.
     * @param {number} x The drop's x coordinate.
     * @param {number} y The drop's y coordinate.
     * @param {object} [lootOverrides] Overrides for the underlying loot drop double.
     * @returns {object}
     */
    function buildLootEvent(x, y, lootOverrides = {})
    {
      const jabsLoot = {
        isCollected: () => false,
        beginWhizzing: vi.fn(),
        ...lootOverrides,
      };

      return {
        isErased: () => false,
        getJabsLoot: () => jabsLoot,
        realX: () => x,
        realY: () => y,
        setLootPosition: vi.fn(),
        jabsLoot,
      };
    }

    it('moves a drop that is inside the radius toward the player', () =>
    {
      // Arrange- player at origin, drop two tiles to the right and well inside a radius of 3.
      const player = buildPlayer();
      const lootEvent = buildLootEvent(2, 0);

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert- it moved, and it moved leftward toward the player rather than away.
      const [ [ nextX, nextY ] ] = lootEvent.setLootPosition.mock.calls;
      expect(nextX).toBeLessThan(2);
      expect(nextY).toBe(0);
    });

    it('claims a drop the moment it comes into range', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootEvent = buildLootEvent(2, 0);

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert- claiming is what stops the expiration timer, so it must happen on the first frame
      // of the pull rather than on arrival.
      expect(lootEvent.jabsLoot.beginWhizzing).toHaveBeenCalled();
    });

    it('leaves a drop beyond the radius entirely alone', () =>
    {
      // Arrange- four tiles out against a radius of three.
      const player = buildPlayer();
      const lootEvent = buildLootEvent(4, 0);

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert- neither moved nor claimed, so it keeps aging out normally.
      expect(lootEvent.setLootPosition).not.toHaveBeenCalled();
      expect(lootEvent.jabsLoot.beginWhizzing).not.toHaveBeenCalled();
    });

    it('claims but does not move a drop already within arrival distance', () =>
    {
      // Arrange- a fifth of a tile away, inside the 0.5 arrival threshold. Moving it would mean
      // dividing by a near-zero distance to build a direction.
      const player = buildPlayer();
      const lootEvent = buildLootEvent(0.2, 0);

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert
      expect(lootEvent.jabsLoot.beginWhizzing).toHaveBeenCalled();
      expect(lootEvent.setLootPosition).not.toHaveBeenCalled();
    });

    it('ignores a drop that has already been collected', () =>
    {
      // Arrange- a collected drop is mid-removal; it sits at a distance that would otherwise be
      // well within range, so only the state check can be what stops the pull.
      const player = buildPlayer();
      const lootEvent = buildLootEvent(2, 0, { isCollected: () => true });

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert
      expect(lootEvent.setLootPosition).not.toHaveBeenCalled();
    });

    it('ignores a drop whose event has been erased', () =>
    {
      // Arrange- same in-range position, only the erased flag flipped.
      const player = buildPlayer();
      const lootEvent = buildLootEvent(2, 0);
      lootEvent.isErased = () => true;

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert
      expect(lootEvent.setLootPosition).not.toHaveBeenCalled();
    });

    it('never steps further than the remaining gap', () =>
    {
      // Arrange- a drop just outside arrival distance, paired with a speed far larger than the gap
      // so an unclamped step would sail past the player and land on the far side.
      const player = buildPlayer();
      globalThis.J.ABS.Metadata.Loot.magnetSpeed = 50;
      const lootEvent = buildLootEvent(0.6, 0);

      // Act
      player.magnetizeLoot(lootEvent, 3);

      // Assert- it lands exactly on the player rather than overshooting to a negative x.
      const [ [ nextX ] ] = lootEvent.setLootPosition.mock.calls;
      expect(nextX).toBe(0);

      // Cleanup- this global is shared across the file.
      globalThis.J.ABS.Metadata.Loot.magnetSpeed = 0.1;
    });

    it('moves a nearer drop further in one frame than a distant one', () =>
    {
      // Arrange- two drops inside the same radius at different distances. The acceleration curve
      // is the only thing that could make their per-frame steps differ.
      const player = buildPlayer();
      const nearDrop = buildLootEvent(1, 0);
      const farDrop = buildLootEvent(2.9, 0);

      // Act
      player.magnetizeLoot(nearDrop, 3);
      player.magnetizeLoot(farDrop, 3);

      // Assert
      const [ [ nearNextX ] ] = nearDrop.setLootPosition.mock.calls;
      const [ [ farNextX ] ] = farDrop.setLootPosition.mock.calls;
      const nearStep = 1 - nearNextX;
      const farStep = 2.9 - farNextX;
      expect(nearStep).toBeGreaterThan(farStep);
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
      const lootDrop = { getJabsLoot: vi.fn(() => ({ isUseOnPickup: () => true, lootData: () => lootData })) };
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
      const lootDrop = { getJabsLoot: vi.fn(() => ({ isUseOnPickup: () => false })) };
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
      const lootA = { getJabsLoot: vi.fn(() => ({ lootData: () => lootDataA })) };
      const lootB = { getJabsLoot: vi.fn(() => ({ lootData: () => lootDataB })) };
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
    it('returns true when the drop has arrived', () =>
    {
      // Arrange- player at origin, drop a fifth of a tile away, inside the 0.5 arrival threshold.
      const player = buildPlayer();
      const lootDrop = { realX: () => 0.2, realY: () => 0 };

      // Act/Assert
      expect(player.isTouchingLoot(lootDrop)).toEqual(true);
    });

    it('returns false when the drop has not arrived yet', () =>
    {
      // Arrange- still in flight at a full tile out.
      const player = buildPlayer();
      const lootDrop = { realX: () => 1, realY: () => 0 };

      // Act/Assert
      expect(player.isTouchingLoot(lootDrop)).toEqual(false);
    });

    it('measures diagonally rather than as the sum of both axes', () =>
    {
      // Arrange- 0.3 on each axis is 0.6 of manhattan distance, which the engine's own `distance`
      // would reject against a 0.5 threshold, but only 0.42 in a straight line. A drop sitting
      // diagonally underfoot has arrived, and this is the exact case the old manhattan check got
      // wrong.
      const player = buildPlayer();
      const lootDrop = { realX: () => 0.3, realY: () => 0.3 };

      // Act/Assert
      expect(player.isTouchingLoot(lootDrop)).toEqual(true);
    });
  });

  describe('pickupLoot', () =>
  {
    it('uses the loot immediately when flagged useOnPickup', () =>
    {
      // Arrange
      const player = buildPlayer();
      const lootData = { id: 1 };
      const lootEvent = { getJabsLoot: vi.fn(() => ({ isUseOnPickup: () => true, lootData: () => lootData })) };
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
      const lootEvent = { getJabsLoot: vi.fn(() => ({ isUseOnPickup: () => false, lootData: () => lootData })) };
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
    it('applies tool-item effects to player1 using the Tool button', () =>
    {
      // Arrange
      const player = buildPlayer();
      const applyToolItemEffects = vi.fn();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ applyToolItemEffects });
      const lootData = { id: 7 };

      // Act
      player.useOnPickup(lootData);

      // Assert
      expect(applyToolItemEffects).toHaveBeenCalledWith(7, JABS_Button.Tool, true);
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
      const lootEvent = {
        setLootNeedsRemoving,
        getJabsLoot: () => ({ markCollected: vi.fn() }),
      };

      // Act
      player.removeLoot(lootEvent);

      // Assert
      expect(setLootNeedsRemoving).toHaveBeenCalledWith(true);
      expect(globalThis.$jabsEngine.requestClearLoot).toEqual(true);
    });

    it('retires the drop from the lifecycle before flagging its removal', () =>
    {
      // Arrange- a drop still mid-flight when it is granted; without this it would sit in the
      // whizzing state forever and keep being pulled while it waits to be cleared.
      const player = buildPlayer();
      const markCollected = vi.fn();
      const lootEvent = {
        setLootNeedsRemoving: vi.fn(),
        getJabsLoot: () => ({ markCollected }),
      };

      // Act
      player.removeLoot(lootEvent);

      // Assert
      expect(markCollected).toHaveBeenCalled();
    });
  });
  //endregion loot
});
//endregion plugins/abs/core/objects/game-player.test.js
