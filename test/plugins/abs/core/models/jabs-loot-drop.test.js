//region plugins/abs/core/models/jabs-loot-drop.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * JABS_LootDrop.js has no imports, but its `_uuid` class field reads the bare `J.BASE.Helpers.shortUuid()`
 * global at construction time- stubbed directly rather than pulling in the real J-Base plugin.
 */
describe('JABS_LootDrop (unit, bare J.BASE.Helpers global stubbed)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js').default} */
  let JABS_LootDrop;

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Helpers: { shortUuid: () => 'generated-uuid' } } };
    ({ default: JABS_LootDrop } = await import('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js'));
  });

  let lootObject;
  beforeEach(() =>
  {
    lootObject = { iconIndex: 7, jabsUseOnPickup: true };
  });

  describe('constructor', () =>
  {
    it('assigns the given loot object and a generated uuid', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.lootData()).toEqual(lootObject);
      expect(drop.uuid()).toEqual('generated-uuid');
    });
  });

  describe('uuid', () =>
  {
    it('can be overwritten with a new value', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setUuid('custom-uuid');

      expect(drop.uuid()).toEqual('custom-uuid');
    });
  });

  describe('duration', () =>
  {
    it('defaults to 900', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.duration()).toEqual(900);
    });

    it('can be set to a new positive value', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setDuration(300);

      expect(drop.duration()).toEqual(300);
    });

    it('disables expiration when set to -1', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setDuration(-1);

      expect(drop.canExpire()).toEqual(false);
      expect(drop.duration()).toEqual(-1);
    });
  });

  describe('expired', () =>
  {
    it('is never expired when expiration is disabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.disableExpiration();
      drop.setDuration(0);

      expect(drop.isExpired()).toEqual(false);
    });

    it('is expired once duration reaches zero while expiration is enabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setDuration(0);

      expect(drop.isExpired()).toEqual(true);
    });

    it('is not expired while duration remains positive', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setDuration(1);

      expect(drop.isExpired()).toEqual(false);
    });
  });

  describe('canExpire()/enableExpiration()/disableExpiration()', () =>
  {
    it('defaults to able-to-expire', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.canExpire()).toEqual(true);
    });

    it('can be toggled off then back on', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.disableExpiration();
      expect(drop.canExpire()).toEqual(false);

      drop.enableExpiration();
      expect(drop.canExpire()).toEqual(true);
    });
  });

  describe('countdownDuration()/canCountdownDuration()', () =>
  {
    it('counts down the duration by one when eligible', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.countdownDuration();

      expect(drop.duration()).toEqual(899);
    });

    it('does not count down when expiration is disabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.disableExpiration();
      drop.countdownDuration();

      expect(drop.duration()).toEqual(900);
    });

    it('does not count down once duration has already reached zero', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.setDuration(0);
      drop.countdownDuration();

      expect(drop.duration()).toEqual(0);
    });

    it('does not count down while the drop is in flight', () =>
    {
      // Arrange- expiration is still enabled and the duration is still positive, so the whizzing
      // state is the only thing that can stop the clock. A drop that aged out mid-flight would
      // delete an item the player has already watched themselves earn.
      const drop = new JABS_LootDrop(lootObject);
      drop.beginWhizzing();

      // Act
      drop.countdownDuration();

      // Assert
      expect(drop.duration()).toEqual(900);
    });

    it('does not count down once the drop has been collected', () =>
    {
      // Arrange- the mirror of the case above for the far end of the lifecycle.
      const drop = new JABS_LootDrop(lootObject);
      drop.markCollected();

      // Act
      drop.countdownDuration();

      // Assert
      expect(drop.duration()).toEqual(900);
    });
  });

  describe('lifecycle state', () =>
  {
    it('starts out waiting on the ground', () =>
    {
      // Arrange
      const drop = new JABS_LootDrop(lootObject);

      // Act & Assert
      expect(drop.isWaiting()).toEqual(true);
      expect(drop.isWhizzing()).toEqual(false);
      expect(drop.isCollected()).toEqual(false);
    });

    it('reports whizzing once claimed, and nothing else', () =>
    {
      // Arrange
      const drop = new JABS_LootDrop(lootObject);

      // Act
      drop.beginWhizzing();

      // Assert- the two sibling predicates are what prove the state actually moved rather than
      // a new flag simply being raised alongside the old one.
      expect(drop.isWhizzing()).toEqual(true);
      expect(drop.isWaiting()).toEqual(false);
      expect(drop.isCollected()).toEqual(false);
    });

    it('reports collected once granted, and nothing else', () =>
    {
      // Arrange- claimed first, so this covers the real transition rather than a fresh drop
      // jumping straight to the end.
      const drop = new JABS_LootDrop(lootObject);
      drop.beginWhizzing();

      // Act
      drop.markCollected();

      // Assert
      expect(drop.isCollected()).toEqual(true);
      expect(drop.isWhizzing()).toEqual(false);
      expect(drop.isWaiting()).toEqual(false);
    });

    it('exposes the raw state for callers that need it', () =>
    {
      // Arrange
      const drop = new JABS_LootDrop(lootObject);

      // Act
      drop.setState(JABS_LootDrop.States.Collected);

      // Assert
      expect(drop.state()).toEqual(JABS_LootDrop.States.Collected);
    });
  });

  describe('arrivalDistance', () =>
  {
    it('is a short absorb threshold rather than a reach stat', () =>
    {
      // Arrange- nothing to arrange; the threshold is a constant of the model.

      // Act & Assert- half a tile, small enough that a drop is visibly underfoot before it goes.
      expect(JABS_LootDrop.arrivalDistance()).toEqual(0.5);
    });
  });

  describe('lootIcon', () =>
  {
    it('returns the underlying loot object icon index', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.lootIcon()).toEqual(7);
    });

    it('defaults to 0 when the loot object has no icon index', () =>
    {
      const drop = new JABS_LootDrop({});

      expect(drop.lootIcon()).toEqual(0);
    });
  });

  describe('useOnPickup', () =>
  {
    it('returns the underlying loot object flag', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.isUseOnPickup()).toEqual(true);
    });

    it('defaults to false when the loot object has no flag set', () =>
    {
      const drop = new JABS_LootDrop({});

      expect(drop.isUseOnPickup()).toEqual(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-loot-drop.test.js
