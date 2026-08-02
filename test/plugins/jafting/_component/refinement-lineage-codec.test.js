//region plugins/jafting/_component/refinement-lineage-codec.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The lineage model through the real save pipeline.
 *
 * The manager suite proves a lineage *replays* into the right equip. This proves the lineage itself
 * survives a save: the recursion nests, the captured ledger comes back as an instance rather than a
 * plain object, and the datastore slot each node names is intact. A provenance record that does not
 * round-trip is worse than storing the equip, because the equip at least came back.
 */
describe('JAFTING refinement lineage through the save codecs', () =>
{
  let JaftingRefinementLineage;
  let JaftingSalvageLedgerRow;
  let JaftingSalvageLedgerSnapshot;
  let SaveEncoder;
  let SaveDecoder;

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../src/plugins/_base/core/SerializableRegistry.js'));
    ({ default: SaveEncoder } = await import('../../../../src/plugins/_base/core/save/SaveEncoder.js'));
    ({ default: SaveDecoder } = await import('../../../../src/plugins/_base/core/save/SaveDecoder.js'));

    // JAFTING core owns the ledger models and loads before the refine extension, which is the same
    // order the shipped bundles load in.
    ({ default: JaftingSalvageLedgerRow } = await import(
      '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js'));
    ({ default: JaftingSalvageLedgerSnapshot } = await import(
      '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js'));

    globalThis.JaftingSalvageLedgerRow = JaftingSalvageLedgerRow;
    globalThis.JaftingSalvageLedgerSnapshot = JaftingSalvageLedgerSnapshot;

    globalThis.SerializableRegistry.register(JaftingSalvageLedgerRow);
    globalThis.SerializableRegistry.register(JaftingSalvageLedgerSnapshot, {
      seed: instance => Object.assign(instance, new JaftingSalvageLedgerSnapshot([])),
    });

    ({ default: JaftingRefinementLineage } = await import(
      '../../../../src/plugins/jafting/ext/refine/__models/JaftingRefinementLineage.js'));
  });

  /**
   * A three-deep provenance: a base refined once, then refined again with a plain donor.
   * @returns {JaftingRefinementLineage}
   */
  const threeDeepLineage = () =>
  {
    const inner = JaftingRefinementLineage.refinement(
      2001,
      JaftingRefinementLineage.leaf('w', 5),
      JaftingRefinementLineage.leaf('a', 12),
      new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('a', 12, 1) ]));

    return JaftingRefinementLineage.refinement(
      2002,
      inner,
      JaftingRefinementLineage.leaf('w', 9),
      new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('a', 12, 1) ]));
  };

  /**
   * Runs a lineage out to plain data and back.
   * @param {JaftingRefinementLineage} lineage The provenance to round-trip.
   * @returns {JaftingRefinementLineage}
   */
  const roundTrip = lineage => SaveDecoder.decode(SaveEncoder.encode(lineage, '$.lineage'), null, '$.lineage');

  it('writes the lineage under a stable save id rather than the class name', () =>
  {
    // Arrange
    const lineage = JaftingRefinementLineage.leaf('w', 5);

    // Act
    const encoded = SaveEncoder.encode(lineage, '$.lineage');

    // Assert
    expect(encoded['@']).toBe('jafting-refinement-lineage');
  });

  it('rebuilds a leaf with its own prototype', () =>
  {
    // Arrange
    const lineage = JaftingRefinementLineage.leaf('w', 5);

    // Act
    const decoded = roundTrip(lineage);

    // Assert
    expect(decoded.isLeaf()).toBe(true);
    expect(decoded.kind).toBe('w');
    expect(decoded.id).toBe(5);
  });

  it('keeps the datastore slot each refinement node was allocated', () =>
  {
    // Arrange
    const lineage = threeDeepLineage();

    // Act
    const decoded = roundTrip(lineage);

    // Assert
    expect(decoded.index).toBe(2002);
    expect(decoded.base.index).toBe(2001);
  });

  it('nests a refinement inside a refinement, all the way down to the leaves', () =>
  {
    // Arrange
    const lineage = threeDeepLineage();

    // Act
    const decoded = roundTrip(lineage);

    // Assert
    expect(decoded.base.base.isLeaf()).toBe(true);
    expect(decoded.base.base.id).toBe(5);
    expect(decoded.base.material.kind).toBe('a');
  });

  it('rebuilds the captured ledger as a snapshot rather than a plain object', () =>
  {
    // Arrange
    const lineage = threeDeepLineage();

    // Act
    const decoded = roundTrip(lineage);

    // Assert
    expect(Object.getPrototypeOf(decoded.ledger)).toBe(JaftingSalvageLedgerSnapshot.prototype);
    expect(Object.getPrototypeOf(decoded.ledger.rows[0])).toBe(JaftingSalvageLedgerRow.prototype);
  });

  it('carries a null ledger through as null rather than losing the field', () =>
  {
    // Arrange
    const lineage = JaftingRefinementLineage.refinement(
      2001,
      JaftingRefinementLineage.leaf('w', 5),
      JaftingRefinementLineage.leaf('w', 9),
      null);

    // Act
    const decoded = roundTrip(lineage);

    // Assert
    expect(decoded.ledger).toBe(null);
  });

  it('rebuilds from the type maps alone when every tag is stripped by hand', () =>
  {
    // Arrange
    const encoded = SaveEncoder.encode(threeDeepLineage(), '$.lineage');

    const stripTags = node =>
    {
      if (node === null) return null;

      if (Array.isArray(node)) return node.map(stripTags);

      if (Object(node) !== node) return node;

      const stripped = {};
      Object.keys(node)
        .filter(key => key !== '@')
        .forEach(key =>
        {
          stripped[key] = stripTags(node[key]);
        });

      return stripped;
    };

    // Act
    const decoded = SaveDecoder.decode(stripTags(encoded), JaftingRefinementLineage, '$.lineage');

    // Assert
    expect(decoded.base.base.id).toBe(5);
    expect(Object.getPrototypeOf(decoded.ledger)).toBe(JaftingSalvageLedgerSnapshot.prototype);
  });

  it('restores a field the file never held, so a lineage written today opens tomorrow', () =>
  {
    // Arrange
    const encoded = SaveEncoder.encode(JaftingRefinementLineage.leaf('w', 5), '$.lineage');
    delete encoded.ledger;

    // Act
    const decoded = SaveDecoder.decode(encoded, null, '$.lineage');

    // Assert
    expect(decoded.ledger).toBe(null);
  });
});
//endregion plugins/jafting/_component/refinement-lineage-codec.test.js