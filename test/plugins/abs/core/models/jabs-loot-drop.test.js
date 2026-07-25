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

      expect(drop.lootData).toEqual(lootObject);
      expect(drop.uuid).toEqual('generated-uuid');
    });
  });

  describe('uuid', () =>
  {
    it('can be overwritten with a new value', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.uuid = 'custom-uuid';

      expect(drop.uuid).toEqual('custom-uuid');
    });
  });

  describe('duration', () =>
  {
    it('defaults to 900', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.duration).toEqual(900);
    });

    it('can be set to a new positive value', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.duration = 300;

      expect(drop.duration).toEqual(300);
    });

    it('disables expiration when set to -1', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.duration = -1;

      expect(drop.canExpire()).toEqual(false);
      expect(drop.duration).toEqual(-1);
    });
  });

  describe('expired', () =>
  {
    it('is never expired when expiration is disabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.disableExpiration();
      drop.duration = 0;

      expect(drop.expired).toEqual(false);
    });

    it('is expired once duration reaches zero while expiration is enabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.duration = 0;

      expect(drop.expired).toEqual(true);
    });

    it('is not expired while duration remains positive', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.duration = 1;

      expect(drop.expired).toEqual(false);
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

      expect(drop.duration).toEqual(899);
    });

    it('does not count down when expiration is disabled', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.disableExpiration();
      drop.countdownDuration();

      expect(drop.duration).toEqual(900);
    });

    it('does not count down once duration has already reached zero', () =>
    {
      const drop = new JABS_LootDrop(lootObject);
      drop.duration = 0;
      drop.countdownDuration();

      expect(drop.duration).toEqual(0);
    });
  });

  describe('lootIcon', () =>
  {
    it('returns the underlying loot object icon index', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.lootIcon).toEqual(7);
    });

    it('defaults to 0 when the loot object has no icon index', () =>
    {
      const drop = new JABS_LootDrop({});

      expect(drop.lootIcon).toEqual(0);
    });
  });

  describe('useOnPickup', () =>
  {
    it('returns the underlying loot object flag', () =>
    {
      const drop = new JABS_LootDrop(lootObject);

      expect(drop.useOnPickup).toEqual(true);
    });

    it('defaults to false when the loot object has no flag set', () =>
    {
      const drop = new JABS_LootDrop({});

      expect(drop.useOnPickup).toEqual(false);
    });
  });
});
//endregion plugins/abs/core/models/jabs-loot-drop.test.js
