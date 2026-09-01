//region plugins/abs/core/_component/respawn-registry-roundtrip.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * The respawn registry's stored shape- `JABS_RespawnRecord` instances as values of a `Map` inside
 * a `Map` inside plain-object namespaces on `Game_System`- is a nesting nothing else round-trips,
 * and surviving a save is the feature's entire point. This file proves it against the REAL
 * registry, encoder, and decoder rather than the mocked stand-ins the unit tests use.
 */
describe('respawn registry save round-trip (real codec chain)', () =>
{
  let SaveEncoder;
  let SaveDecoder;
  let JABS_RespawnRecord;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRealRmmzEngine();

    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // the real registry, hoisted the way J-Base hoists it in-game.
    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveEncoder } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    ({ default: SaveDecoder } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveDecoder.js'));

    // vanilla has no initMembers hook; J-Base adds one that every plugin's alias chain hangs off,
    // and the Game_System codec's seed calls it. This stands in for J-Base's augmentation with the
    // one slice the respawn registry needs seeded.
    globalThis.Game_System.prototype.initMembers = function()
    {
      this._j = { _abs: { _respawns: new Map() } };
    };

    // the engine codecs bring the Map codec and the Game_System registration.
    await import('../../../../../src/plugins/_base/ext/save/core/registerEngineSaveCodecs.js');

    // the record registers itself against the real registry at import time.
    ({ default: JABS_RespawnRecord } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_RespawnRecord.js'));
  });

  it('round-trips pending and permanent records across two maps through encode and decode', () =>
  {
    // Arrange- two maps, each holding a record, one pending and one permanent.
    const system = new Game_System();
    const pending = new JABS_RespawnRecord('seconds', '90', 6400);
    const permanent = new JABS_RespawnRecord('never', '', 0);
    system._j = {
      _abs: {
        _respawns: new Map([
          [ 7, new Map([ [ 4, pending ] ]) ],
          [ 9, new Map([ [ 12, permanent ] ]) ],
        ]),
      },
    };

    // Act
    const encoded = SaveEncoder.encode(system, '$.system');
    const decoded = SaveDecoder.decode(encoded, null, '$.system');

    // Assert- the registry comes back as real Maps keyed by real numbers.
    const registry = decoded._j._abs._respawns;
    expect(registry).toBeInstanceOf(Map);
    expect([ ...registry.keys() ]).toEqual([ 7, 9 ]);

    // the pending record comes back as a real instance with its schedule intact.
    const decodedPending = registry.get(7)
      .get(4);
    expect(decodedPending).toBeInstanceOf(JABS_RespawnRecord);
    expect(decodedPending.method).toBe('seconds');
    expect(decodedPending.param).toBe('90');
    expect(decodedPending.due).toBe(6400);
    expect(decodedPending.isPermanent()).toBe(false);

    // the permanent record comes back permanent, prototype and all.
    const decodedPermanent = registry.get(9)
      .get(12);
    expect(decodedPermanent).toBeInstanceOf(JABS_RespawnRecord);
    expect(decodedPermanent.isPermanent()).toBe(true);
  });

  it('decodes a record-free payload back to the seeded empty registry', () =>
  {
    // Arrange- a save written before any battler ever died.
    const system = new Game_System();
    system._j = { _abs: { _respawns: new Map() } };

    // Act
    const encoded = SaveEncoder.encode(system, '$.system');
    const decoded = SaveDecoder.decode(encoded, null, '$.system');

    // Assert
    expect(decoded._j._abs._respawns).toBeInstanceOf(Map);
    expect(decoded._j._abs._respawns.size).toBe(0);
  });
});
//endregion plugins/abs/core/_component/respawn-registry-roundtrip.test.js